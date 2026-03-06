"""
LLM service: thin wrapper around OpenAI chat and completion calls
used by the consolidation engine and other Python-side components.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

import structlog
from openai import AsyncOpenAI

logger = structlog.get_logger("rem.python_worker.llm_service")


class LLMService:
    """Centralized access to OpenAI models for the Python worker."""

    def __init__(self, openai_client: AsyncOpenAI, default_model: str = "gpt-4o") -> None:
        self.client = openai_client
        self.default_model = default_model

    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048,
        json_mode: bool = False,
    ) -> str:
        """
        Send a chat completion request and return the assistant message string.
        """
        chosen_model = model or self.default_model
        kwargs: Dict[str, Any] = {
            "model": chosen_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        try:
            resp = await self.client.chat.completions.create(**kwargs)
            content = resp.choices[0].message.content or ""
            logger.debug(
                "llm_chat_ok",
                model=chosen_model,
                prompt_tokens=resp.usage.prompt_tokens if resp.usage else 0,
                completion_tokens=resp.usage.completion_tokens if resp.usage else 0,
            )
            return content
        except Exception as exc:  # noqa: BLE001
            logger.error("llm_chat_failed", model=chosen_model, error=str(exc))
            raise

    async def chat_json(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Send a chat completion in JSON mode and return the parsed dict.
        """
        raw = await self.chat(messages, model=model, temperature=temperature, json_mode=True)
        try:
            return json.loads(raw)
        except json.JSONDecodeError as exc:
            logger.error("llm_json_parse_failed", raw=raw[:200], error=str(exc))
            raise ValueError(f"LLM did not return valid JSON: {exc}") from exc

    async def summarise(self, text: str, max_words: int = 80, model: Optional[str] = None) -> str:
        """
        Summarise `text` in at most `max_words` words.
        """
        messages = [
            {
                "role": "system",
                "content": (
                    "You are a precise summariser. Respond with a single concise paragraph. "
                    f"Use at most {max_words} words. No bullet points, no headers."
                ),
            },
            {"role": "user", "content": f"Summarise the following:\n\n{text}"},
        ]
        return await self.chat(messages, model=model, temperature=0.1)
