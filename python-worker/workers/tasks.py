from __future__ import annotations

import asyncio
import os
import time
from typing import Any, Dict, List, Set, Tuple

import httpx
import structlog
from celery import Task
from openai import AsyncOpenAI

from workers.celery_app import celery_app
from services.consolidation.engine import ConsolidationEngine


logger = structlog.get_logger("rem.python_worker.workers")


def _get_env(name: str, default: str) -> str:
    val = os.getenv(name, default)
    return val


GO_API_BASE_URL = _get_env("GO_API_BASE_URL", "http://localhost:8000")
PYTHON_WORKER_URL = _get_env("PYTHON_WORKER_URL", "http://localhost:8001")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")


async def _fetch_unconsolidated_episodes(
    agent_id: str,
    triggered_by_episode_id: str,
) -> List[Dict[str, Any]]:
    """
    Fetch unconsolidated episodes for a given agent from the Go API.
    """
    headers = {}
    if INTERNAL_API_KEY:
        headers["X-API-Key"] = INTERNAL_API_KEY

    params = {
        "agent_id": agent_id,
        "consolidated": "false",
        "limit": "50",
        "offset": "0",
    }

    url = f"{GO_API_BASE_URL.rstrip('/')}/api/v1/episodes"
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url, headers=headers, params=params)
        resp.raise_for_status()
        data = resp.json()

    episodes = data.get("episodes", [])
    # Ensure the triggering episode is included if present.
    if triggered_by_episode_id:
        for ep in episodes:
            if str(ep.get("episode_id")) == triggered_by_episode_id:
                break
        else:
            # Not found, try to fetch it directly.
            ep_url = f"{GO_API_BASE_URL.rstrip('/')}/api/v1/episodes/{triggered_by_episode_id}"
            async with httpx.AsyncClient(timeout=30.0) as client:
                ep_resp = await client.get(ep_url, headers=headers)
                if ep_resp.status_code == 200:
                    episodes.append(ep_resp.json())

    return episodes


async def _embed_fact(text: str) -> List[float]:
    """
    Call the Python worker /embed endpoint to get an embedding for a fact.
    """
    payload = {"text": text}
    url = f"{PYTHON_WORKER_URL.rstrip('/')}/embed"
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
    embedding = data.get("embedding") or []
    return embedding


async def _store_semantic_memory(
    memory: Dict[str, Any],
    embedding: List[float],
    agent_id: str,
) -> str:
    """
    Store a semantic memory via the Go API.

    Returns the created semantic_id (if provided by the API), or an empty string.
    """
    headers = {"Content-Type": "application/json"}
    if INTERNAL_API_KEY:
        headers["X-API-Key"] = INTERNAL_API_KEY

    payload: Dict[str, Any] = {
        "agent_id": agent_id,
        "fact": memory.get("fact"),
        "confidence": float(memory.get("confidence", 0.7)),
        "fact_type": memory.get("fact_type", "pattern"),
        "domain": memory.get("domain", "general"),
        "evidence_count": int(memory.get("evidence_count", 1)),
        "source_episode_ids": memory.get("source_episode_ids", []),
        "embedding": embedding,
    }

    url = f"{GO_API_BASE_URL.rstrip('/')}/api/v1/semantic"
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

    semantic_id = str(data.get("semantic_id", "") or "")
    return semantic_id


async def _mark_episodes_consolidated(
    episode_ids: Set[str],
    semantic_id: str,
) -> None:
    """
    Mark source episodes as consolidated via Go API.
    """
    if not episode_ids:
        return

    headers = {"Content-Type": "application/json"}
    if INTERNAL_API_KEY:
        headers["X-API-Key"] = INTERNAL_API_KEY

    async with httpx.AsyncClient(timeout=30.0) as client:
        for eid in episode_ids:
            if not eid:
                continue
            url = f"{GO_API_BASE_URL.rstrip('/')}/api/v1/episodes/{eid}/consolidated"
            payload = {"semantic_id": semantic_id} if semantic_id else {}
            try:
                resp = await client.patch(url, headers=headers, json=payload)
                if resp.status_code >= 400:
                    logger.warning(
                        "mark_episode_consolidated_failed",
                        episode_id=eid,
                        status_code=resp.status_code,
                        body=resp.text,
                    )
            except httpx.HTTPError as exc:  # noqa: PERF203
                logger.warning(
                    "mark_episode_consolidated_http_error",
                    episode_id=eid,
                    error=str(exc),
                )


