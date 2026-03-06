import json
from typing import Any, Dict

import structlog
from openai import AsyncOpenAI


logger = structlog.get_logger("rem.python_worker.parse_service")


class ParseService:
    def __init__(self, openai_client: AsyncOpenAI) -> None:
        self.client = openai_client
        self.model = "gpt-4o-mini"

    async def parse(self, content: str) -> Dict[str, Any]:
        """
        Extract structured data from raw episode content.
        """
        system_prompt = (
            "You are an AI memory parser. Extract structured information from "
            "agent episode descriptions. Be concise and accurate. "
            "Always return valid JSON only, no markdown, no explanation."
        )

        user_prompt = f"""Parse this agent episode and extract:
1. intent: What was the agent trying to accomplish? (one sentence, max 100 chars)
2. entities: Key entities mentioned (list of strings, max 10 items)
3. domain: Primary domain. Choose ONE from:
   coding, writing, research, planning, analysis, communication, general
4. emotion_signal: Agent/user sentiment. Choose ONE from:
   productive, frustrated, confused, satisfied, urgent, neutral
5. importance_score: How important is this to remember? Float 0.0-1.0.
   High (0.8+): novel information, errors made, user preferences stated explicitly
   Medium (0.5-0.7): task completion, standard operations
   Low (0.2-0.4): routine queries, repeated patterns

Episode: {content}

Return JSON: {{"intent":"...","entities":[...],"domain":"...","emotion_signal":"...","importance_score":0.0}}"""

        try:
            resp = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.0,
            )
            raw = resp.choices[0].message.content or "{}"
            data = json.loads(raw)
        except Exception as exc:  # noqa: BLE001
            logger.exception("parse_llm_failed", error=str(exc))
            return {
                "intent": "general task",
                "entities": [],
                "domain": "general",
                "emotion_signal": "neutral",
                "importance_score": 0.5,
            }

        intent = data.get("intent") or "general task"
        entities = data.get("entities") or []
        domain = data.get("domain") or "general"
        emotion = data.get("emotion_signal") or "neutral"
        importance = data.get("importance_score") or 0.5

        try:
            importance_val = float(importance)
        except (TypeError, ValueError):
            importance_val = 0.5

        result = {
            "intent": intent,
            "entities": entities,
            "domain": domain,
            "emotion_signal": emotion,
            "importance_score": importance_val,
        }
        return result

