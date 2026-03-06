package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	// Server
	Port        string
	Environment string

	// PostgreSQL
	DatabaseURL string

	// Qdrant
	QdrantHost string
	QdrantPort int

	// Neo4j
	Neo4jURI      string
	Neo4jUser     string
	Neo4jPassword string

	// Redis
	RedisURL string

	// Python worker
	PythonWorkerURL string

	// OpenAI (for Go side if needed)
	OpenAIAPIKey string

	// Constants
	EmbeddingDimensions       int
	ConsolidationMinEpisodes int
}

func Load() (*Config, error) {
	_ = godotenv.Load(".env")

	cfg := &Config{
		Port:        getEnvWithDefault("PORT", "8000"),
		Environment: getEnvWithDefault("ENVIRONMENT", "development"),

		DatabaseURL: os.Getenv("DATABASE_URL"),

		QdrantHost: getEnvWithDefault("QDRANT_HOST", "localhost"),
		QdrantPort: getEnvIntWithDefault("QDRANT_PORT", 6333),

		Neo4jURI:      os.Getenv("NEO4J_URI"),
		Neo4jUser:     getEnvWithDefault("NEO4J_USER", "neo4j"),
		Neo4jPassword: os.Getenv("NEO4J_PASSWORD"),

		RedisURL: getEnvWithDefault("REDIS_URL", "redis://localhost:6379/0"),

		PythonWorkerURL: getEnvWithDefault("PYTHON_WORKER_URL", "http://localhost:8001"),

		OpenAIAPIKey: os.Getenv("OPENAI_API_KEY"),

		EmbeddingDimensions:       getEnvIntWithDefault("EMBEDDING_DIMENSIONS", 1536),
		ConsolidationMinEpisodes: getEnvIntWithDefault("CONSOLIDATION_MIN_EPISODES", 3),
	}

	var missing []string
	if cfg.DatabaseURL == "" {
		missing = append(missing, "DATABASE_URL")
	}
	if cfg.Neo4jURI == "" {
		missing = append(missing, "NEO4J_URI")
	}
	if cfg.Neo4jPassword == "" {
		missing = append(missing, "NEO4J_PASSWORD")
	}
	if cfg.OpenAIAPIKey == "" {
		missing = append(missing, "OPENAI_API_KEY")
	}
	if len(missing) > 0 {
		return nil, &MissingEnvError{Keys: missing}
	}

	return cfg, nil
}

func MustLoad() *Config {
	cfg, err := Load()
	if err != nil {
		panic(err)
	}
	return cfg
}

func getEnvWithDefault(key, defaultVal string) string {
	v := os.Getenv(key)
	if v == "" {
		return defaultVal
	}
	return v
}

func getEnvIntWithDefault(key string, defaultVal int) int {
	v := os.Getenv(key)
	if v == "" {
		return defaultVal
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return defaultVal
	}
	return n
}

type MissingEnvError struct {
	Keys []string
}

func (e *MissingEnvError) Error() string {
	return "missing required env vars: " + stringsJoin(e.Keys, ", ")
}

func stringsJoin(parts []string, sep string) string {
	if len(parts) == 0 {
		return ""
	}
	out := parts[0]
	for i := 1; i < len(parts); i++ {
		out += sep + parts[i]
	}
	return out
}

