import type {
  Agent,
  DashboardMetrics,
  Episode,
  GraphData,
  RetrieveResult,
  SemanticMemory,
} from "./types";

export const DEMO_AGENT: Agent = {
  agent_id: "agent_demo_cursor",
  name: "Cursor Coding Assistant",
  description: "Helps a TypeScript developer who prefers functional programming.",
  total_episodes: 247,
  total_semantic_memories: 23,
  last_active_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

export const DEMO_EPISODES: Episode[] = Array.from({ length: 30 }).map((_, i) => {
  const domainCycle: Episode["domain"][] = ["coding", "coding", "coding", "planning", "general"];
  const outcomeCycle: Episode["outcome"][] = ["success", "success", "partial", "failure", "success"];
  const domain = domainCycle[i % domainCycle.length];
  const outcome = outcomeCycle[i % outcomeCycle.length];

  const baseContent =
    i % 3 === 0
      ? "User prefers TypeScript with strict mode enabled for all new projects. I refactored JS utilities into typed functional modules."
      : i % 3 === 1
        ? "User asked to replace promise chains with async/await in an existing codepath. I removed nested .then and used top-level await."
        : "User prefers functional React components using hooks, and wants to avoid class components or heavy mutable state.";

  return {
    episode_id: `ep_demo_${i}`,
    agent_id: DEMO_AGENT.agent_id,
    user_id: "user_demo",
    session_id: "",
    raw_content: baseContent,
    parsed_entities: ["TypeScript", "React", "async/await", "functional"],
    intent:
      i % 2 === 0
        ? "Refactor codebase to match the user's TypeScript and functional preferences."
        : "Apply user's preferences to new feature work.",
    outcome,
    domain,
    emotion_signal: i % 5 === 0 ? "satisfied" : "productive",
    importance_score: 0.5 + (i % 5) * 0.1,
    retrieval_count: i % 7,
    consolidated: i % 4 !== 0,
    created_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - i * 30 * 60 * 1000).toISOString(),
  };
});

export const DEMO_SEMANTIC_MEMORIES: SemanticMemory[] = [
  {
    semantic_id: "sm_demo_ts_pref",
    agent_id: DEMO_AGENT.agent_id,
    fact: "User strongly prefers TypeScript with strict mode for all new projects.",
    confidence: 0.87,
    evidence_count: 14,
    source_episode_ids: DEMO_EPISODES.slice(0, 14).map((e) => e.episode_id),
    domain: "coding",
    fact_type: "preference",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    semantic_id: "sm_demo_fn_prog",
    agent_id: DEMO_AGENT.agent_id,
    fact: "User prefers functional programming patterns over OOP in TypeScript.",
    confidence: 0.8,
    evidence_count: 10,
    source_episode_ids: DEMO_EPISODES.slice(5, 20).map((e) => e.episode_id),
    domain: "coding",
    fact_type: "pattern",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    semantic_id: "sm_demo_async",
    agent_id: DEMO_AGENT.agent_id,
    fact: "User always prefers async/await rather than promise chains.",
    confidence: 0.82,
    evidence_count: 11,
    source_episode_ids: DEMO_EPISODES.slice(10, 25).map((e) => e.episode_id),
    domain: "coding",
    fact_type: "preference",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    semantic_id: "sm_demo_react",
    agent_id: DEMO_AGENT.agent_id,
    fact: "User prefers React function components with hooks, avoiding classes and heavy mutable state.",
    confidence: 0.76,
    evidence_count: 9,
    source_episode_ids: DEMO_EPISODES.slice(8, 22).map((e) => e.episode_id),
    domain: "coding",
    fact_type: "preference",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    semantic_id: "sm_demo_errors",
    agent_id: DEMO_AGENT.agent_id,
    fact: "User wants recurring errors documented as learning episodes and avoided in future changes.",
    confidence: 0.71,
    evidence_count: 7,
    source_episode_ids: DEMO_EPISODES.slice(3, 12).map((e) => e.episode_id),
    domain: "coding",
    fact_type: "rule",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    semantic_id: "sm_demo_perf",
    agent_id: DEMO_AGENT.agent_id,
    fact: "User prefers to optimise developer experience before micro-optimising performance.",
    confidence: 0.68,
    evidence_count: 6,
    source_episode_ids: DEMO_EPISODES.slice(15, 30).map((e) => e.episode_id),
    domain: "planning",
    fact_type: "pattern",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    semantic_id: "sm_demo_tests",
    agent_id: DEMO_AGENT.agent_id,
    fact: "User prefers writing high-level integration tests over unit tests for trivial functions.",
    confidence: 0.64,
    evidence_count: 5,
    source_episode_ids: DEMO_EPISODES.slice(12, 24).map((e) => e.episode_id),
    domain: "coding",
    fact_type: "preference",
    active: true,
    created_at: new Date().toISOString(),
  },
  {
    semantic_id: "sm_demo_docs",
    agent_id: DEMO_AGENT.agent_id,
    fact: "User wants concise, example-driven documentation for all new utilities.",
    confidence: 0.7,
    evidence_count: 6,
    source_episode_ids: DEMO_EPISODES.slice(18, 30).map((e) => e.episode_id),
    domain: "writing",
    fact_type: "rule",
    active: true,
    created_at: new Date().toISOString(),
  },
];

