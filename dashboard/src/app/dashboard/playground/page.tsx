"use client";
import React, { useState } from "react";
import { QueryPanel } from "@/components/playground/QueryPanel";
import { ResultsPanel } from "@/components/playground/ResultsPanel";
import { useAgent } from "@/lib/agent-context";
import { createApiClient } from "@/lib/api";
import type { RetrieveResult } from "@/lib/types";

export default function PlaygroundPage() {
  const { agentId } = useAgent();
  const [result, setResult] = useState<RetrieveResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleQuery(query: string, topK: number) {
    if (!agentId) {
      setError("No agent selected. Please select an agent from the sidebar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = createApiClient();
      const res = await client.retrieve(agentId, { query, top_k: topK });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Query Playground
        </h1>
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          Run semantic retrieval queries against the agent&apos;s memory store.
        </p>
      </div>

      {!agentId && (
        <div
          className="mb-4 px-4 py-3 rounded-[8px] text-[13px]"
          style={{
            background: "rgba(139,92,246,0.1)",
            border: "1px solid rgba(139,92,246,0.3)",
            color: "var(--text-secondary)",
          }}
        >
          No agent selected — results will be simulated. Select an agent from the sidebar to query live memory.
        </div>
      )}

      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-[8px] text-[13px]"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <QueryPanel onQuery={handleQuery} loading={loading} />
        <ResultsPanel result={result} loading={loading} />
      </div>
    </div>
  );
}
