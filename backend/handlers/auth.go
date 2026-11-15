package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"backend/config"
	"backend/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecretKey = []byte(getAuthSecret())

func getAuthSecret() string {
	if s := os.Getenv("JWT_SECRET"); s != "" {
		return s
	}
	return "top_project_dashboard_jwt_secret_key_2026_super_secure"
}

func getRoleLabel(role string) string {
	switch role {
	case "admin":
		return "Administrator"
	case "pm":
		return "Project Manager"
	case "member":
		return "Anggota Tim"
	case "viewer":
		return "Viewer / Direksi"
	default:
		return "Pengguna"
	}
}

// ── JWT Helpers ─────────────────────────────────────────────────────────────

type JWTHeader struct {
	Alg string `json:"alg"`
	Typ string `json:"typ"`
}

type JWTClaims struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	Exp      int64  `json:"exp"`
}

func generateJWT(claims JWTClaims) (string, error) {
	header := JWTHeader{Alg: "HS256", Typ: "JWT"}
	hBytes, _ := json.Marshal(header)
	cBytes, _ := json.Marshal(claims)

	hB64 := base64.RawURLEncoding.EncodeToString(hBytes)
	cB64 := base64.RawURLEncoding.EncodeToString(cBytes)

	data := hB64 + "." + cB64
	mac := hmac.New(sha256.New, jwtSecretKey)
	mac.Write([]byte(data))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	return data + "." + sig, nil
}

func verifyJWT(tokenStr string) (*JWTClaims, error) {
	parts := strings.Split(tokenStr, ".")
	if len(parts) != 3 {
		return nil, errors.New("format token tidak valid")
	}

	data := parts[0] + "." + parts[1]
	mac := hmac.New(sha256.New, jwtSecretKey)
	mac.Write([]byte(data))
	expectedSig := mac.Sum(nil)

	actualSig, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil || !hmac.Equal(actualSig, expectedSig) {
		return nil, errors.New("tanda tangan token tidak valid")
	}

	cBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, errors.New("klaim token rusak")
	}

	var claims JWTClaims
	if err := json.Unmarshal(cBytes, &claims); err != nil {
		return nil, err
	}

	if time.Now().Unix() > claims.Exp {
		return nil, errors.New("token telah kadaluarsa")
	}

	return &claims, nil
}

func extractBearerToken(c *gin.Context) string {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return ""
	}
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
		return strings.TrimSpace(parts[1])
	}
	return ""
}

// ── Handlers: Authentication ────────────────────────────────────────────────

// POST /api/auth/login
func Login(c *gin.Context) {
	db := config.DB

	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username dan password wajib diisi"})
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.Password = strings.TrimSpace(req.Password)

	if req.Username == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username dan password tidak boleh kosong"})
		return
	}

	var user models.DashboardUser
	var passwordHash string
	var lastLogin, createdAt, updatedAt sql.NullTime

	err := db.QueryRow(`
		SELECT id, username, email, password_hash, full_name, role, is_active, last_login_at, created_at, updated_at
		FROM dashboard_users
		WHERE (LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1))
	`, req.Username).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&passwordHash,
		&user.FullName,
		&user.Role,
		&user.IsActive,
		&lastLogin,
		&createdAt,
		&updatedAt,
	)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username atau kata sandi salah"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membaca database: " + err.Error()})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akun ini telah dinonaktifkan. Silakan hubungi Administrator."})
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username atau kata sandi salah"})
		return
	}

	// Update last_login_at
	now := time.Now()
	_, _ = db.Exec("UPDATE dashboard_users SET last_login_at = $1 WHERE id = $2", now, user.ID)
	user.LastLoginAt = &now

	if createdAt.Valid {
		user.CreatedAt = &createdAt.Time
	}
	if updatedAt.Valid {
		user.UpdatedAt = &updatedAt.Time
	}
	user.RoleLabel = getRoleLabel(user.Role)

	// Generate JWT token (valid for 7 days)
	claims := JWTClaims{
		UserID:   user.ID,
		Username: user.Username,
		FullName: user.FullName,
		Email:    user.Email,
		Role:     user.Role,
		Exp:      time.Now().Add(7 * 24 * time.Hour).Unix(),
	}
	token, err := generateJWT(claims)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat sesi token: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.LoginResponse{
		Token: token,
		User:  user,
	})
}

// GET /api/auth/me
func GetMe(c *gin.Context) {
	db := config.DB
	token := extractBearerToken(c)
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi tidak ditemukan. Silakan login."})
		return
	}

	claims, err := verifyJWT(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Sesi tidak valid atau telah kadaluarsa"})
		return
	}

	var user models.DashboardUser
	var lastLogin, createdAt, updatedAt sql.NullTime

	err = db.QueryRow(`
		SELECT id, username, email, full_name, role, is_active, last_login_at, created_at, updated_at
		FROM dashboard_users
		WHERE id = $1
	`, claims.UserID).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.FullName,
		&user.Role,
		&user.IsActive,
		&lastLogin,
		&createdAt,
		&updatedAt,
	)

	if err != nil || !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Pengguna tidak ditemukan atau tidak aktif"})
		return
	}

	if lastLogin.Valid {
		user.LastLoginAt = &lastLogin.Time
	}
	if createdAt.Valid {
		user.CreatedAt = &createdAt.Time
	}
	if updatedAt.Valid {
		user.UpdatedAt = &updatedAt.Time
	}
	user.RoleLabel = getRoleLabel(user.Role)

	c.JSON(http.StatusOK, gin.H{"user": user})
}

