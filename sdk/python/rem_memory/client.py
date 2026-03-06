from __future__ import annotations

import asyncio
from typing import Any, Dict, List, Optional, Tuple, Literal

import httpx

from .types import (
    Agent,
    CreateAgentRequest,
    EpisodeResult,
    RetrieveResult,
    SemanticMemory,
    WriteResult,
)
from .exceptions import (
    REMError,
    AuthenticationError,
    NotFoundError,
    RateLimitError,
    APIError,
    ConnectionError,
    ValidationError,
)


SDK_VERSION = "0.1.0"


class REMClient:
    """
    Recursive Episodic Memory client for AI agents.

    Quick start:
        client = REMClient(api_key="rem_sk_...")

        # After agent task
        await client.write(
            content="User prefers TypeScript",
            agent_id="my-agent",
        )

        # Before next task
        result = await client.retrieve(
            query="user preferences",
            agent_id="my-agent",
        )
        print(result.injection_prompt)
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.rem.ai",
        timeout: int = 30,
        max_retries: int = 3,
    ) -> None:
        if not api_key:
            raise AuthenticationError("api_key is required")
        if not api_key.startswith("rem_sk_"):
            raise AuthenticationError(
                "Invalid API key format. Key must start with 'rem_sk_'",
            )

        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries

        self._headers = {
            "X-API-Key": api_key,
            "Content-Type": "application/json",
            "User-Agent": f"rem-memory-python/{SDK_VERSION}",
        }

        self._async_client: Optional[httpx.AsyncClient] = None
        self._sync_client: Optional[httpx.Client] = None

    # ── ASYNC METHODS ────────────────────────────────────────────

    async def write(
        self,
        content: str,
        agent_id: str,
        user_id: str = "default",
        session_id: str = "",
        outcome: Literal["success", "failure", "partial", "unknown"] = "unknown",
        metadata: Optional[Dict[str, str]] = None,
    ) -> WriteResult:
        """
        Write an episode to memory after your agent completes a task.
        """
        if not content or len(content.strip()) < 10:
            raise ValidationError("content must be at least 10 characters")
        if not agent_id:
            raise ValidationError("agent_id is required")

        response = await self._async_request(
            "POST",
            "/api/v1/episodes",
            json={
                "content": content,
                "agent_id": agent_id,
                "user_id": user_id,
                "session_id": session_id,
                "outcome": outcome,
                "metadata": metadata or {},
            },
        )
        return WriteResult(**response)

    async def retrieve(
        self,
        query: str,
        agent_id: str,
        top_k: int = 5,
        include_semantic: bool = True,
    ) -> RetrieveResult:
        """
        Retrieve relevant memories before your agent starts a task.
        Inject result.injection_prompt into your LLM system prompt.
        """
        if not query:
            raise ValidationError("query is required")
        if not agent_id:
            raise ValidationError("agent_id is required")
        top_k = max(1, min(top_k, 20))

        raw = await self._async_request(
            "POST",
            "/api/v1/retrieve",
            json={
                "query": query,
                "agent_id": agent_id,
                "top_k": top_k,
                "include_semantic": include_semantic,
            },
        )

        # Flatten episode results (Go API returns {"episode": {...}, "score": ..., "retrieval_source": ...})
        flat_episodes: List[EpisodeResult] = []
        for item in raw.get("episodes", []):
            ep = item.get("episode") or {}
            flat_episodes.append(
                EpisodeResult(
                    episode_id=ep.get("episode_id", ""),
                    agent_id=ep.get("agent_id", ""),
                    raw_content=ep.get("raw_content", ""),
                    intent=ep.get("intent", ""),
                    domain=ep.get("domain", "general"),
                    outcome=ep.get("outcome", "unknown"),
                    importance_score=float(ep.get("importance_score", 0.5)),
                    retrieval_count=int(ep.get("retrieval_count", 0)),
                    consolidated=bool(ep.get("consolidated", False)),
                    created_at=ep.get("created_at"),
                    score=float(item.get("score", 0.0)),
                    retrieval_source=str(item.get("retrieval_source", "qdrant")),
                )
            )

        sem_raw = raw.get("semantic_memories", [])
        semantic: List[SemanticMemory] = []
        for sm in sem_raw:
            semantic.append(
                SemanticMemory(
                    semantic_id=sm.get("semantic_id", ""),
                    agent_id=sm.get("agent_id", ""),
                    fact=sm.get("fact", ""),
                    confidence=float(sm.get("confidence", 0.0)),
                    evidence_count=int(sm.get("evidence_count", 0)),
                    domain=sm.get("domain", "general"),
                    fact_type=sm.get("fact_type", "pattern"),
                    created_at=sm.get("created_at"),
                    score=sm.get("score"),
                )
            )

        result = RetrieveResult(
            episodes=flat_episodes,
            semantic_memories=semantic,
            injection_prompt=raw.get("injection_prompt", ""),
            latency_ms=int(raw.get("latency_ms", 0)),
        )
        return result

    async def create_agent(
        self,
        name: str,
        description: str = "",
    ) -> Agent:
        """Create a new agent to store memories for."""
        if not name:
            raise ValidationError("name is required")

        req = CreateAgentRequest(name=name, description=description)
        response = await self._async_request(
            "POST",
            "/api/v1/agents",
            json=req.model_dump(),
        )
        return Agent(**response)

    async def get_semantic_memory(
        self,
        agent_id: str,
        limit: int = 20,
    ) -> List[SemanticMemory]:
        """Get semantic memories (consolidated facts) for an agent."""
        if not agent_id:
            raise ValidationError("agent_id is required")
        response = await self._async_request(
            "GET",
            f"/api/v1/semantic?agent_id={agent_id}&limit={limit}",
        )
        items = response.get("memories") or response.get("items") or []
        return [
            SemanticMemory(
                semantic_id=sm.get("semantic_id", ""),
                agent_id=sm.get("agent_id", ""),
                fact=sm.get("fact", ""),
                confidence=float(sm.get("confidence", 0.0)),
                evidence_count=int(sm.get("evidence_count", 0)),
                domain=sm.get("domain", "general"),
                fact_type=sm.get("fact_type", "pattern"),
                created_at=sm.get("created_at"),
                score=sm.get("score"),
            )
            for sm in items
        ]

    async def list_episodes(
        self,
        agent_id: str,
        limit: int = 20,
        offset: int = 0,
        domain: Optional[str] = None,
        outcome: Optional[str] = None,
    ) -> Tuple[List[EpisodeResult], int]:
        """
        List episodes for an agent. Returns (episodes, total_count).

        This flattens the Go API /episodes response into EpisodeResult objects
        with score=0 and retrieval_source="episodes".
        """
        if not agent_id:
            raise ValidationError("agent_id is required")

        params = f"agent_id={agent_id}&limit={limit}&offset={offset}"
        if domain:
            params += f"&domain={domain}"
        if outcome:
            params += f"&outcome={outcome}"

        response = await self._async_request("GET", f"/api/v1/episodes?{params}")
        eps: List[EpisodeResult] = []
        for ep in response.get("episodes", []):
            eps.append(
                EpisodeResult(
                    episode_id=ep.get("episode_id", ""),
                    agent_id=ep.get("agent_id", ""),
                    raw_content=ep.get("raw_content", ""),
                    intent=ep.get("intent", ""),
                    domain=ep.get("domain", "general"),
                    outcome=ep.get("outcome", "unknown"),
                    importance_score=float(ep.get("importance_score", 0.5)),
                    retrieval_count=int(ep.get("retrieval_count", 0)),
                    consolidated=bool(ep.get("consolidated", False)),
                    created_at=ep.get("created_at"),
                    score=0.0,
                    retrieval_source="episodes",
                )
            )
        total = int(response.get("total", len(eps)))
        return eps, total

    async def close(self) -> None:
        """Close the async HTTP client. Call when done."""
        if self._async_client is not None:
            await self._async_client.aclose()
        if self._sync_client is not None:
            self._sync_client.close()

    # ── SYNC WRAPPERS ─────────────────────────────────────────────
    # For developers not using async — wraps async methods

    def write_sync(self, content: str, agent_id: str, **kwargs: Any) -> WriteResult:
        """Synchronous version of write(). Use in non-async code."""
        return asyncio.get_event_loop().run_until_complete(
            self.write(content, agent_id, **kwargs),
        )

    def retrieve_sync(self, query: str, agent_id: str, **kwargs: Any) -> RetrieveResult:
        """Synchronous version of retrieve(). Use in non-async code."""
        return asyncio.get_event_loop().run_until_complete(
            self.retrieve(query, agent_id, **kwargs),
        )

    def create_agent_sync(self, name: str, description: str = "") -> Agent:
        """Synchronous version of create_agent()."""
        return asyncio.get_event_loop().run_until_complete(
            self.create_agent(name, description),
        )

    # ── CONTEXT MANAGER ───────────────────────────────────────────

    async def __aenter__(self) -> "REMClient":
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:  # type: ignore[override]
        await self.close()

    # ── PRIVATE HTTP LAYER ────────────────────────────────────────

    def _get_async_client(self) -> httpx.AsyncClient:
        if self._async_client is None or self._async_client.is_closed:
            self._async_client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=self._headers,
                timeout=self.timeout,
            )
        return self._async_client

    async def _async_request(
        self,
        method: str,
        path: str,
        **kwargs: Any,
    ) -> Dict[str, Any]:
        client = self._get_async_client()
        last_error: Optional[REMError] = None

        for attempt in range(self.max_retries):
            try:
                response = await client.request(method, path, **kwargs)
                return self._handle_response(response)
            except httpx.ConnectError as e:
                last_error = ConnectionError(
                    f"Cannot connect to REM API at {self.base_url}. "
                    f"Is the server running? Error: {e}",
                )
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2**attempt)
            except httpx.TimeoutException:
                last_error = APIError(
                    f"Request to {self.base_url}{path} timed out after {self.timeout}s",
                )
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(1)

        if last_error is not None:
            raise last_error
        raise ConnectionError("Request failed and no error captured")

    def _handle_response(self, response: httpx.Response) -> Dict[str, Any]:
        if response.status_code in (200, 201):
            data = response.json()
            if isinstance(data, Dict):
                return data
            return {"data": data}

        try:
            error_body = response.json()
            message = error_body.get("error", f"HTTP {response.status_code}")
        except Exception:
            message = f"HTTP {response.status_code}"

        status = response.status_code
        if status == 400:
            raise ValidationError(message, status)
        if status == 401:
            raise AuthenticationError(message, status)
        if status == 404:
            raise NotFoundError(message, status)
        if status == 429:
            retry_after = int(response.headers.get("Retry-After", "60"))
            raise RateLimitError(message, retry_after=retry_after)
        raise APIError(message, status)


