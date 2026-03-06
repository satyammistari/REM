"use client";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/lib/api";
import type { DashboardMetrics } from "@/lib/types";

interface UseMetricsOptions {
  agentId: string;
  refreshInterval?: number; // ms, 0 = no auto-refresh
  autoFetch?: boolean;
}

interface UseMetricsResult {
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMetrics({
  agentId,
  refreshInterval = 0,
  autoFetch = true,
}: UseMetricsOptions): UseMetricsResult {
  const api = useApi();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMetrics(agentId);
      setMetrics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, [api, agentId]);

  useEffect(() => {
    if (autoFetch) fetch();
  }, [fetch, autoFetch]);

  useEffect(() => {
    if (!refreshInterval) return;
    const id = setInterval(fetch, refreshInterval);
    return () => clearInterval(id);
  }, [fetch, refreshInterval]);

  return { metrics, loading, error, refetch: fetch };
}
