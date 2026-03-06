package domain

import "time"

// User represents an account that owns agents and API keys.
type User struct {
	UserID       string
	Email        string
	APIKeyHash   string
	APIKeyPrefix string
	Plan         string
	TotalAgents  int
	CreatedAt    time.Time
	Active       bool
}

