package main

import (
	"log"
	"os"
	"time"

	"backend/config"
	"backend/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize PostgreSQL connection pool
	db := config.InitDB()
	defer db.Close()

	r := gin.Default()

	// CORS configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "TOP Project Dashboard API (Golang)"})
	})

	api := r.Group("/api")
	{
		api.GET("/meta/filters", handlers.GetFilterMeta)
		api.GET("/kpi", handlers.GetKPI)
		api.GET("/status-distribution", handlers.GetStatusDistribution)
		api.GET("/type-distribution", handlers.GetTypeDistribution)
		api.GET("/priority-distribution", handlers.GetPriorityDistribution)
		api.GET("/monthly-volume", handlers.GetMonthlyVolume)
		api.GET("/projects", handlers.GetProjects)
		api.GET("/work-packages", handlers.GetWorkPackages)
		api.GET("/work-packages/:id", handlers.GetWorkPackageDetail)
		api.GET("/workload", handlers.GetWorkload)
		api.GET("/time-per-project", handlers.GetTimePerProject)
		api.GET("/time-tracking", handlers.GetTimeTracking)
		api.GET("/milestones", handlers.GetMilestones)
		api.GET("/versions", handlers.GetVersions)
		api.GET("/completion", handlers.GetCompletion)
		api.GET("/reports-summary", handlers.GetReportsSummary)
		api.GET("/release-pipeline", handlers.GetReleasePipeline)

		// Authentication & Dashboard Users
		api.POST("/auth/login", handlers.Login)
		api.GET("/auth/me", handlers.GetMe)
		api.POST("/auth/logout", handlers.Logout)
		api.GET("/dashboard-users", handlers.GetDashboardUsers)
		api.POST("/dashboard-users", handlers.CreateDashboardUser)
		api.PUT("/dashboard-users/:id", handlers.UpdateDashboardUser)
		api.DELETE("/dashboard-users/:id", handlers.DeleteDashboardUser)

		// User Management (OpenProject Members)
		api.GET("/users", handlers.GetUsers)
		api.GET("/users/:id", handlers.GetUserDetail)
		api.POST("/users", handlers.CreateUser)
		api.PUT("/users/:id", handlers.UpdateUser)
		api.DELETE("/users/:id", handlers.DeleteUser)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Printf("Server starting on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Server failed to run: %v", err)
	}
}
