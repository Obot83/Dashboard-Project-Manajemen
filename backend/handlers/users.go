package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"backend/config"
	"backend/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func getStatusLabel(status int) string {
	switch status {
	case 1:
		return "Aktif"
	case 2:
		return "Terdaftar"
	case 3:
		return "Dinonaktifkan"
	case 4:
		return "Terundang"
	default:
		return "Lainnya"
	}
}

// ── GET /api/users ────────────────────────────────────────────────────────────

func GetUsers(c *gin.Context) {
	db := config.DB

	search := strings.TrimSpace(c.Query("search"))
	statusStr := strings.TrimSpace(c.Query("status"))
	role := strings.TrimSpace(c.Query("role"))
	projectIDStr := strings.TrimSpace(c.Query("project_id"))

	// 1. Calculate Summary KPIs across all users
	var summary models.UserSummaryKPI
	_ = db.QueryRow(`
		SELECT 
			COUNT(*),
			COUNT(CASE WHEN status = 1 THEN 1 END),
			COUNT(CASE WHEN status = 4 THEN 1 END),
			COUNT(CASE WHEN status = 3 THEN 1 END),
			COUNT(CASE WHEN admin = true THEN 1 END)
		FROM users
		WHERE type = 'User'
	`).Scan(
		&summary.TotalUsers,
		&summary.ActiveUsers,
		&summary.InvitedUsers,
		&summary.LockedUsers,
		&summary.AdminUsers,
	)

	_ = db.QueryRow(`
		SELECT COALESCE(ROUND(SUM(hours)::numeric, 1), 0) FROM time_entries
	`).Scan(&summary.TotalHoursLogged)

	// 2. Build Query with CTE for Aggregations
	query := `
		WITH user_tasks AS (
			SELECT 
				wp.assigned_to_id AS user_id,
				COUNT(CASE WHEN s.is_closed = false THEN 1 END) AS open_tasks,
				COUNT(CASE WHEN s.is_closed = true THEN 1 END) AS closed_tasks,
				COUNT(*) AS total_tasks
			FROM work_packages wp
			JOIN statuses s ON s.id = wp.status_id
			GROUP BY wp.assigned_to_id
		),
		user_hours AS (
			SELECT 
				te.user_id,
				ROUND(SUM(te.hours)::numeric, 2) AS spent_hours
			FROM time_entries te
			GROUP BY te.user_id
		),
		user_projects AS (
			SELECT 
				m.user_id,
				COUNT(DISTINCT m.project_id) AS project_count,
				STRING_AGG(DISTINCT p.name, '|||') AS project_names
			FROM members m
			JOIN projects p ON p.id = m.project_id
			GROUP BY m.user_id
		)
		SELECT 
			u.id,
			u.login,
			u.firstname,
			u.lastname,
			u.mail,
			u.admin,
			u.status,
			u.created_at,
			u.last_login_on,
			COALESCE(up.project_count, 0) AS project_count,
			COALESCE(up.project_names, '') AS project_names,
			COALESCE(ut.open_tasks, 0) AS open_tasks,
			COALESCE(ut.closed_tasks, 0) AS closed_tasks,
			COALESCE(ut.total_tasks, 0) AS total_tasks,
			COALESCE(uh.spent_hours, 0) AS spent_hours
		FROM users u
		LEFT JOIN user_tasks ut ON ut.user_id = u.id
		LEFT JOIN user_hours uh ON uh.user_id = u.id
		LEFT JOIN user_projects up ON up.user_id = u.id
		WHERE u.type = 'User'
	`

	var whereClauses []string
	var args []interface{}
	argIdx := 1

	if search != "" {
		whereClauses = append(whereClauses, fmt.Sprintf(
			"(u.firstname ILIKE $%d OR u.lastname ILIKE $%d OR u.login ILIKE $%d OR u.mail ILIKE $%d)",
			argIdx, argIdx, argIdx, argIdx,
		))
		args = append(args, "%"+search+"%")
		argIdx++
	}

	if statusStr != "" {
		if st, err := strconv.Atoi(statusStr); err == nil {
			whereClauses = append(whereClauses, fmt.Sprintf("u.status = $%d", argIdx))
			args = append(args, st)
			argIdx++
		}
	}

	if role == "admin" {
		whereClauses = append(whereClauses, "u.admin = true")
	} else if role == "member" {
		whereClauses = append(whereClauses, "u.admin = false")
	}

	if projectIDStr != "" {
		if pid, err := strconv.Atoi(projectIDStr); err == nil {
			whereClauses = append(whereClauses, fmt.Sprintf(
				"u.id IN (SELECT user_id FROM members WHERE project_id = $%d)",
				argIdx,
			))
			args = append(args, pid)
			argIdx++
		}
	}

	if len(whereClauses) > 0 {
		query += " AND " + strings.Join(whereClauses, " AND ")
	}

	query += " ORDER BY u.admin DESC, u.status ASC, u.firstname ASC"

	rows, err := db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar pengguna: " + err.Error()})
		return
	}
	defer rows.Close()

	users := make([]models.UserItem, 0)
	for rows.Next() {
		var it models.UserItem
		var fn, ln, mail, pNames string
		var createdAt, lastLogin sql.NullTime

		err := rows.Scan(
			&it.ID,
			&it.Login,
			&fn,
			&ln,
			&mail,
			&it.Admin,
			&it.Status,
			&createdAt,
			&lastLogin,
			&it.ProjectCount,
			&pNames,
			&it.OpenTasks,
			&it.ClosedTasks,
			&it.TotalTasks,
			&it.SpentHours,
		)
		if err != nil {
			continue
		}

		it.FirstName = strings.TrimSpace(fn)
		it.LastName = strings.TrimSpace(ln)
		it.Email = strings.TrimSpace(mail)

		fullName := strings.TrimSpace(it.FirstName + " " + it.LastName)
		if fullName == "" {
			fullName = it.Login
		}
		it.Name = fullName

		it.StatusLabel = getStatusLabel(it.Status)

		if createdAt.Valid {
			it.CreatedAt = &createdAt.Time
		}
		if lastLogin.Valid {
			it.LastLoginOn = &lastLogin.Time
		}

		if pNames != "" {
			it.Projects = strings.Split(pNames, "|||")
		} else {
			it.Projects = []string{}
		}

		users = append(users, it)
	}

	c.JSON(http.StatusOK, models.UsersResponse{
		Summary: summary,
		Users:   users,
		Total:   len(users),
	})
}

