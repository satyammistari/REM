import time
from typing import Optional

import structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.parse_service import ParseService


logger = structlog.get_logger("rem.python_worker.parse")
router = APIRouter()

parse_service: Optional[ParseService] = None  # set in main lifespan


class ParseRequest(BaseModel):
    content: str = Field(..., min_length=1)


class ParseResponse(BaseModel):
    intent: str
    entities: list[str]
    domain: str
    emotion_signal: str
    importance_score: float


@router.post("/parse", response_model=ParseResponse)
async def parse(req: ParseRequest) -> ParseResponse:
    if parse_service is None:
        raise HTTPException(status_code=500, detail="parse service not initialized")

    start = time.perf_counter()
    try:
        data = await parse_service.parse(req.content)
    except Exception as exc:  # noqa: BLE001
        logger.exception("parse_failed", error=str(exc))
        raise HTTPException(status_code=500, detail="parse failed") from exc

    latency_ms = int((time.perf_counter() - start) * 1000)
    logger.info(
        "parse",
        domain_detected=data.get("domain", "general"),
        importance_score=data.get("importance_score", 0.5),
        latency_ms=latency_ms,
    )

    return ParseResponse(
        intent=data.get("intent", "general task"),
        entities=data.get("entities", []),
        domain=data.get("domain", "general"),
        emotion_signal=data.get("emotion_signal", "neutral"),
        importance_score=data.get("importance_score", 0.5),
    )

