from __future__ import annotations

import json
from collections import defaultdict
from typing import Any, Dict, List

import structlog
from openai import AsyncOpenAI


logger = structlog.get_logger("rem.python_worker.consolidation_engine")


class ConsolidationEngine:
    def __init__(self, openai_client: AsyncOpenAI) -> None:
        self.client = openai_client
        self.model = "gpt-4o"
        self.min_episodes = 3
        self.max_cluster_size = 15

    async def consolidate(self, episodes: List[Dict[str, Any]], agent_id: str) -> List[Dict[str, Any]]:
        """
        Takes raw episodes, returns semantic memories.
        """
        if len(episodes) < self.min_episodes:
            return []

        # Step 1: cluster by domain
        by_domain: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for ep in episodes:
            dom = (ep.get("domain") or "general").lower()
            by_domain[dom].append(ep)

        candidates: list[list[dict[str, Any]]] = []

        # Step 2: within each domain, simple intent keyword clustering
        for dom, eps in by_domain.items():
            if len(eps) < self.min_episodes:
                continue

            # tokenized intents
            tokenized: list[tuple[dict[str, Any], set[str]]] = []
            for ep in eps:
                intent = (ep.get("intent") or "").lower()
                tokens = {t for t in intent.replace(",", " ").split() if t}
                tokenized.append((ep, tokens))

            used = set()
            for i, (ep_i, tokens_i) in enumerate(tokenized):
                if i in used:
                    continue
                cluster = [ep_i]
                used.add(i)
                for j, (ep_j, tokens_j) in enumerate(tokenized):
                    if j in used or j == i:
                        continue
                    if not tokens_i or not tokens_j:
                        continue
                    overlap = tokens_i.intersection(tokens_j)
                    if len(overlap) >= 2:
                        cluster.append(ep_j)
                        used.add(j)
                if len(cluster) >= self.min_episodes:
                    candidates.append(cluster)

        # Step 3: compress clusters
        all_memories: list[dict[str, Any]] = []
        for cluster in candidates:
            mems = await self._compress_cluster(cluster, agent_id)
            all_memories.extend(mems)

        return all_memories

    async def _compress_cluster(self, episodes: List[Dict[str, Any]], agent_id: str) -> List[Dict[str, Any]]:
        """
        Convert a cluster of episodes into semantic memories.
        """
        limited_eps = episodes[: self.max_cluster_size]
        episodes_text = "\n\n".join(
            [
                f"Episode {i+1} ({ep.get('domain','?')}, {ep.get('outcome','?')}):\n"
                f"Intent: {ep.get('intent','?')}\n"
                f"Content: {str(ep.get('raw_content','?'))[:500]}"
                for i, ep in enumerate(limited_eps)
            ]
        )

        prompt = f"""You are analyzing {len(episodes)} memory episodes 
from an AI agent. Extract durable, reusable facts that should be remembered 
long-term.

Episodes:
{episodes_text}

Extract 1-5 semantic memories. For each:
- fact: A clear, specific, actionable statement (max 200 chars)
- confidence: 0.0-1.0 (how certain is this pattern)
- fact_type: preference/rule/pattern/skill/fact
- domain: the domain this applies to

Focus on: user preferences explicitly stated, recurring patterns, 
errors to avoid, skills demonstrated, rules that apply repeatedly.
Skip: one-time events, transient states, obvious facts.

Return JSON array: [{{"fact":"...","confidence":0.8,"fact_type":"preference","domain":"coding"}}]
Return empty array [] if no durable facts found.
JSON only, no explanation."""

        try:
            resp = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.3,
            )
            raw = resp.choices[0].message.content or "{}"
            data = json.loads(raw)
            mems = data if isinstance(data, list) else data.get("semantic_memories") or []
        except Exception as exc:  # noqa: BLE001
            logger.exception("consolidation_llm_failed", error=str(exc))
            return []

        semantic_memories: list[dict[str, Any]] = []
        source_ids = [str(ep.get("episode_id") or "") for ep in episodes]

        for item in mems:
            fact = item.get("fact")
            if not fact:
                continue
            confidence = float(item.get("confidence", 0.7))
            fact_type = item.get("fact_type", "pattern")
            domain_name = item.get("domain", "general")

            semantic_memories.append(
                {
                    "agent_id": agent_id,
                    "fact": fact,
                    "confidence": confidence,
                    "fact_type": fact_type,
                    "domain": domain_name,
                    "evidence_count": len(source_ids),
                    "source_episode_ids": source_ids,
                }
            )

        return semantic_memories

