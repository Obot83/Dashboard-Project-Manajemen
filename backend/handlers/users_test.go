package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/config"
	"backend/models"

	"github.com/gin-gonic/gin"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	_ = config.InitDB()
	r := gin.New()
	r.GET("/api/users", GetUsers)
	r.GET("/api/users/:id", GetUserDetail)
	r.POST("/api/users", CreateUser)
	r.PUT("/api/users/:id", UpdateUser)
	r.DELETE("/api/users/:id", DeleteUser)
	return r
}

func TestGetUsers(t *testing.T) {
	r := setupTestRouter()
	req, _ := http.NewRequest("GET", "/api/users", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var res models.UsersResponse
	if err := json.Unmarshal(w.Body.Bytes(), &res); err != nil {
		t.Fatalf("Failed to unmarshal response: %v", err)
	}

	if len(res.Users) == 0 {
		t.Fatalf("Expected at least 1 user, got 0")
	}

	t.Logf("Successfully fetched %d users, summary total: %d, active: %d, admin: %d",
		len(res.Users), res.Summary.TotalUsers, res.Summary.ActiveUsers, res.Summary.AdminUsers)
}

func TestGetUserDetail(t *testing.T) {
	r := setupTestRouter()
	// Test with user ID 5 (Deni)
	req, _ := http.NewRequest("GET", "/api/users/5", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var res models.UserDetailResponse
	if err := json.Unmarshal(w.Body.Bytes(), &res); err != nil {
		t.Fatalf("Failed to unmarshal detail response: %v", err)
	}

	if res.User.ID != 5 {
		t.Fatalf("Expected user ID 5, got %d", res.User.ID)
	}

	t.Logf("User #5 details: Name=%s, Projects=%d, Tasks=%d, TimeEntries=%d",
		res.User.Name, len(res.Projects), len(res.Tasks), len(res.TimeEntries))
}

func TestCreateUserValidation(t *testing.T) {
	r := setupTestRouter()
	// Test empty payload
	req, _ := http.NewRequest("POST", "/api/users", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("Expected status 400 for empty body, got %d", w.Code)
	}
}
