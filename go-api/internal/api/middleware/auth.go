package middleware

import (
	"context"
	"strings"
	"time"

	"rem/go-api/internal/db/postgres"
	redisdb "rem/go-api/internal/db/redis"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

// APIKeyPassthrough is a no-op middleware for routes that don't require auth.
func APIKeyPassthrough() fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.Next()
	}
}

// APIKeyMiddleware validates the X-API-Key header against the database.
// It caches successful lookups in Redis to avoid repeated DB hits.
func APIKeyMiddleware(db *postgres.DB, redis *redisdb.RedisClient, logger *zap.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		apiKey := strings.TrimSpace(c.Get("X-API-Key"))
		if apiKey == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "missing X-API-Key header",
			})
		}

		// Keys are formatted as rem_sk_<random>; prefix = first 12 chars.
		if !strings.HasPrefix(apiKey, "rem_sk_") || len(apiKey) < 12 {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid API key format",
			})
		}
		prefix := apiKey[:12]

		// Try Redis cache first.
		ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
		defer cancel()

		cacheKey := "rem:apikey:" + prefix
		if cachedUserID, ok, _ := redis.GetCache(ctx, cacheKey); ok && cachedUserID != "" {
			c.Locals("user_id", cachedUserID)
			return c.Next()
		}

		// Fall back to database lookup.
		user, err := db.GetUserByAPIKeyPrefix(ctx, prefix)
		if err != nil {
			logger.Error("api_key_lookup_failed", zap.Error(err))
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "internal server error",
			})
		}
		if user == nil || !user.Active {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid or inactive API key",
			})
		}

		// Verify the hash.
		if err := bcrypt.CompareHashAndPassword([]byte(user.APIKeyHash), []byte(apiKey)); err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "invalid API key",
			})
		}

		// Cache for 5 minutes.
		_ = redis.SetCache(ctx, cacheKey, user.UserID, 5*time.Minute)

		c.Locals("user_id", user.UserID)
		return c.Next()
	}
}
