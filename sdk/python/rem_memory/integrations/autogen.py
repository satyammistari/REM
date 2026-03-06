"""
AutoGen integration for REM (Recursive Episodic Memory).

This module provides a drop-in memory store that injects relevant context
from REM into AutoGen agent conversations and persists interactions back
to episodic memory automatically.

Usage::

    from rem_memory.integrations.autogen import REMMemoryStore

    store = REMMemoryStore(api_key="rem_sk_...", agent_id="agent_autogen_001")

    # Retrieve relevant context string for injection into system_message
    context = await store.get_context("user's TypeScript preferences")

    # After a conversation turn, persist it
    await store.save_turn(user_input="...", assistant_output="...")
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional

from ..client import REMClient
from ..types import RetrieveResult

logger = logging.getLogger(__name__)


class REMMemoryStore:
    """
    Async memory store for AutoGen agents backed by REM.

    Parameters
    ----------
    api_key:
        REM API key (``X-API-Key`` header).
    agent_id:
        Identifier for the AutoGen agent.
    user_id:
        Optional user identifier scoped to this conversation.
    base_url:
        Base URL for the REM Go API (default ``http://localhost:8080``).
    top_k:
        How many episodes/facts to retrieve for context injection.
    include_semantic:
        Whether to include consolidated semantic facts in retrieval.
    inject_format:
        ``"prose"`` (paragraph) or ``"bullets"`` (markdown list).
    """

    def __init__(
        self,
        api_key: str,
        agent_id: str,
        user_id: str = "user_default",
        base_url: str = "http://localhost:8080",
        top_k: int = 5,
        include_semantic: bool = True,
        inject_format: str = "prose",
    ) -> None:
        self.agent_id = agent_id
        self.user_id = user_id
        self.top_k = top_k
        self.include_semantic = include_semantic
        self.inject_format = inject_format
        self._client = REMClient(api_key=api_key, base_url=base_url)

    # ── Context retrieval ────────────────────────────────────────────────────

    async def get_context(self, query: str) -> str:
        """
        Retrieve relevant memories and return them as a formatted string
        suitable for injection into an AutoGen agent's system message or
        the first turn of a conversation.

        Parameters
        ----------
        query:
            The user input or topic to retrieve relevant memories for.

        Returns
        -------
        str
            Formatted context string, or empty string if no memories found.
        """
        async with self._client:
            result: RetrieveResult = await self._client.retrieve(
                query=query,
                agent_id=self.agent_id,
                top_k=self.top_k,
                include_semantic=self.include_semantic,
            )

        if not result.episodes and not result.semantic_memories:
            return ""

        if hasattr(result, "injection_prompt") and result.injection_prompt:
            return result.injection_prompt

        return self._format_context(result)

    def get_context_sync(self, query: str) -> str:
        """Synchronous wrapper around :meth:`get_context`."""
        return asyncio.get_event_loop().run_until_complete(self.get_context(query))

    # ── Saving turns ─────────────────────────────────────────────────────────

    async def save_turn(
        self,
        user_input: str,
        assistant_output: str,
        session_id: Optional[str] = None,
        outcome: str = "success",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Persist a conversation turn to REM episodic memory.

        Parameters
        ----------
        user_input:
            The user message for this turn.
        assistant_output:
            The agent's response for this turn.
        session_id:
            Optional session identifier for grouping turns.
        outcome:
            Conversation outcome signal: ``"success"``, ``"partial"``, or ``"failure"``.
        metadata:
            Additional key/value pairs to attach to the episode.
        """
        content = f"User: {user_input}\nAssistant: {assistant_output}"
        async with self._client:
            await self._client.write(
                content=content,
                agent_id=self.agent_id,
                user_id=self.user_id,
                session_id=session_id,
                outcome=outcome,
                metadata=metadata or {},
            )

    def save_turn_sync(self, user_input: str, assistant_output: str, **kwargs: Any) -> None:
        """Synchronous wrapper around :meth:`save_turn`."""
        asyncio.get_event_loop().run_until_complete(
            self.save_turn(user_input, assistant_output, **kwargs)
        )

    # ── AutoGen hook helpers ─────────────────────────────────────────────────

    def build_system_prefix(self, query: str) -> str:
        """
        Return a system message prefix string that injects relevant memories.

        Suitable for prepending to an AutoGen agent's ``system_message``:

        .. code-block:: python

            prefix = store.build_system_prefix("code style preferences")
            agent = ConversableAgent(
                name="assistant",
                system_message=prefix + "\\n\\nYou are a helpful coding assistant.",
            )
        """
        context = self.get_context_sync(query)
        if not context:
            return ""
        return f"## Relevant memory context\\n\\n{context}\\n\\n---\\n\\n"

    # ── Formatting helpers ───────────────────────────────────────────────────

    def _format_context(self, result: RetrieveResult) -> str:
        parts: List[str] = []

        if result.semantic_memories:
            if self.inject_format == "bullets":
                parts.append("**Known facts about this user/agent:**")
                for sm in result.semantic_memories:
                    parts.append(f"- {sm.fact} (confidence: {sm.confidence:.0%})")
            else:
                facts = "; ".join(sm.fact for sm in result.semantic_memories)
                parts.append(f"Known facts: {facts}.")

        if result.episodes:
            if self.inject_format == "bullets":
                parts.append("**Recent relevant episodes:**")
                for ep in result.episodes[:3]:
                    parts.append(f"- {ep.intent} [{ep.outcome}]")
            else:
                recent = "; ".join(ep.intent for ep in result.episodes[:3])
                parts.append(f"Recent interactions: {recent}.")

        return "\n".join(parts)
