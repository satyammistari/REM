package handlers

import (
	"context"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

// ListSemantic handles GET /api/v1/semantic?agent_id=...&limit=...
func ListSemantic(deps *Dependencies) fiber.Handler {
	return func(c *fiber.Ctx) error {
		agentID := strings.TrimSpace(c.Query("agent_id"))
		if agentID == "" {
			return jsonError(c, fiber.StatusBadRequest, "agent_id is required")
		}

		limit := 50
		if raw := strings.TrimSpace(c.Query("limit")); raw != "" {
			if n, err := strconv.Atoi(raw); err == nil && n > 0 {
				limit = n
			}
		}

		ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
		defer cancel()

		items, err := deps.DB.ListSemanticByAgent(ctx, agentID, limit)
		if err != nil {
			deps.Logger.Error("list_semantic_failed",
				zap.Error(err),
				zap.String("agent_id", agentID),
				zap.String("request_id", requestID(c)),
			)
			return jsonError(c, fiber.StatusInternalServerError, "failed to list semantic memories")
		}

		return c.JSON(fiber.Map{
			"items": items,
			"limit": limit,
		})
	}
}
