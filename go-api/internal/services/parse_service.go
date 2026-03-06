package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"go.uber.org/zap"
)

// ParseService calls the Python worker to parse episode content.
type ParseService struct {
	pythonWorkerURL string
	logger          *zap.Logger
	httpClient      *http.Client
}

// NewParseService creates a ParseService backed by the given Python worker URL.
func NewParseService(pythonWorkerURL string, logger *zap.Logger) *ParseService {
	return &ParseService{
		pythonWorkerURL: pythonWorkerURL,
		logger:          logger,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// ParseRequest is the payload sent to the Python parse endpoint.
type ParseRequest struct {
	Content string `json:"content"`
	AgentID string `json:"agent_id,omitempty"`
}

// ParseResponse is the parsed episode metadata returned by the Python worker.
type ParseResponse struct {
	Intent          string   `json:"intent"`
	Entities        []string `json:"entities"`
	Domain          string   `json:"domain"`
	EmotionSignal   string   `json:"emotion_signal"`
	ImportanceScore float64  `json:"importance_score"`
	LatencyMs       int64    `json:"latency_ms"`
}

// Parse extracts structured metadata from raw episode content.
func (s *ParseService) Parse(ctx context.Context, content, agentID string) (*ParseResponse, error) {
	if s.pythonWorkerURL == "" {
		return nil, fmt.Errorf("python worker URL not configured")
	}

	req := ParseRequest{Content: content, AgentID: agentID}
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("marshal parse request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, s.pythonWorkerURL+"/parse", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create parse request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	start := time.Now()
	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("call parse endpoint: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("parse endpoint returned %d", resp.StatusCode)
	}

	var result ParseResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode parse response: %w", err)
	}

	result.LatencyMs = time.Since(start).Milliseconds()
	s.logger.Debug("parse_ok",
		zap.String("domain", result.Domain),
		zap.Float64("importance", result.ImportanceScore),
		zap.Int64("latency_ms", result.LatencyMs),
	)

	return &result, nil
}
