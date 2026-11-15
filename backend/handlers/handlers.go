package handlers

import (
	"database/sql"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"

	"backend/config"
	"backend/models"

	"github.com/gin-gonic/gin"
)

func parseProjectID(c *gin.Context) (int, bool) {
	val := c.Query("project_id")
	if val == "" {
		return 0, false
	}
	id, err := strconv.Atoi(val)
	if err != nil {
		return 0, false
	}
	return id, true
}

// ── Metadata Filters ─────────────────────────────────────────────────────────

func GetFilterMeta(c *gin.Context) {
	db := config.DB

	// Statuses
	statusRows, err := db.Query("SELECT id, name, is_closed FROM statuses ORDER BY id")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer statusRows.Close()

	var statuses []models.FilterOption
	for statusRows.Next() {
		var s models.FilterOption
		var isClosed bool
		if err := statusRows.Scan(&s.ID, &s.Name, &isClosed); err == nil {
			s.IsClosed = &isClosed
			statuses = append(statuses, s)
		}
	}

	// Types
	typeRows, err := db.Query("SELECT id, name FROM types ORDER BY id")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer typeRows.Close()

	var types []models.FilterOption
	for typeRows.Next() {
		var t models.FilterOption
		if err := typeRows.Scan(&t.ID, &t.Name); err == nil {
			types = append(types, t)
		}
	}

	// Priorities
	priorityRows, err := db.Query("SELECT id, name FROM enumerations WHERE type = 'IssuePriority' ORDER BY id")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer priorityRows.Close()

	var priorities []models.FilterOption
	for priorityRows.Next() {
		var p models.FilterOption
		if err := priorityRows.Scan(&p.ID, &p.Name); err == nil {
			priorities = append(priorities, p)
		}
	}

	// Projects
	projRows, err := db.Query("SELECT id, name, identifier FROM projects WHERE active = true ORDER BY name ASC")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer projRows.Close()

	var projects []models.ProjectOption
	for projRows.Next() {
		var pr models.ProjectOption
		if err := projRows.Scan(&pr.ID, &pr.Name, &pr.Identifier); err == nil {
			projects = append(projects, pr)
		}
	}

	c.JSON(http.StatusOK, models.FilterMetaResponse{
		Statuses:   statuses,
		Types:      types,
		Priorities: priorities,
		Projects:   projects,
	})
}

// ── KPI Summary ─────────────────────────────────────────────────────────────

func GetKPI(c *gin.Context) {
	db := config.DB
	projectID, hasProject := parseProjectID(c)

	var res models.KPIResponse

	if hasProject {
		res.Projects = 1
	} else {
		_ = db.QueryRow("SELECT COUNT(*) FROM projects WHERE active = true").Scan(&res.Projects)
	}

	// Total Work Packages
	wpQuery := "SELECT COUNT(*) FROM work_packages wp"
	if hasProject {
		wpQuery += " WHERE wp.project_id = $1"
		_ = db.QueryRow(wpQuery, projectID).Scan(&res.WorkPackages)
	} else {
		_ = db.QueryRow(wpQuery).Scan(&res.WorkPackages)
	}

	// Users
	if hasProject {
		_ = db.QueryRow("SELECT COUNT(DISTINCT user_id) FROM members WHERE project_id = $1", projectID).Scan(&res.Users)
	} else {
		_ = db.QueryRow("SELECT COUNT(*) FROM users WHERE status = 1").Scan(&res.Users)
	}

	// Closed
	closedQuery := `
		SELECT COUNT(*) FROM work_packages wp
		JOIN statuses s ON s.id = wp.status_id
		WHERE s.is_closed = true`
	if hasProject {
		closedQuery += " AND wp.project_id = $1"
		_ = db.QueryRow(closedQuery, projectID).Scan(&res.Closed)
	} else {
		_ = db.QueryRow(closedQuery).Scan(&res.Closed)
	}

	// Overdue
	overdueQuery := `
		SELECT COUNT(*) FROM work_packages wp
		JOIN statuses s ON s.id = wp.status_id
		WHERE wp.due_date < CURRENT_DATE AND s.is_closed = false`
	if hasProject {
		overdueQuery += " AND wp.project_id = $1"
		_ = db.QueryRow(overdueQuery, projectID).Scan(&res.Overdue)
	} else {
		_ = db.QueryRow(overdueQuery).Scan(&res.Overdue)
	}

	// In Progress
	inProgQuery := `
		SELECT COUNT(*) FROM work_packages wp
		JOIN statuses s ON s.id = wp.status_id
		WHERE s.name = 'In progress'`
	if hasProject {
		inProgQuery += " AND wp.project_id = $1"
		_ = db.QueryRow(inProgQuery, projectID).Scan(&res.InProgress)
	} else {
		_ = db.QueryRow(inProgQuery).Scan(&res.InProgress)
	}

	// On Hold
	onHoldQuery := `
		SELECT COUNT(*) FROM work_packages wp
		JOIN statuses s ON s.id = wp.status_id
		WHERE s.name = 'On hold'`
	if hasProject {
		onHoldQuery += " AND wp.project_id = $1"
		_ = db.QueryRow(onHoldQuery, projectID).Scan(&res.OnHold)
	} else {
		_ = db.QueryRow(onHoldQuery).Scan(&res.OnHold)
	}

	// Rejected
	rejectedQuery := `
		SELECT COUNT(*) FROM work_packages wp
		JOIN statuses s ON s.id = wp.status_id
		WHERE s.name = 'Rejected'`
	if hasProject {
		rejectedQuery += " AND wp.project_id = $1"
		_ = db.QueryRow(rejectedQuery, projectID).Scan(&res.Rejected)
	} else {
		_ = db.QueryRow(rejectedQuery).Scan(&res.Rejected)
	}

	if res.WorkPackages > 0 {
		res.CloseRate = math.Round(float64(res.Closed)/float64(res.WorkPackages)*1000) / 10
	}

	c.JSON(http.StatusOK, res)
}

