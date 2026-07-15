package main

import (
	"bufio"
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/url"
	"os"
	"strings"
	"time"

	"apotek-api/database/seeders"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	if err := loadEnv(".env"); err != nil {
		log.Fatalf("load env: %v", err)
	}

	db, err := sql.Open("pgx", databaseURL())
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer db.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("ping database: %v", err)
	}

	if _, err := db.ExecContext(ctx, `
CREATE TABLE IF NOT EXISTS seed_history (
  id VARCHAR(150) PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT NOW()
);`); err != nil {
		log.Fatalf("create seed_history: %v", err)
	}

	authUserID := os.Getenv("ADMIN_AUTH_USER_ID")

	for _, seeder := range seeders.All {
		applied, err := isApplied(ctx, db, seeder.ID)
		if err != nil {
			log.Fatalf("check seeder %s: %v", seeder.ID, err)
		}
		if applied {
			fmt.Printf("skip %s\n", seeder.ID)
			continue
		}

		sqlText := seeder.SQL
		if strings.Contains(sqlText, "__AUTH_USER_ID__") {
			if authUserID == "" {
				fmt.Printf("skip %s: set ADMIN_AUTH_USER_ID (Supabase Auth user UUID) to run this seeder\n", seeder.ID)
				continue
			}
			sqlText = strings.ReplaceAll(sqlText, "__AUTH_USER_ID__", authUserID)
		}

		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			log.Fatalf("begin seeder %s: %v", seeder.ID, err)
		}

		if _, err := tx.ExecContext(ctx, sqlText); err != nil {
			_ = tx.Rollback()
			log.Fatalf("apply seeder %s: %v", seeder.ID, err)
		}
		if _, err := tx.ExecContext(ctx, `INSERT INTO seed_history (id) VALUES ($1)`, seeder.ID); err != nil {
			_ = tx.Rollback()
			log.Fatalf("record seeder %s: %v", seeder.ID, err)
		}
		if err := tx.Commit(); err != nil {
			log.Fatalf("commit seeder %s: %v", seeder.ID, err)
		}

		fmt.Printf("applied %s\n", seeder.ID)
	}

	fmt.Println("seed complete")
}

func isApplied(ctx context.Context, db *sql.DB, id string) (bool, error) {
	var exists bool
	err := db.QueryRowContext(ctx, `SELECT EXISTS (SELECT 1 FROM seed_history WHERE id = $1)`, id).Scan(&exists)
	return exists, err
}

func databaseURL() string {
	if rawURL := os.Getenv("DATABASE_URL"); rawURL != "" {
		return rawURL
	}

	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}

	u := url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(os.Getenv("DB_USERNAME"), os.Getenv("DB_PASSWORD")),
		Host:   fmt.Sprintf("%s:%s", host, port),
		Path:   os.Getenv("DB_DATABASE"),
	}
	q := u.Query()
	q.Set("sslmode", "require")
	q.Set("default_query_exec_mode", "simple_protocol")
	u.RawQuery = q.Encode()

	return u.String()
}

func loadEnv(path string) error {
	file, err := os.Open(path)
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.Trim(strings.TrimSpace(value), `"'`)
		if key != "" {
			_ = os.Setenv(key, value)
		}
	}

	return scanner.Err()
}
