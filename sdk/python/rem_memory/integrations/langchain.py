from __future__ import annotations

from typing import Any, Dict, List

from langchain.memory import BaseChatMemory

from ..client import REMClient


class REMMemory(BaseChatMemory):
    """Drop-in LangChain memory that uses REM for persistent episodic storage."""

    rem_client: REMClient
    agent_id: str
    user_id: str
    memory_key: str = "chat_history"
    return_messages: bool = True

    class Config:
        arbitrary_types_allowed = True

    @property
    def memory_variables(self) -> List[str]:
        # We expose both the standard memory key and a separate relevant_memories field.
        return [self.memory_key, "relevant_memories"]

    def load_memory_variables(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Called before each LLM invoke — retrieves relevant memories."""
        query = inputs.get("input") or inputs.get("question") or ""
        if not query:
            return {self.memory_key: [], "relevant_memories": ""}

        result = self.rem_client.retrieve_sync(
            query=query,
            agent_id=self.agent_id,
            top_k=5,
            include_semantic=True,
        )
        return {
            self.memory_key: [],  # REM handles long-term context; we don't inject chat history here.
            "relevant_memories": result.injection_prompt,
        }

    def save_context(self, inputs: Dict[str, Any], outputs: Dict[str, Any]) -> None:
        """Called after each LLM response — writes episode to REM."""
        content = f"Input: {inputs.get('input', '')}\nOutput: {outputs.get('output', '')}"
        self.rem_client.write_sync(
            content=content,
            agent_id=self.agent_id,
            user_id=self.user_id,
            outcome="success",
        )

    def clear(self) -> None:
        """
        Clearing is intentionally a no-op — REM is designed as a persistent memory layer.
        """
        return

