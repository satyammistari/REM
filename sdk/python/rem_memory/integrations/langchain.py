from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, PrivateAttr

try:
    from langchain.memory import BaseChatMemory
except ImportError as exc:  # pragma: no cover - import-time guard
    raise ImportError(
        "langchain package required. Install with: pip install rem-memory[langchain]",
    ) from exc

from ..client import REMClient


class REMMemory(BaseChatMemory, BaseModel):
    """
    Drop-in LangChain memory backed by REM.

    Usage:
        from rem_memory.integrations.langchain import REMMemory

        memory = REMMemory(
            api_key="rem_sk_...",
            agent_id="my-agent",
        )
        chain = ConversationChain(llm=ChatOpenAI(), memory=memory)
    """

    api_key: str
    agent_id: str
    user_id: str = "default"
    memory_key: str = "relevant_memories"
    return_messages: bool = False

    _client: Optional[REMClient] = PrivateAttr(default=None)

    model_config = ConfigDict(arbitrary_types_allowed=True)

    def model_post_init(self, __context: Any) -> None:  # type: ignore[override]
        base_url = os.getenv("REM_BASE_URL", "https://api.rem.ai")
        self._client = REMClient(api_key=self.api_key, base_url=base_url)
        super().model_post_init(__context)  # type: ignore[misc]

    @property
    def memory_variables(self) -> List[str]:
        return [self.memory_key]

    def load_memory_variables(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Called before LLM invoke — fetches relevant memories."""
        query = (
            inputs.get("input")
            or inputs.get("question")
            or inputs.get("human_input")
            or ""
        )

        if not query or self._client is None:
            return {self.memory_key: ""}

        result = self._client.retrieve_sync(
            query=query,
            agent_id=self.agent_id,
            top_k=5,
            include_semantic=True,
        )

        return {self.memory_key: result.injection_prompt}

    def save_context(self, inputs: Dict[str, Any], outputs: Dict[str, Any]) -> None:
        """Called after LLM response — writes episode to REM."""
        if self._client is None:
            return

        human_input = (
            inputs.get("input")
            or inputs.get("question")
            or inputs.get("human_input")
            or ""
        )
        ai_output = (
            outputs.get("response")
            or outputs.get("output")
            or outputs.get("text")
            or ""
        )

        if not human_input:
            return

        content = f"Human: {human_input}\nAssistant: {ai_output}"

        self._client.write_sync(
            content=content,
            agent_id=self.agent_id,
            user_id=self.user_id,
            outcome="success",
        )

    def clear(self) -> None:
        """REM memories persist. This is intentional."""
        return

