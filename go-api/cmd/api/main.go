package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"rem/go-api/internal/api"
	"rem/go-api/internal/api/handlers"
	"rem/go-api/internal/config"
	"rem/go-api/internal/db/neo4j"
	"rem/go-api/internal/db/postgres"
	"rem/go-api/internal/db/qdrant"
	"rem/go-api/internal/db/redis"
	"rem/go-api/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/fiber/v2/middleware/requestid"
	"go.uber.org/zap"
)

func main() {
	cfg := config.MustLoad()

	var logger *zap.Logger
	var err error
	if cfg.Environment == "production" {
		logger, err = zap.NewProduction()
	} else {
		logger, err = zap.NewDevelopment()
	}
	if err != nil {
		panic(err)
	}
	defer func() { _ = logger.Sync() }()

	ctx := context.Background()

	db, err := postgres.New(ctx, cfg, logger)
	if err != nil {
		logger.Fatal("postgres connect failed", zap.Error(err))
	}
	if err := db.RunMigrations(ctx); err != nil {
		logger.Fatal("postgres migrations failed", zap.Error(err))
	}

	qc, err := qdrant.New(cfg, logger)
	if err != nil {
		logger.Fatal("qdrant connect failed", zap.Error(err))
	}
	if err := qc.InitializeCollections(ctx); err != nil {
		logger.Fatal("qdrant init collections failed", zap.Error(err))
	}

	nc, err := neo4jdb.New(cfg, logger)
	if err != nil {
		logger.Fatal("neo4j connect failed", zap.Error(err))
	}
	if err := nc.InitializeSchema(ctx); err != nil {
		logger.Fatal("neo4j init schema failed", zap.Error(err))
	}

	rc, err := redisdb.New(cfg, logger)
	if err != nil {
		logger.Fatal("redis init failed", zap.Error(err))
	}

	app := fiber.New(fiber.Config{
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		BodyLimit:    4 * 1024 * 1024,
		ErrorHandler: func(c *fiber.Ctx, e error) error {
			code := fiber.StatusInternalServerError
			if fe, ok := e.(*fiber.Error); ok {
				code = fe.Code
			}
			reqID, _ := c.Locals("requestid").(string)
			return c.Status(code).JSON(fiber.Map{
				"error":      e.Error(),
				"request_id": reqID,
			})
		},
	})

	app.Use(recover.New())
	app.Use(requestid.New())

	if cfg.Environment != "production" {
		app.Use(cors.New(cors.Config{
			AllowOrigins: "*",
			AllowHeaders: "*",
			AllowMethods: "*",
		}))
	} else {
		app.Use(cors.New())
	}

	app.Use(zapRequestLogger(logger))

	writeService := services.NewWriteService(db, qc, nc, rc, cfg.PythonWorkerURL, logger)
	retrieveService := services.NewRetrieveService(db, qc, nc, rc, cfg.PythonWorkerURL, logger)

	deps := &handlers.Dependencies{
		DB:              db,
		Qdrant:          qc,
		Neo4j:           nc,
		Redis:           rc,
		Config:          cfg,
		Logger:          logger,
		WriteService:    writeService,
		RetrieveService: retrieveService,
	}
	api.Setup(app, deps)

	errCh := make(chan error, 1)
	go func() {
		addr := ":" + cfg.Port
		logger.Info("starting server", zap.String("addr", addr))
		errCh <- app.Listen(addr)
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	select {
	case sig := <-sigCh:
		logger.Info("shutdown signal received", zap.String("signal", sig.String()))
	case err := <-errCh:
		logger.Error("server error", zap.Error(err))
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := app.ShutdownWithContext(shutdownCtx); err != nil {
		logger.Error("fiber shutdown error", zap.Error(err))
	}

	db.Close()
	_ = qc.Close()
	_ = nc.Close()
	_ = rc.Close()

	logger.Info("shutdown complete")
}

func zapRequestLogger(logger *zap.Logger) fiber.Handler {
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
			zap.String("ua", string(c.Context().UserAgent())),
		)

		return err
	}
}

