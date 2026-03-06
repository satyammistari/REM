package handlers

import (
	"strings"
	"time"

	"rem/go-api/internal/domain"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

// Retrieve handles POST /api/v1/retrieve
func Retrieve(deps *Dependencies) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		var req domain.RetrieveRequest
		if err := c.BodyParser(&req); err != nil {
			return jsonError(c, fiber.StatusBadRequest, "invalid JSON body")
		}

		req.Query = strings.TrimSpace(req.Query)
		req.AgentID = strings.TrimSpace(req.AgentID)

		if req.Query == "" {
			return jsonError(c, fiber.StatusBadRequest, "query is required")
		}
		if req.AgentID == "" {
			return jsonError(c, fiber.StatusBadRequest, "agent_id is required")
		}

		resp, err := deps.RetrieveService.Retrieve(c.UserContext(), req)
		if err != nil {
			deps.Logger.Error("retrieve_failed",
				zap.Error(err),
				zap.String("agent_id", req.AgentID),
				zap.Int("query_length", len(req.Query)),
				zap.String("request_id", requestID(c)),
			)
			return jsonError(c, fiber.StatusInternalServerError, "failed to retrieve memories")
		}

		deps.Logger.Info("retrieve",
			zap.String("agent_id", req.AgentID),
			zap.Int("query_length", len(req.Query)),
			zap.Int("results_count", len(resp.Episodes)),
			zap.Int64("latency_ms", resp.LatencyMs),
			zap.Duration("latency", time.Since(start)),
			zap.String("request_id", requestID(c)),
		)

		return c.JSON(resp)
	}
}