// ── Status Distribution ─────────────────────────────────────────────────────

func GetStatusDistribution(c *gin.Context) {
	db := config.DB
	projectID, hasProject := parseProjectID(c)

	query := `
		SELECT s.name AS status, COUNT(wp.id) AS count, s.is_closed
		FROM work_packages wp
		JOIN statuses s ON s.id = wp.status_id`
	var rows *sql.Rows
	var err error

	if hasProject {
		query += " WHERE wp.project_id = $1 GROUP BY s.name, s.is_closed ORDER BY count DESC"
		rows, err = db.Query(query, projectID)
	} else {
		query += " GROUP BY s.name, s.is_closed ORDER BY count DESC"
		rows, err = db.Query(query)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	items := make([]models.StatusDistributionItem, 0)
	for rows.Next() {
		var it models.StatusDistributionItem
		if err := rows.Scan(&it.Status, &it.Count, &it.IsClosed); err == nil {
			items = append(items, it)
		}
	}

	c.JSON(http.StatusOK, items)
}

// ── Type Distribution ───────────────────────────────────────────────────────

func GetTypeDistribution(c *gin.Context) {
	db := config.DB
	projectID, hasProject := parseProjectID(c)

	query := `
		SELECT t.name AS type, COUNT(wp.id) AS count
		FROM work_packages wp
		JOIN types t ON t.id = wp.type_id`
	var rows *sql.Rows
	var err error

	if hasProject {
		query += " WHERE wp.project_id = $1 GROUP BY t.name ORDER BY count DESC"
		rows, err = db.Query(query, projectID)
	} else {
		query += " GROUP BY t.name ORDER BY count DESC"
		rows, err = db.Query(query)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	items := make([]models.TypeDistributionItem, 0)
	for rows.Next() {
		var it models.TypeDistributionItem
		if err := rows.Scan(&it.Type, &it.Count); err == nil {
			items = append(items, it)
		}
	}

	c.JSON(http.StatusOK, items)
}

// ── Priority Distribution ───────────────────────────────────────────────────

func GetPriorityDistribution(c *gin.Context) {
	db := config.DB
	projectID, hasProject := parseProjectID(c)

	query := `
		SELECT COALESCE(e.name, 'Normal') AS priority, COUNT(wp.id) AS count
		FROM work_packages wp
		LEFT JOIN enumerations e ON e.id = wp.priority_id`
	var rows *sql.Rows
	var err error

	if hasProject {
		query += " WHERE wp.project_id = $1 GROUP BY e.name ORDER BY count DESC"
		rows, err = db.Query(query, projectID)
	} else {
		query += " GROUP BY e.name ORDER BY count DESC"
		rows, err = db.Query(query)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	items := make([]models.PriorityDistributionItem, 0)
	for rows.Next() {
		var it models.PriorityDistributionItem
		if err := rows.Scan(&it.Priority, &it.Count); err == nil {
			items = append(items, it)
		}
	}

	c.JSON(http.StatusOK, items)
}

// ── Monthly Volume (Created vs Resolved) ────────────────────────────────────

func GetMonthlyVolume(c *gin.Context) {
	db := config.DB
	projectID, hasProject := parseProjectID(c)

	pid := 0
	if hasProject {
		pid = projectID
	}

	query := `
		WITH created_data AS (
			SELECT 
				TO_CHAR(wp.created_at, 'YYYY-MM') AS month,
				COUNT(*) AS created_count
			FROM work_packages wp
			WHERE wp.created_at >= NOW() - INTERVAL '12 months'
			  AND ($1 = 0 OR wp.project_id = $1)
			GROUP BY month
		),
		resolved_data AS (
			SELECT 
				TO_CHAR(j.created_at, 'YYYY-MM') AS month,
				COUNT(DISTINCT j.journable_id) AS resolved_count
			FROM journals j
			JOIN work_package_journals wpj ON wpj.id = j.data_id AND j.data_type = 'Journal::WorkPackageJournal'
			JOIN statuses s ON s.id = wpj.status_id
			WHERE s.is_closed = true
			  AND j.created_at >= NOW() - INTERVAL '12 months'
			  AND ($1 = 0 OR wpj.project_id = $1)
			GROUP BY month
		),
		all_months AS (
			SELECT month FROM created_data
			UNION
			SELECT month FROM resolved_data
		)
		SELECT 
			m.month,
			COALESCE(c.created_count, 0) AS created,
			COALESCE(r.resolved_count, 0) AS resolved
		FROM all_months m
		LEFT JOIN created_data c ON c.month = m.month
		LEFT JOIN resolved_data r ON r.month = m.month
		ORDER BY m.month ASC`

	rows, err := db.Query(query, pid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	items := make([]models.MonthlyVolumeItem, 0)
	for rows.Next() {
		var it models.MonthlyVolumeItem
		if err := rows.Scan(&it.Month, &it.Created, &it.Resolved); err == nil {
			it.Count = it.Created // preserve backward compatibility
			items = append(items, it)
		}
	}

	c.JSON(http.StatusOK, items)
}

// ── Projects ────────────────────────────────────────────────────────────────

func GetProjects(c *gin.Context) {
	db := config.DB
	search := c.Query("search")

	query := `
		SELECT
			p.id, p.name, p.identifier, p.active, p.created_at,
			COUNT(wp.id) AS wp_count,
			COUNT(CASE WHEN s.is_closed THEN 1 END) AS closed_count,
			COUNT(CASE WHEN wp.due_date < CURRENT_DATE AND s.is_closed = false THEN 1 END) AS overdue_count,
			COUNT(CASE WHEN e.name IN ('High', 'Immediate') AND s.is_closed = false THEN 1 END) AS high_priority_open,
			ROUND(COALESCE(AVG(wp.done_ratio), 0)::numeric, 1) AS avg_done,
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
		WHERE p.active = true`

	var rows *sql.Rows
	var err error

	if search != "" {
		query += " AND (p.name ILIKE $1 OR p.identifier ILIKE $1)"
		query += " GROUP BY p.id, p.name, p.identifier, p.active, p.created_at, te.spent_hours ORDER BY p.name ASC"
		rows, err = db.Query(query, "%"+search+"%")
	} else {
		query += " GROUP BY p.id, p.name, p.identifier, p.active, p.created_at, te.spent_hours ORDER BY p.name ASC"
		rows, err = db.Query(query)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	items := make([]models.ProjectItem, 0)
	for rows.Next() {
		var it models.ProjectItem
		err := rows.Scan(
			&it.ID, &it.Name, &it.Identifier, &it.Active, &it.CreatedAt,
			&it.WpCount, &it.ClosedCount, &it.OverdueCount, &it.HighPriorityOpen,
			&it.AvgDone, &it.EstimatedHours, &it.SpentHours,
		)
		if err == nil {
			if it.WpCount > 0 {
				it.CloseRate = math.Round(float64(it.ClosedCount)/float64(it.WpCount)*1000) / 10
			}

			// Health determination
			if it.OverdueCount > 3 || it.HighPriorityOpen > 2 {
				it.Health = "critical"
				it.HealthLabel = "Kritis"
			} else if it.OverdueCount > 0 || it.HighPriorityOpen > 0 {
				it.Health = "warning"
				it.HealthLabel = "Perhatian"
			} else {
				it.Health = "good"
				it.HealthLabel = "Normal"
			}
			items = append(items, it)
		}
	}

	c.JSON(http.StatusOK, items)
}

// ── Work Packages with SQL Filtering & Pagination ──────────────────────────

func GetWorkPackages(c *gin.Context) {
	db := config.DB

	limit, err := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if err != nil || limit <= 0 {
		limit = 50
	}
	if limit > 500 {
		limit = 500
	}

	offset, err := strconv.Atoi(c.DefaultQuery("offset", "0"))
	if err != nil || offset < 0 {
		offset = 0
	}

	projectID, hasProject := parseProjectID(c)
	status := c.Query("status")
	priority := c.Query("priority")
	wpType := c.Query("type")
	isOverdueStr := c.Query("is_overdue")
	search := c.Query("search")
	sortBy := c.DefaultQuery("sort_by", "updated_at")
	sortDir := strings.ToLower(c.DefaultQuery("sort_dir", "desc"))

	whereClauses := []string{"1=1"}
	params := []interface{}{}
	paramIdx := 1

	if hasProject {
		whereClauses = append(whereClauses, fmt.Sprintf("wp.project_id = $%d", paramIdx))
		params = append(params, projectID)
		paramIdx++
	}

	if status != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("s.name = $%d", paramIdx))
		params = append(params, status)
		paramIdx++
	}

	if priority != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("e.name = $%d", paramIdx))
		params = append(params, priority)
		paramIdx++
	}

	if wpType != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("t.name = $%d", paramIdx))
		params = append(params, wpType)
		paramIdx++
	}

	if isOverdueStr == "true" {
		whereClauses = append(whereClauses, "wp.due_date < CURRENT_DATE AND s.is_closed = false")
	}

	if search != "" {
		whereClauses = append(whereClauses, fmt.Sprintf(
			"(wp.subject ILIKE $%d OR p.name ILIKE $%d OR u.firstname ILIKE $%d OR u.lastname ILIKE $%d)",
			paramIdx, paramIdx, paramIdx, paramIdx,
		))
		params = append(params, "%"+search+"%")
		paramIdx++
	}

	validSorts := map[string]string{
		"id":         "wp.id",
		"subject":    "wp.subject",
		"status":     "s.name",
		"type":       "t.name",
		"project":    "p.name",
		"due_date":   "wp.due_date",
		"done_ratio": "wp.done_ratio",
		"updated_at": "wp.updated_at",
		"created_at": "wp.created_at",
	}
	orderCol, ok := validSorts[sortBy]
	if !ok {
		orderCol = "wp.updated_at"
	}
	orderDirection := "DESC"
	if sortDir == "asc" {
		orderDirection = "ASC"
	}

	whereSQL := strings.Join(whereClauses, " AND ")

	query := fmt.Sprintf(`
		SELECT
			wp.id, wp.subject, s.name AS status, s.is_closed,
			t.name AS type, COALESCE(e.name, 'Normal') AS priority,
			p.id AS project_id, p.name AS project, p.identifier AS project_identifier,
			wp.due_date::text, wp.start_date::text, wp.done_ratio,
			wp.estimated_hours,
			wp.created_at, wp.updated_at,
			CASE 
				WHEN wp.due_date < CURRENT_DATE AND s.is_closed = false THEN (CURRENT_DATE - wp.due_date)
				ELSE 0 
			END AS days_overdue,
			CASE WHEN u.id IS NOT NULL THEN (u.firstname || ' ' || u.lastname) ELSE NULL END AS assignee,
			COUNT(*) OVER() AS total_count
		FROM work_packages wp
		JOIN statuses s ON s.id = wp.status_id
		JOIN types t ON t.id = wp.type_id
		JOIN projects p ON p.id = wp.project_id
		LEFT JOIN enumerations e ON e.id = wp.priority_id
		LEFT JOIN users u ON u.id = wp.assigned_to_id
		WHERE %s
		ORDER BY %s %s NULLS LAST
		LIMIT $%d OFFSET $%d`,
		whereSQL, orderCol, orderDirection, paramIdx, paramIdx+1,
	)

	params = append(params, limit, offset)

	rows, err := db.Query(query, params...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	total := 0
	items := make([]models.WorkPackageItem, 0)

	for rows.Next() {
		var it models.WorkPackageItem
		var dueDate, startDate sql.NullString
		var doneRatio sql.NullInt64
		var estHours sql.NullFloat64
		var assignee sql.NullString

		err := rows.Scan(
			&it.ID, &it.Subject, &it.Status, &it.IsClosed,
			&it.Type, &it.Priority,
			&it.ProjectID, &it.Project, &it.ProjectIdentifier,
			&dueDate, &startDate, &doneRatio,
			&estHours,
			&it.CreatedAt, &it.UpdatedAt,
			&it.DaysOverdue,
			&assignee,
			&total,
		)
		if err == nil {
			if dueDate.Valid {
				it.DueDate = &dueDate.String
			}
			if startDate.Valid {
				it.StartDate = &startDate.String
			}
			if doneRatio.Valid {
				dr := int(doneRatio.Int64)
				it.DoneRatio = &dr
			}
			if estHours.Valid {
				it.EstimatedHours = &estHours.Float64
			}
			if assignee.Valid {
				it.Assignee = &assignee.String
			}
			items = append(items, it)
		}
	}

	page := 1
	if limit > 0 {
		page = (offset / limit) + 1
	}
	pages := 1
	if limit > 0 && total > 0 {
		pages = int(math.Ceil(float64(total) / float64(limit)))
	}

	c.JSON(http.StatusOK, models.WorkPackagesResponse{
		Total:  total,
		Page:   page,
		Pages:  pages,
		Limit:  limit,
		Offset: offset,
		Items:  items,
	})
}

