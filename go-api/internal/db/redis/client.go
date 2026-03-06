package redisdb

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"rem/go-api/internal/config"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type RedisClient struct {
	client *redis.Client
	logger *zap.Logger
}

func New(cfg *config.Config, logger *zap.Logger) (*RedisClient, error) {
	opts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		return nil, fmt.Errorf("parse redis url: %w", err)
	}

	rdb := redis.NewClient(opts)
	c := &RedisClient{client: rdb, logger: logger}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := c.safe(ctx, "ping", func() error { return rdb.Ping(ctx).Err() }); err != nil {
		// Redis is cache layer only - don't crash.
		logger.Warn("redis ping failed (cache will be degraded)", zap.Error(err))
	}

	return c, nil
}

func (r *RedisClient) Close() error {
	if r.client == nil {
		return nil
	}
	return r.client.Close()
}

func (r *RedisClient) Ping(ctx context.Context) error {
	if r.client == nil {
		return fmt.Errorf("redis client not initialized")
	}
	ctx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	return r.safe(ctx, "ping", func() error { return r.client.Ping(ctx).Err() })
}

func (r *RedisClient) CacheEmbedding(ctx context.Context, textHash string, embedding []float32, ttl time.Duration) error {
	key := fmt.Sprintf("rem:embed:%s", textHash)
	return r.safe(ctx, "cache_embedding", func() error {
		b, err := json.Marshal(embedding)
		if err != nil {
			return err
		}
		return r.client.Set(ctx, key, string(b), ttl).Err()
	})
}

func (r *RedisClient) GetCachedEmbedding(ctx context.Context, textHash string) ([]float32, bool, error) {
	key := fmt.Sprintf("rem:embed:%s", textHash)

	var val string
	err := r.safe(ctx, "get_cached_embedding", func() error {
		v, err := r.client.Get(ctx, key).Result()
		if err != nil {
			return err
		}
		val = v
		return nil
	})
	if err != nil {
		if err == redis.Nil {
			return nil, false, nil
		}
		return nil, false, err
	}

	var out []float32
	if err := json.Unmarshal([]byte(val), &out); err != nil {
		return nil, false, err
	}
	return out, true, nil
}

func (r *RedisClient) PublishConsolidationJob(ctx context.Context, agentID, episodeID string) error {
	key := "rem:jobs:consolidation"
	payload := map[string]any{
		"agent_id":   agentID,
		"episode_id": episodeID,
		"timestamp":  time.Now().UTC().Unix(),
	}
	return r.safe(ctx, "publish_job", func() error {
		b, err := json.Marshal(payload)
		if err != nil {
			return err
		}
		return r.client.LPush(ctx, key, string(b)).Err()
	})
}

func (r *RedisClient) SetCache(ctx context.Context, key, value string, ttl time.Duration) error {
	return r.safe(ctx, "set_cache", func() error { return r.client.Set(ctx, key, value, ttl).Err() })
}

func (r *RedisClient) GetCache(ctx context.Context, key string) (string, bool, error) {
	var val string
	err := r.safe(ctx, "get_cache", func() error {
		v, err := r.client.Get(ctx, key).Result()
		if err != nil {
			return err
		}
		val = v
		return nil
	})
	if err != nil {
		if err == redis.Nil {
			return "", false, nil
		}
		return "", false, err
	}
	return val, true, nil
}

func (r *RedisClient) DeleteCache(ctx context.Context, key string) error {
	return r.safe(ctx, "delete_cache", func() error { return r.client.Del(ctx, key).Err() })
}

func (r *RedisClient) safe(ctx context.Context, op string, fn func() error) (err error) {
	if r.client == nil {
		return fmt.Errorf("redis unavailable")
	}
	defer func() {
		if rec := recover(); rec != nil {
			r.logger.Warn("redis operation panicked", zap.String("op", op), zap.Any("recover", rec))
			err = fmt.Errorf("redis operation panicked: %v", rec)
		}
	}()
	return fn()
}