async def _run_consolidation(
    agent_id: str,
    triggered_by_episode_id: str,
) -> Tuple[int, int]:
    """
    Core consolidation pipeline executed inside the Celery task.

    Returns (episodes_processed, memories_created).
    """
    if not OPENAI_API_KEY:
        logger.error("openai_api_key_missing")
        return 0, 0

    episodes = await _fetch_unconsolidated_episodes(agent_id, triggered_by_episode_id)
    if len(episodes) < 3:
        logger.info(
            "consolidation_skipped_not_enough_episodes",
            agent_id=agent_id,
            episodes=len(episodes),
        )
        return len(episodes), 0

    openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    engine = ConsolidationEngine(openai_client=openai_client)

    memories = await engine.consolidate(episodes, agent_id)
    if not memories:
        logger.info(
            "consolidation_no_memories_generated",
            agent_id=agent_id,
            episodes=len(episodes),
        )
        return len(episodes), 0

    all_source_ids: Set[str] = set()
    created_count = 0
    for mem in memories:
        fact_text = mem.get("fact")
        if not fact_text:
            continue

        embedding = await _embed_fact(fact_text)
        semantic_id = await _store_semantic_memory(mem, embedding, agent_id)
        source_ids = {str(eid) for eid in mem.get("source_episode_ids", []) if eid}
        all_source_ids.update(source_ids)

        await _mark_episodes_consolidated(source_ids, semantic_id)
        created_count += 1

    # As a safety, ensure all contributing episodes are marked consolidated once.
    if all_source_ids:
        await _mark_episodes_consolidated(all_source_ids, "")

    return len(episodes), created_count


@celery_app.task(
    name="consolidation.run_for_agent",
    bind=True,
    autoretry_for=(httpx.HTTPError,),
    retry_backoff=True,
    retry_backoff_max=600,
)
def run_consolidation_for_agent(
    self: Task,
    agent_id: str,
    triggered_by_episode_id: str,
) -> Dict[str, Any]:
    """
    Celery task entrypoint: run consolidation for a single agent.
    """
    start = time.perf_counter()
    try:
        episodes_processed, memories_created = asyncio.run(
            _run_consolidation(agent_id, triggered_by_episode_id),
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception(
            "consolidation_task_failed",
            agent_id=agent_id,
            triggered_by_episode_id=triggered_by_episode_id,
            error=str(exc),
        )
        raise self.retry(exc=exc)

    latency_ms = int((time.perf_counter() - start) * 1000)
    logger.info(
        "consolidation_task_complete",
        agent_id=agent_id,
        triggered_by_episode_id=triggered_by_episode_id,
        episodes_processed=episodes_processed,
        memories_created=memories_created,
        latency_ms=latency_ms,
    )
    return {
        "agent_id": agent_id,
        "triggered_by_episode_id": triggered_by_episode_id,
        "episodes_processed": episodes_processed,
        "memories_created": memories_created,
        "latency_ms": latency_ms,
    }


async def _fetch_agents_with_unconsolidated() -> List[str]:
    """
    Fetch all agents that have at least 3 unconsolidated episodes.

    This relies on a future Go API endpoint; errors are logged and ignored.
    """
    headers = {}
    if INTERNAL_API_KEY:
        headers["X-API-Key"] = INTERNAL_API_KEY

    url = f"{GO_API_BASE_URL.rstrip('/')}/api/v1/agents"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            agents = resp.json() or []
    except Exception as exc:  # noqa: BLE001
        logger.warning("fetch_agents_failed", error=str(exc))
        return []

    # Heuristic: assume agents include total_episodes and total_semantic_memories.
    result: List[str] = []
    for agent in agents:
        total_eps = int(agent.get("total_episodes") or 0)
        total_sem = int(agent.get("total_semantic_memories") or 0)
        unconsolidated = max(total_eps - total_sem, 0)
        if unconsolidated >= 3:
            aid = str(agent.get("agent_id") or "")
            if aid:
                result.append(aid)
    return result


@celery_app.task(
    name="consolidation.run_scheduled_consolidation",
    bind=True,
)
def run_scheduled_consolidation(self: Task) -> Dict[str, Any]:
    """
    Periodic Celery task that schedules consolidation for all eligible agents.
    """
    start = time.perf_counter()
    agent_ids: List[str] = asyncio.run(_fetch_agents_with_unconsolidated())

    for agent_id in agent_ids:
        # Trigger consolidation per agent asynchronously via Celery.
        run_consolidation_for_agent.delay(agent_id, triggered_by_episode_id="")

    latency_ms = int((time.perf_counter() - start) * 1000)
    logger.info(
        "scheduled_consolidation_enqueued",
        agents=len(agent_ids),
        latency_ms=latency_ms,
    )
    return {"agents_scheduled": len(agent_ids), "latency_ms": latency_ms}

