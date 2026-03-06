package neo4jdb

import (
	"context"
	"fmt"
	"time"

	"rem/go-api/internal/config"

	"github.com/neo4j/neo4j-go-driver/v5/neo4j"
	"go.uber.org/zap"
)

type Neo4jClient struct {
	driver neo4j.DriverWithContext
	logger *zap.Logger
}

func New(cfg *config.Config, logger *zap.Logger) (*Neo4jClient, error) {
	driver, err := neo4j.NewDriverWithContext(
		cfg.Neo4jURI,
		neo4j.BasicAuth(cfg.Neo4jUser, cfg.Neo4jPassword, ""),
	)
	if err != nil {
		return nil, fmt.Errorf("create neo4j driver: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := driver.VerifyConnectivity(ctx); err != nil {
		_ = driver.Close(ctx)
		return nil, fmt.Errorf("verify neo4j connectivity: %w", err)
	}

	return &Neo4jClient{driver: driver, logger: logger}, nil
}

func (n *Neo4jClient) Close() error {
	if n.driver == nil {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return n.driver.Close(ctx)
}

func (n *Neo4jClient) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	return n.driver.VerifyConnectivity(ctx)
}

func (n *Neo4jClient) InitializeSchema(ctx context.Context) error {
	steps := []string{
		"CREATE CONSTRAINT ep_unique IF NOT EXISTS FOR (e:Episode) REQUIRE e.episode_id IS UNIQUE",
		"CREATE CONSTRAINT sm_unique IF NOT EXISTS FOR (s:SemanticMemory) REQUIRE s.semantic_id IS UNIQUE",
		"CREATE INDEX ep_agent IF NOT EXISTS FOR (e:Episode) ON (e.agent_id)",
		"CREATE INDEX ep_ts IF NOT EXISTS FOR (e:Episode) ON (e.created_at)",
		"CREATE INDEX ep_domain IF NOT EXISTS FOR (e:Episode) ON (e.domain)",
	}

	for _, cypher := range steps {
		if err := n.execWrite(ctx, cypher, nil); err != nil {
			return err
		}
		n.logger.Info("neo4j schema step ok", zap.String("cypher", cypher))
	}

	return nil
}

func (n *Neo4jClient) CreateEpisodeNode(ctx context.Context, episodeID, agentID, domain string, createdAt int64) error {
	cypher := `
MERGE (e:Episode {episode_id: $episode_id})
SET e.agent_id = $agent_id,
    e.domain = $domain,
    e.created_at = $created_at`
	params := map[string]any{
		"episode_id": episodeID,
		"agent_id":   agentID,
		"domain":     domain,
		"created_at": createdAt,
	}
	return n.execWrite(ctx, cypher, params)
}

func (n *Neo4jClient) CreateTemporalEdge(ctx context.Context, fromEpisodeID, toEpisodeID string) error {
	cypher := `
MATCH (a:Episode {episode_id: $from}), (b:Episode {episode_id: $to})
MERGE (a)-[:FOLLOWED_BY]->(b)`
	return n.execWrite(ctx, cypher, map[string]any{"from": fromEpisodeID, "to": toEpisodeID})
}

func (n *Neo4jClient) GetTemporalNeighbors(ctx context.Context, episodeID string, depth int) ([]string, error) {
	if depth <= 0 {
		depth = 1
	}
	cypher := fmt.Sprintf(`
MATCH (e:Episode {episode_id: $episode_id})
CALL {
  WITH e
  MATCH (e)-[:FOLLOWED_BY*1..%d]-(n:Episode)
  RETURN DISTINCT n.episode_id AS id
}
RETURN DISTINCT id`, depth)

	records, err := n.execRead(ctx, cypher, map[string]any{"episode_id": episodeID})
	if err != nil {
		return nil, err
	}

	ids := make([]string, 0, len(records))
	for _, r := range records {
		if v, ok := r["id"].(string); ok && v != "" {
			ids = append(ids, v)
		}
	}
	return ids, nil
}

func (n *Neo4jClient) CreateSemanticNode(ctx context.Context, semanticID, agentID, factType string) error {
	cypher := `
MERGE (s:SemanticMemory {semantic_id: $semantic_id})
SET s.agent_id = $agent_id,
    s.fact_type = $fact_type`
	return n.execWrite(ctx, cypher, map[string]any{"semantic_id": semanticID, "agent_id": agentID, "fact_type": factType})
}

func (n *Neo4jClient) LinkEpisodeToSemantic(ctx context.Context, episodeID, semanticID string) error {
	cypher := `
MATCH (e:Episode {episode_id: $episode_id}), (s:SemanticMemory {semantic_id: $semantic_id})
MERGE (e)-[:COMPRESSED_INTO]->(s)`
	return n.execWrite(ctx, cypher, map[string]any{"episode_id": episodeID, "semantic_id": semanticID})
}

type GraphNode struct {
	ID           string `json:"id"`
	Type         string `json:"type"`
	Label        string `json:"label"`
	Domain       string `json:"domain"`
	Consolidated bool   `json:"consolidated"`
}

type GraphEdge struct {
	From string `json:"from"`
	To   string `json:"to"`
	Type string `json:"type"`
}

type GraphData struct {
	Nodes []GraphNode `json:"nodes"`
	Edges []GraphEdge `json:"edges"`
}

func (n *Neo4jClient) GetAgentGraphData(ctx context.Context, agentID string) (*GraphData, error) {
	cypher := `
MATCH (e:Episode {agent_id: $agent_id})
OPTIONAL MATCH (e)-[r]->(x)
WHERE (x:Episode AND x.agent_id = $agent_id) OR (x:SemanticMemory AND x.agent_id = $agent_id)
WITH collect(DISTINCT e) AS eps, collect(DISTINCT r) AS rels, collect(DISTINCT x) AS xs
RETURN eps, rels, xs`

	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	session := n.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	recAny, err := session.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		res, err := tx.Run(ctx, cypher, map[string]any{"agent_id": agentID})
		if err != nil {
			return nil, err
		}
		if res.Next(ctx) {
			return res.Record(), nil
		}
		return nil, res.Err()
	})
	if err != nil {
		return nil, err
	}
	if recAny == nil {
		return &GraphData{Nodes: []GraphNode{}, Edges: []GraphEdge{}}, nil
	}

	// Minimal graph: weâ€™ll expand/normalize in Day 3+.
	return &GraphData{Nodes: []GraphNode{}, Edges: []GraphEdge{}}, nil
}

