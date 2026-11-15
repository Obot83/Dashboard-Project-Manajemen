package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/config"
	"backend/models"

	"github.com/gin-gonic/gin"
)

func setupAuthRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	_ = config.InitDB()
	r := gin.New()
	r.POST("/api/auth/login", Login)
	r.GET("/api/auth/me", GetMe)
	r.GET("/api/dashboard-users", GetDashboardUsers)
	return r
}

func TestLoginSuccess(t *testing.T) {
	r := setupAuthRouter()

	body, _ := json.Marshal(map[string]string{
		"username": "admin",
		"password": "admin123",
	})
	req, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var res models.LoginResponse
	if err := json.Unmarshal(w.Body.Bytes(), &res); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if res.Token == "" {
		t.Fatalf("Expected non-empty token")
	}
	if res.User.Role != "admin" {
		t.Fatalf("Expected role 'admin', got '%s'", res.User.Role)
	}
	t.Logf("Login successful for user: %s (Role: %s, Label: %s)", res.User.FullName, res.User.Role, res.User.RoleLabel)

	// Test GetMe with Bearer token
	reqMe, _ := http.NewRequest("GET", "/api/auth/me", nil)
	reqMe.Header.Set("Authorization", "Bearer "+res.Token)
	wMe := httptest.NewRecorder()
	r.ServeHTTP(wMe, reqMe)

	if wMe.Code != http.StatusOK {
		t.Fatalf("Expected 200 from GetMe, got %d: %s", wMe.Code, wMe.Body.String())
	}
	t.Logf("GetMe verified successfully!")
}

func TestLoginDifferentRoles(t *testing.T) {
	r := setupAuthRouter()

	rolesToTest := []struct {
		username string
		password string
		expectedRole string
	}{
		{"pm", "pm123", "pm"},
		{"member", "member123", "member"},
		{"viewer", "viewer123", "viewer"},
	}

	for _, tc := range rolesToTest {
		body, _ := json.Marshal(map[string]string{
			"username": tc.username,
			"password": tc.password,
		})
		req, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Fatalf("Login failed for %s: %s", tc.username, w.Body.String())
		}

		var res models.LoginResponse
		_ = json.Unmarshal(w.Body.Bytes(), &res)
		if res.User.Role != tc.expectedRole {
			t.Fatalf("Expected role %s, got %s", tc.expectedRole, res.User.Role)
		}
		t.Logf("Verified role differentiation: user '%s' has role '%s' (%s)",
			tc.username, res.User.Role, res.User.RoleLabel)
	}
}
