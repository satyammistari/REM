package domain

import (
	"time"

	"github.com/google/uuid"
)

type Episode struct {
	EpisodeID              string
	AgentID                string
	UserID                 string
	SessionID              string
	TeamID                 string
	RawContent             string
	ParsedEntities         []string
	Intent                 string
	Outcome                string
	Domain                 string
	EmotionSignal          string
	ImportanceScore        float64
	RetrievalCount         int
	LastRetrievedAt        *time.Time
	Consolidated           bool
	ConsolidationCandidate bool
	ConsolidatedInto       string
	CreatedAt              time.Time
	UpdatedAt              time.Time
}

type CreateEpisodeRequest struct {
	AgentID   string            `json:"agent_id"`
	UserID    string            `json:"user_id"`
	SessionID string            `json:"session_id"`
	Content   string            `json:"content"`
	Outcome   string            `json:"outcome"`
	Metadata  map[string]string `json:"metadata"`
}

type CreateEpisodeResponse struct {
	EpisodeID string    `json:"episode_id"`
	AgentID   string    `json:"agent_id"`
	CreatedAt time.Time `json:"created_at"`
	Status    string    `json:"status"`
}

type RetrieveRequest struct {
	Query           string `json:"query"`
	AgentID         string `json:"agent_id"`
	TopK            int    `json:"top_k"`
	IncludeSemantic bool   `json:"include_semantic"`
}

type EpisodeResult struct {
	Episode         Episode  `json:"episode"`
	Score           float64  `json:"score"`
	RetrievalSource string   `json:"retrieval_source"`
}

type SemanticResult struct {
	SemanticID    string  `json:"semantic_id"`
	Fact          string  `json:"fact"`
	Confidence    float64 `json:"confidence"`
	FactType      string  `json:"fact_type"`
	Domain        string  `json:"domain"`
	EvidenceCount int     `json:"evidence_count"`
	Score         float64 `json:"score"`
}

type RetrieveResponse struct {
	Episodes         []EpisodeResult  `json:"episodes"`
	SemanticMemories []SemanticResult `json:"semantic_memories"`
	InjectionPrompt  string           `json:"injection_prompt"`
	LatencyMs        int64            `json:"latency_ms"`
}

type GraphData struct {
	Nodes []GraphNode `json:"nodes"`
	Edges []GraphEdge `json:"edges"`
}

type GraphNode struct {
	ID           string  `json:"id"`
	Type         string  `json:"type"`
	Label        string  `json:"label"`
	Domain       string  `json:"domain"`
	Consolidated bool    `json:"consolidated"`
	Importance   float64 `json:"importance"`
}

type GraphEdge struct {
	From string `json:"from"`
	To   string `json:"to"`
	Type string `json:"type"`
}

func NewEpisode(req CreateEpisodeRequest) Episode {
	now := time.Now().UTC()
	outcome := req.Outcome
	if outcome == "" {
		outcome = "unknown"
	}
	return Episode{
		EpisodeID:       uuid.NewString(),
		AgentID:         req.AgentID,
		UserID:          req.UserID,
		SessionID:       req.SessionID,
		RawContent:      req.Content,
		ParsedEntities:  []string{},
		Outcome:         outcome,
		Domain:          "general",
		ImportanceScore: 0.5,
		CreatedAt:       now,
		UpdatedAt:       now,
	}
}