func (n *Neo4jClient) execWrite(ctx context.Context, cypher string, params map[string]any) error {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	session := n.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeWrite})
	defer session.Close(ctx)

	_, err := session.ExecuteWrite(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		_, err := tx.Run(ctx, cypher, params)
		return nil, err
	})
	if err != nil {
		return fmt.Errorf("neo4j write: %w", err)
	}
	return nil
}

func (n *Neo4jClient) execRead(ctx context.Context, cypher string, params map[string]any) ([]map[string]any, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	session := n.driver.NewSession(ctx, neo4j.SessionConfig{AccessMode: neo4j.AccessModeRead})
	defer session.Close(ctx)

	anyRes, err := session.ExecuteRead(ctx, func(tx neo4j.ManagedTransaction) (any, error) {
		res, err := tx.Run(ctx, cypher, params)
		if err != nil {
			return nil, err
		}
		var rows []map[string]any
		for res.Next(ctx) {
			row := map[string]any{}
			for _, key := range res.Record().Keys {
				row[key], _ = res.Record().Get(key)
			}
			rows = append(rows, row)
		}
		return rows, res.Err()
	})
	if err != nil {
		return nil, err
	}
	if anyRes == nil {
		return nil, nil
	}
	return anyRes.([]map[string]any), nil
}