// ── Work Package Detail ─────────────────────────────────────────────────────

func GetWorkPackageDetail(c *gin.Context) {
	db := config.DB
	idStr := c.Param("id")
	wpID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid work package ID"})
		return
	}

	query := `
		SELECT
			wp.id, wp.subject, wp.description, s.name AS status, s.is_closed,
			t.name AS type, COALESCE(e.name, 'Normal') AS priority,
			p.id AS project_id, p.name AS project, p.identifier AS project_identifier,
			wp.due_date::text, wp.start_date::text, wp.done_ratio,
			wp.estimated_hours, wp.remaining_hours,
			wp.created_at, wp.updated_at,
			CASE 
				WHEN wp.due_date < CURRENT_DATE AND s.is_closed = false THEN (CURRENT_DATE - wp.due_date)
				ELSE 0 
			END AS days_overdue,
			CASE WHEN u.id IS NOT NULL THEN (u.firstname || ' ' || u.lastname) ELSE NULL END AS assignee,
			CASE WHEN a.id IS NOT NULL THEN (a.firstname || ' ' || a.lastname) ELSE NULL END AS author
		FROM work_packages wp
		JOIN statuses s ON s.id = wp.status_id
		JOIN types t ON t.id = wp.type_id
		JOIN projects p ON p.id = wp.project_id
		LEFT JOIN enumerations e ON e.id = wp.priority_id
		LEFT JOIN users u ON u.id = wp.assigned_to_id
		LEFT JOIN users a ON a.id = wp.author_id
		WHERE wp.id = $1`

	var it models.WorkPackageDetail
	var desc, dueDate, startDate, assignee, author sql.NullString
	var doneRatio sql.NullInt64
	var estHours, remHours sql.NullFloat64

	row := db.QueryRow(query, wpID)
	err = row.Scan(
		&it.ID, &it.Subject, &desc, &it.Status, &it.IsClosed,
		&it.Type, &it.Priority,
		&it.ProjectID, &it.Project, &it.ProjectIdentifier,
		&dueDate, &startDate, &doneRatio,
		&estHours, &remHours,
		&it.CreatedAt, &it.UpdatedAt,
		&it.DaysOverdue,
		&assignee, &author,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Work package not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	if desc.Valid {
		it.Description = &desc.String
	}
	if dueDate.Valid {
		it.DueDate = &dueDate.String
	}
	if startDate.Valid {
		it.StartDate = &startDate.String
	}
	if doneRatio.Valid {
		dr := int(doneRatio.Int64)
		it.DoneRatio = &dr
	}
	if estHours.Valid {
		it.EstimatedHours = &estHours.Float64
	}
	if remHours.Valid {
		it.RemainingHours = &remHours.Float64
	}
	if assignee.Valid {
		it.Assignee = &assignee.String
	}
	if author.Valid {
		it.Author = &author.String
	}

	// Spent Hours
	_ = db.QueryRow(`
		SELECT ROUND(COALESCE(SUM(hours), 0)::numeric, 1)
		FROM time_entries
		WHERE work_package_id = $1`, wpID).Scan(&it.SpentHours)

	// Custom Fields
	it.CustomFields = make([]models.CustomFieldItem, 0)
	cfRows, err := db.Query(`
		SELECT cf.name, cv.value
		FROM custom_values cv
		JOIN custom_fields cf ON cf.id = cv.custom_field_id
		WHERE cv.customized_type = 'WorkPackage' AND cv.customized_id = $1
		  AND cv.value IS NOT NULL AND cv.value != ''
		ORDER BY cf.position ASC`, wpID)
	if err == nil {
		defer cfRows.Close()
		for cfRows.Next() {
			var cf models.CustomFieldItem
			if err := cfRows.Scan(&cf.Name, &cf.Value); err == nil {
				it.CustomFields = append(it.CustomFields, cf)
			}
		}
	}

	// Journals
	it.Journals = make([]models.JournalItem, 0)
	jRows, err := db.Query(`
		SELECT j.id, j.version, COALESCE(j.notes, ''), j.created_at,
		       CASE WHEN u.id IS NOT NULL THEN (u.firstname || ' ' || u.lastname) ELSE NULL END AS author
		FROM journals j
		LEFT JOIN users u ON u.id = j.user_id
		WHERE j.journable_type = 'WorkPackage' AND j.journable_id = $1
		ORDER BY j.created_at DESC
		LIMIT 5`, wpID)
	if err == nil {
		defer jRows.Close()
		for jRows.Next() {
			var j models.JournalItem
			var author sql.NullString
			if err := jRows.Scan(&j.ID, &j.Version, &j.Notes, &j.CreatedAt, &author); err == nil {
				if author.Valid {
					j.Author = &author.String
				}
				it.Journals = append(it.Journals, j)
			}
		}
	}

	c.JSON(http.StatusOK, it)
}

