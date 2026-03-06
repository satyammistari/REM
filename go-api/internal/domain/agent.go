package domain

import "time"

type Agent struct {
	AgentID               string
	UserID                string
	Name                  string
	Description           string
	TotalEpisodes         int
	TotalSemanticMemories int
	LastActiveAt          *time.Time
	CreatedAt             time.Time
	Active                bool
}

