from __future__ import annotations

import asyncio
from typing import Any, Dict, List, Optional

import httpx

from .types import Agent, RetrieveResult, SemanticMemory, WriteResult


class REMError(Exception):
    """Base REM SDK error."""


class AuthenticationError(REMError):
    """Raised when the API key is invalid."""


class NotFoundError(REMError):
    """Raised when a resource is not found."""


class RateLimitError(REMError):
    """Raised on HTTP 429 responses."""

    def __init__(self, message: str, retry_after: Optional[float] = None) -> None:
        super().__init__(message)
        self.retry_after = retry_after


class APIError(REMError):
    """Raised for 5xx server errors."""

    def __init__(self, status_code: int, message: str) -> None:
        super().__init__(f"{status_code}: {message}")
        self.status_code = status_code


class ConnectionError(REMError):
    """Raised when the SDK cannot reach the REM API."""


class REMClient:
    """
    Python client for REM (Recursive Episodic Memory).

    Example:
        from rem_memory import REMClient

        async with REMClient(api_key="rem_sk_...") as client:
            res = await client.write(
                content="User prefers TypeScript over JavaScript",
                agent_id="agent_123",
                user_id="user_456",
            )
    """

    def __init__(self, api_key: str, base_url: str = "https://api.rem.ai", timeout: int = 30) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        headers = {
            "X-API-Key": api_key,
            "Content-Type": "application/json",
        }
        self._async_client = httpx.AsyncClient(
            base_url=self.base_url,
            headers=headers,
            timeout=timeout,
        )
        self._sync_client = httpx.Client(
            base_url=self.base_url,
            headers=headers,
            timeout=timeout,
        )

    # -----------------
    # Internal request
    # -----------------
    async def _request(self, method: str, path: str, **kwargs: Any) -> Dict[str, Any]:
        url = path
        try:
            resp = await self._async_client.request(method, url, **kwargs)
        except httpx.RequestError as exc:
            raise ConnectionError(f"connection error: {exc}") from exc

        if resp.status_code == 401:
            raise AuthenticationError("Invalid API key")
        if resp.status_code == 404:
            raise NotFoundError("Resource not found")
        if resp.status_code == 429:
            retry_after_hdr = resp.headers.get("Retry-After")
            retry_after = float(retry_after_hdr) if retry_after_hdr else None
            raise RateLimitError("Rate limited by REM API", retry_after=retry_after)
        if 500 <= resp.status_code < 600:
            raise APIError(resp.status_code, resp.text)
        if resp.status_code >= 400:
            # Generic client error
            raise REMError(f"{resp.status_code}: {resp.text}")

        data = resp.json()
        if not isinstance(data, dict):
            return {"data": data}
        return data

    # -------------
    # ASYNC METHODS
    # -------------
    async def write(
        self,
        content: str,
        agent_id: str,
        user_id: str,
        session_id: str = "",
        outcome: str = "unknown",
        metadata: Optional[Dict[str, str]] = None,
    ) -> WriteResult:
        payload: Dict[str, Any] = {
            "content": content,
            "agent_id": agent_id,
            "user_id": user_id,
            "session_id": session_id,
            "outcome": outcome,
            "metadata": metadata or {},
        }
        data = await self._request("POST", "/api/v1/episodes", json=payload)
        return WriteResult(**data)

    async def retrieve(
        self,
        query: str,
        agent_id: str,
        top_k: int = 5,
        include_semantic: bool = True,
    ) -> RetrieveResult:
        payload = {
            "query": query,
            "agent_id": agent_id,
            "top_k": top_k,
            "include_semantic": include_semantic,
        }
        data = await self._request("POST", "/api/v1/retrieve", json=payload)

        # Coerce semantic_memories into model
        sem_raw = data.get("semantic_memories", [])
        semantic = [SemanticMemory(**sm) for sm in sem_raw]
        result = {
            "episodes": data.get("episodes", []),
            "semantic_memories": semantic,
            "injection_prompt": data.get("injection_prompt", ""),
            "latency_ms": data.get("latency_ms", 0),
        }
        return RetrieveResult(**result)

    async def get_semantic_memory(self, agent_id: str) -> List[SemanticMemory]:
        params = {"agent_id": agent_id}
        data = await self._request("GET", "/api/v1/semantic", params=params)
        items = data.get("items", [])
        return [SemanticMemory(**sm) for sm in items]

    async def create_agent(self, name: str, description: str = "") -> Agent:
        payload = {"name": name, "description": description, "config": {}}
        data = await self._request("POST", "/api/v1/agents", json=payload)
        return Agent(**data)

    async def close(self) -> None:
        await self._async_client.aclose()
        self._sync_client.close()

    # --------------
    # SYNC WRAPPERS
    # --------------
    def write_sync(
        self,
        content: str,
        agent_id: str,
        user_id: str,
        session_id: str = "",
        outcome: str = "unknown",
        metadata: Optional[Dict[str, str]] = None,
    ) -> WriteResult:
        return asyncio.run(
            self.write(
                content=content,
                agent_id=agent_id,
                user_id=user_id,
                session_id=session_id,
                outcome=outcome,
                metadata=metadata,
            )
        )

    def retrieve_sync(
        self,
        query: str,
        agent_id: str,
        top_k: int = 5,
        include_semantic: bool = True,
    ) -> RetrieveResult:
        return asyncio.run(
            self.retrieve(
                query=query,
                agent_id=agent_id,
                top_k=top_k,
                include_semantic=include_semantic,
            )
        )

    # ---------------
    # CONTEXT MANAGER
    # ---------------
    async def __aenter__(self) -> "REMClient":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:  # type: ignore[override]
        await self.close()

