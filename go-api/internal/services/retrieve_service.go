package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"time"

	"rem/go-api/internal/db/neo4j"
	"rem/go-api/internal/db/postgres"
	"rem/go-api/internal/db/qdrant"
	"rem/go-api/internal/db/redis"
	"rem/go-api/internal/domain"

	"go.uber.org/zap"
)

type RetrieveService struct {
	db              *postgres.DB
	qdrant          *qdrant.QdrantClient
	neo4j           *neo4jdb.Neo4jClient
	redis           *redisdb.RedisClient
	pythonWorkerURL string
	logger          *zap.Logger
	httpClient      *http.Client
}

func NewRetrieveService(db *postgres.DB, qd *qdrant.QdrantClient, neo *neo4jdb.Neo4jClient, redis *redisdb.RedisClient, pythonWorkerURL string, logger *zap.Logger) *RetrieveService {
	return &RetrieveService{
		db:              db,
		qdrant:          qd,
		neo4j:           neo,
		redis:           redis,
		pythonWorkerURL: pythonWorkerURL,
		logger:          logger,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

type pythonEmbedRequest struct {
	Text string `json:"text"`
}

type pythonEmbedResp struct {
	Embedding  []float32 `json:"embedding"`
	Cached     bool      `json:"cached"`
	Dimensions int       `json:"dimensions"`
}

// Retrieve implements the full retrieval pipeline.
func (s *RetrieveService) Retrieve(ctx context.Context, req domain.RetrieveRequest) (*domain.RetrieveResponse, error) {
	start := time.Now()

	// Step 1: validate + defaults
	if req.TopK <= 0 {
		req.TopK = 5
	}
	if req.TopK > 20 {
		req.TopK = 20
	}

	// Step 2: query embedding via Python worker + Redis cache
	embedStart := time.Now()
	textHash := md5Hex(req.Query)
	var queryEmbedding []float32

	if s.redis != nil {
		if cached, ok, err := s.redis.GetCachedEmbedding(ctx, textHash); err == nil && ok {
			queryEmbedding = cached
		}
	}

	if queryEmbedding == nil {
		if s.pythonWorkerURL == "" {
			return nil, fmt.Errorf("python worker URL not configured")
		}
		ectx, cancel := context.WithTimeout(ctx, 10*time.Second)
		defer cancel()

		var embResp pythonEmbedResp
		if err := s.postJSON(ectx, s.pythonWorkerURL+"/embed", pythonEmbedRequest{Text: req.Query}, &embResp); err != nil {
			return nil, fmt.Errorf("embed query failed: %w", err)
		}
		queryEmbedding = embResp.Embedding
		if s.redis != nil && queryEmbedding != nil {
			_ = s.redis.CacheEmbedding(ctx, textHash, queryEmbedding, 24*time.Hour)
		}
	}
	s.logger.Debug("retrieve_embed_done", zap.Duration("latency", time.Since(embedStart)))

	// Step 3: parallel Qdrant searches
	type epSearchResult struct {
		results []qdrant.SearchResult
		err     error
	}
	type smSearchResult struct {
		results []qdrant.SearchResult
		err     error
	}

	epCh := make(chan epSearchResult, 1)
	smCh := make(chan smSearchResult, 1)

	go func() {
		res, err := s.qdrant.SearchEpisodes(ctx, queryEmbedding, req.AgentID, req.TopK*2, 0.0)
		epCh <- epSearchResult{results: res, err: err}
	}()

	if req.IncludeSemantic {
		go func() {
			res, err := s.qdrant.SearchSemanticMemories(ctx, queryEmbedding, req.AgentID, req.TopK*2)
			smCh <- smSearchResult{results: res, err: err}
		}()
	}

	epRes := <-epCh
	var smRes smSearchResult
	if req.IncludeSemantic {
		smRes = <-smCh
	}

	if epRes.err != nil {
		s.logger.Warn("qdrant_episode_search_failed", zap.Error(epRes.err))
	}
	if smRes.err != nil {
		s.logger.Warn("qdrant_semantic_search_failed", zap.Error(smRes.err))
	}

	// Step 4: Graph expansion for top 3 episode results
	episodesByID := make(map[string]domain.EpisodeResult)
	for _, r := range epRes.results {
		episodesByID[r.ID] = domain.EpisodeResult{
			Score:           float64(r.Score),
			RetrievalSource: "qdrant",
		}
	}

	// Fetch episode records for qdrant hits
	for id, base := range episodesByID {
		ep, err := s.db.GetEpisodeByID(ctx, id)
		if err != nil || ep == nil {
			continue
		}
		base.Episode = *ep
		episodesByID[id] = base
	}

	// Graph neighbors for top 3
	maxNeighborsFrom := 3
	count := 0
	for _, r := range epRes.results {
		if count >= maxNeighborsFrom {
			break
		}
		count++
		neighbors, err := s.neo4j.GetTemporalNeighbors(ctx, r.ID, 1)
		if err != nil {
			s.logger.Warn("neo4j_neighbors_failed", zap.Error(err))
			continue
		}
		for _, nid := range neighbors {
			if _, exists := episodesByID[nid]; exists {
				continue
			}
			ep, err := s.db.GetEpisodeByID(ctx, nid)
			if err != nil || ep == nil {
				continue
			}
			episodesByID[nid] = domain.EpisodeResult{
				Episode:         *ep,
				Score:           float64(r.Score) * 0.8, // slightly discounted vs direct hit
				RetrievalSource: "graph",
			}
		}
	}

	// Step 5: Build semantic memory results from qdrant hits
	var semanticResults []domain.SemanticResult
	if req.IncludeSemantic {
		for _, r := range smRes.results {
			payload := r.Payload
			fact, _ := payload["fact"].(string)
			conf, _ := payload["confidence"].(float64)
			factType, _ := payload["fact_type"].(string)
			domainName, _ := payload["domain"].(string)
			evidence, _ := payload["evidence_count"].(float64)
			semanticResults = append(semanticResults, domain.SemanticResult{
				SemanticID:   r.ID,
				Fact:         fact,
				Confidence:   conf,
				FactType:     factType,
				Domain:       domainName,
				EvidenceCount: int(evidence),
				Score:        float64(r.Score),
			})
		}
	}

	// Step 6: Rerank episodes
	now := time.Now().UTC()
	ranked := make([]domain.EpisodeResult, 0, len(episodesByID))
	for id, er := range episodesByID {
		ep := er.Episode
		if ep.EpisodeID == "" {
			// defensive: ensure we have a loaded episode
			if loaded, err := s.db.GetEpisodeByID(ctx, id); err == nil && loaded != nil {
				ep = *loaded
			}
		}

		daysSince := now.Sub(ep.CreatedAt).Hours() / 24
		recencyScore := 1.0 / (1.0 + daysSince*0.1)
		retrievalBonus := float64(ep.RetrievalCount) * 0.05
		if retrievalBonus > 0.3 {
			retrievalBonus = 0.3
		}

		finalScore := er.Score*0.6 + recencyScore*0.25 + retrievalBonus*0.15
		er.Score = finalScore
		er.Episode = ep
		ranked = append(ranked, er)
	}

	sort.Slice(ranked, func(i, j int) bool {
		return ranked[i].Score > ranked[j].Score
	})
	if len(ranked) > req.TopK {
		ranked = ranked[:req.TopK]
	}

	// Step 7: increment retrieval counts (fire-and-forget)
	go func(results []domain.EpisodeResult) {
		bg, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		for _, r := range results {
			_ = s.db.IncrementRetrievalCount(bg, r.Episode.EpisodeID)
		}
	}(ranked)

	// Step 8: build injection prompt
	prompt := buildInjectionPrompt(ranked, semanticResults)

	resp := &domain.RetrieveResponse{
		Episodes:         ranked,
		SemanticMemories: semanticResults,
		InjectionPrompt:  prompt,
		LatencyMs:        time.Since(start).Milliseconds(),
	}
	return resp, nil
}

func (s *RetrieveService) postJSON(ctx context.Context, url string, body any, out any) error {
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

func buildInjectionPrompt(episodes []domain.EpisodeResult, semantics []domain.SemanticResult) string {
	var buf bytes.Buffer
	buf.WriteString("=== RELEVANT MEMORY CONTEXT ===\n")

	now := time.Now().UTC()

	for i, er := range episodes {
		ep := er.Episode
		daysAgo := int(now.Sub(ep.CreatedAt).Hours() / 24)
		buf.WriteString(
			fmt.Sprintf("[Memory %d] (%s, %s, %d days ago): %s\n",
				i+1, ep.Domain, ep.Outcome, daysAgo, ep.RawContent),
		)
	}

	if len(semantics) > 0 {
		buf.WriteString("\n")
		for _, sm := range semantics {
			buf.WriteString(
				fmt.Sprintf("[Learned Fact]: %s (confidence: %.0f%%)\n",
					sm.Fact, sm.Confidence*100),
			)
		}
	}

	buf.WriteString("=== END MEMORY CONTEXT ===")
	return buf.String()
}

