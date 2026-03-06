from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class WriteResult(BaseModel):
    episode_id: str
    agent_id: str
    created_at: datetime
    status: str


class Episode(BaseModel):
    episode_id: str
    agent_id: str
    user_id: str
    session_id: str
    raw_content: str
    parsed_entities: List[str]
    intent: str
    outcome: str
    domain: str
    emotion_signal: str
    importance_score: float
    retrieval_count: int
    consolidated: bool
    created_at: datetime
    updated_at: datetime


class SemanticMemory(BaseModel):
    semantic_id: str
    fact: str
    confidence: float
    fact_type: str
    domain: str
    evidence_count: int


class RetrieveResult(BaseModel):
    episodes: list[dict]
    semantic_memories: List[SemanticMemory]
    injection_prompt: str
    latency_ms: int


class Agent(BaseModel):
    agent_id: str
    name: str
    description: str
    total_episodes: int
    total_semantic_memories: int
    last_active_at: Optional[datetime]
    created_at: datetime

