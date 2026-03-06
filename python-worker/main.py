import asyncio
import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

import structlog
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from api.router import api_router
from api.handlers import embed as embed_handler
from api.handlers import parse as parse_handler
from api.handlers import consolidate as consolidate_handler
from services.embed_service import EmbedService
from services.parse_service import ParseService
from services.consolidation.engine import ConsolidationEngine

from openai import AsyncOpenAI
from redis.asyncio import from_url as redis_from_url


load_dotenv()
logger = structlog.get_logger("rem.python_worker")


class HealthResponse(BaseModel):
    status: str
    version: str


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Initialize shared clients and services, verify OpenAI key with a test embedding.
    """
    # OpenAI client
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")

    openai_client = AsyncOpenAI(api_key=openai_api_key)

    # Redis client (optional cache / queue)
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_client = redis_from_url(redis_url, encoding="utf-8", decode_responses=False)

    # Verify OpenAI key with a tiny embedding call
    try:
        await openai_client.embeddings.create(
            model="text-embedding-3-large",
            input="rem-health-check",
        )
        logger.info("openai_embedding_check_ok")
    except Exception as exc:  # noqa: BLE001
        logger.error("openai_embedding_check_failed", error=str(exc))
        raise

    # Initialize services and inject into handler modules
    embed_service = EmbedService(openai_client=openai_client, redis_client=redis_client)
    parse_service = ParseService(openai_client=openai_client)
    consolidation_engine = ConsolidationEngine(openai_client=openai_client)

    embed_handler.embed_service = embed_service
    parse_handler.parse_service = parse_service
    consolidate_handler.consolidation_engine = consolidation_engine

    app.state.openai_client = openai_client
    app.state.redis_client = redis_client
    app.state.embed_service = embed_service
    app.state.parse_service = parse_service
    app.state.consolidation_engine = consolidation_engine

    logger.info("python_worker_startup_complete")
    try:
        yield
    finally:
        # graceful shutdown
        try:
            await redis_client.aclose()
        except Exception:  # noqa: BLE001
            pass


app = FastAPI(
    title="REM Python Worker",
    version="0.1.0",
    lifespan=lifespan,
)

origins = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:  # pragma: no cover - trivial
    return HealthResponse(status="ok", version="0.1.0")


def run() -> None:  # pragma: no cover - convenience
    import uvicorn

    port = int(os.getenv("PYTHON_WORKER_PORT", "8001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False, workers=2)


if __name__ == "__main__":  # pragma: no cover
    asyncio.run(asyncio.to_thread(run))

