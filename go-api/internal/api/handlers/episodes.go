package handlers

import (
	"strings"
	"time"

	"rem/go-api/internal/domain"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

// WriteEpisode handles POST /api/v1/episodes
func WriteEpisode(deps *Dependencies) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		var req domain.CreateEpisodeRequest
		if err := c.BodyParser(&req); err != nil {
			return jsonError(c, fiber.StatusBadRequest, "invalid JSON body")
		}

		req.AgentID = strings.TrimSpace(req.AgentID)
		req.UserID = strings.TrimSpace(req.UserID)
		req.Content = strings.TrimSpace(req.Content)

		if req.AgentID == "" || req.UserID == "" || req.Content == "" {
			return jsonError(c, fiber.StatusBadRequest, "agent_id, user_id, and content are required")
		}
		if l := len(req.Content); l <= 50 || l >= 10000 {
			return jsonError(c, fiber.StatusBadRequest, "content length must be between 50 and 10000 characters")
		}

		resp, err := deps.WriteService.WriteEpisode(c.UserContext(), req)
		if err != nil {
			deps.Logger.Error("write_episode_failed",
				zap.Error(err),
				zap.String("agent_id", req.AgentID),
				zap.String("request_id", requestID(c)),
			)
			return jsonError(c, fiber.StatusInternalServerError, "failed to write episode")
		}

		deps.Logger.Info("write_episode",
			zap.String("agent_id", req.AgentID),
			zap.String("episode_id", resp.EpisodeID),
			zap.Duration("latency", time.Since(start)),
			zap.String("request_id", requestID(c)),
		)

		return c.Status(fiber.StatusCreated).JSON(resp)
	}
}

// ListEpisodes handles GET /api/v1/episodes
func ListEpisodes(deps *Dependencies) fiber.Handler {
	return func(c *fiber.Ctx) error {
		agentID := strings.TrimSpace(c.Query("agent_id"))
		if agentID == "" {
			return jsonError(c, fiber.StatusBadRequest, "agent_id is required")
		}

		limit := parseIntWithDefault(c.Query("limit"), 20)
		if limit > 100 {
			limit = 100
		}
		offset := parseIntWithDefault(c.Query("offset"), 0)
		if offset < 0 {
			offset = 0
		}

		episodes, total, err := deps.DB.ListEpisodesByAgent(c.UserContext(), agentID, limit, offset)
		if err != nil {
			deps.Logger.Error("list_episodes_failed",
				zap.Error(err),
				zap.String("agent_id", agentID),
				zap.String("request_id", requestID(c)),
			)
			return jsonError(c, fiber.StatusInternalServerError, "failed to list episodes")
		}

		return c.JSON(fiber.Map{
			"episodes": episodes,
			"total":    total,
			"limit":    limit,
			"offset":   offset,
		})
	}
}

// GetEpisode handles GET /api/v1/episodes/:id
func GetEpisode(deps *Dependencies) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id := strings.TrimSpace(c.Params("id"))
		if id == "" {
			return jsonError(c, fiber.StatusBadRequest, "episode id required")
		}

		ep, err := deps.DB.GetEpisodeByID(c.UserContext(), id)
		if err != nil {
			deps.Logger.Error("get_episode_failed",
				zap.Error(err),
				zap.String("episode_id", id),
				zap.String("request_id", requestID(c)),
			)
			return jsonError(c, fiber.StatusInternalServerError, "failed to load episode")
		}
		if ep == nil {
			return jsonError(c, fiber.StatusNotFound, "episode not found")
		}

		return c.JSON(ep)
	}
}
