"""
REM Memory adapter for benchmarks.
Wraps the REM REST API (http://localhost:8000) with a simple
write / retrieve interface that all benchmark scripts use.
"""
from __future__ import annotations

import os
import time
import uuid
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

REM_API_URL   = os.getenv("REM_API_URL",  "http://localhost:8000")
REM_API_KEY   = os.getenv("REM_API_KEY",  "rem_dev_key")
REM_USER_ID   = os.getenv("REM_USER_ID",  "")
API_BASE_PATH = "/api/v1"

HEADERS = {
    "X-API-Key": REM_API_KEY,
    "Content-Type": "application/json",
}


def _client() -> httpx.Client:
    return httpx.Client(base_url=REM_API_URL + API_BASE_PATH, headers=HEADERS, timeout=30)


# ── health ────────────────────────────────────────────────────────────────────

def health() -> bool:
    try:
        with httpx.Client(base_url=REM_API_URL, headers=HEADERS, timeout=10) as c:
            r = c.get("/health")
            return r.status_code == 200
    except Exception:
        return False


# ── write episode ─────────────────────────────────────────────────────────────

def write_episode(
    content: str,
    agent_id: str = "bench_agent",
    metadata: dict[str, Any] | None = None,
) -> str:
    """Write one episode; return episode_id."""
    # API requires content between 50-10000 chars
    if len(content) < 50:
        content = content + " " + ("(benchmark episode context padding) " * 5)
    content = content[:10000]

    payload: dict[str, Any] = {
        "content": content,
        "agent_id": agent_id,
        "user_id": REM_USER_ID,
        "outcome": "completed",
    }
    if metadata:
        payload["metadata"] = metadata

    with _client() as c:
        r = c.post("/episodes", json=payload)
        r.raise_for_status()
        return r.json().get("episode_id", str(uuid.uuid4()))


# ── retrieve ──────────────────────────────────────────────────────────────────

def retrieve(
    query: str,
    agent_id: str = "bench_agent",
    top_k: int = 5,
) -> dict[str, Any]:
    """Retrieve relevant memories; return full response dict."""
    payload = {"query": query, "agent_id": agent_id, "top_k": top_k}
    with _client() as c:
        r = c.post("/retrieve", json=payload)
        r.raise_for_status()
        return r.json()


def retrieve_prompt(query: str, agent_id: str = "bench_agent", top_k: int = 5) -> str:
    """Convenience: return only the injection_prompt string."""
    result = retrieve(query, agent_id=agent_id, top_k=top_k)
    return result.get("injection_prompt", "")


# ── reset agent memory ────────────────────────────────────────────────────────

def reset_agent(agent_id: str) -> None:
    """Delete all episodes for an agent (best-effort)."""
    try:
        with _client() as c:
            # list episodes and delete each one
            r = c.get("/episodes", params={"agent_id": agent_id, "limit": 200})
            if r.is_success:
                for ep in r.json().get("episodes", []):
                    eid = ep.get("id") or ep.get("episode_id", "")
                    if eid:
                        c.delete(f"/episodes/{eid}")
    except Exception:
        pass


# ── latency helper ────────────────────────────────────────────────────────────

def timed_retrieve(query: str, agent_id: str = "bench_agent", top_k: int = 5) -> tuple[dict, float]:
    """Returns (result, latency_ms)."""
    t0 = time.perf_counter()
    result = retrieve(query, agent_id=agent_id, top_k=top_k)
    latency_ms = (time.perf_counter() - t0) * 1000
    return result, latency_ms