// ── GET /api/users/:id ────────────────────────────────────────────────────────

func GetUserDetail(c *gin.Context) {
	db := config.DB
	idStr := c.Param("id")
	userID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID pengguna tidak valid"})
		return
	}

	// 1. Fetch User Base Info & Aggregate Stats
	userQuery := `
		WITH user_tasks AS (
			SELECT 
				COUNT(CASE WHEN s.is_closed = false THEN 1 END) AS open_tasks,
				COUNT(CASE WHEN s.is_closed = true THEN 1 END) AS closed_tasks,
				COUNT(*) AS total_tasks
			FROM work_packages wp
			JOIN statuses s ON s.id = wp.status_id
			WHERE wp.assigned_to_id = $1
		),
		user_hours AS (
			SELECT 
				ROUND(SUM(te.hours)::numeric, 2) AS spent_hours
			FROM time_entries te
			WHERE te.user_id = $1
		),
		user_projects AS (
			SELECT 
				COUNT(DISTINCT m.project_id) AS project_count,
				STRING_AGG(DISTINCT p.name, '|||') AS project_names
			FROM members m
			JOIN projects p ON p.id = m.project_id
			WHERE m.user_id = $1
		)
		SELECT 
			u.id,
			u.login,
			u.firstname,
			u.lastname,
			u.mail,
			u.admin,
			u.status,
			u.created_at,
			u.last_login_on,
			COALESCE(up.project_count, 0) AS project_count,
			COALESCE(up.project_names, '') AS project_names,
			COALESCE(ut.open_tasks, 0) AS open_tasks,
			COALESCE(ut.closed_tasks, 0) AS closed_tasks,
			COALESCE(ut.total_tasks, 0) AS total_tasks,
			COALESCE(uh.spent_hours, 0) AS spent_hours
		FROM users u
		LEFT JOIN user_tasks ut ON true
		LEFT JOIN user_hours uh ON true
		LEFT JOIN user_projects up ON true
		WHERE u.id = $1 AND u.type = 'User'
	`

	var it models.UserItem
	var fn, ln, mail, pNames string
	var createdAt, lastLogin sql.NullTime

	err = db.QueryRow(userQuery, userID).Scan(
		&it.ID,
		&it.Login,
		&fn,
		&ln,
		&mail,
		&it.Admin,
		&it.Status,
		&createdAt,
		&lastLogin,
		&it.ProjectCount,
		&pNames,
		&it.OpenTasks,
		&it.ClosedTasks,
		&it.TotalTasks,
		&it.SpentHours,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengguna tidak ditemukan"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membaca data pengguna: " + err.Error()})
		return
	}

	it.FirstName = strings.TrimSpace(fn)
	it.LastName = strings.TrimSpace(ln)
	it.Email = strings.TrimSpace(mail)
	fullName := strings.TrimSpace(it.FirstName + " " + it.LastName)
	if fullName == "" {
		fullName = it.Login
	}
	it.Name = fullName
	it.StatusLabel = getStatusLabel(it.Status)

	if createdAt.Valid {
		it.CreatedAt = &createdAt.Time
	}
	if lastLogin.Valid {
		it.LastLoginOn = &lastLogin.Time
	}
	if pNames != "" {
		it.Projects = strings.Split(pNames, "|||")
	} else {
		it.Projects = []string{}
	}

	// 2. Fetch Projects Memberships & Roles
	pRows, err := db.Query(`
		SELECT 
			p.id AS project_id,
			p.name AS project_name,
			p.identifier AS project_identifier,
			COALESCE(STRING_AGG(DISTINCT r.name, ', '), 'Member') AS roles,
			m.created_at
		FROM members m
		JOIN projects p ON p.id = m.project_id
		LEFT JOIN member_roles mr ON mr.member_id = m.id
		LEFT JOIN roles r ON r.id = mr.role_id
		WHERE m.user_id = $1
		GROUP BY p.id, p.name, p.identifier, m.created_at
		ORDER BY p.name ASC
	`, userID)

	projects := make([]models.UserProjectMembership, 0)
	if err == nil {
		defer pRows.Close()
		for pRows.Next() {
			var up models.UserProjectMembership
			var mCreatedAt sql.NullTime
			if err := pRows.Scan(&up.ProjectID, &up.ProjectName, &up.ProjectIdentifier, &up.Roles, &mCreatedAt); err == nil {
				if mCreatedAt.Valid {
					up.CreatedAt = &mCreatedAt.Time
				}
				if up.Roles != "" {
					up.RoleList = strings.Split(up.Roles, ", ")
				}
				projects = append(projects, up)
			}
		}
	}

	// 3. Fetch Assigned Tasks
	tRows, err := db.Query(`
		SELECT 
			wp.id,
			wp.subject,
			s.name AS status,
			s.is_closed,
			t.name AS type,
			COALESCE(en.name, 'Normal') AS priority,
			p.id AS project_id,
			p.name AS project_name,
			wp.due_date::text,
			wp.done_ratio,
			wp.created_at,
			wp.updated_at
		FROM work_packages wp
		JOIN projects p ON p.id = wp.project_id
		JOIN statuses s ON s.id = wp.status_id
		JOIN types t ON t.id = wp.type_id
		LEFT JOIN enumerations en ON en.id = wp.priority_id
		WHERE wp.assigned_to_id = $1
		ORDER BY wp.updated_at DESC
		LIMIT 50
	`, userID)

	tasks := make([]models.UserTaskItem, 0)
	if err == nil {
		defer tRows.Close()
		for tRows.Next() {
			var ut models.UserTaskItem
			var dueDate sql.NullString
			var doneRatio sql.NullInt32
			var wpCreatedAt, wpUpdatedAt sql.NullTime

			if err := tRows.Scan(
				&ut.ID,
				&ut.Subject,
				&ut.Status,
				&ut.IsClosed,
				&ut.Type,
				&ut.Priority,
				&ut.ProjectID,
				&ut.ProjectName,
				&dueDate,
				&doneRatio,
				&wpCreatedAt,
				&wpUpdatedAt,
			); err == nil {
				if dueDate.Valid {
					ut.DueDate = &dueDate.String
				}
				if doneRatio.Valid {
					v := int(doneRatio.Int32)
					ut.DoneRatio = &v
				}
				if wpCreatedAt.Valid {
					ut.CreatedAt = &wpCreatedAt.Time
				}
				if wpUpdatedAt.Valid {
					ut.UpdatedAt = &wpUpdatedAt.Time
				}
				tasks = append(tasks, ut)
			}
		}
	}

	// 4. Fetch Recent Time Entries
	teRows, err := db.Query(`
		SELECT 
			te.id,
			ROUND(te.hours::numeric, 2) AS hours,
			te.spent_on::text,
			COALESCE(te.comments, '') AS comments,
			p.id AS project_id,
			p.name AS project_name,
			wp.id AS work_package_id,
			wp.subject AS work_package_subject
		FROM time_entries te
		JOIN projects p ON p.id = te.project_id
		LEFT JOIN work_packages wp ON wp.id = te.work_package_id
		WHERE te.user_id = $1
		ORDER BY te.spent_on DESC, te.id DESC
		LIMIT 25
	`, userID)

	timeEntries := make([]models.UserTimeEntryItem, 0)
	if err == nil {
		defer teRows.Close()
		for teRows.Next() {
			var te models.UserTimeEntryItem
			var wpID sql.NullInt32
			var wpSubj sql.NullString

			if err := teRows.Scan(
				&te.ID,
				&te.Hours,
				&te.SpentOn,
				&te.Comments,
				&te.ProjectID,
				&te.ProjectName,
				&wpID,
				&wpSubj,
			); err == nil {
				if wpID.Valid {
					v := int(wpID.Int32)
					te.WorkPackageID = &v
				}
				if wpSubj.Valid {
					te.WorkPackageSubject = &wpSubj.String
				}
				timeEntries = append(timeEntries, te)
			}
		}
	}

	c.JSON(http.StatusOK, models.UserDetailResponse{
		User:        it,
		Projects:    projects,
		Tasks:       tasks,
		TimeEntries: timeEntries,
	})
}

