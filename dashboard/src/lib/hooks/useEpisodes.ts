"use client";
import { useCallback, useEffect, useState } from "react";
import { useApi } from "@/lib/api";
import type { Episode } from "@/lib/types";

interface UseEpisodesOptions {
  agentId: string;
  limit?: number;
  offset?: number;
  autoFetch?: boolean;
}

interface UseEpisodesResult {
  episodes: Episode[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  setOffset: (offset: number) => void;
}

export function useEpisodes({
  agentId,
  limit = 20,
  offset: initialOffset = 0,
  autoFetch = true,
}: UseEpisodesOptions): UseEpisodesResult {
  const api = useApi();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(initialOffset);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.listEpisodes(agentId, { limit, offset });
      setEpisodes(result.episodes);
      setTotal(result.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load episodes");
    } finally {
      setLoading(false);
    }
  }, [api, agentId, limit, offset]);

  useEffect(() => {
    if (autoFetch) fetch();
  }, [fetch, autoFetch]);

  return { episodes, total, loading, error, refetch: fetch, setOffset };
}
