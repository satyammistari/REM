"use client";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/lib/api";
import type { GraphData } from "@/lib/types";

interface UseGraphOptions {
  agentId: string;
  autoFetch?: boolean;
}

interface UseGraphResult {
  graph: GraphData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGraph({ agentId, autoFetch = true }: UseGraphOptions): UseGraphResult {
  const api = useApi();
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGraph(agentId);
      setGraph(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load graph");
    } finally {
      setLoading(false);
    }
  }, [api, agentId]);

  useEffect(() => {
    if (autoFetch) fetch();
  }, [fetch, autoFetch]);

  return { graph, loading, error, refetch: fetch };
}
