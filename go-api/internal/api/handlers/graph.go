package handlers

import (
	"context"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

// GetGraph handles GET /api/v1/graph/:agent_id
// Returns all nodes and edges for the agent's memory graph.
func GetGraph(deps *Dependencies) fiber.Handler {
	return func(c *fiber.Ctx) error {
		agentID := strings.TrimSpace(c.Params("agent_id"))
		if agentID == "" {
			return jsonError(c, fiber.StatusBadRequest, "agent_id is required")
		}

		userID, _ := c.Locals("user_id").(string)
		if userID == "" {
			return jsonError(c, fiber.StatusUnauthorized, "unauthorized")
		}

		ctx, cancel := context.WithTimeout(c.UserContext(), 10*time.Second)
		defer cancel()

		// Verify the agent belongs to the authenticated user.
		agent, err := deps.DB.GetAgentByID(ctx, agentID)
		if err != nil {
			deps.Logger.Error("graph_get_agent_failed",
				zap.Error(err),
				zap.String("agent_id", agentID),
				zap.String("request_id", requestID(c)),
			)
			return jsonError(c, fiber.StatusInternalServerError, "failed to load agent")
		}
		if agent == nil || agent.UserID != userID {
			return jsonError(c, fiber.StatusNotFound, "agent not found")
		}

		// Fetch graph data from Neo4j.
		graph, err := deps.Neo4j.GetAgentGraphData(ctx, agentID)
		if err != nil {
			deps.Logger.Error("graph_fetch_failed",
				zap.Error(err),
				zap.String("agent_id", agentID),
				zap.String("request_id", requestID(c)),
			)
			return jsonError(c, fiber.StatusInternalServerError, "failed to fetch graph")
		}

		return c.JSON(fiber.Map{
			"agent_id": agentID,
			"nodes":    graph.Nodes,
			"edges":    graph.Edges,
		})
	}
}
