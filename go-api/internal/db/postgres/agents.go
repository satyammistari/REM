package postgres

import (
	"context"

	"rem/go-api/internal/domain"
)

// InsertAgent inserts a new agent.
func (db *DB) InsertAgent(ctx context.Context, a domain.Agent) error {
	_, err := db.pool.Exec(ctx, `
INSERT INTO agents (
  agent_id, user_id, name, description, config,
  total_episodes, total_semantic_memories, last_active_at,
  created_at, active
) VALUES (
  $1, $2, $3, $4, '{}'::jsonb,
  $5, $6, $7,
  $8, $9
)`,
		a.AgentID,
		a.UserID,
		a.Name,
		a.Description,
		a.TotalEpisodes,
		a.TotalSemanticMemories,
		a.LastActiveAt,
		a.CreatedAt,
		a.Active,
	)
	return err
}

// GetAgentByID returns an agent by id.
func (db *DB) GetAgentByID(ctx context.Context, agentID string) (*domain.Agent, error) {
	row := db.pool.QueryRow(ctx, `
SELECT agent_id, user_id, name, description,
       total_episodes, total_semantic_memories, last_active_at,
       created_at, active
FROM agents
WHERE agent_id = $1
`, agentID)

	var a domain.Agent
	if err := row.Scan(
		&a.AgentID,
		&a.UserID,
		&a.Name,
		&a.Description,
		&a.TotalEpisodes,
		&a.TotalSemanticMemories,
		&a.LastActiveAt,
		&a.CreatedAt,
		&a.Active,
	); err != nil {
		if isNoRows(err) {
			return nil, nil
		}
		return nil, err
	}
	return &a, nil
}

// ListAgentsByUser lists all agents for a user.
func (db *DB) ListAgentsByUser(ctx context.Context, userID string) ([]domain.Agent, error) {
	rows, err := db.pool.Query(ctx, `
SELECT agent_id, user_id, name, description,
       total_episodes, total_semantic_memories, last_active_at,
       created_at, active
FROM agents
WHERE user_id = $1
ORDER BY created_at DESC
`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []domain.Agent
	for rows.Next() {
		var a domain.Agent
		if err := rows.Scan(
			&a.AgentID,
			&a.UserID,
			&a.Name,
			&a.Description,
			&a.TotalEpisodes,
			&a.TotalSemanticMemories,
			&a.LastActiveAt,
			&a.CreatedAt,
			&a.Active,
		); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

// UpdateAgentStats updates the episode and semantic memory counts.
func (db *DB) UpdateAgentStats(ctx context.Context, agentID string, episodeDelta, semanticDelta int) error {
	_, err := db.pool.Exec(ctx, `
UPDATE agents
SET total_episodes = total_episodes + $2,
    total_semantic_memories = total_semantic_memories + $3,
    last_active_at = NOW()
WHERE agent_id = $1
`, agentID, episodeDelta, semanticDelta)
	return err
}

// DeactivateAgent marks an agent as inactive.
func (db *DB) DeactivateAgent(ctx context.Context, agentID string) error {
	_, err := db.pool.Exec(ctx, `
UPDATE agents
SET active = FALSE
WHERE agent_id = $1
`, agentID)
	return err
}

