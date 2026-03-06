package postgres

import (
	"context"

	"github.com/jackc/pgx/v5"

	"rem/go-api/internal/domain"
)

// InsertUser inserts a new user row.
func (db *DB) InsertUser(ctx context.Context, u domain.User) error {
	_, err := db.pool.Exec(ctx, `
INSERT INTO users (
  user_id, email, api_key_hash, api_key_prefix, plan, total_agents, created_at, active
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8
)`,
		u.UserID,
		u.Email,
		u.APIKeyHash,
		u.APIKeyPrefix,
		u.Plan,
		u.TotalAgents,
		u.CreatedAt,
		u.Active,
	)
	return err
}

// GetUserByEmail returns a user by email if it exists.
func (db *DB) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	row := db.pool.QueryRow(ctx, `
SELECT user_id, email, api_key_hash, api_key_prefix, plan, total_agents, created_at, active
FROM users
WHERE email = $1
`, email)

	var u domain.User
	if err := row.Scan(
		&u.UserID,
		&u.Email,
		&u.APIKeyHash,
		&u.APIKeyPrefix,
		&u.Plan,
		&u.TotalAgents,
		&u.CreatedAt,
		&u.Active,
	); err != nil {
		if isNoRows(err) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

// GetUserByAPIKeyPrefix returns a user by stored API key prefix.
func (db *DB) GetUserByAPIKeyPrefix(ctx context.Context, prefix string) (*domain.User, error) {
	row := db.pool.QueryRow(ctx, `
SELECT user_id, email, api_key_hash, api_key_prefix, plan, total_agents, created_at, active
FROM users
WHERE api_key_prefix = $1
`, prefix)

	var u domain.User
	if err := row.Scan(
		&u.UserID,
		&u.Email,
		&u.APIKeyHash,
		&u.APIKeyPrefix,
		&u.Plan,
		&u.TotalAgents,
		&u.CreatedAt,
		&u.Active,
	); err != nil {
		if isNoRows(err) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

// GetUserByID returns a user by primary key.
func (db *DB) GetUserByID(ctx context.Context, userID string) (*domain.User, error) {
	row := db.pool.QueryRow(ctx, `
SELECT user_id, email, api_key_hash, api_key_prefix, plan, total_agents, created_at, active
FROM users
WHERE user_id = $1
`, userID)

	var u domain.User
	if err := row.Scan(
		&u.UserID,
		&u.Email,
		&u.APIKeyHash,
		&u.APIKeyPrefix,
		&u.Plan,
		&u.TotalAgents,
		&u.CreatedAt,
		&u.Active,
	); err != nil {
		if isNoRows(err) {
			return nil, nil
		}
		return nil, err
	}
	return &u, nil
}

// isNoRows abstracts pgx.ErrNoRows checks so callers don't depend on pgx directly.
func isNoRows(err error) bool {
	return err == pgx.ErrNoRows
}


// UpdateAPIKey stores a new API key hash and prefix for a user.
func (db *DB) UpdateAPIKey(ctx context.Context, userID, keyHash, keyPrefix string) error {
	_, err := db.pool.Exec(ctx, `
UPDATE users
SET api_key_hash = $2,
    api_key_prefix = $3
WHERE user_id = $1
`, userID, keyHash, keyPrefix)
	return err
}

