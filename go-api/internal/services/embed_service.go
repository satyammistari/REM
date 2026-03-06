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

// EmbedService calls the Python worker to generate embeddings.
type EmbedService struct {
	pythonWorkerURL string
	logger          *zap.Logger
	httpClient      *http.Client
}

// NewEmbedService creates an EmbedService backed by the given Python worker URL.
func NewEmbedService(pythonWorkerURL string, logger *zap.Logger) *EmbedService {
	return &EmbedService{
		pythonWorkerURL: pythonWorkerURL,
		logger:          logger,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// EmbedRequest is the payload sent to the Python embed endpoint.
type EmbedRequest struct {
	Text  string `json:"text"`
	Cache bool   `json:"cache"`
}

// EmbedResponse is the response from the Python embed endpoint.
type EmbedResponse struct {
	Embedding  []float32 `json:"embedding"`
	Cached     bool      `json:"cached"`
	Dimensions int       `json:"dimensions"`
	LatencyMs  int64     `json:"latency_ms"`
}

// Embed generates an embedding vector for the given text.
func (s *EmbedService) Embed(ctx context.Context, text string, useCache bool) (*EmbedResponse, error) {
	if s.pythonWorkerURL == "" {
		return nil, fmt.Errorf("python worker URL not configured")
	}

	req := EmbedRequest{Text: text, Cache: useCache}
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("marshal embed request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, s.pythonWorkerURL+"/embed", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("create embed request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	start := time.Now()
	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("call embed endpoint: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("embed endpoint returned %d", resp.StatusCode)
	}

	var result EmbedResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode embed response: %w", err)
	}

	result.LatencyMs = time.Since(start).Milliseconds()
	s.logger.Debug("embed_ok",
		zap.Int("dims", result.Dimensions),
		zap.Bool("cached", result.Cached),
		zap.Int64("latency_ms", result.LatencyMs),
	)

	return &result, nil
}
