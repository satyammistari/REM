package domain

import "time"

type SemanticMemory struct {
	SemanticID       string
	AgentID          string
	UserID           string
	Fact             string
	Confidence       float64
	EvidenceCount    int
	SourceEpisodeIDs []string
	Domain           string
	FactType         string
	Active           bool
	ContradictedBy   string
	Superseded       bool
	CreatedAt        time.Time
	UpdatedAt        time.Time
	LastRetrievedAt  *time.Time
}

