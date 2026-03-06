package handlers

import "github.com/gofiber/fiber/v2"

// Ping handles GET /api/v1/ping.
func Ping(_ *Dependencies) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "pong",
			"version": "0.1.0",
		})
	}
}
