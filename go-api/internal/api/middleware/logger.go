package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

// RequestLogger returns a Fiber middleware that logs each request with
// method, path, status, latency, and request ID using zap.
func RequestLogger(logger *zap.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()
		latency := time.Since(start)

		reqID, _ := c.Locals("requestid").(string)
		logger.Info("request",
			zap.String("request_id", reqID),
			zap.String("method", c.Method()),
			zap.String("path", c.Path()),
			zap.Int("status", c.Response().StatusCode()),
			zap.Duration("latency", latency),
			zap.String("ip", c.IP()),
			zap.String("user_agent", string(c.Context().UserAgent())),
		)

		return err
	}
}
