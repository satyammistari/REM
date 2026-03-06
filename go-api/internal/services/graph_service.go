package services

import (
	"context"
	"fmt"

	neo4jdb "rem/go-api/internal/db/neo4j"

	"go.uber.org/zap"
)

// GraphService encapsulates Neo4j graph operations for memory relationships.
type GraphService struct {
	neo4j  *neo4jdb.Neo4jClient
	logger *zap.Logger
}

// NewGraphService creates a new GraphService.
func NewGraphService(neo4j *neo4jdb.Neo4jClient, logger *zap.Logger) *GraphService {
	return &GraphService{
		neo4j:  neo4j,
		logger: logger,
	}
}

// RecordEpisode creates an Episode node and optionally links it temporally
// to the previously recorded episode for the same agent.
func (s *GraphService) RecordEpisode(ctx context.Context, episodeID, agentID, domain string, createdAtUnix int64, prevEpisodeID string) error {
	if err := s.neo4j.CreateEpisodeNode(ctx, episodeID, agentID, domain, createdAtUnix); err != nil {
		return fmt.Errorf("create episode node: %w", err)
	}

	if prevEpisodeID != "" {
		if err := s.neo4j.CreateTemporalEdge(ctx, prevEpisodeID, episodeID); err != nil {
			s.logger.Warn("create_temporal_edge_failed",
				zap.Error(err),
				zap.String("from", prevEpisodeID),
				zap.String("to", episodeID),
			)
		}
	}

	return nil
}

// RecordSemanticMemory creates a SemanticMemory node in Neo4j and links it
// to all source episodes.
func (s *GraphService) RecordSemanticMemory(ctx context.Context, semanticID, agentID, factType string, sourceEpisodeIDs []string) error {
	if err := s.neo4j.CreateSemanticNode(ctx, semanticID, agentID, factType); err != nil {
		return fmt.Errorf("create semantic node: %w", err)
	}

	for _, epID := range sourceEpisodeIDs {
		if err := s.neo4j.LinkEpisodeToSemantic(ctx, epID, semanticID); err != nil {
			s.logger.Warn("link_episode_to_semantic_failed",
				zap.Error(err),
				zap.String("episode_id", epID),
				zap.String("semantic_id", semanticID),
			)
		}
	}

	return nil
}

// GetAgentGraph returns nodes and edges for the given agent from Neo4j.
func (s *GraphService) GetAgentGraph(ctx context.Context, agentID string) (*neo4jdb.GraphData, error) {
	data, err := s.neo4j.GetAgentGraphData(ctx, agentID)
	if err != nil {
		return nil, fmt.Errorf("get agent graph: %w", err)
	}
	return data, nil
}

// GetTemporalNeighbors returns episodeIDs temporally adjacent to the given episode.
func (s *GraphService) GetTemporalNeighbors(ctx context.Context, episodeID string, depth int) ([]string, error) {
	ids, err := s.neo4j.GetTemporalNeighbors(ctx, episodeID, depth)
	if err != nil {
		return nil, fmt.Errorf("get temporal neighbors: %w", err)
	}
	return ids, nil
}