// ── POST /api/users ───────────────────────────────────────────────────────────

func CreateUser(c *gin.Context) {
	db := config.DB

	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data input tidak lengkap atau tidak valid: " + err.Error()})
		return
	}

	req.Login = strings.TrimSpace(req.Login)
	req.FirstName = strings.TrimSpace(req.FirstName)
	req.LastName = strings.TrimSpace(req.LastName)
	req.Email = strings.TrimSpace(req.Email)

	if req.Login == "" || req.FirstName == "" || req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username, Nama Depan, dan Email wajib diisi"})
		return
	}

	if req.Status == 0 {
		req.Status = 1 // Default Active
	}

	// Check login duplicate
	var existsCount int
	_ = db.QueryRow("SELECT COUNT(*) FROM users WHERE LOWER(login) = LOWER($1)", req.Login).Scan(&existsCount)
	if existsCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("Username '%s' sudah digunakan", req.Login)})
		return
	}

	// Check email duplicate
	_ = db.QueryRow("SELECT COUNT(*) FROM users WHERE LOWER(mail) = LOWER($1)", req.Email).Scan(&existsCount)
	if existsCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("Email '%s' sudah terdaftar", req.Email)})
		return
	}

	tx, err := db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memulai transaksi: " + err.Error()})
		return
	}
	defer tx.Rollback()

	// Insert into users
	var newUserID int
	err = tx.QueryRow(`
		INSERT INTO users (
			login, firstname, lastname, mail, admin, status, type,
			created_at, updated_at, language, first_login, force_password_change
		) VALUES (
			$1, $2, $3, $4, $5, $6, 'User',
			CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'en', true, false
		) RETURNING id
	`, req.Login, req.FirstName, req.LastName, req.Email, req.Admin, req.Status).Scan(&newUserID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat pengguna: " + err.Error()})
		return
	}

	// Insert password if provided
	if req.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi kata sandi: " + err.Error()})
			return
		}

		_, err = tx.Exec(`
			INSERT INTO user_passwords (user_id, hashed_password, type, created_at, updated_at)
			VALUES ($1, $2, 'UserPassword::Bcrypt', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		`, newUserID, string(hash))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan kata sandi: " + err.Error()})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan perubahan: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Pengguna berhasil dibuat",
		"id":      newUserID,
		"login":   req.Login,
	})
}

