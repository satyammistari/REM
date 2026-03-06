# REM Python SDK

[![PyPI](https://img.shields.io/pypi/v/rem-memory)](https://pypi.org/project/rem-memory/)
[![Python](https://img.shields.io/pypi/pyversions/rem-memory)](https://pypi.org/project/rem-memory/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**rem-memory** is the official Python SDK for [REM](https://github.com/your-org/rem) (Recursive Episodic Memory) — an open-source memory layer for AI agents.

---

## Installation

```bash
pip install rem-memory
```

## Quick start

```python
import asyncio
from rem_memory import REMClient

async def main():
    async with REMClient(api_key="rem_sk_...") as client:
        # Write a memory episode
        result = await client.write(
            content="User prefers TypeScript with strict mode for all new projects.",
            agent_id="agent_cursor",
            user_id="user_alice",
        )
        print(result.episode_id)

        # Retrieve relevant memories
        memories = await client.retrieve(
            query="Does the user prefer TypeScript or JavaScript?",
            agent_id="agent_cursor",
            top_k=5,
        )
        for m in memories.episodes:
            print(m.intent, m.importance_score)

asyncio.run(main())
```

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `api_key` | — | Your REM API key (`X-API-Key` header) |
| `base_url` | `http://localhost:8080` | Base URL of the REM Go API |
| `timeout` | `30` | Request timeout in seconds |

Environment variables are also supported:

```bash
export REM_API_KEY=rem_sk_...
export REM_BASE_URL=http://localhost:8080
```

## Integrations

### LangChain

```python
from rem_memory.integrations.langchain import REMMemory
from langchain.chains import ConversationChain
from langchain_openai import ChatOpenAI

memory = REMMemory(
    api_key="rem_sk_...",
    agent_id="agent_cursor",
    user_id="user_alice",
)

chain = ConversationChain(llm=ChatOpenAI(), memory=memory)
response = chain.predict(input="What are my coding preferences?")
```

### AutoGen

```python
from rem_memory.integrations.autogen import REMMemoryStore
from autogen import ConversableAgent

memory_store = REMMemoryStore(
    api_key="rem_sk_...",
    agent_id="agent_autogen",
)

agent = ConversableAgent(
    name="assistant",
    system_message="You are a helpful coding assistant.",
)

# Inject past memories into system prompt
context = await memory_store.get_context(query="user coding preferences")
```

## API Reference

### `REMClient`

#### `write(content, agent_id, user_id, session_id?, metadata?)`
Write a raw interaction to episodic memory. Returns `WriteResult`.

#### `retrieve(query, agent_id, top_k?, include_semantic?)`
Retrieve semantically relevant episodes and facts. Returns `RetrieveResult`.

#### `get_agent(agent_id)`
Fetch agent metadata. Returns `Agent`.

#### `list_agents()`
List all agents. Returns `List[Agent]`.

#### `list_episodes(agent_id, limit?, offset?)`
Page through raw episodes for an agent. Returns `List[Episode]`.

#### `list_semantic_memories(agent_id)`
Fetch all consolidated semantic memories. Returns `List[SemanticMemory]`.

## Development

```bash
cd sdk/python
pip install -e ".[dev]"
pytest
```

## License

MIT © REM Contributors
