"""
Compressor: takes a cluster of episodes and uses an LLM to distil them
into one or more durable semantic memory facts.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

import structlog
from openai import AsyncOpenAI

logger = structlog.get_logger("rem.python_worker.compressor")

_SYSTEM_PROMPT = (
    "You are a memory consolidation engine for an AI agent. "
    "Your job is to distil a cluster of related episode memories into "
    "concise, durable semantic facts. "
    "Each fact must be self-contained and useful for future retrieval. "
    "Return ONLY a JSON array of fact objects, no markdown, no explanation."
)

_USER_TEMPLATE = """Here are {n} related episodes for agent '{agent_id}':

{episodes_json}

Produce 1-3 concise semantic memory facts that capture the key knowledge.
Each fact object must have these exact keys:
  - "content": string — the semantic fact (max 300 chars)
  - "fact_type": one of ["preference","pattern","error","skill","context","relationship"]
  - "importance_score": float 0.0-1.0
  - "outcome": one of ["success","failure","partial","unknown"]
  - "confidence_score": float 0.0-1.0

Return JSON array: [{{"content":"...","fact_type":"...","importance_score":0.0,"outcome":"...","confidence_score":0.0}}, ...]"""


class Compressor:
    """
    Compresses a cluster of episodes into semantic memories via LLM.
    """

    def __init__(self, openai_client: AsyncOpenAI, model: str = "gpt-4o") -> None:
        self.client = openai_client
        self.model = model

    async def compress(
        self,
        cluster: List[Dict[str, Any]],
        agent_id: str,
    ) -> List[Dict[str, Any]]:
        """
        Compress a cluster of episode dicts into semantic memory dicts.
        Returns a list of raw semantic memory dicts (without IDs — caller assigns).
        """
        if not cluster:
            return []

        # Trim each episode to the fields relevant for compression.
        slim = [
            {
                "intent": ep.get("intent", ""),
                "domain": ep.get("domain", "general"),
                "outcome": ep.get("outcome", "unknown"),
                "importance_score": ep.get("importance_score", 0.5),
                "content_preview": (ep.get("raw_content") or "")[:300],
            }
            for ep in cluster
        ]

        user_msg = _USER_TEMPLATE.format(
            n=len(slim),
            agent_id=agent_id,
            episodes_json=json.dumps(slim, indent=2),
        )

        try:
            resp = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("compress_llm_failed", agent_id=agent_id, error=str(exc))
            raise

        raw = resp.choices[0].message.content or "[]"
        facts = self._parse_response(raw)

        logger.info(
            "compress_ok",
            agent_id=agent_id,
            input_episodes=len(cluster),
            output_facts=len(facts),
        )
        return facts

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _parse_response(self, raw: str) -> List[Dict[str, Any]]:
        """Parse the LLM JSON response into a list of fact dicts."""
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            logger.error("compress_json_parse_failed", raw=raw[:200], error=str(exc))
            return []

        # The model may return {"facts": [...]} or just [...]
        if isinstance(parsed, dict):
            for key in ("facts", "memories", "results", "items"):
                if key in parsed and isinstance(parsed[key], list):
                    parsed = parsed[key]
                    break
            else:
                return []

        if not isinstance(parsed, list):
            return []

        validated: List[Dict[str, Any]] = []
        for item in parsed:
            if not isinstance(item, dict):
                continue
            content = str(item.get("content", "")).strip()
            if not content:
                continue
            validated.append(
                {
                    "content": content[:300],
                    "fact_type": self._safe_fact_type(item.get("fact_type")),
                    "importance_score": self._clamp(item.get("importance_score", 0.5)),
                    "outcome": self._safe_outcome(item.get("outcome")),
                    "confidence_score": self._clamp(item.get("confidence_score", 0.7)),
                }
            )

        return validated

    @staticmethod
    def _safe_fact_type(value: Optional[Any]) -> str:
        allowed = {"preference", "pattern", "error", "skill", "context", "relationship"}
        return value if value in allowed else "context"

    @staticmethod
    def _safe_outcome(value: Optional[Any]) -> str:
        allowed = {"success", "failure", "partial", "unknown"}
        return value if value in allowed else "unknown"

    @staticmethod
    def _clamp(value: Any) -> float:
        try:
            return max(0.0, min(1.0, float(value)))
        except (TypeError, ValueError):
            return 0.5