// ── PUT /api/users/:id ────────────────────────────────────────────────────────

func UpdateUser(c *gin.Context) {
	db := config.DB
	idStr := c.Param("id")
	userID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID pengguna tidak valid"})
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format input tidak valid: " + err.Error()})
		return
	}

	req.FirstName = strings.TrimSpace(req.FirstName)
	req.LastName = strings.TrimSpace(req.LastName)
	req.Email = strings.TrimSpace(req.Email)

	if req.FirstName == "" || req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama Depan dan Email wajib diisi"})
		return
	}

	// Check if user exists
	var currentStatus int
	err = db.QueryRow("SELECT status FROM users WHERE id = $1 AND type = 'User'", userID).Scan(&currentStatus)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengguna tidak ditemukan"})
		return
	}

	// Check email uniqueness among other users
	var emailConflict int
	_ = db.QueryRow("SELECT COUNT(*) FROM users WHERE LOWER(mail) = LOWER($1) AND id <> $2", req.Email, userID).Scan(&emailConflict)
	if emailConflict > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("Email '%s' sudah digunakan oleh pengguna lain", req.Email)})
		return
	}

	if req.Status == 0 {
		req.Status = currentStatus
	}

	tx, err := db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memulai transaksi: " + err.Error()})
		return
	}
	defer tx.Rollback()

	// Update user info
	_, err = tx.Exec(`
		UPDATE users 
		SET firstname = $1, lastname = $2, mail = $3, admin = $4, status = $5, updated_at = CURRENT_TIMESTAMP
		WHERE id = $6
	`, req.FirstName, req.LastName, req.Email, req.Admin, req.Status, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui pengguna: " + err.Error()})
		return
	}

	// Update password if provided
	if req.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi kata sandi: " + err.Error()})
			return
		}

		var pwdExists int
		_ = tx.QueryRow("SELECT COUNT(*) FROM user_passwords WHERE user_id = $1", userID).Scan(&pwdExists)
		if pwdExists > 0 {
			_, err = tx.Exec(`
				UPDATE user_passwords 
				SET hashed_password = $1, updated_at = CURRENT_TIMESTAMP
				WHERE user_id = $2
			`, string(hash), userID)
		} else {
			_, err = tx.Exec(`
				INSERT INTO user_passwords (user_id, hashed_password, type, created_at, updated_at)
				VALUES ($1, $2, 'UserPassword::Bcrypt', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			`, userID, string(hash))
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui kata sandi: " + err.Error()})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan perubahan: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Data pengguna berhasil diperbarui",
		"id":      userID,
	})
}

// ── DELETE /api/users/:id ─────────────────────────────────────────────────────

func DeleteUser(c *gin.Context) {
	db := config.DB
	idStr := c.Param("id")
	userID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID pengguna tidak valid"})
		return
	}

	// Safety check: Prevent deactivating OpenProject Admin user #4
	if userID == 4 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akun Administrator Utama tidak boleh dinonaktifkan"})
		return
	}

	// Safely lock / deactivate user (status = 3)
	res, err := db.Exec(`
		UPDATE users 
		SET status = 3, updated_at = CURRENT_TIMESTAMP 
		WHERE id = $1 AND type = 'User'
	`, userID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menonaktifkan pengguna: " + err.Error()})
		return
	}

	ra, _ := res.RowsAffected()
	if ra == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengguna tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Pengguna berhasil dinonaktifkan (Status: Locked)",
		"id":      userID,
	})
}
