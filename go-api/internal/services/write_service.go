package services

import (
	"bytes"
	"context"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"rem/go-api/internal/db/neo4j"
	"rem/go-api/internal/db/postgres"
	"rem/go-api/internal/db/qdrant"
	"rem/go-api/internal/db/redis"
	"rem/go-api/internal/domain"

	"go.uber.org/zap"
)

type WriteService struct {
	db              *postgres.DB
	qdrant          *qdrant.QdrantClient
	neo4j           *neo4jdb.Neo4jClient
	redis           *redisdb.RedisClient
	pythonWorkerURL string
	logger          *zap.Logger
	httpClient      *http.Client
}

func NewWriteService(db *postgres.DB, qd *qdrant.QdrantClient, neo *neo4jdb.Neo4jClient, redis *redisdb.RedisClient, pythonWorkerURL string, logger *zap.Logger) *WriteService {
	return &WriteService{
		db:     db,
		qdrant: qd,
		neo4j:  neo,
		redis:  redis,
		pythonWorkerURL: pythonWorkerURL,
		logger:          logger,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

type pythonParseResponse struct {
	Intent          string   `json:"intent"`
	Entities        []string `json:"entities"`
	Domain          string   `json:"domain"`
	EmotionSignal   string   `json:"emotion_signal"`
	ImportanceScore float64  `json:"importance_score"`
}

type pythonEmbedResponse struct {
	Embedding  []float32 `json:"embedding"`
	Cached     bool      `json:"cached"`
	Dimensions int       `json:"dimensions"`
}

// WriteEpisode stores an episode in Postgres, Qdrant, Neo4j and queues consolidation.
func (s *WriteService) WriteEpisode(ctx context.Context, req domain.CreateEpisodeRequest) (*domain.CreateEpisodeResponse, error) {
	start := time.Now()

	// Step 1: Create episode struct
	episode := domain.NewEpisode(req)

	// Best-effort previous episode lookup for temporal edge
	prevEpisodeID, _, _ := s.db.GetLastEpisodeIDByAgent(ctx, episode.AgentID)

	// Step 2: Parse episode via Python worker (best-effort)
	parseStart := time.Now()
	if s.pythonWorkerURL != "" {
		pctx, cancel := context.WithTimeout(ctx, 8*time.Second)
		defer cancel()

		var parsed pythonParseResponse
		err := s.postJSON(pctx, s.pythonWorkerURL+"/parse", map[string]any{
			"content": req.Content,
		}, &parsed)
		if err != nil {
			s.logger.Warn("parse_step_failed", zap.Error(err))
		} else {
			if parsed.Intent != "" {
				episode.Intent = parsed.Intent
			}
			if parsed.Entities != nil {
				episode.ParsedEntities = parsed.Entities
			}
			if parsed.Domain != "" {
				episode.Domain = parsed.Domain
			}
			if parsed.EmotionSignal != "" {
				episode.EmotionSignal = parsed.EmotionSignal
			}
			if parsed.ImportanceScore >= 0 && parsed.ImportanceScore <= 1 {
				episode.ImportanceScore = parsed.ImportanceScore
			}
		}
	}
	s.logger.Debug("write_parse_done", zap.Duration("latency", time.Since(parseStart)), zap.String("episode_id", episode.EpisodeID))

	// Step 3: Get embedding via Python worker with Redis cache
	embedStart := time.Now()
	textHash := md5Hex(req.Content)
	var embedding []float32

	if s.redis != nil {
		if cached, ok, err := s.redis.GetCachedEmbedding(ctx, textHash); err == nil && ok {
			embedding = cached
		}
	}

	if embedding == nil {
		if s.pythonWorkerURL == "" {
			return nil, fmt.Errorf("python worker URL not configured")
		}

		ectx, cancel := context.WithTimeout(ctx, 12*time.Second)
		defer cancel()

		var embResp pythonEmbedResponse
		if err := s.postJSON(ectx, s.pythonWorkerURL+"/embed", map[string]any{
			"text": req.Content,
		}, &embResp); err != nil {
			return nil, fmt.Errorf("embedding request failed: %w", err)
		}
		embedding = embResp.Embedding
		if s.redis != nil && embedding != nil {
			_ = s.redis.CacheEmbedding(ctx, textHash, embedding, 24*time.Hour)
		}
	}
	s.logger.Debug("write_embed_done", zap.Duration("latency", time.Since(embedStart)), zap.String("episode_id", episode.EpisodeID))

	// Step 4: Store in PostgreSQL
	pgStart := time.Now()
	if err := s.db.InsertEpisode(ctx, episode); err != nil {
		return nil, fmt.Errorf("insert episode: %w", err)
	}
	s.logger.Debug("write_postgres_done", zap.Duration("latency", time.Since(pgStart)), zap.String("episode_id", episode.EpisodeID))

	// Step 5: Store in Qdrant
	qdStart := time.Now()
	payload := map[string]interface{}{
		"agent_id":         episode.AgentID,
		"domain":           episode.Domain,
		"outcome":          episode.Outcome,
		"consolidated":     false,
		"importance_score": episode.ImportanceScore,
		"created_at":       episode.CreatedAt.Unix(),
	}
	if err := s.qdrant.UpsertEpisode(ctx, episode.EpisodeID, embedding, payload); err != nil {
		return nil, fmt.Errorf("qdrant upsert: %w", err)
	}
	s.logger.Debug("write_qdrant_done", zap.Duration("latency", time.Since(qdStart)), zap.String("episode_id", episode.EpisodeID))

	// Step 6: Store in Neo4j with temporal edge
	neoStart := time.Now()
	if err := s.neo4j.CreateEpisodeNode(ctx, episode.EpisodeID, episode.AgentID, episode.Domain, episode.CreatedAt.Unix()); err != nil {
		return nil, fmt.Errorf("neo4j episode node: %w", err)
	}
	if prevEpisodeID != "" && prevEpisodeID != episode.EpisodeID {
		_ = s.neo4j.CreateTemporalEdge(ctx, prevEpisodeID, episode.EpisodeID)
	}
	s.logger.Debug("write_neo4j_done", zap.Duration("latency", time.Since(neoStart)), zap.String("episode_id", episode.EpisodeID))

	// Step 7: Queue consolidation job (fire-and-forget)
	if s.redis != nil {
		go func(agentID, episodeID string) {
			bgCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()
			if err := s.redis.PublishConsolidationJob(bgCtx, agentID, episodeID); err != nil {
				s.logger.Warn("publish_consolidation_job_failed", zap.Error(err))
			}
		}(episode.AgentID, episode.EpisodeID)
	}

	// Step 8: Update agent stats (best-effort; implemented in Day 6)
	// noop for now, to be wired when agent stats helpers exist.

	resp := &domain.CreateEpisodeResponse{
		EpisodeID: episode.EpisodeID,
		AgentID:   episode.AgentID,
		CreatedAt: episode.CreatedAt,
		Status:    "stored",
	}

	s.logger.Info("episode_written",
		zap.String("episode_id", episode.EpisodeID),
		zap.String("agent_id", episode.AgentID),
		zap.Duration("latency", time.Since(start)),
	)

	return resp, nil
}

func (s *WriteService) postJSON(ctx context.Context, url string, body any, out any) error {
	b, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(b))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("http %s returned status %d", url, resp.StatusCode)
	}
	if out == nil {
		return nil
	}
	return json.NewDecoder(resp.Body).Decode(out)
}

func md5Hex(s string) string {
	h := md5.Sum([]byte(s))
	return hex.EncodeToString(h[:])
}

