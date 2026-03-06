"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useApi } from "@/lib/api";
import { useAgent } from "@/lib/agent-context";
import type { DashboardMetrics, Episode, SemanticMemory } from "@/lib/types";
import { HealthGauge } from "@/components/dashboard/HealthGauge";
import { MetricsRow } from "@/components/dashboard/MetricsRow";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { DomainChart } from "@/components/dashboard/DomainChart";
import {
  DEMO_AGENT,
  DEMO_EPISODES,
  DEMO_METRICS,
  DEMO_SEMANTIC_MEMORIES,
} from "@/lib/demo-data";

export default function DashboardPage() {
  const api = useApi();
  const { agentId } = useAgent();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentSemantic, setRecentSemantic] = useState<SemanticMemory[]>([]);
  const [demoMode, setDemoMode] = useState<boolean>(true);

  const load = useCallback(async () => {
    if (demoMode) {
      setMetrics(DEMO_METRICS);
      setRecentSemantic(DEMO_SEMANTIC_MEMORIES.slice(0, 5));
      return;
    }
    if (!agentId) return;
    try {
      const [m, sem] = await Promise.all([
        api.getMetrics(agentId),
        api.listSemantic(agentId),
      ]);
      setMetrics(m);
      setRecentSemantic(sem.slice(0, 5));
    } catch {
      // ignore for now
    }
  }, [agentId, api, demoMode]);

  useEffect(() => {
    void load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const fetchRecentEpisodes = useCallback(async (): Promise<Episode[]> => {
    if (demoMode) {
      return DEMO_EPISODES.slice(0, 10);
    }
    if (!agentId) return [];
    const { episodes } = await api.listEpisodes(agentId, { limit: 10, offset: 0 });
    return episodes;
  }, [agentId, api, demoMode]);

  const totalEpisodes = metrics?.total_episodes ?? 0;
  const totalSemantic = metrics?.total_semantic_memories ?? 0;
  const totalAgents = metrics?.total_agents ?? 1;
  const avgLatency = metrics?.avg_retrieval_latency_ms ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl mb-1">Agent Overview</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            This is what your agent remembers across all tasks.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)]">
          <span className="px-2 py-1 rounded-full bg-[rgba(15,23,42,0.9)] border border-[var(--border)]">
            {demoMode ? "👀 Viewing demo data — connect your agent to see real memories" : "Live data"}
          </span>
          <label className="inline-flex items-center gap-1 cursor-pointer">
            <span>Demo mode</span>
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6">
        <HealthGauge
          totalEpisodes={totalEpisodes}
          consolidatedEpisodes={Math.floor(totalEpisodes * 0.6)}
          totalSemantic={totalSemantic}
        />
        <MetricsRow
          totalEpisodes={totalEpisodes}
          totalSemantic={totalSemantic}
          totalAgents={totalAgents}
          avgLatencyMs={avgLatency}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6">
        <LiveFeed fetchEpisodes={fetchRecentEpisodes} />
        <DomainChart data={metrics?.episodes_by_domain ?? {}} />
      </div>

      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[var(--text-secondary)]">Recent Semantic Memories</span>
        </div>
        {recentSemantic.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">
            No semantic memories yet. Write 3+ similar episodes to trigger consolidation.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentSemantic.map((sm) => (
              <li key={sm.semantic_id} className="flex items-center justify-between">
                <span className="text-[var(--text-primary)]">{sm.fact}</span>
                <span className="text-[10px] text-[var(--text-secondary)]">
                  {(sm.confidence * 100).toFixed(0)}% · {sm.evidence_count} episodes
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

