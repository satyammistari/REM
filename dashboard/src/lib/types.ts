export interface Episode {
  episode_id: string;
  agent_id: string;
  user_id: string;
  session_id: string;
  raw_content: string;
  parsed_entities: string[];
  intent: string;
  outcome: "success" | "failure" | "partial" | "unknown";
  domain: "coding" | "writing" | "research" | "planning" | "general";
  emotion_signal: string;
  importance_score: number;
  retrieval_count: number;
  consolidated: boolean;
  created_at: string;
  updated_at: string;
}

export interface SemanticMemory {
  semantic_id: string;
  agent_id: string;
  fact: string;
  confidence: number;
  evidence_count: number;
  source_episode_ids: string[];
  domain: string;
  fact_type: "preference" | "rule" | "pattern" | "skill" | "fact";
  active: boolean;
  created_at: string;
}

export interface Agent {
  agent_id: string;
  name: string;
  description: string;
  total_episodes: number;
  total_semantic_memories: number;
  last_active_at: string | null;
  created_at: string;
}

export interface GraphNode {
  id: string;
  type: "episode" | "semantic";
  label: string;
  domain: string;
  consolidated: boolean;
  importance: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: "followed_by" | "compressed_into";
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface RetrieveResult {
  episodes: Array<{
    episode: Episode;
    score: number;
    retrieval_source: string;
  }>;
  semantic_memories: SemanticMemory[];
  injection_prompt: string;
  latency_ms: number;
}

export interface DashboardMetrics {
  total_episodes: number;
  total_semantic_memories: number;
  total_agents: number;
  avg_retrieval_latency_ms: number;
  consolidation_queue_size: number;
  episodes_by_domain: Record<string, number>;
  episodes_by_outcome: Record<string, number>;
}

