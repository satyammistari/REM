from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


def _ensure_aware(dt: datetime) -> datetime:
    """Ensure datetimes are timezone-aware (UTC)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class BaseModelTZ(BaseModel):
    """Base model that normalises datetimes to timezone-aware UTC."""

    model_config = ConfigDict(populate_by_name=True)

    def model_post_init(self, __context) -> None:  # type: ignore[override]
        for field_name, field in self.model_fields.items():  # type: ignore[attr-defined]
            value = getattr(self, field_name)
            if isinstance(value, datetime):
                setattr(self, field_name, _ensure_aware(value))
        super().model_post_init(__context)  # type: ignore[misc]


class WriteResult(BaseModelTZ):
    episode_id: str
    agent_id: str
    created_at: datetime
    status: str  # "stored"


class EpisodeResult(BaseModelTZ):
    episode_id: str
    agent_id: str
    raw_content: str
    intent: str
    domain: str
    outcome: str
    importance_score: float
    retrieval_count: int
    consolidated: bool
    created_at: datetime
    score: float  # retrieval relevance score
    retrieval_source: str  # "qdrant" | "graph" | "semantic" | "episodes"


class SemanticMemory(BaseModelTZ):
    semantic_id: str
    agent_id: str
    fact: str
    confidence: float
    evidence_count: int
    domain: str
    fact_type: str  # "preference" | "rule" | "pattern" | "skill" | "fact"
    created_at: datetime
    score: Optional[float] = None  # if retrieved, has relevance score


class RetrieveResult(BaseModelTZ):
    episodes: List[EpisodeResult]
    semantic_memories: List[SemanticMemory]
    injection_prompt: str
    latency_ms: int

    def to_prompt(self) -> str:
        """Alias for injection_prompt — most common usage."""
        return self.injection_prompt


class Agent(BaseModelTZ):
    agent_id: str
    name: str
    description: str
    total_episodes: int
    total_semantic_memories: int
    last_active_at: Optional[datetime]
    created_at: datetime


class CreateAgentRequest(BaseModelTZ):
    name: str
    description: str = ""


