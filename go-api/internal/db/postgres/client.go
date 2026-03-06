package postgres

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"rem/go-api/internal/config"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

type DB struct {
	pool   *pgxpool.Pool
	logger *zap.Logger
}

func New(ctx context.Context, cfg *config.Config, logger *zap.Logger) (*DB, error) {
	poolCfg, err := pgxpool.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse database url: %w", err)
	}

	poolCfg.MaxConns = 20
	poolCfg.MinConns = 2
	poolCfg.MaxConnLifetime = time.Hour
	poolCfg.MaxConnIdleTime = 30 * time.Minute
	poolCfg.HealthCheckPeriod = time.Minute

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, fmt.Errorf("connect postgres: %w", err)
	}

	db := &DB{pool: pool, logger: logger}
	if err := db.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}

	return db, nil
}

func (d *DB) Close() {
	if d.pool != nil {
		d.pool.Close()
	}
}

func (d *DB) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	return d.pool.Ping(ctx)
}

func (d *DB) Pool() *pgxpool.Pool {
	return d.pool
}

func (d *DB) RunMigrations(ctx context.Context) error {
	if _, err := d.pool.Exec(ctx, `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);`); err != nil {
		return fmt.Errorf("create schema_migrations: %w", err)
	}

	migrationsDir, err := findMigrationsDir()
	if err != nil {
		return err
	}

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}

	var files []string
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		name := e.Name()
		if strings.HasSuffix(strings.ToLower(name), ".sql") {
			files = append(files, name)
		}
	}
	sort.Strings(files)

	for _, name := range files {
		version := name

		applied, err := d.isMigrationApplied(ctx, version)
		if err != nil {
			return err
		}
		if applied {
			continue
		}

		path := filepath.Join(migrationsDir, name)
		sqlBytes, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", name, err)
		}

		tx, err := d.pool.BeginTx(ctx, pgx.TxOptions{})
		if err != nil {
			return fmt.Errorf("begin tx: %w", err)
		}

		if _, err := tx.Exec(ctx, string(sqlBytes)); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("apply migration %s: %w", name, err)
		}

		if _, err := tx.Exec(ctx, `INSERT INTO schema_migrations (version) VALUES ($1)`, version); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("record migration %s: %w", name, err)
		}

		if err := tx.Commit(ctx); err != nil {
			return fmt.Errorf("commit migration %s: %w", name, err)
		}

		d.logger.Info("applied migration", zap.String("version", version))
	}

	return nil
}

func (d *DB) isMigrationApplied(ctx context.Context, version string) (bool, error) {
	var v string
	err := d.pool.QueryRow(ctx, `SELECT version FROM schema_migrations WHERE version=$1`, version).Scan(&v)
	if err == nil {
		return true, nil
	}
	if err == pgx.ErrNoRows {
		return false, nil
	}
	return false, fmt.Errorf("check migration applied %s: %w", version, err)
}

func findMigrationsDir() (string, error) {
	// Try common working dirs for `go run ./cmd/api` and running the built binary.
	candidates := []string{
		filepath.Join("internal", "db", "postgres", "migrations"),
		filepath.Join("go-api", "internal", "db", "postgres", "migrations"),
	}

	cwd, _ := os.Getwd()
	if cwd != "" {
		candidates = append(candidates,
			filepath.Join(cwd, "internal", "db", "postgres", "migrations"),
			filepath.Join(cwd, "go-api", "internal", "db", "postgres", "migrations"),
		)
	}

	for _, p := range candidates {
		if st, err := os.Stat(p); err == nil && st.IsDir() {
			return p, nil
		}
	}
	return "", fmt.Errorf("migrations directory not found; tried: %v", candidates)
}