// POST /api/auth/logout
func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Berhasil keluar (logout)"})
}

// ── Handlers: Dashboard Users Management ────────────────────────────────────

// GET /api/dashboard-users
func GetDashboardUsers(c *gin.Context) {
	db := config.DB

	search := strings.TrimSpace(c.Query("search"))
	role := strings.TrimSpace(c.Query("role"))

	query := `
		SELECT id, username, email, full_name, role, is_active, last_login_at, created_at, updated_at
		FROM dashboard_users
		WHERE 1=1
	`
	var args []interface{}
	argIdx := 1

	if search != "" {
		query += fmt.Sprintf(" AND (username ILIKE $%d OR full_name ILIKE $%d OR email ILIKE $%d)", argIdx, argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}

	if role != "" {
		query += fmt.Sprintf(" AND role = $%d", argIdx)
		args = append(args, role)
		argIdx++
	}

	query += " ORDER BY id ASC"

	rows, err := db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data: " + err.Error()})
		return
	}
	defer rows.Close()

	list := make([]models.DashboardUser, 0)
	for rows.Next() {
		var u models.DashboardUser
		var lastLogin, createdAt, updatedAt sql.NullTime

		if err := rows.Scan(
			&u.ID,
			&u.Username,
			&u.Email,
			&u.FullName,
			&u.Role,
			&u.IsActive,
			&lastLogin,
			&createdAt,
			&updatedAt,
		); err == nil {
			if lastLogin.Valid {
				u.LastLoginAt = &lastLogin.Time
			}
			if createdAt.Valid {
				u.CreatedAt = &createdAt.Time
			}
			if updatedAt.Valid {
				u.UpdatedAt = &updatedAt.Time
			}
			u.RoleLabel = getRoleLabel(u.Role)
			list = append(list, u)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"users": list,
		"total": len(list),
	})
}

// POST /api/dashboard-users
func CreateDashboardUser(c *gin.Context) {
	db := config.DB

	var req models.CreateDashboardUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Semua data wajib diisi dengan benar"})
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(req.Email)
	req.FullName = strings.TrimSpace(req.FullName)
	req.Role = strings.TrimSpace(req.Role)

	if req.Username == "" || req.Email == "" || req.FullName == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Semua kolom wajib diisi"})
		return
	}

	// Validate duplicate username
	var count int
	_ = db.QueryRow("SELECT COUNT(*) FROM dashboard_users WHERE LOWER(username) = LOWER($1)", req.Username).Scan(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("Username '%s' sudah digunakan", req.Username)})
		return
	}

	// Validate duplicate email
	_ = db.QueryRow("SELECT COUNT(*) FROM dashboard_users WHERE LOWER(email) = LOWER($1)", req.Email).Scan(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("Email '%s' sudah digunakan", req.Email)})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi kata sandi"})
		return
	}

	var newID int
	err = db.QueryRow(`
		INSERT INTO dashboard_users (username, email, password_hash, full_name, role, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id
	`, req.Username, req.Email, string(hash), req.FullName, req.Role, req.IsActive).Scan(&newID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan akun: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Akun dashboard berhasil dibuat",
		"id":      newID,
	})
}

// PUT /api/dashboard-users/:id
func UpdateDashboardUser(c *gin.Context) {
	db := config.DB
	idStr := c.Param("id")
	userID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID pengguna tidak valid"})
		return
	}

	var req models.UpdateDashboardUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format input tidak valid"})
		return
	}

	req.Email = strings.TrimSpace(req.Email)
	req.FullName = strings.TrimSpace(req.FullName)
	req.Role = strings.TrimSpace(req.Role)

	if req.Email == "" || req.FullName == "" || req.Role == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nama lengkap, email, dan peran wajib diisi"})
		return
	}

	// Check email uniqueness
	var count int
	_ = db.QueryRow("SELECT COUNT(*) FROM dashboard_users WHERE LOWER(email) = LOWER($1) AND id <> $2", req.Email, userID).Scan(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("Email '%s' sudah digunakan akun lain", req.Email)})
		return
	}

	if req.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi kata sandi"})
			return
		}
		_, err = db.Exec(`
			UPDATE dashboard_users
			SET email = $1, full_name = $2, role = $3, is_active = $4, password_hash = $5, updated_at = CURRENT_TIMESTAMP
			WHERE id = $6
		`, req.Email, req.FullName, req.Role, req.IsActive, string(hash), userID)
	} else {
		_, err = db.Exec(`
			UPDATE dashboard_users
			SET email = $1, full_name = $2, role = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP
			WHERE id = $5
		`, req.Email, req.FullName, req.Role, req.IsActive, userID)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui akun: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Akun dashboard berhasil diperbarui"})
}

// DELETE /api/dashboard-users/:id
func DeleteDashboardUser(c *gin.Context) {
	db := config.DB
	idStr := c.Param("id")
	userID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID pengguna tidak valid"})
		return
	}

	// Safety: Prevent deleting user id 1 (primary superadmin)
	if userID == 1 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Akun Super Administrator Utama tidak dapat dihapus"})
		return
	}

	res, err := db.Exec("DELETE FROM dashboard_users WHERE id = $1", userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus akun: " + err.Error()})
		return
	}

	ra, _ := res.RowsAffected()
	if ra == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pengguna tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Akun dashboard berhasil dihapus"})
}
