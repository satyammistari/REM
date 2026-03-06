from __future__ import annotations

import asyncio
from typing import Any, Dict, List

from rem_memory import REMClient


BASE_URL = "http://localhost:8000"
DEMO_EMAIL = "demo@rem.ai"


async def main() -> None:
  """
  Seed REM with a realistic demo:
  - demo user + API key
  - 3 demo agents
  - episodes for each agent
  - trigger consolidation for each agent
  """

  import httpx

  async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
    # 1) Register demo user
    resp = await client.post("/api/v1/auth/register", json={"email": DEMO_EMAIL})
    resp.raise_for_status()
    user = resp.json()
    user_id = user["user_id"]

    # 2) Create API key
    resp = await client.post("/api/v1/auth/apikey", json={"user_id": user_id, "name": "Demo Key"})
    resp.raise_for_status()
    key_data = resp.json()
    api_key = key_data["api_key"]

  # 3) Create SDK client with that key
  client = REMClient(api_key=api_key, base_url=BASE_URL)

  # 4) Create agents
  cursor_agent = await client.create_agent(name="Cursor Coding Assistant", description="Helps with TypeScript and React in Cursor.")
  research_agent = await client.create_agent(name="Research Agent", description="Summarises and compares research papers.")
  email_agent = await client.create_agent(name="Email Writing Assistant", description="Drafts and refines emails with user preferences.")

  # 5) Seed episodes
  await seed_cursor_agent(client, cursor_agent.agent_id, user_id)
  await seed_research_agent(client, research_agent.agent_id, user_id)
  await seed_email_agent(client, email_agent.agent_id, user_id)

  # 6) Trigger consolidation via Python worker for each agent
  async with httpx.AsyncClient(base_url="http://localhost:8001", timeout=60.0) as py:
    for agent_id in (cursor_agent.agent_id, research_agent.agent_id, email_agent.agent_id):
      # fetch episodes from Go API as raw dicts
      async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as go:
        resp = await go.get("/api/v1/episodes", params={"agent_id": agent_id, "limit": 50})
        resp.raise_for_status()
        data = resp.json()
        episodes = data.get("episodes", [])
      if len(episodes) < 3:
        continue
      r = await py.post("/consolidate", json={"episodes": episodes, "agent_id": agent_id})
      r.raise_for_status()

  print("Demo data seeded successfully.")


async def seed_cursor_agent(client: REMClient, agent_id: str, user_id: str) -> None:
  episodes: List[str] = [
    "User asked to implement binary search. I provided iterative version. User requested recursive version instead. Delivered and approved.",
    "User asked to fix a React hydration error. Issue was caused by Date() rendering differently on server vs client. Used suppressHydrationWarning to resolve.",
    "User asked to refactor Python code to use type hints. Completed. User approved and then asked to also add docstrings and improve naming.",
    "User requested a TypeScript API client using fetch with strict null checks enabled. I used TypeScript strict mode and returned typed responses.",
    "User prefers functional React components with hooks instead of class components. Updated legacy code to hooks and context, user happy.",
    "User asked to migrate from JavaScript to TypeScript. I created a tsconfig with strict mode and incremental compilation.",
    "User prefers async/await over promise chains for all new code. I refactored existing promise-based logic to async/await.",
    "User asked to implement debounced search in a React app using useEffect and useRef. Implemented with lodash.debounce and cleanup.",
    "User asked to optimize a slow list rendering. I introduced React windowing with react-window and memoized row components.",
    "User prefers pushing heavy computations to the server and keeping front-end components lean and declarative.",
    "User asked to add logging middleware to an Express API. I added a structured logger and correlation IDs.",
    "User prefers using Zod for runtime validation of incoming requests in Next.js route handlers.",
    "User requested a reusable Card component with dark theme and hover states using Tailwind CSS.",
    "User asked to move from REST to tRPC for type-safe APIs between Next.js and a Node backend.",
    "User prefers Postgres over MongoDB for new backends, especially for relational data modelling.",
    "User requested integration tests for a FastAPI app using httpx and pytest-asyncio.",
    "User prefers to keep business logic out of React components and in separate service modules.",
    "User asked to refactor a large React component into smaller composable primitives.",
    "User prefers to avoid implicit any in TypeScript and wants all functions typed.",
    "User requested a reusable error boundary component for catching React render errors.",
    "User asked to add retry logic with exponential backoff around a flaky external API call.",
    "User prefers to use pnpm instead of npm for new JavaScript/TypeScript projects.",
    "User requested custom hooks for data fetching that wrap React Query.",
    "User asked to ensure all new Next.js routes use the App Router and server components where possible.",
    "User prefers strict ESLint rules and Prettier formatting on save for all projects."
  ]

  for text in episodes:
    await client.write(
      content=text,
      agent_id=agent_id,
      user_id=user_id,
      outcome="success",
    )


