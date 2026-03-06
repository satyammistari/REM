//go:build integration

package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

var baseURL = getenv("REM_BASE_URL", "http://localhost:8000")

func getenv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func do(t *testing.T, method, path string, body any, apiKey string) *http.Response {
	t.Helper()

	var rdr io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		assert.NoError(t, err)
		rdr = bytes.NewReader(b)
	}

	req, err := http.NewRequest(method, baseURL+path, rdr)
	assert.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")
	if apiKey != "" {
		req.Header.Set("X-API-Key", apiKey)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	assert.NoError(t, err)
	return resp
}

func bootstrapUserAndAgent(t *testing.T) (apiKey, userID, agentID string) {
	// Register user
	resp := do(t, http.MethodPost, "/api/v1/auth/register", map[string]string{
		"email": fmt.Sprintf("integration-%d@example.com", time.Now().UnixNano()),
	}, "")
	assert.Equal(t, http.StatusCreated, resp.StatusCode)
	var reg struct {
		UserID string `json:"user_id"`
		Email  string `json:"email"`
	}
	assert.NoError(t, json.NewDecoder(resp.Body).Decode(&reg))
	_ = resp.Body.Close()

	// Create API key
	resp = do(t, http.MethodPost, "/api/v1/auth/apikey", map[string]string{
		"user_id": reg.UserID,
		"name":    "integration",
	}, "")
	assert.Equal(t, http.StatusCreated, resp.StatusCode)
	var key struct {
		APIKey string `json:"api_key"`
		Prefix string `json:"prefix"`
	}
	assert.NoError(t, json.NewDecoder(resp.Body).Decode(&key))
	_ = resp.Body.Close()
	apiKey = key.APIKey

	// Create agent
	resp = do(t, http.MethodPost, "/api/v1/agents", map[string]any{
		"name":        "Integration Agent",
		"description": "Used for integration tests",
		"config":      map[string]any{},
	}, apiKey)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)
	var agent struct {
		AgentID string `json:"agent_id"`
	}
	assert.NoError(t, json.NewDecoder(resp.Body).Decode(&agent))
	_ = resp.Body.Close()

	return apiKey, reg.UserID, agent.AgentID
}

func TestFullWriteRetrieveLoop(t *testing.T) {
	apiKey, userID, agentID := bootstrapUserAndAgent(t)

	content := "User asked for TypeScript API client. I used fetch with strict null checks and user approved the solution."

	for i := 0; i < 5; i++ {
		resp := do(t, http.MethodPost, "/api/v1/episodes", map[string]any{
			"content":  content,
			"agent_id": agentID,
			"user_id":  userID,
			"outcome":  "success",
		}, apiKey)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)
		_ = resp.Body.Close()
	}

	resp := do(t, http.MethodPost, "/api/v1/retrieve", map[string]any{
		"query":            "what language does user prefer?",
		"agent_id":         agentID,
		"top_k":            5,
		"include_semantic": true,
	}, apiKey)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	var out struct {
		Episodes        []any  `json:"episodes"`
		InjectionPrompt string `json:"injection_prompt"`
		LatencyMs       int64  `json:"latency_ms"`
	}
	assert.NoError(t, json.NewDecoder(resp.Body).Decode(&out))
	_ = resp.Body.Close()

	assert.GreaterOrEqual(t, len(out.Episodes), 1)
	assert.NotEmpty(t, out.InjectionPrompt)
	assert.Less(t, out.LatencyMs, int64(500))
}

func TestAPIKeyAuth(t *testing.T) {
	apiKey, _, agentID := bootstrapUserAndAgent(t)

	// No key
	resp := do(t, http.MethodGet, "/api/v1/agents", nil, "")
	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	_ = resp.Body.Close()

	// Invalid key
	resp = do(t, http.MethodGet, "/api/v1/agents", nil, "rem_sk_invalid")
	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	_ = resp.Body.Close()

	// Valid key
	resp = do(t, http.MethodGet, "/api/v1/agents/"+agentID, nil, apiKey)
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	_ = resp.Body.Close()
}