export const DEMO_GRAPH_DATA: GraphData = (() => {
  const nodes = DEMO_EPISODES.map((ep) => ({
    id: ep.episode_id,
    type: "episode" as const,
    label: ep.intent || ep.raw_content.slice(0, 40),
    domain: ep.domain,
    consolidated: ep.consolidated,
    importance: ep.importance_score,
  }));

  const semanticNodes = DEMO_SEMANTIC_MEMORIES.map((sm) => ({
    id: sm.semantic_id,
    type: "semantic" as const,
    label: sm.fact.slice(0, 40),
    domain: sm.domain,
    consolidated: true,
    importance: sm.confidence,
  }));

  const temporalEdges = DEMO_EPISODES.slice(0, 29).map((ep, idx) => ({
    from: ep.episode_id,
    to: DEMO_EPISODES[idx + 1].episode_id,
    type: "followed_by" as const,
  }));

  const compressedEdges = DEMO_SEMANTIC_MEMORIES.flatMap((sm) =>
    sm.source_episode_ids.slice(0, 6).map((eid) => ({
      from: eid,
      to: sm.semantic_id,
      type: "compressed_into" as const,
    })),
  );

  return {
    nodes: [...nodes, ...semanticNodes],
    edges: [...temporalEdges, ...compressedEdges],
  };
})();

export const DEMO_METRICS: DashboardMetrics = {
  total_episodes: 247,
  total_semantic_memories: 23,
  total_agents: 3,
  avg_retrieval_latency_ms: 34,
  consolidation_queue_size: 5,
  episodes_by_domain: {
    coding: 118,
    writing: 69,
    research: 44,
    planning: 10,
    general: 6,
  },
  episodes_by_outcome: {
    success: 172,
    failure: 25,
    partial: 35,
    unknown: 15,
  },
};

export const DEMO_RETRIEVE_RESULT: RetrieveResult = {
  episodes: DEMO_EPISODES.slice(0, 5).map((ep, idx) => ({
    episode: ep,
    score: 0.9 - idx * 0.05,
    retrieval_source: idx < 3 ? "qdrant" : "graph",
  })),
  semantic_memories: DEMO_SEMANTIC_MEMORIES.slice(0, 3),
  injection_prompt:
    "=== RELEVANT MEMORY CONTEXT ===\n" +
    "[Memory 1] (coding, success, 0 days ago): User prefers TypeScript with strict mode enabled...\n" +
    "[Memory 2] (coding, success, 1 days ago): User prefers functional React with hooks...\n" +
    "[Learned Fact] User strongly prefers TypeScript over JavaScript for all new projects. (confidence: 87%)\n" +
    "=== END MEMORY CONTEXT ===",
  latency_ms: 34,
};

