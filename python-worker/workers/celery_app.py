from __future__ import annotations

import os
from datetime import timedelta

from celery import Celery


def _build_redis_dsn(db_suffix: str) -> str:
    """
    Build a Redis DSN for Celery broker/backend based on REDIS_URL.

    If REDIS_URL already contains a DB index, we keep it and ignore the suffix.
    Otherwise we append the suffix (e.g. '/0', '/1').
    """
    base = os.getenv("REDIS_URL", "redis://localhost:6379")
    # If a DB index is already present (path segment after last '/'), don't append.
    if base.rsplit("/", 1)[-1].isdigit():
        return base
    return base.rstrip("/") + db_suffix


broker_url = _build_redis_dsn("/0")
result_backend = _build_redis_dsn("/1")

celery_app = Celery(
    "rem_workers",
    broker=broker_url,
    backend=result_backend,
    include=["workers.tasks"],
)

celery_app.conf.update(
    task_routes={
        "consolidation.*": {"queue": "consolidation"},
    },
    worker_concurrency=int(os.getenv("CELERY_CONCURRENCY", "2")),
    task_time_limit=120,
    task_soft_time_limit=110,
    task_default_retry_delay=60,
    task_annotations={
        "*": {"max_retries": 3},
    },
    beat_schedule={
        "run-scheduled-consolidation": {
            "task": "consolidation.run_scheduled_consolidation",
            "schedule": timedelta(hours=6),
        },
    },
)

