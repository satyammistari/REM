import time
from typing import List, Optional

import structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.embed_service import EmbedService


logger = structlog.get_logger("rem.python_worker.embed")
router = APIRouter()

embed_service: Optional[EmbedService] = None  # set in main lifespan


class EmbedRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=8000)


class EmbedResponse(BaseModel):
    embedding: List[float]
    cached: bool
    dimensions: int


@router.post("/embed", response_model=EmbedResponse)
async def embed(req: EmbedRequest) -> EmbedResponse:
    if embed_service is None:
        raise HTTPException(status_code=500, detail="embed service not initialized")

    start = time.perf_counter()
    try:
        emb, cached = await embed_service.embed(req.text)
    except Exception as exc:  # noqa: BLE001
        logger.exception("embed_failed", error=str(exc))
        raise HTTPException(status_code=500, detail="embedding failed") from exc

    latency_ms = int((time.perf_counter() - start) * 1000)
    logger.info(
        "embed",
        text_length=len(req.text),
        cached=cached,
        latency_ms=latency_ms,
    )
    return EmbedResponse(embedding=emb, cached=cached, dimensions=len(emb))

