# REM API Reference

Base URL: `http://localhost:8080` (development) — configure via `NEXT_PUBLIC_API_URL` / `PORT`.

All protected endpoints require the `X-API-Key` header.

---

## Authentication

### `POST /api/v1/auth/register`
Register a new user account.

**Request body**
```json
{ "email": "user@example.com", "password": "s3cret" }
```

**Response `201`**
```json
{ "user_id": "usr_...", "email": "user@example.com", "created_at": "..." }
```

---

### `POST /api/v1/auth/apikey`
Create an API key for an existing user.

**Request body**
```json
{ "user_id": "usr_...", "name": "My Key" }
```

**Response `201`**
```json
{ "api_key": "rem_sk_...", "created_at": "..." }
```

---

## Health

### `GET /health`
Returns service health. No authentication required.

**Response `200`**
```json
{
  "status": "healthy",
  "postgres": "ok",
  "redis": "ok",
  "qdrant": "ok",
  "neo4j": "ok"
}
```

### `GET /api/v1/ping`
Lightweight liveness check.

**Response `200`**
```json
{ "pong": true }
```

---

## Agents

### `POST /api/v1/agents`
Create a new agent.

**Request body**
```json
{
  "name": "Cursor Assistant",
  "description": "Helps with TypeScript development."
}
```

**Response `201`**
```json
{
  "agent_id": "agent_...",
  "name": "Cursor Assistant",
  "description": "...",
  "total_episodes": 0,
  "total_semantic_memories": 0,
  "created_at": "...",
  "last_active_at": "..."
}
```

---

### `GET /api/v1/agents`
List all agents for the authenticated user.

**Response `200`**
```json
{ "agents": [ { ...Agent } ] }
```

---

### `GET /api/v1/agents/:id`
Get a single agent by ID.

**Response `200`** — `Agent` object.
**Response `404`** — Agent not found.

---

## Episodes

### `POST /api/v1/episodes`
Write a new episodic memory.

**Request body**
```json
{
  "agent_id": "agent_...",
  "user_id": "usr_...",
  "session_id": "sess_...",
  "content": "User prefers TypeScript with strict mode.",
  "outcome": "success",
  "metadata": {}
}
```

**Response `201`**
```json
{
  "episode_id": "ep_...",
  "agent_id": "agent_...",
  "created_at": "...",
  "status": "written"
}
```

---

### `GET /api/v1/episodes`
List episodes for an agent.

**Query parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `agent_id` | string | **required** | Filter by agent |
| `limit` | int | `20` | Max results |
| `offset` | int | `0` | Pagination offset |
| `domain` | string | — | Filter by domain |
| `outcome` | string | — | Filter by outcome |
| `consolidated` | bool | — | Filter by consolidation status |

**Response `200`**
```json
{ "episodes": [ { ...Episode } ], "total": 247 }
```

---

### `GET /api/v1/episodes/:id`
Get a single episode by ID.

**Response `200`** — `Episode` object.
**Response `404`** — Episode not found.

---

## Retrieval

### `POST /api/v1/retrieve`
Perform a semantic retrieval query across an agent's memory.

**Request body**
```json
{
  "query": "What are the user's TypeScript preferences?",
  "agent_id": "agent_...",
  "top_k": 5,
  "include_semantic": true
}
```

**Response `200`**
```json
{
  "episodes": [ { ...Episode } ],
  "semantic_memories": [ { ...SemanticMemory } ],
  "injection_prompt": "Known facts: User prefers TypeScript ...",
  "scores": { "ep_...": 0.92 }
}
```

---

## Semantic Memories

### `GET /api/v1/semantic`
List consolidated semantic memories for an agent.

**Query parameters**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `agent_id` | string | **required** | Filter by agent |
| `domain` | string | — | Filter by domain |
| `fact_type` | string | — | `preference`, `pattern`, `rule`, `fact` |
| `active` | bool | — | Only active memories |

**Response `200`**
```json
{ "memories": [ { ...SemanticMemory } ] }
```

---

## Graph

### `GET /api/v1/graph/:agent_id`
Return graph data (nodes + edges) for an agent's memory network.

**Response `200`**
```json
{
  "nodes": [
    { "id": "ep_...", "type": "episode", "label": "...", "domain": "coding", "consolidated": true, "importance": 0.9 }
  ],
  "edges": [
    { "from": "ep_...", "to": "ep_...", "type": "followed_by" }
  ]
}
```

**Edge types:** `followed_by`, `compressed_into`, `related_to`

---

## Object schemas

### `Agent`
```json
{
  "agent_id": "string",
  "name": "string",
  "description": "string",
  "total_episodes": 0,
  "total_semantic_memories": 0,
  "last_active_at": "ISO 8601",
  "created_at": "ISO 8601"
}
```

### `Episode`
```json
{
  "episode_id": "string",
  "agent_id": "string",
  "user_id": "string",
  "session_id": "string",
  "raw_content": "string",
  "parsed_entities": ["string"],
  "intent": "string",
  "outcome": "success | partial | failure",
  "domain": "coding | planning | general | ...",
  "emotion_signal": "string",
  "importance_score": 0.0,
  "retrieval_count": 0,
  "consolidated": false,
  "created_at": "ISO 8601",
  "updated_at": "ISO 8601"
}
```

### `SemanticMemory`
```json
{
  "semantic_id": "string",
  "agent_id": "string",
  "fact": "string",
  "confidence": 0.0,
  "evidence_count": 0,
  "source_episode_ids": ["string"],
  "domain": "string",
  "fact_type": "preference | pattern | rule | fact",
  "active": true,
  "created_at": "ISO 8601"
}
```

---

## Error responses

All errors follow the same envelope:

```json
{ "error": "human-readable message" }
```

| HTTP Status | Meaning |
|-------------|---------|
| `400` | Bad request / validation error |
| `401` | Missing or invalid API key |
| `403` | Forbidden |
| `404` | Resource not found |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