async def seed_research_agent(client: REMClient, agent_id: str, user_id: str) -> None:
  episodes = [
    "User asked for a literature review on retrieval-augmented generation. I summarised 5 recent arxiv papers and compared evaluation methods.",
    "User requested a comparison of vector databases for production: Qdrant, Pinecone, Weaviate. I highlighted tradeoffs and pricing.",
    "User asked to fact-check claims about LLM copyright risk. I cross-checked with legal blog posts and official statements.",
    "User requested a summary of papers on tool-using agents and program synthesis.",
    "User asked to track conflicting numbers in two reports about user growth. I highlighted discrepancies and flagged for follow-up.",
    "User requested research on long-term memory architectures for agents including LTM, RAG, and world models.",
    "User asked for a deep dive on failure modes of chain-of-thought prompting.",
    "User requested a summary of best practices for evaluation of agentic systems.",
    "User asked to identify contradictions between two climate reports.",
    "User requested pros/cons of open-source vs closed-source LLMs for their use case.",
    "User asked to cluster a set of research papers into topics and summarize each cluster.",
    "User requested a structured table comparing context window limits of major LLM providers.",
    "User asked to contrast three different memory architectures and their tradeoffs.",
    "User requested a long-term tracking doc for important findings related to RLHF.",
    "User asked to reconcile contradictory statistics from two sources about global GDP growth."
  ]

  for text in episodes:
    await client.write(
      content=text,
      agent_id=agent_id,
      user_id=user_id,
      outcome="success",
    )


async def seed_email_agent(client: REMClient, agent_id: str, user_id: str) -> None:
  episodes = [
    "User asked me to draft a follow-up email after a sales call. They explicitly requested bullet points and a concise summary at the top.",
    "User prefers a formal tone for B2B emails and avoids emojis entirely.",
    "User asked me to always include a clear call-to-action in the final paragraph of outbound emails.",
    "User prefers short subject lines under 50 characters that highlight value, not features.",
    "User asked for a weekly status email template with a three-part structure: highlights, risks, and next steps.",
    "User prefers British English spelling in emails for UK clients.",
    'User asked me to avoid phrases like \"just checking in\" and instead be direct about the purpose of the email.',
    "User prefers that I always include a brief TL;DR at the top of longer emails.",
    "User asked for a default polite but firm tone when declining meeting requests.",
    "User prefers numbered lists over long paragraphs for internal status updates.",
    "User requested that all customer support replies start by acknowledging the issue explicitly.",
    "User prefers to end emails with \"Best regards\" instead of \"Cheers\" or \"Thanks\".",
    "User asked that I never promise specific delivery dates unless explicitly confirmed.",
    "User prefers that I include links rather than file attachments where possible.",
    "User asked for a consistent signature block including role, company, and Calendly link.",
    "User prefers that follow-up emails reference the original subject and date for context."
  ]

  for text in episodes:
    await client.write(
      content=text,
      agent_id=agent_id,
      user_id=user_id,
      outcome="success",
    )


if __name__ == "__main__":
  asyncio.run(main())

