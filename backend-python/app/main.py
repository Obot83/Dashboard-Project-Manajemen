import math
import json
import datetime
from decimal import Decimal
from typing import Optional

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .database import get_db

app = FastAPI(title="TOP Project Dashboard API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def serialize(obj):
    """Convert non-JSON-serializable types."""
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")


def query(sql: str, params: Optional[dict] = None):
    """Execute SQL query using the connection pool and return JSON-serializable list of dicts."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
            return json.loads(json.dumps([dict(r) for r in rows], default=serialize))


def query_one(sql: str, params: Optional[dict] = None):
    """Execute SQL query and return a single row or None."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            row = cur.fetchone()
            if not row:
                return None
            return json.loads(json.dumps(dict(row), default=serialize))


# ── Metadata Filters ─────────────────────────────────────────────────────────

@app.get("/api/meta/filters")
def get_filter_meta():
    """Provides dynamic filter options (statuses, types, priorities, projects)."""
    statuses = query("SELECT id, name, is_closed FROM statuses ORDER BY id")
    types = query("SELECT id, name FROM types ORDER BY id")
    priorities = query("SELECT id, name FROM enumerations WHERE type = 'IssuePriority' ORDER BY id")
    projects = query("SELECT id, name, identifier FROM projects WHERE active = true ORDER BY name ASC")

    return {
        "statuses": statuses,
        "types": types,
        "priorities": priorities,
        "projects": projects,
    }


# ── KPI Summary ─────────────────────────────────────────────────────────────

@app.get("/api/kpi")
def get_kpi(project_id: Optional[int] = None):
    """Executive KPI summary, optionally filtered by project_id."""
    params = {}
    wp_filter = ""
    if project_id:
        wp_filter = "WHERE wp.project_id = %(pid)s"
        params["pid"] = project_id

    with get_db() as conn:
        with conn.cursor() as cur:
            if project_id:
                cur.execute("SELECT 1 AS total")
                projects = 1
            else:
                cur.execute("SELECT COUNT(*) AS total FROM projects WHERE active = true")
                projects = cur.fetchone()["total"]

            cur.execute(f"SELECT COUNT(*) AS total FROM work_packages wp {wp_filter}", params)
            wp_total = cur.fetchone()["total"]

            if project_id:
                cur.execute("""
                    SELECT COUNT(DISTINCT user_id) AS total FROM members WHERE project_id = %(pid)s
                """, params)
                users = cur.fetchone()["total"]
            else:
                cur.execute("SELECT COUNT(*) AS total FROM users WHERE status = 1")
                users = cur.fetchone()["total"]

            cur.execute(f"""
                SELECT COUNT(*) AS total FROM work_packages wp
                JOIN statuses s ON s.id = wp.status_id
                WHERE s.is_closed = true {"AND wp.project_id = %(pid)s" if project_id else ""}
            """, params)
            closed = cur.fetchone()["total"]

            cur.execute(f"""
                SELECT COUNT(*) AS total FROM work_packages wp
                JOIN statuses s ON s.id = wp.status_id
                WHERE wp.due_date < CURRENT_DATE AND s.is_closed = false {"AND wp.project_id = %(pid)s" if project_id else ""}
            """, params)
            overdue = cur.fetchone()["total"]

            cur.execute(f"""
                SELECT COUNT(*) AS total FROM work_packages wp
                JOIN statuses s ON s.id = wp.status_id
                WHERE s.name = 'In progress' {"AND wp.project_id = %(pid)s" if project_id else ""}
            """, params)
            in_progress = cur.fetchone()["total"]

            cur.execute(f"""
                SELECT COUNT(*) AS total FROM work_packages wp
                JOIN statuses s ON s.id = wp.status_id
                WHERE s.name = 'On hold' {"AND wp.project_id = %(pid)s" if project_id else ""}
            """, params)
            on_hold = cur.fetchone()["total"]

            cur.execute(f"""
                SELECT COUNT(*) AS total FROM work_packages wp
                JOIN statuses s ON s.id = wp.status_id
                WHERE s.name = 'Rejected' {"AND wp.project_id = %(pid)s" if project_id else ""}
            """, params)
            rejected = cur.fetchone()["total"]

        return {
            "projects": projects,
            "work_packages": wp_total,
            "users": users,
            "closed": closed,
            "overdue": overdue,
            "in_progress": in_progress,
            "on_hold": on_hold,
            "rejected": rejected,
            "close_rate": round(closed / wp_total * 100, 1) if wp_total else 0,
        }


# ── Distributions ────────────────────────────────────────────────────────────

@app.get("/api/status-distribution")
def get_status_distribution(project_id: Optional[int] = None):
    where = "WHERE wp.project_id = %(pid)s" if project_id else ""
    params = {"pid": project_id} if project_id else None
    return query(f"""
        SELECT s.name AS status, COUNT(wp.id) AS count, s.is_closed
        FROM work_packages wp
        JOIN statuses s ON s.id = wp.status_id
        {where}
        GROUP BY s.name, s.is_closed
        ORDER BY count DESC
    """, params)


@app.get("/api/type-distribution")
def get_type_distribution(project_id: Optional[int] = None):
    where = "WHERE wp.project_id = %(pid)s" if project_id else ""
    params = {"pid": project_id} if project_id else None
    return query(f"""
        SELECT t.name AS type, COUNT(wp.id) AS count
        FROM work_packages wp
        JOIN types t ON t.id = wp.type_id
        {where}
        GROUP BY t.name
        ORDER BY count DESC
    """, params)


@app.get("/api/priority-distribution")
def get_priority_distribution(project_id: Optional[int] = None):
    where = "WHERE wp.project_id = %(pid)s" if project_id else ""
    params = {"pid": project_id} if project_id else None
    return query(f"""
        SELECT COALESCE(e.name, 'Normal') AS priority, COUNT(wp.id) AS count
        FROM work_packages wp
        LEFT JOIN enumerations e ON e.id = wp.priority_id
        {where}
        GROUP BY e.name
        ORDER BY count DESC
    """, params)


@app.get("/api/monthly-volume")
def get_monthly_volume(project_id: Optional[int] = None):
    where = "AND wp.project_id = %(pid)s" if project_id else ""
    params = {"pid": project_id} if project_id else None
    return query(f"""
        SELECT TO_CHAR(wp.created_at, 'YYYY-MM') AS month, COUNT(*) AS count
        FROM work_packages wp
        WHERE wp.created_at >= NOW() - INTERVAL '12 months' {where}
        GROUP BY month
        ORDER BY month ASC
    """, params)


# ── Projects ────────────────────────────────────────────────────────────────

@app.get("/api/projects")
def get_projects(search: str = ""):
    sql = """
        SELECT
            p.id, p.name, p.identifier, p.active, p.created_at,
            COUNT(wp.id) AS wp_count,
            COUNT(CASE WHEN s.is_closed THEN 1 END) AS closed_count,
            COUNT(CASE WHEN wp.due_date < CURRENT_DATE AND s.is_closed = false THEN 1 END) AS overdue_count,
            COUNT(CASE WHEN e.name IN ('High', 'Immediate') AND s.is_closed = false THEN 1 END) AS high_priority_open,
            ROUND(AVG(wp.done_ratio)::numeric, 1) AS avg_done,
            ROUND(COALESCE(SUM(wp.estimated_hours), 0)::numeric, 1) AS estimated_hours,
            ROUND(COALESCE(te.spent_hours, 0)::numeric, 1) AS spent_hours
        FROM projects p
        LEFT JOIN work_packages wp ON wp.project_id = p.id
        LEFT JOIN statuses s ON s.id = wp.status_id
        LEFT JOIN enumerations e ON e.id = wp.priority_id
        LEFT JOIN (
            SELECT project_id, SUM(hours) AS spent_hours
            FROM time_entries
            GROUP BY project_id
        ) te ON te.project_id = p.id
        WHERE p.active = true
    """
    params = {}
    if search:
        sql += " AND (p.name ILIKE %(search)s OR p.identifier ILIKE %(search)s)"
        params["search"] = f"%{search}%"

    sql += """
        GROUP BY p.id, p.name, p.identifier, p.active, p.created_at, te.spent_hours
        ORDER BY p.name ASC
    """
    rows = query(sql, params)
    for r in rows:
        wp_c = r["wp_count"] or 0
        od_c = r["overdue_count"] or 0
        hp_c = r["high_priority_open"] or 0
        r["close_rate"] = round(r["closed_count"] / wp_c * 100, 1) if wp_c else 0

        # Health status logic
        if od_c > 3 or hp_c > 2:
            r["health"] = "critical"
            r["health_label"] = "Needs Attention"
        elif od_c > 0 or hp_c > 0:
            r["health"] = "warning"
            r["health_label"] = "At Risk"
        else:
            r["health"] = "good"
            r["health_label"] = "On Track"

    return rows


# ── Work Packages with Real SQL Filtering & Pagination ──────────────────────

@app.get("/api/work-packages")
def get_work_packages(
    project_id: Optional[int] = None,
    status: Optional[str] = "",
    priority: Optional[str] = "",
    type: Optional[str] = "",
    is_overdue: Optional[bool] = None,
    search: Optional[str] = "",
    limit: int = 50,
    offset: int = 0,
    sort_by: str = "updated_at",
    sort_dir: str = "desc",
):
    where_clauses = ["1=1"]
    params = {"limit": limit, "offset": offset}

    if project_id:
        where_clauses.append("wp.project_id = %(project_id)s")
        params["project_id"] = project_id

    if status:
        where_clauses.append("s.name = %(status)s")
        params["status"] = status

    if priority:
        where_clauses.append("e.name = %(priority)s")
        params["priority"] = priority

    if type:
        where_clauses.append("t.name = %(type)s")
        params["type"] = type

    if is_overdue is True:
        where_clauses.append("wp.due_date < CURRENT_DATE AND s.is_closed = false")

    if search:
        where_clauses.append("(wp.subject ILIKE %(search)s OR p.name ILIKE %(search)s OR u.firstname ILIKE %(search)s OR u.lastname ILIKE %(search)s)")
        params["search"] = f"%{search}%"

    # Sanitize sort fields
    valid_sorts = {
        "id": "wp.id",
        "subject": "wp.subject",
        "status": "s.name",
        "type": "t.name",
        "project": "p.name",
        "assignee": "assignee",
        "due_date": "wp.due_date",
        "done_ratio": "wp.done_ratio",
        "updated_at": "wp.updated_at",
        "created_at": "wp.created_at",
    }
    order_col = valid_sorts.get(sort_by, "wp.updated_at")
    order_dir = "DESC" if sort_dir.lower() == "desc" else "ASC"

    where_sql = " AND ".join(where_clauses)

    sql = f"""
        SELECT
            wp.id, wp.subject, s.name AS status, s.is_closed,
            t.name AS type, COALESCE(e.name, 'Normal') AS priority,
            p.id AS project_id, p.name AS project, p.identifier AS project_identifier,
            wp.due_date, wp.start_date, wp.done_ratio,
            wp.estimated_hours,
            wp.created_at, wp.updated_at,
            CASE 
                WHEN wp.due_date < CURRENT_DATE AND s.is_closed = false THEN (CURRENT_DATE - wp.due_date)
                ELSE 0 
            END AS days_overdue,
            u.firstname || ' ' || u.lastname AS assignee,
            COUNT(*) OVER() AS total_count
        FROM work_packages wp
        JOIN statuses s ON s.id = wp.status_id
        JOIN types t ON t.id = wp.type_id
        JOIN projects p ON p.id = wp.project_id
        LEFT JOIN enumerations e ON e.id = wp.priority_id
        LEFT JOIN users u ON u.id = wp.assigned_to_id
        WHERE {where_sql}
        ORDER BY {order_col} {order_dir} NULLS LAST
        LIMIT %(limit)s OFFSET %(offset)s
    """
    rows = query(sql, params)
    total = rows[0]["total_count"] if rows else 0

    return {
        "total": total,
        "page": (offset // limit) + 1 if limit else 1,
        "pages": math.ceil(total / limit) if limit else 1,
        "limit": limit,
        "offset": offset,
        "items": rows,
    }


# ── Work Package Detail ─────────────────────────────────────────────────────

@app.get("/api/work-packages/{wp_id}")
def get_work_package_detail(wp_id: int):
    """Retrieve full details of a single work package including custom fields and journals."""
    wp = query_one("""
        SELECT
            wp.id, wp.subject, wp.description, s.name AS status, s.is_closed,
            t.name AS type, COALESCE(e.name, 'Normal') AS priority,
            p.id AS project_id, p.name AS project, p.identifier AS project_identifier,
            wp.due_date, wp.start_date, wp.done_ratio,
            wp.estimated_hours, wp.remaining_hours,
            wp.created_at, wp.updated_at,
            u.firstname || ' ' || u.lastname AS assignee,
            a.firstname || ' ' || a.lastname AS author,
            CASE 
                WHEN wp.due_date < CURRENT_DATE AND s.is_closed = false THEN (CURRENT_DATE - wp.due_date)
                ELSE 0 
            END AS days_overdue
        FROM work_packages wp
        JOIN statuses s ON s.id = wp.status_id
        JOIN types t ON t.id = wp.type_id
        JOIN projects p ON p.id = wp.project_id
        LEFT JOIN enumerations e ON e.id = wp.priority_id
        LEFT JOIN users u ON u.id = wp.assigned_to_id
        LEFT JOIN users a ON a.id = wp.author_id
        WHERE wp.id = %(wp_id)s
    """, {"wp_id": wp_id})

    if not wp:
        raise HTTPException(status_code=404, detail="Work package not found")

    # Custom fields
    custom_fields = query("""
        SELECT cf.name, cv.value
        FROM custom_values cv
        JOIN custom_fields cf ON cf.id = cv.custom_field_id
        WHERE cv.customized_type = 'WorkPackage' AND cv.customized_id = %(wp_id)s
          AND cv.value IS NOT NULL AND cv.value != ''
        ORDER BY cf.position ASC
    """, {"wp_id": wp_id})

    # Spent hours logged
    spent = query_one("""
        SELECT ROUND(COALESCE(SUM(hours), 0)::numeric, 1) AS spent_hours
        FROM time_entries
        WHERE work_package_id = %(wp_id)s
    """, {"wp_id": wp_id})
    wp["spent_hours"] = spent["spent_hours"] if spent else 0.0

    # Recent journals
    journals = query("""
        SELECT j.id, j.version, j.notes, j.created_at, u.firstname || ' ' || u.lastname AS author
        FROM journals j
        LEFT JOIN users u ON u.id = j.user_id
        WHERE j.journable_type = 'WorkPackage' AND j.journable_id = %(wp_id)s
        ORDER BY j.created_at DESC
        LIMIT 5
    """, {"wp_id": wp_id})

    wp["custom_fields"] = custom_fields
    wp["journals"] = journals
    return wp


# ── Workload ────────────────────────────────────────────────────────────────

@app.get("/api/workload")
def get_workload(project_id: Optional[int] = None):
    where = "AND wp.project_id = %(pid)s" if project_id else ""
    params = {"pid": project_id} if project_id else None
    return query(f"""
        SELECT
            u.firstname || ' ' || u.lastname AS name,
            COUNT(CASE WHEN s.is_closed = false THEN 1 END) AS open_tasks,
            COUNT(CASE WHEN s.is_closed = true THEN 1 END) AS closed_tasks,
            COUNT(wp.id) AS total_tasks
        FROM work_packages wp
        JOIN users u ON u.id = wp.assigned_to_id
        JOIN statuses s ON s.id = wp.status_id
        WHERE 1=1 {where}
        GROUP BY u.firstname, u.lastname
        ORDER BY open_tasks DESC, total_tasks DESC
        LIMIT 15
    """, params)


# ── Time Entries & Tracking ─────────────────────────────────────────────────

@app.get("/api/time-per-project")
def get_time_per_project():
    return query("""
        SELECT p.name AS project, ROUND(SUM(te.hours)::numeric, 1) AS total_hours
        FROM time_entries te
        JOIN projects p ON p.id = te.project_id
        GROUP BY p.name
        ORDER BY total_hours DESC
        LIMIT 10
    """)


@app.get("/api/time-tracking")
def get_time_tracking(project_id: Optional[int] = None):
    """Compare estimated vs spent hours per project and team member."""
    where = "WHERE p.id = %(pid)s" if project_id else "WHERE p.active = true"
    params = {"pid": project_id} if project_id else None

    projects = query(f"""
        SELECT 
            p.id,
            p.name,
            ROUND(COALESCE(SUM(wp.estimated_hours), 0)::numeric, 1) AS estimated_hours,
            ROUND(COALESCE(te.spent_hours, 0)::numeric, 1) AS spent_hours
        FROM projects p
        LEFT JOIN work_packages wp ON wp.project_id = p.id
        LEFT JOIN (
            SELECT project_id, SUM(hours) AS spent_hours
            FROM time_entries
            GROUP BY project_id
        ) te ON te.project_id = p.id
        {where}
        GROUP BY p.id, p.name, te.spent_hours
        HAVING COALESCE(SUM(wp.estimated_hours), 0) > 0 OR COALESCE(te.spent_hours, 0) > 0
        ORDER BY spent_hours DESC, estimated_hours DESC
        LIMIT 12
    """, params)

    users = query("""
        SELECT 
            u.firstname || ' ' || u.lastname AS user_name,
            ROUND(SUM(te.hours)::numeric, 1) AS total_hours,
            COUNT(te.id) AS log_count
        FROM time_entries te
        JOIN users u ON u.id = te.user_id
        GROUP BY u.firstname, u.lastname
        ORDER BY total_hours DESC
        LIMIT 10
    """)

    return {"by_project": projects, "by_user": users}


# ── Milestones & Versions ───────────────────────────────────────────────────

@app.get("/api/milestones")
def get_milestones(project_id: Optional[int] = None):
    where = "AND wp.project_id = %(pid)s" if project_id else ""
    params = {"pid": project_id} if project_id else None
    return query(f"""
        SELECT
            wp.id, wp.subject, wp.due_date, wp.start_date, wp.done_ratio,
            p.name AS project, s.name AS status, s.is_closed
        FROM work_packages wp
        JOIN types t ON t.id = wp.type_id AND t.name = 'Milestone'
        JOIN statuses s ON s.id = wp.status_id
        JOIN projects p ON p.id = wp.project_id
        WHERE 1=1 {where}
        ORDER BY wp.due_date NULLS LAST
        LIMIT 30
    """, params)


@app.get("/api/versions")
def get_versions(project_id: Optional[int] = None):
    where = "WHERE v.project_id = %(pid)s" if project_id else ""
    params = {"pid": project_id} if project_id else None
    return query(f"""
        SELECT
            v.id, v.name, v.status, v.effective_date,
            p.name AS project, COUNT(wp.id) AS wp_count,
            COUNT(CASE WHEN s.is_closed THEN 1 END) AS closed_count
        FROM versions v
        JOIN projects p ON p.id = v.project_id
        LEFT JOIN work_packages wp ON wp.version_id = v.id
        LEFT JOIN statuses s ON s.id = wp.status_id
        {where}
        GROUP BY v.id, v.name, v.status, v.effective_date, p.name
        ORDER BY v.effective_date DESC NULLS LAST
        LIMIT 20
    """, params)


# ── Completion per Project ──────────────────────────────────────────────────

@app.get("/api/completion")
def get_completion(project_id: Optional[int] = None):
    where = "WHERE wp.project_id = %(pid)s" if project_id else ""
    params = {"pid": project_id} if project_id else None
    return query(f"""
        SELECT
            p.id,
            p.name AS project,
            COUNT(wp.id) AS total,
            COUNT(CASE WHEN s.is_closed THEN 1 END) AS closed,
            ROUND(AVG(wp.done_ratio)::numeric, 1) AS avg_done
        FROM work_packages wp
        JOIN statuses s ON s.id = wp.status_id
        JOIN projects p ON p.id = wp.project_id
        {where}
        GROUP BY p.id, p.name
        ORDER BY total DESC
        LIMIT 20
    """, params)


# ── Dynamic Reports Summary (No hardcoded values) ───────────────────────────

@app.get("/api/reports-summary")
def get_reports_summary(project_id: Optional[int] = None):
    """Comprehensive analytical statistics for the reports page, calculated live."""
    where = "WHERE wp.project_id = %(pid)s" if project_id else ""
    params = {"pid": project_id} if project_id else None

    stats = query_one(f"""
        SELECT
            COUNT(wp.id) AS total_items,
            COUNT(CASE WHEN t.name = 'Bug' THEN 1 END) AS bug_count,
            COUNT(CASE WHEN t.name = 'User story' THEN 1 END) AS story_count,
            COUNT(CASE WHEN t.name = 'Task' THEN 1 END) AS task_count,
            COUNT(CASE WHEN t.name = 'Feature' THEN 1 END) AS feature_count,
            COUNT(CASE WHEN s.name = 'On hold' THEN 1 END) AS on_hold_count,
            COUNT(CASE WHEN s.name = 'Rejected' THEN 1 END) AS rejected_count,
            COUNT(CASE WHEN wp.due_date < CURRENT_DATE AND s.is_closed = false THEN 1 END) AS overdue_count,
            COUNT(CASE WHEN s.is_closed = true THEN 1 END) AS closed_count,
            ROUND(COALESCE(SUM(wp.estimated_hours), 0)::numeric, 1) AS total_estimated_hours
        FROM work_packages wp
        JOIN statuses s ON s.id = wp.status_id
        JOIN types t ON t.id = wp.type_id
        {where}
    """, params)

    total_spent = query_one("""
        SELECT ROUND(COALESCE(SUM(hours), 0)::numeric, 1) AS total_spent_hours
        FROM time_entries
    """)

    top_projects = query("""
        SELECT 
            p.id, p.name,
            COUNT(wp.id) AS total,
            COUNT(CASE WHEN s.is_closed THEN 1 END) AS closed,
            ROUND(AVG(wp.done_ratio)::numeric, 1) AS avg_done
        FROM projects p
        JOIN work_packages wp ON wp.project_id = p.id
        JOIN statuses s ON s.id = wp.status_id
        WHERE p.active = true
        GROUP BY p.id, p.name
        ORDER BY total DESC
        LIMIT 10
    """)

    return {
        "stats": stats,
        "total_spent_hours": total_spent["total_spent_hours"] if total_spent else 0,
        "top_projects": top_projects,
    }
