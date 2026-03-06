"use client";
import React, { useState } from "react";

interface QueryPanelProps {
  agentId: string;
  onResult: (result: unknown) => void;
  onLoading: (loading: boolean) => void;
}

export function QueryPanel({ agentId, onResult, onLoading }: QueryPanelProps) {
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);
    onLoading(true);
    try {
      const res = await fetch("/api/v1/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), agent_id: agentId, top_k: topK, include_semantic: true }),
      });
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      onResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      onResult(null);
    } finally {
      onLoading(false);
    }
  };

  return (
    <div
      className="rounded-[10px] p-5"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <h3 className="font-medium text-[13px] mb-4" style={{ color: "var(--text-primary)" }}>
        Query Memory
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Query textarea */}
        <div>
          <label
            className="block text-[11px] font-mono mb-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            query
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={4}
            placeholder="Ask about the agent's memory…"
            className="w-full text-[12px] p-3 rounded-lg resize-none outline-none focus:ring-1 focus:ring-[var(--violet-light)] font-mono"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Top-K */}
        <div className="flex items-center gap-3">
          <label
            className="text-[11px] font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            top_k
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="w-16 text-[12px] px-2 py-1 rounded text-center outline-none font-mono"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {error && (
          <p className="text-[11px] font-mono" style={{ color: "#ef4444" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!query.trim()}
          className="w-full py-2 rounded-lg text-[12px] font-medium transition-opacity disabled:opacity-40"
          style={{
            background: "var(--violet)",
            color: "#fff",
            opacity: query.trim() ? 1 : 0.4,
          }}
        >
          Retrieve →
        </button>
      </form>
    </div>
  );
}
