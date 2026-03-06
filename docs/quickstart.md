## REM Quickstart — 5 Minutes to Persistent Memory

Audience: Python developers building AI agents (LangChain or similar).

---

### 1. Prerequisites

- Python **3.11+**
- `pip`
- Running REM backend (Go API + Python worker + DBs)
  - Postgres 16
  - Redis 7
  - Qdrant 1.7
  - Neo4j 5

For local dev, ensure these services are running on their default ports, then:

```bash
git clone https://github.com/yourusername/rem
cd rem
make dev
```

This starts:

- Go API on `http://localhost:8000`
- Python worker on `http://localhost:8001`
- Dashboard on `http://localhost:3000`

---

### 2. Install the Python SDK

```bash
pip install rem-memory
```

Verify:

```bash
python -c "from rem_memory import REMClient; print('REMClient OK')"
```

Expected output:

```text
REMClient OK
```

---

### 3. Create an account and API key

Register a user:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'
```

Expected output:

```json
{
  "user_id": "user_abc123",
  "email": "you@example.com",
  "created_at": "2026-03-05T10:00:00Z"
}
```

Create an API key:

```bash
curl -X POST http://localhost:8000/api/v1/auth/apikey \
  -H "Content-Type: application/json" \
  -d '{"user_id":"user_abc123","name":"local-dev"}'
```

Expected output (keep `api_key` safe):

```json
{
  "api_key": "rem_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "prefix": "rem_sk_XXXXXXXX",
  "created_at": "2026-03-05T10:01:00Z"
}
```

> **Important:** The full API key is shown only once.

---

### 4. Create your first agent

Use the API key from the previous step:

```bash
curl -X POST http://localhost:8000/api/v1/agents \
  -H "Content-Type: application/json" \
  -H "X-API-Key: rem_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \
  -d '{"name":"My Coding Agent","description":"Helps with Python and TypeScript"}'
```

Expected output:

```json
{
  "agent_id": "agent_123",
  "user_id": "user_abc123",
  "name": "My Coding Agent",
  "description": "Helps with Python and TypeScript",
  "total_episodes": 0,
  "total_semantic_memories": 0,
  "last_active_at": null,
  "created_at": "2026-03-05T10:02:00Z",
  "active": true
}
```

---

### 5. Write your first episode (Python SDK, async)

Create `example_write.py`:

```python
import asyncio
from rem_memory import REMClient


async def main() -> None:
    client = REMClient(
        api_key="rem_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        base_url="http://localhost:8000",
    )

    result = await client.write(
        content=(
            "User asked me to build a REST API in Go. "
            "I used Fiber and PostgreSQL. User approved the architecture."
        ),
        agent_id="agent_123",
        user_id="user_abc123",
        outcome="success",
    )

    print("Episode stored:", result.episode_id, "status:", result.status)

    await client.close()


if __name__ == "__main__":
    asyncio.run(main())
```

Run it:

```bash
python example_write.py
```

Expected output:

```text
Episode stored: ep_abc123 status: stored
```

---

### 6. Retrieve memories before a task

Create `example_retrieve.py`:

```python
import asyncio
from rem_memory import REMClient


async def main() -> None:
    client = REMClient(
        api_key="rem_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        base_url="http://localhost:8000",
    )

    result = await client.retrieve(
        query="What does this user prefer for API development?",
        agent_id="agent_123",
        top_k=5,
        include_semantic=True,
    )

    print("Latency:", result.latency_ms, "ms")
    print("Episodes returned:", len(result.episodes))
    print("--- Injection prompt ---")
    print(result.injection_prompt)

    await client.close()


if __name__ == "__main__":
    asyncio.run(main())
```

Run:

```bash
python example_retrieve.py
```

Expected output (shape):

```text
Latency: 42 ms
Episodes returned: 1
--- Injection prompt ---
=== RELEVANT MEMORY CONTEXT ===
[Memory 1] (coding, success, 0 days ago): User asked me to build a REST API in Go...
=== END MEMORY CONTEXT ===
```

---

### 7. LangChain integration (5 lines)

If you use LangChain:

```bash
pip install langchain langchain-openai
```

Then:

```python
from rem_memory import REMClient
from rem_memory.integrations.langchain import REMMemory
from langchain.chains import ConversationChain
from langchain_openai import ChatOpenAI

client = REMClient(
    api_key="rem_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    base_url="http://localhost:8000",
)

memory = REMMemory(
    rem_client=client,
    agent_id="agent_123",
    user_id="user_abc123",
)

llm = ChatOpenAI(model="gpt-4o-mini")
chain = ConversationChain(llm=llm, memory=memory, verbose=True)
```

Every call to `chain.invoke()`:

- fetches relevant episodes and semantic memories from REM,
- injects them as `relevant_memories`,
- stores a new episode afterwards.

---

### 8. View everything in the dashboard

Open:

- `http://localhost:3000` – landing page  
- `http://localhost:3000/dashboard` – main dashboard

Set environment variables before starting `make dev`:

```bash
export NEXT_PUBLIC_API_URL="http://localhost:8000"
export NEXT_PUBLIC_API_KEY="rem_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
export NEXT_PUBLIC_DEFAULT_AGENT_ID="agent_123"
```

You should now see:

- New episodes in the **live feed**,
- Memory health and metrics,
- Semantic memories after consolidation kicks in.

---

### 9. Next steps

- Wire REM calls into your own agent loop (after each task: `write`, before each: `retrieve`).
- Explore the memory graph and semantic memory pages.
- Enable Celery workers to run consolidation continuously.
- Deploy the Go API, Python worker, and dashboard to your preferred cloud.

REM is designed to be the **memory fabric** under all your agents — once it’s in place, they stop forgetting what matters. 

