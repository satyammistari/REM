import time
from typing import Any, Dict, List, Optional

import structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.consolidation.engine import ConsolidationEngine


logger = structlog.get_logger("rem.python_worker.consolidate")
router = APIRouter()

consolidation_engine: Optional[ConsolidationEngine] = None  # set in main lifespan


class ConsolidateRequest(BaseModel):
    episodes: List[Dict[str, Any]] = Field(..., min_length=1)
    agent_id: str = Field(..., min_length=1)


class ConsolidateResponse(BaseModel):
    semantic_memories: List[Dict[str, Any]]


@router.post("/consolidate", response_model=ConsolidateResponse)
async def consolidate(req: ConsolidateRequest) -> ConsolidateResponse:
    if consolidation_engine is None:
        raise HTTPException(status_code=500, detail="consolidation engine not initialized")

    start = time.perf_counter()
    try:
        memories = await consolidation_engine.consolidate(req.episodes, req.agent_id)
    except Exception as exc:  # noqa: BLE001
        logger.exception("consolidate_failed", error=str(exc))
        raise HTTPException(status_code=500, detail="consolidation failed") from exc

    latency_ms = int((time.perf_counter() - start) * 1000)
    logger.info(
        "consolidate",
        agent_id=req.agent_id,
        episodes_in=len(req.episodes),
        memories_out=len(memories),
        latency_ms=latency_ms,
    )

    return ConsolidateResponse(semantic_memories=memories)

