package postgres

import (
	"context"

	"rem/go-api/internal/domain"
)

// InsertSemanticMemory inserts a new semantic memory row.
func (db *DB) InsertSemanticMemory(ctx context.Context, sm domain.SemanticMemory) error {
	_, err := db.pool.Exec(ctx, `
INSERT INTO semantic_memories (
  semantic_id, agent_id, user_id, fact, confidence,
  evidence_count, source_episode_ids, domain, fact_type,
  active, contradicted_by, superseded,
  created_at, updated_at, last_retrieved_at
) VALUES (
  $1, $2, $3, $4, $5,
  $6, $7, $8, $9,
  $10, $11, $12,
  $13, $14, $15
)`,
		sm.SemanticID,
		sm.AgentID,
		sm.UserID,
		sm.Fact,
		sm.Confidence,
		sm.EvidenceCount,
		sm.SourceEpisodeIDs,
		sm.Domain,
		sm.FactType,
		sm.Active,
		sm.ContradictedBy,
		sm.Superseded,
		sm.CreatedAt,
		sm.UpdatedAt,
		sm.LastRetrievedAt,
	)
	return err
}

// ListSemanticByAgent returns semantic memories for an agent.
func (db *DB) ListSemanticByAgent(ctx context.Context, agentID string, limit int) ([]domain.SemanticMemory, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}

	rows, err := db.pool.Query(ctx, `
SELECT semantic_id, agent_id, user_id, fact, confidence,
       evidence_count, source_episode_ids, domain, fact_type,
       active, contradicted_by, superseded,
       created_at, updated_at, last_retrieved_at
FROM semantic_memories
WHERE agent_id = $1
ORDER BY created_at DESC
LIMIT $2
`, agentID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []domain.SemanticMemory
	for rows.Next() {
		var sm domain.SemanticMemory
		if err := rows.Scan(
			&sm.SemanticID,
			&sm.AgentID,
			&sm.UserID,
			&sm.Fact,
			&sm.Confidence,
			&sm.EvidenceCount,
			&sm.SourceEpisodeIDs,
			&sm.Domain,
			&sm.FactType,
			&sm.Active,
			&sm.ContradictedBy,
			&sm.Superseded,
			&sm.CreatedAt,
			&sm.UpdatedAt,
			&sm.LastRetrievedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, sm)
	}
	return out, rows.Err()
}

// GetSemanticStats returns count and average confidence for an agent.
func (db *DB) GetSemanticStats(ctx context.Context, agentID string) (int, float64, error) {
	row := db.pool.QueryRow(ctx, `
SELECT COUNT(*) AS total,
       COALESCE(AVG(confidence), 0) AS avg_confidence
FROM semantic_memories
WHERE agent_id = $1 AND active = TRUE
`, agentID)

	var total int
	var avg float64
	if err := row.Scan(&total, &avg); err != nil {
		return 0, 0, err
	}
	return total, avg, nil
}

