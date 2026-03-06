package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"net/mail"
	"strings"
	"time"

	"rem/go-api/internal/domain"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

// Register handles POST /api/v1/auth/register.
func Register(deps *Dependencies) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var body struct {
			Email string `json:"email"`
		}
		if err := c.BodyParser(&body); err != nil {
			return jsonError(c, fiber.StatusBadRequest, "invalid JSON body")
		}

		email := strings.TrimSpace(strings.ToLower(body.Email))
		if email == "" {
			return jsonError(c, fiber.StatusBadRequest, "email is required")
		}
		if _, err := mail.ParseAddress(email); err != nil {
			return jsonError(c, fiber.StatusBadRequest, "invalid email")
		}

		ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
		defer cancel()

		existing, err := deps.DB.GetUserByEmail(ctx, email)
		if err != nil {
			deps.Logger.Error("get_user_by_email_failed", zap.Error(err))
			return jsonError(c, fiber.StatusInternalServerError, "failed to check user")
		}
		if existing != nil {
			return jsonError(c, fiber.StatusBadRequest, "email already registered")
		}

		now := time.Now().UTC()
		user := domain.User{
			UserID:       uuid.NewString(),
			Email:        email,
			APIKeyHash:   "",
			APIKeyPrefix: "",
			Plan:         "free",
			TotalAgents:  0,
			CreatedAt:    now,
			Active:       true,
		}

		if err := deps.DB.InsertUser(ctx, user); err != nil {
			deps.Logger.Error("insert_user_failed", zap.Error(err))
			return jsonError(c, fiber.StatusInternalServerError, "failed to create user")
		}

		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"user_id":    user.UserID,
			"email":      user.Email,
			"created_at": user.CreatedAt,
		})
	}
}

// CreateAPIKey handles POST /api/v1/auth/apikey.
func CreateAPIKey(deps *Dependencies) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var body struct {
			UserID string `json:"user_id"`
			Name   string `json:"name"`
		}
		if err := c.BodyParser(&body); err != nil {
			return jsonError(c, fiber.StatusBadRequest, "invalid JSON body")
		}

		userID := strings.TrimSpace(body.UserID)
		if userID == "" {
			return jsonError(c, fiber.StatusBadRequest, "user_id is required")
		}

		ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
		defer cancel()

		u, err := deps.DB.GetUserByID(ctx, userID)
		if err != nil {
			deps.Logger.Error("get_user_by_id_failed", zap.Error(err))
			return jsonError(c, fiber.StatusInternalServerError, "failed to load user")
		}
		if u == nil || !u.Active {
			return jsonError(c, fiber.StatusBadRequest, "user not found or inactive")
		}

		randomBytes := make([]byte, 32)
		if _, err := rand.Read(randomBytes); err != nil {
			return jsonError(c, fiber.StatusInternalServerError, "failed to generate api key")
		}
		encoded := base64.RawURLEncoding.EncodeToString(randomBytes)
		apiKey := "rem_sk_" + encoded
		if len(apiKey) < 12 {
			return jsonError(c, fiber.StatusInternalServerError, "api key generation error")
		}
		prefix := apiKey[:12]

		hash, err := bcrypt.GenerateFromPassword([]byte(apiKey), bcrypt.DefaultCost)
		if err != nil {
			return jsonError(c, fiber.StatusInternalServerError, "failed to hash api key")
		}

		if err := deps.DB.UpdateAPIKey(ctx, userID, string(hash), prefix); err != nil {
			deps.Logger.Error("update_api_key_failed", zap.Error(err))
			return jsonError(c, fiber.StatusInternalServerError, "failed to store api key")
		}

		now := time.Now().UTC()
		return c.Status(fiber.StatusCreated).JSON(fiber.Map{
			"api_key":    apiKey,
			"prefix":     prefix,
			"created_at": now,
		})
	}
}
