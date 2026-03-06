import type {
  Agent,
  DashboardMetrics,
  Episode,
  GraphData,
  RetrieveResult,
  SemanticMemory,
} from "./types";

class REMApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

class REMApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl = process.env.NEXT_PUBLIC_API_URL!, apiKey: string) {
    this.baseUrl = (baseUrl || "").replace(/\/+$/, "");
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
      ...(options.headers || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      throw new REMApiError(401, "Invalid API key");
    }
    if (res.status === 404) {
      throw new REMApiError(404, "Not found");
    }
    if (res.status >= 500) {
      throw new REMApiError(res.status, "Server error");
    }
    if (!res.ok) {
      const text = await res.text();
      throw new REMApiError(res.status, text || "Request failed");
    }

    return (await res.json()) as T;
  }

  // Episodes
  async listEpisodes(
    agentId: string,
    params: {
      limit?: number;
      offset?: number;
      domain?: string;
      outcome?: string;
      consolidated?: boolean;
      search?: string;
    } = {},
  ): Promise<{ episodes: Episode[]; total: number }> {
    const searchParams = new URLSearchParams();
    searchParams.set("agent_id", agentId);
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.offset) searchParams.set("offset", String(params.offset));
    if (params.domain) searchParams.set("domain", params.domain);
    if (params.outcome) searchParams.set("outcome", params.outcome);
    if (typeof params.consolidated === "boolean") {
      searchParams.set("consolidated", String(params.consolidated));
    }
    if (params.search) searchParams.set("search", params.search);

    const data = await this.request<{ episodes: Episode[]; total: number }>(
      `/api/v1/episodes?${searchParams.toString()}`,
    );
    return { episodes: data.episodes, total: data.total };
  }

  async getEpisode(episodeId: string): Promise<Episode> {
    return this.request<Episode>(`/api/v1/episodes/${episodeId}`);
  }

  async writeEpisode(data: {
    agent_id: string;
    user_id: string;
    content: string;
    outcome?: string;
  }): Promise<{ episode_id: string }> {
    return this.request<{ episode_id: string }>(`/api/v1/episodes`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Retrieve
  async retrieve(query: string, agentId: string, topK = 5): Promise<RetrieveResult> {
    return this.request<RetrieveResult>(`/api/v1/retrieve`, {
      method: "POST",
      body: JSON.stringify({
        query,
        agent_id: agentId,
        top_k: topK,
        include_semantic: true,
      }),
    });
  }

  // Agents
  async listAgents(): Promise<Agent[]> {
    return this.request<Agent[]>(`/api/v1/agents`);
  }

  async createAgent(name: string, description = ""): Promise<Agent> {
    return this.request<Agent>(`/api/v1/agents`, {
      method: "POST",
      body: JSON.stringify({ name, description, config: {} }),
    });
  }

  // Semantic
  async listSemantic(agentId: string): Promise<SemanticMemory[]> {
    const params = new URLSearchParams({ agent_id: agentId });
    const data = await this.request<{ items: SemanticMemory[] }>(
      `/api/v1/semantic?${params.toString()}`,
    );
    return data.items;
  }

  // Graph
  async getGraph(agentId: string): Promise<GraphData> {
    return this.request<GraphData>(`/api/v1/graph/${agentId}`);
  }

  // Metrics (placeholder; backend endpoint to be added)
  async getMetrics(agentId: string): Promise<DashboardMetrics> {
    return this.request<DashboardMetrics>(`/api/v1/metrics/${agentId}`);
  }
}

let apiSingleton: REMApiClient | null = null;

export function createApiClient(apiKey: string, baseUrl?: string) {
  apiSingleton = new REMApiClient(baseUrl ?? process.env.NEXT_PUBLIC_API_URL!, apiKey);
  return apiSingleton;
}

// Eagerly create a singleton if a public API key is provided.
const defaultKey = process.env.NEXT_PUBLIC_API_KEY;
if (!apiSingleton && defaultKey) {
  apiSingleton = new REMApiClient(process.env.NEXT_PUBLIC_API_URL!, defaultKey);
}

export function useApi(): REMApiClient {
  if (apiSingleton) return apiSingleton;
  // Return a proxy that only throws when an API method is actually called,
  // so components can safely call useApi() and guard with a demoMode flag.
  return new Proxy({} as REMApiClient, {
    get(_target, prop) {
      return () => {
        throw new Error(
          `REMApiClient not initialised (called .${String(prop)}()). Call createApiClient() first.`,
        );
      };
    },
  });
}

export { REMApiClient };


