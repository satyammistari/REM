package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"rem/go-api/internal/domain"

	"github.com/jackc/pgx/v5"
)

type EpisodeStats struct {
	Total         int
	Consolidated  int
	AvgImportance float64
}

func (db *DB) InsertEpisode(ctx context.Context, ep domain.Episode) error {
	entitiesJSON, err := json.Marshal(ep.ParsedEntities)
	if err != nil {
		return err
	}

	_, err = db.pool.Exec(ctx, `
INSERT INTO episodes (
  episode_id, agent_id, user_id, session_id, team_id,
  raw_content, parsed_entities, intent, outcome, domain, emotion_signal,
  importance_score, retrieval_count, last_retrieved_at,
  consolidated, consolidation_candidate, consolidated_into,
  created_at, updated_at
) VALUES (
  @episode_id, @agent_id, @user_id, @session_id, @team_id,
  @raw_content, @parsed_entities, @intent, @outcome, @domain, @emotion_signal,
  @importance_score, @retrieval_count, @last_retrieved_at,
  @consolidated, @consolidation_candidate, @consolidated_into,
  @created_at, @updated_at
)`, pgx.NamedArgs{
		"episode_id":              ep.EpisodeID,
		"agent_id":                ep.AgentID,
		"user_id":                 ep.UserID,
		"session_id":              ep.SessionID,
		"team_id":                 ep.TeamID,
		"raw_content":             ep.RawContent,
		"parsed_entities":         entitiesJSON,
		"intent":                  ep.Intent,
		"outcome":                 ep.Outcome,
		"domain":                  ep.Domain,
		"emotion_signal":          ep.EmotionSignal,
		"importance_score":        ep.ImportanceScore,
		"retrieval_count":         ep.RetrievalCount,
		"last_retrieved_at":       ep.LastRetrievedAt,
		"consolidated":            ep.Consolidated,
		"consolidation_candidate": ep.ConsolidationCandidate,
		"consolidated_into":       ep.ConsolidatedInto,
		"created_at":              ep.CreatedAt,
		"updated_at":              ep.UpdatedAt,
	})
	return err
}

func (db *DB) GetEpisodeByID(ctx context.Context, episodeID string) (*domain.Episode, error) {
	row := db.pool.QueryRow(ctx, `
SELECT episode_id, agent_id, user_id, session_id, team_id,
       raw_content, parsed_entities, intent, outcome, domain, emotion_signal,
       importance_score, retrieval_count, last_retrieved_at,
       consolidated, consolidation_candidate, consolidated_into,
       created_at, updated_at
FROM episodes
WHERE episode_id = $1
`, episodeID)

	ep, err := scanEpisode(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return ep, nil
}

func (db *DB) ListEpisodesByAgent(ctx context.Context, agentID string, limit, offset int) ([]domain.Episode, int, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	var total int
	if err := db.pool.QueryRow(ctx, `SELECT COUNT(*) FROM episodes WHERE agent_id=$1`, agentID).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := db.pool.Query(ctx, `
SELECT episode_id, agent_id, user_id, session_id, team_id,
       raw_content, parsed_entities, intent, outcome, domain, emotion_signal,
       importance_score, retrieval_count, last_retrieved_at,
       consolidated, consolidation_candidate, consolidated_into,
       created_at, updated_at
FROM episodes
WHERE agent_id=$1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3
`, agentID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var out []domain.Episode
	for rows.Next() {
		ep, err := scanEpisode(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, *ep)
	}
	return out, total, rows.Err()
}

// ListEpisodesForConsolidation returns unconsolidated episodes for an agent.
func (db *DB) ListEpisodesForConsolidation(ctx context.Context, agentID string, minCount int) ([]domain.Episode, error) {
	rows, err := db.pool.Query(ctx, `
SELECT episode_id, agent_id, user_id, session_id, team_id,
       raw_content, parsed_entities, intent, outcome, domain, emotion_signal,
       importance_score, retrieval_count, last_retrieved_at,
       consolidated, consolidation_candidate, consolidated_into,
       created_at, updated_at
FROM episodes
WHERE agent_id=$1 AND consolidated=FALSE
ORDER BY created_at ASC
LIMIT 100
`, agentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []domain.Episode
	for rows.Next() {
		ep, err := scanEpisode(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *ep)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if minCount > 0 && len(out) < minCount {
		return []domain.Episode{}, nil
	}
	return out, nil
}

func (db *DB) UpdateEpisodeConsolidated(ctx context.Context, episodeID, semanticID string) error {
	_, err := db.pool.Exec(ctx, `
UPDATE episodes
SET consolidated=TRUE,
    consolidated_into=$2,
    updated_at=NOW()
WHERE episode_id=$1
`, episodeID, semanticID)
	return err
}

func (db *DB) IncrementRetrievalCount(ctx context.Context, episodeID string) error {
	_, err := db.pool.Exec(ctx, `
UPDATE episodes
SET retrieval_count=retrieval_count+1,
    last_retrieved_at=NOW()
WHERE episode_id=$1
`, episodeID)
	return err
}

func (db *DB) GetEpisodeStats(ctx context.Context, agentID string) (*EpisodeStats, error) {
	row := db.pool.QueryRow(ctx, `
SELECT COUNT(*) AS total,
       SUM(CASE WHEN consolidated THEN 1 ELSE 0 END) AS consolidated,
       COALESCE(AVG(importance_score), 0) AS avg_importance
FROM episodes
WHERE agent_id=$1
`, agentID)

	var total int
	var consolidated int
	var avg float64
	if err := row.Scan(&total, &consolidated, &avg); err != nil {
		return nil, err
	}
	return &EpisodeStats{
		Total:         total,
		Consolidated:  consolidated,
		AvgImportance: avg,
	}, nil
}

// GetLastEpisodeIDByAgent returns the most recent episode id for temporal edges.
func (db *DB) GetLastEpisodeIDByAgent(ctx context.Context, agentID string) (string, *time.Time, error) {
	row := db.pool.QueryRow(ctx, `
SELECT episode_id, created_at
FROM episodes
WHERE agent_id=$1
ORDER BY created_at DESC
LIMIT 1
`, agentID)

	var id string
	var ts time.Time
	if err := row.Scan(&id, &ts); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", nil, nil
		}
		return "", nil, err
	}
	return id, &ts, nil
}

type scanRow interface {
	Scan(dest ...any) error
}

func scanEpisode(row scanRow) (*domain.Episode, error) {
	var ep domain.Episode
	var entities json.RawMessage
	if err := row.Scan(
		&ep.EpisodeID,
		&ep.AgentID,
		&ep.UserID,
		&ep.SessionID,
		&ep.TeamID,
		&ep.RawContent,
		&entities,
		&ep.Intent,
		&ep.Outcome,
		&ep.Domain,
		&ep.EmotionSignal,
		&ep.ImportanceScore,
		&ep.RetrievalCount,
		&ep.LastRetrievedAt,
		&ep.Consolidated,
		&ep.ConsolidationCandidate,
		&ep.ConsolidatedInto,
		&ep.CreatedAt,
		&ep.UpdatedAt,
	); err != nil {
		return nil, err
	}

	_ = json.Unmarshal(entities, &ep.ParsedEntities)
	if ep.ParsedEntities == nil {
		ep.ParsedEntities = []string{}
	}
	return &ep, nil
}

