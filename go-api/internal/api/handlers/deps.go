package handlers

import (
	"strconv"
	"strings"

	"rem/go-api/internal/config"
	neo4jdb "rem/go-api/internal/db/neo4j"
	"rem/go-api/internal/db/postgres"
	"rem/go-api/internal/db/qdrant"
	redisdb "rem/go-api/internal/db/redis"
	"rem/go-api/internal/services"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

// Dependencies holds all shared infrastructure and services for handlers.
type Dependencies struct {
	DB     *postgres.DB
	Qdrant *qdrant.QdrantClient
	Neo4j  *neo4jdb.Neo4jClient
	Redis  *redisdb.RedisClient
	Config *config.Config
	Logger *zap.Logger

	WriteService    *services.WriteService
	RetrieveService *services.RetrieveService
}

// jsonError writes a JSON error body and returns the Fiber error.
func jsonError(c *fiber.Ctx, status int, msg string) error {
	return c.Status(status).JSON(fiber.Map{
		"error": msg,
	})
}

// requestID returns the request-id set by the requestid middleware,
// falling back to an empty string.
func requestID(c *fiber.Ctx) string {
	if id, ok := c.Locals("requestid").(string); ok {
		return id
	}
	return ""
}

// parseIntWithDefault parses a raw string as int, returning def on failure.
func parseIntWithDefault(raw string, def int) int {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return def
	}
	n, err := strconv.Atoi(raw)
	if err != nil {
		return def
	}
	return n
}
