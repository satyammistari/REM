package api

import (
	"rem/go-api/internal/api/handlers"
	"rem/go-api/internal/api/middleware"

	"github.com/gofiber/fiber/v2"
)

// Setup registers all routes on the provided Fiber app.
func Setup(app *fiber.App, deps *handlers.Dependencies) {
	// Public
	app.Get("/health", handlers.Health(deps))
	app.Get("/api/v1/ping", handlers.Ping(deps))

	// Auth (public)
	app.Post("/api/v1/auth/register", handlers.Register(deps))
	app.Post("/api/v1/auth/apikey", handlers.CreateAPIKey(deps))

	// Protected API v1 group
	v1 := app.Group("/api/v1", middleware.APIKeyMiddleware(deps.DB, deps.Redis, deps.Logger))

	// Agents
	v1.Post("/agents", handlers.CreateAgent(deps))
	v1.Get("/agents", handlers.ListAgents(deps))
	v1.Get("/agents/:id", handlers.GetAgent(deps))

	// Episodes
	v1.Post("/episodes", handlers.WriteEpisode(deps))
	v1.Get("/episodes", handlers.ListEpisodes(deps))
	v1.Get("/episodes/:id", handlers.GetEpisode(deps))

	// Retrieve
	v1.Post("/retrieve", handlers.Retrieve(deps))

	// Semantic memories
	v1.Get("/semantic", handlers.ListSemantic(deps))

	// Graph
	v1.Get("/graph/:agent_id", handlers.GetGraph(deps))
}
