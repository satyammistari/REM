package handlers

import (
	"context"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
)

var startedAt time.Time

func init() {
	startedAt = time.Now().UTC()
}

// Health implements GET /health and pings all backing services.
func Health(deps *Dependencies) fiber.Handler {
	return func(c *fiber.Ctx) error {
		type pingFn func(context.Context) error

		results := map[string]string{}
		var mu sync.Mutex
		var wg sync.WaitGroup

		pingWithTimeout := func(name string, fn pingFn) {
			defer wg.Done()

			ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
			defer cancel()

			if err := fn(ctx); err != nil {
				mu.Lock()
				results[name] = "error: " + err.Error()
				mu.Unlock()
				return
			}
			mu.Lock()
			results[name] = "connected"
			mu.Unlock()
		}

		wg.Add(4)
		go pingWithTimeout("postgres", deps.DB.Ping)
		go pingWithTimeout("qdrant", deps.Qdrant.Ping)
		go pingWithTimeout("neo4j", deps.Neo4j.Ping)
		go pingWithTimeout("redis", deps.Redis.Ping)
		wg.Wait()

		healthy := true
		for _, v := range results {
			if len(v) >= 6 && v[:6] == "error:" {
				healthy = false
				break
			}
		}

		status := "healthy"
		code := fiber.StatusOK
		if !healthy {
			status = "degraded"
			code = fiber.StatusServiceUnavailable
		}

		uptime := int64(time.Since(startedAt).Seconds())

		return c.Status(code).JSON(fiber.Map{
			"status":         status,
			"version":        "0.1.0",
			"environment":    deps.Config.Environment,
			"uptime_seconds": uptime,
			"databases":      results,
		})
	}
}
