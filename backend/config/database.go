package config

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() *sql.DB {
	// Try loading .env from current directory or parent
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")
	ex, err := os.Executable()
	if err == nil {
		_ = godotenv.Load(filepath.Join(filepath.Dir(ex), ".env"))
		_ = godotenv.Load(filepath.Join(filepath.Dir(ex), "..", ".env"))
	}

	host := getEnv("DB_HOST", "127.0.0.1")
	portStr := getEnv("DB_PORT", "35433")
	user := getEnv("DB_USER", "openproject")
	password := getEnv("DB_PASSWORD", "")
	dbname := getEnv("DB_NAME", "openproject")

	port, err := strconv.Atoi(portStr)
	if err != nil {
		port = 35433
	}

	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable connect_timeout=10",
		host, port, user, password, dbname,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to open database connection: %v", err)
	}

	// Optimize connection pooling
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(2 * time.Minute)

	// Test ping
	if err := db.Ping(); err != nil {
		log.Printf("Warning: Database ping failed: %v", err)
	} else {
		log.Printf("Connected successfully to PostgreSQL database '%s' at %s:%d", dbname, host, port)
	}

	DB = db
	return db
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
