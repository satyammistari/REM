package middleware

import (
	"fmt"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

type windowCounter struct {
	count    int
	windowAt time.Time
}

// RateLimiter is a simple in-memory sliding-window rate limiter keyed by IP.
type RateLimiter struct {
	mu       sync.Mutex
	windows  map[string]*windowCounter
	max      int
	window   time.Duration
	logger   *zap.Logger
}

// NewRateLimiter creates a RateLimiter that allows max requests per window duration.
func NewRateLimiter(max int, window time.Duration, logger *zap.Logger) *RateLimiter {
	rl := &RateLimiter{
		windows: make(map[string]*windowCounter),
		max:     max,
		window:  window,
		logger:  logger,
	}
	// Background cleanup goroutine.
	go rl.cleanup()
	return rl
}

func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(rl.window * 2)
	defer ticker.Stop()
	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for key, wc := range rl.windows {
			if now.Sub(wc.windowAt) > rl.window {
				delete(rl.windows, key)
			}
		}
		rl.mu.Unlock()
	}
}

// Allow reports whether the request should be allowed.
func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	wc, ok := rl.windows[key]
	if !ok || now.Sub(wc.windowAt) > rl.window {
		rl.windows[key] = &windowCounter{count: 1, windowAt: now}
		return true
	}
	wc.count++
	return wc.count <= rl.max
}

// Middleware returns a Fiber handler that enforces the rate limit.
func (rl *RateLimiter) Middleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		key := c.IP()
		if !rl.Allow(key) {
			rl.logger.Warn("rate_limit_exceeded",
				zap.String("ip", key),
				zap.String("path", c.Path()),
			)
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error":       "rate limit exceeded",
				"retry_after": fmt.Sprintf("%.0fs", rl.window.Seconds()),
			})
		}
		return c.Next()
	}
}