// ── Workload ────────────────────────────────────────────────────────────────

func GetWorkload(c *gin.Context) {
	db := config.DB
	projectID, hasProject := parseProjectID(c)

	query := `
		SELECT
			u.firstname || ' ' || u.lastname AS name,
			COUNT(CASE WHEN s.is_closed = false THEN 1 END) AS open_tasks,
			COUNT(CASE WHEN s.is_closed = true THEN 1 END) AS closed_tasks,
			COUNT(wp.id) AS total_tasks
		FROM work_packages wp
		JOIN users u ON u.id = wp.assigned_to_id
		JOIN statuses s ON s.id = wp.status_id`
	var rows *sql.Rows
	var err error

	if hasProject {
		query += ` WHERE wp.project_id = $1
			GROUP BY u.firstname, u.lastname
			ORDER BY open_tasks DESC, total_tasks DESC
			LIMIT 15`
		rows, err = db.Query(query, projectID)
	} else {
		query += ` GROUP BY u.firstname, u.lastname
			ORDER BY open_tasks DESC, total_tasks DESC
			LIMIT 15`
		rows, err = db.Query(query)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	items := make([]models.WorkloadItem, 0)
	for rows.Next() {
		var it models.WorkloadItem
		if err := rows.Scan(&it.Name, &it.OpenTasks, &it.ClosedTasks, &it.TotalTasks); err == nil {
			items = append(items, it)
		}
	}

	c.JSON(http.StatusOK, items)
}

// ── Time Entries & Tracking ─────────────────────────────────────────────────

func GetTimePerProject(c *gin.Context) {
	db := config.DB

	rows, err := db.Query(`
		SELECT p.name AS project, ROUND(SUM(te.hours)::numeric, 1) AS total_hours
		FROM time_entries te
		JOIN projects p ON p.id = te.project_id
		GROUP BY p.name
		ORDER BY total_hours DESC
		LIMIT 10`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	type TimeProject struct {
		Project    string  `json:"project"`
		TotalHours float64 `json:"total_hours"`
	}

	items := make([]TimeProject, 0)
	for rows.Next() {
		var it TimeProject
		if err := rows.Scan(&it.Project, &it.TotalHours); err == nil {
			items = append(items, it)
		}
	}

	c.JSON(http.StatusOK, items)
}

func GetTimeTracking(c *gin.Context) {
	db := config.DB
	projectID, hasProject := parseProjectID(c)

	projQuery := `
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
		) te ON te.project_id = p.id`

	var pRows *sql.Rows
	var err error

	if hasProject {
		projQuery += ` WHERE p.id = $1
			GROUP BY p.id, p.name, te.spent_hours
			ORDER BY spent_hours DESC, estimated_hours DESC`
		pRows, err = db.Query(projQuery, projectID)
	} else {
		projQuery += ` WHERE p.active = true
			GROUP BY p.id, p.name, te.spent_hours
			HAVING COALESCE(SUM(wp.estimated_hours), 0) > 0 OR COALESCE(te.spent_hours, 0) > 0
			ORDER BY spent_hours DESC, estimated_hours DESC
			LIMIT 12`
		pRows, err = db.Query(projQuery)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer pRows.Close()

	byProject := make([]models.ProjectHoursItem, 0)
	for pRows.Next() {
		var it models.ProjectHoursItem
		if err := pRows.Scan(&it.ID, &it.Name, &it.EstimatedHours, &it.SpentHours); err == nil {
			byProject = append(byProject, it)
		}
	}

	uRows, err := db.Query(`
		SELECT 
			u.firstname || ' ' || u.lastname AS user_name,
			ROUND(SUM(te.hours)::numeric, 1) AS total_hours,
			COUNT(te.id) AS log_count
		FROM time_entries te
		JOIN users u ON u.id = te.user_id
		GROUP BY u.firstname, u.lastname
		ORDER BY total_hours DESC
		LIMIT 10`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer uRows.Close()

	byUser := make([]models.UserHoursItem, 0)
	for uRows.Next() {
		var it models.UserHoursItem
		if err := uRows.Scan(&it.UserName, &it.TotalHours, &it.LogCount); err == nil {
			byUser = append(byUser, it)
		}
	}

	c.JSON(http.StatusOK, models.TimeTrackingResponse{
		ByProject: byProject,
		ByUser:    byUser,
	})
}

// ── Milestones & Versions ───────────────────────────────────────────────────

func GetMilestones(c *gin.Context) {
	db := config.DB
	projectID, hasProject := parseProjectID(c)

	query := `
		SELECT
			wp.id, wp.subject, wp.due_date::text, wp.start_date::text, wp.done_ratio,
			p.name AS project, s.name AS status, s.is_closed
		FROM work_packages wp
		JOIN types t ON t.id = wp.type_id AND t.name = 'Milestone'
		JOIN statuses s ON s.id = wp.status_id
		JOIN projects p ON p.id = wp.project_id`
	var rows *sql.Rows
	var err error

	if hasProject {
		query += " WHERE wp.project_id = $1 ORDER BY wp.due_date NULLS LAST LIMIT 30"
		rows, err = db.Query(query, projectID)
	} else {
		query += " ORDER BY wp.due_date NULLS LAST LIMIT 30"
		rows, err = db.Query(query)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	items := make([]models.MilestoneItem, 0)
	for rows.Next() {
		var it models.MilestoneItem
		var dueDate, startDate sql.NullString
		var doneRatio sql.NullInt64

		if err := rows.Scan(&it.ID, &it.Subject, &dueDate, &startDate, &doneRatio, &it.Project, &it.Status, &it.IsClosed); err == nil {
			if dueDate.Valid {
				it.DueDate = &dueDate.String
			}
			if startDate.Valid {
				it.StartDate = &startDate.String
			}
			if doneRatio.Valid {
				dr := int(doneRatio.Int64)
				it.DoneRatio = &dr
			}
			items = append(items, it)
		}
	}

	c.JSON(http.StatusOK, items)
}

func GetVersions(c *gin.Context) {
	db := config.DB
	projectID, hasProject := parseProjectID(c)

	query := `
		SELECT
			v.id, v.name, v.status, v.effective_date::text,
			p.name AS project, COUNT(wp.id) AS wp_count,
			COUNT(CASE WHEN s.is_closed THEN 1 END) AS closed_count
		FROM versions v
		JOIN projects p ON p.id = v.project_id
		LEFT JOIN work_packages wp ON wp.version_id = v.id
		LEFT JOIN statuses s ON s.id = wp.status_id`
	var rows *sql.Rows
	var err error

	if hasProject {
		query += ` WHERE v.project_id = $1
			GROUP BY v.id, v.name, v.status, v.effective_date, p.name
			ORDER BY v.effective_date DESC NULLS LAST
			LIMIT 20`
		rows, err = db.Query(query, projectID)
	} else {
		query += ` GROUP BY v.id, v.name, v.status, v.effective_date, p.name
			ORDER BY v.effective_date DESC NULLS LAST
			LIMIT 20`
		rows, err = db.Query(query)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	items := make([]models.VersionItem, 0)
	for rows.Next() {
		var it models.VersionItem
		var effDate sql.NullString
		if err := rows.Scan(&it.ID, &it.Name, &it.Status, &effDate, &it.Project, &it.WpCount, &it.ClosedCount); err == nil {
			if effDate.Valid {
				it.EffectiveDate = &effDate.String
			}
			items = append(items, it)
		}
	}

	c.JSON(http.StatusOK, items)
}

// ── Completion per Project ──────────────────────────────────────────────────

func GetCompletion(c *gin.Context) {
	db := config.DB
	projectID, hasProject := parseProjectID(c)

	query := `
		SELECT
			p.id,
			p.name AS project,
			COUNT(wp.id) AS total,
			COUNT(CASE WHEN s.is_closed THEN 1 END) AS closed,
			ROUND(COALESCE(AVG(wp.done_ratio), 0)::numeric, 1) AS avg_done
		FROM work_packages wp
		JOIN statuses s ON s.id = wp.status_id
		JOIN projects p ON p.id = wp.project_id`
	var rows *sql.Rows
	var err error

	if hasProject {
		query += ` WHERE wp.project_id = $1
			GROUP BY p.id, p.name
			ORDER BY total DESC
			LIMIT 20`
		rows, err = db.Query(query, projectID)
	} else {
		query += ` GROUP BY p.id, p.name
			ORDER BY total DESC
			LIMIT 20`
		rows, err = db.Query(query)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	items := make([]models.CompletionItem, 0)
	for rows.Next() {
		var it models.CompletionItem
		if err := rows.Scan(&it.ID, &it.Project, &it.Total, &it.Closed, &it.AvgDone); err == nil {
			items = append(items, it)
		}
	}

	c.JSON(http.StatusOK, items)
}

// ── Reports Summary (Dynamic, No Hardcoded Values) ──────────────────────────

func GetReportsSummary(c *gin.Context) {
	db := config.DB
	projectID, hasProject := parseProjectID(c)

	statQuery := `
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
		JOIN types t ON t.id = wp.type_id`

	var st models.ReportStats
	if hasProject {
		statQuery += " WHERE wp.project_id = $1"
		_ = db.QueryRow(statQuery, projectID).Scan(
			&st.TotalItems, &st.BugCount, &st.StoryCount, &st.TaskCount, &st.FeatureCount,
			&st.OnHoldCount, &st.RejectedCount, &st.OverdueCount, &st.ClosedCount,
			&st.TotalEstimatedHours,
		)
	} else {
		_ = db.QueryRow(statQuery).Scan(
			&st.TotalItems, &st.BugCount, &st.StoryCount, &st.TaskCount, &st.FeatureCount,
			&st.OnHoldCount, &st.RejectedCount, &st.OverdueCount, &st.ClosedCount,
			&st.TotalEstimatedHours,
		)
	}

	var totalSpent float64
	_ = db.QueryRow("SELECT ROUND(COALESCE(SUM(hours), 0)::numeric, 1) FROM time_entries").Scan(&totalSpent)

	topRows, err := db.Query(`
		SELECT 
			p.id, p.name,
			COUNT(wp.id) AS total,
			COUNT(CASE WHEN s.is_closed THEN 1 END) AS closed,
			ROUND(COALESCE(AVG(wp.done_ratio), 0)::numeric, 1) AS avg_done
		FROM projects p
		JOIN work_packages wp ON wp.project_id = p.id
		JOIN statuses s ON s.id = wp.status_id
		WHERE p.active = true
		GROUP BY p.id, p.name
		ORDER BY total DESC
		LIMIT 10`)

	topProjects := make([]models.TopProjectReport, 0)
	if err == nil {
		defer topRows.Close()
		for topRows.Next() {
			var tp models.TopProjectReport
			if err := topRows.Scan(&tp.ID, &tp.Name, &tp.Total, &tp.Closed, &tp.AvgDone); err == nil {
				topProjects = append(topProjects, tp)
			}
		}
	}

	c.JSON(http.StatusOK, models.ReportsSummaryResponse{
		Stats:           st,
		TotalSpentHours: totalSpent,
		TopProjects:     topProjects,
	})
}

// ── Release & Deployment Pipeline (Ready to Prod, UAT, Developed) ───────────

func GetReleasePipeline(c *gin.Context) {
	db := config.DB
	projectID := c.Query("project_id")

	// 1. Projects aggregation query
	projectQuery := `
		SELECT 
			p.id AS project_id,
			p.name AS project_name,
			p.identifier,
			COUNT(CASE WHEN s.name ILIKE '%Ready To Production%' THEN 1 END) AS ready_to_prod_count,
			COUNT(CASE WHEN s.name IN ('Tested', 'In testing') THEN 1 END) AS uat_count,
			COUNT(CASE WHEN s.name = 'Developed' THEN 1 END) AS developed_count,
			COUNT(wp.id) AS total_pipeline
		FROM projects p
		JOIN work_packages wp ON wp.project_id = p.id
		JOIN statuses s ON s.id = wp.status_id
		WHERE (s.name ILIKE '%Ready To Production%' OR s.name IN ('Tested', 'In testing', 'Developed'))
	`
	var projectArgs []interface{}
	if projectID != "" {
		projectQuery += " AND p.id = $1"
		projectArgs = append(projectArgs, projectID)
	}
	projectQuery += `
		GROUP BY p.id, p.name, p.identifier 
		HAVING COUNT(wp.id) > 0 
		ORDER BY ready_to_prod_count DESC, uat_count DESC, developed_count DESC
	`

	rows, err := db.Query(projectQuery, projectArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	projects := make([]models.ReleaseProjectItem, 0)
	var summary models.ReleasePipelineSummary

	for rows.Next() {
		var it models.ReleaseProjectItem
		if err := rows.Scan(
			&it.ProjectID,
			&it.ProjectName,
			&it.Identifier,
			&it.ReadyToProdCount,
			&it.UATCount,
			&it.DevelopedCount,
			&it.TotalPipeline,
		); err == nil {
			summary.ReadyToProdTotal += it.ReadyToProdCount
			summary.UATTotal += it.UATCount
			summary.DevelopedTotal += it.DevelopedCount
			projects = append(projects, it)
		}
	}
	summary.ProjectsCount = len(projects)

	// 2. Individual items query
	itemsQuery := `
		SELECT 
			wp.id,
			wp.subject,
			TRIM(s.name) AS status,
			CASE 
				WHEN s.name ILIKE '%Ready To Production%' THEN 'ready_to_prod'
				WHEN s.name IN ('Tested', 'In testing') THEN 'uat'
				WHEN s.name = 'Developed' THEN 'developed'
				ELSE 'other'
			END AS stage,
			t.name AS type,
			COALESCE(en.name, 'Normal') AS priority,
			p.id AS project_id,
			p.name AS project,
			p.identifier AS project_identifier,
			u.login AS assignee,
			wp.due_date::text,
			wp.updated_at,
			wp.done_ratio
		FROM work_packages wp
		JOIN projects p ON p.id = wp.project_id
		JOIN statuses s ON s.id = wp.status_id
		JOIN types t ON t.id = wp.type_id
		LEFT JOIN enumerations en ON en.id = wp.priority_id
		LEFT JOIN users u ON u.id = wp.assigned_to_id
		WHERE (s.name ILIKE '%Ready To Production%' OR s.name IN ('Tested', 'In testing', 'Developed'))
	`
	var itemArgs []interface{}
	if projectID != "" {
		itemsQuery += " AND p.id = $1"
		itemArgs = append(itemArgs, projectID)
	}
	itemsQuery += `
		ORDER BY 
			CASE 
				WHEN s.name ILIKE '%Ready To Production%' THEN 1
				WHEN s.name IN ('Tested', 'In testing') THEN 2
				ELSE 3
			END,
			wp.updated_at DESC
		LIMIT 100
	`

	itemRows, err := db.Query(itemsQuery, itemArgs...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer itemRows.Close()

	items := make([]models.ReleasePipelineItem, 0)
	for itemRows.Next() {
		var it models.ReleasePipelineItem
		var dueDate sql.NullString
		var assignee sql.NullString
		var doneRatio sql.NullInt32
		var updatedAt sql.NullTime

		if err := itemRows.Scan(
			&it.ID,
			&it.Subject,
			&it.Status,
			&it.Stage,
			&it.Type,
			&it.Priority,
			&it.ProjectID,
			&it.Project,
			&it.ProjectIdentifier,
			&assignee,
			&dueDate,
			&updatedAt,
			&doneRatio,
		); err == nil {
			if assignee.Valid {
				it.Assignee = &assignee.String
			}
			if dueDate.Valid {
				it.DueDate = &dueDate.String
			}
			if updatedAt.Valid {
				it.UpdatedAt = &updatedAt.Time
			}
			if doneRatio.Valid {
				v := int(doneRatio.Int32)
				it.DoneRatio = &v
			}
			items = append(items, it)
		}
	}

	c.JSON(http.StatusOK, models.ReleasePipelineResponse{
		Summary:  summary,
		Projects: projects,
		Items:    items,
	})
}

