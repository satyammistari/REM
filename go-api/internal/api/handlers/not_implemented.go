package handlers

import "github.com/gofiber/fiber/v2"

// NotImplemented returns a 501 handler for features not yet built.
func NotImplemented(feature string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusNotImplemented).JSON(fiber.Map{
			"error":   "not implemented",
			"feature": feature,
		})
	}
}
