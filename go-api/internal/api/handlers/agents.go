package handlers

import (
	"context"
	"strings"
	"time"

	"rem/go-api/internal/domain"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

// CreateAgent handles POST /api/v1/agents.
func CreateAgent(deps *Dependencies) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, _ := c.Locals("user_id").(string)
		if userID == "" {
			return jsonError(c, fiber.StatusUnauthorized, "unauthorized")
		}

		var body struct {
			Name        string         `json:"name"`
			Description string         `json:"description"`
			Config      map[string]any `json:"config"`
		}
		if err := c.BodyParser(&body); err != nil {
			return jsonError(c, fiber.StatusBadRequest, "invalid JSON body")
		}

		name := strings.TrimSpace(body.Name)
		if name == "" || len(name) > 200 {
			return jsonError(c, fiber.StatusBadRequest, "name is required and must be <= 200 chars")
		}

		now := time.Now().UTC()
		agent := domain.Agent{
			AgentID:               uuid.NewString(),
			UserID:                userID,
			Name:                  name,
			Description:           strings.TrimSpace(body.Description),
			TotalEpisodes:         0,
			TotalSemanticMemories: 0,
			LastActiveAt:          nil,
			CreatedAt:             now,
			Active:                true,
		}

		ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
		defer cancel()

		if err := deps.DB.InsertAgent(ctx, agent); err != nil {
			deps.Logger.Error("insert_agent_failed",
				zap.Error(err),
				zap.String("user_id", userID),
				zap.String("request_id", requestID(c)),
			)
			return jsonError(c, fiber.StatusInternalServerError, "failed to create agent")
		}

		return c.Status(fiber.StatusCreated).JSON(agent)
	}
}

// ListAgents handles GET /api/v1/agents.
func ListAgents(deps *Dependencies) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, _ := c.Locals("user_id").(string)
		if userID == "" {
			return jsonError(c, fiber.StatusUnauthorized, "unauthorized")
		}

		ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
		defer cancel()

		agents, err := deps.DB.ListAgentsByUser(ctx, userID)
		if err != nil {
			deps.Logger.Error("list_agents_failed",
				zap.Error(err),
				zap.String("user_id", userID),
				zap.String("request_id", requestID(c)),
			)
			return jsonError(c, fiber.StatusInternalServerError, "failed to list agents")
		}

		return c.JSON(agents)
	}
}

// GetAgent handles GET /api/v1/agents/:id.
func GetAgent(deps *Dependencies) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, _ := c.Locals("user_id").(string)
		if userID == "" {
			return jsonError(c, fiber.StatusUnauthorized, "unauthorized")
		}

		agentID := strings.TrimSpace(c.Params("id"))
		if agentID == "" {
			return jsonError(c, fiber.StatusBadRequest, "agent id required")
		}

		ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
		defer cancel()

		agent, err := deps.DB.GetAgentByID(ctx, agentID)
		if err != nil {
			deps.Logger.Error("get_agent_failed",
				zap.Error(err),
				zap.String("agent_id", agentID),
				zap.String("request_id", requestID(c)),
			)
			return jsonError(c, fiber.StatusInternalServerError, "failed to load agent")
		}
		if agent == nil || agent.UserID != userID {
			return jsonError(c, fiber.StatusNotFound, "agent not found")
		}

		return c.JSON(agent)
	}
}
