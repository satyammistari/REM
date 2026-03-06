import asyncio
import hashlib
import json
from typing import List, Tuple

import structlog
from openai import AsyncOpenAI
from redis.asyncio import Redis


logger = structlog.get_logger("rem.python_worker.embed_service")


class EmbedService:
    def __init__(self, openai_client: AsyncOpenAI, redis_client: Redis | None) -> None:
        self.client = openai_client
        self.redis = redis_client
        self.model = "text-embedding-3-large"
        self.dimensions = 1536

    async def embed(self, text: str) -> Tuple[List[float], bool]:
        """
        Returns (embedding, was_cached).
        """
        normalized = text.strip().lower()
        key_hash = hashlib.md5(normalized.encode("utf-8")).hexdigest()  # noqa: S324
        cache_key = f"rem:embed:{key_hash}"

        # 1. Try cache
        if self.redis is not None:
            try:
                cached = await self.redis.get(cache_key)
                if cached:
                    emb = json.loads(cached)
                    return emb, True
            except Exception as exc:  # noqa: BLE001
                logger.warning("redis_get_failed", error=str(exc))

        # 2. Call OpenAI with retry on rate limit
        attempt = 0
        while True:
            attempt += 1
            try:
                resp = await self.client.embeddings.create(
                    model=self.model,
                    input=normalized,
                )
                embedding = resp.data[0].embedding
                break
            except Exception as exc:  # noqa: BLE001
                msg = str(exc)
                if "rate limit" in msg.lower() and attempt < 3:
                    logger.warning("openai_rate_limited", attempt=attempt)
                    await asyncio.sleep(20)
                    continue
                logger.exception("openai_embedding_failed", error=msg)
                raise

        # 3. Cache
        if self.redis is not None:
            try:
                await self.redis.set(cache_key, json.dumps(embedding), ex=86400)
            except Exception as exc:  # noqa: BLE001
                logger.warning("redis_set_failed", error=str(exc))

        return embedding, False

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Embed multiple texts, using cache where possible.
        """
        if not texts:
            return []

        normalized = [t.strip().lower() for t in texts]
        hashes = [hashlib.md5(t.encode("utf-8")).hexdigest() for t in normalized]  # noqa: S324
        cache_keys = [f"rem:embed:{h}" for h in hashes]

        results: list[list[float] | None] = [None] * len(texts)
        to_query: list[tuple[int, str]] = []

        # 1. Check cache
        if self.redis is not None:
            try:
                cached_vals = await self.redis.mget(*cache_keys)
                for i, raw in enumerate(cached_vals):
                    if raw:
                        results[i] = json.loads(raw)
            except Exception as exc:  # noqa: BLE001
                logger.warning("redis_mget_failed", error=str(exc))

        # 2. Collect uncached
        for i, (t, r) in enumerate(zip(normalized, results, strict=False)):
            if r is None:
                to_query.append((i, t))

        if to_query:
            # OpenAI supports batching; cap at 100
            batch_inputs = [t for _, t in to_query[:100]]
            try:
                resp = await self.client.embeddings.create(
                    model=self.model,
                    input=batch_inputs,
                )
            except Exception as exc:  # noqa: BLE001
                logger.exception("openai_batch_embedding_failed", error=str(exc))
                raise

            embeddings = [d.embedding for d in resp.data]
            for (idx, _), emb in zip(to_query, embeddings, strict=False):
                results[idx] = emb

            # Cache all results
            if self.redis is not None:
                try:
                    pipe = self.redis.pipeline()
                    for key, emb in zip(cache_keys, results, strict=False):
                        if emb is not None:
                            pipe.set(key, json.dumps(emb), ex=86400)
                    await pipe.execute()
                except Exception as exc:  # noqa: BLE001
                    logger.warning("redis_pipeline_failed", error=str(exc))

        # Coerce to non-None
        return [r or [] for r in results]

