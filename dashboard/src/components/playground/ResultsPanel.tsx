"use client";
import React from "react";
import { Badge } from "@/components/ui/Badge";
import { LoadingPulse } from "@/components/ui/LoadingPulse";
import type { RetrieveResult } from "@/lib/types";

interface ResultsPanelProps {
  result: RetrieveResult | null;
  loading: boolean;
}

export function ResultsPanel({ result, loading }: ResultsPanelProps) {
  if (loading) {
    return (
      <div
        className="rounded-[10px] p-5"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <LoadingPulse rows={4} />
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className="rounded-[10px] p-5 flex items-center justify-center min-h-[200px]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        <p className="text-[12px] font-mono" style={{ color: "var(--text-muted)" }}>
          Results will appear here…
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {/* Meta */}
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <h3 className="font-medium text-[13px]" style={{ color: "var(--text-primary)" }}>
          Results
        </h3>
        <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
          {result.latency_ms}ms · {result.episodes.length} episodes · {result.semantic_memories.length} semantic
        </span>
      </div>

      {/* Injection prompt */}
      {result.injection_prompt && (
        <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="text-[10px] font-mono mb-1" style={{ color: "var(--text-muted)" }}>
            injection_prompt
          </p>
          <pre
            className="text-[11px] whitespace-pre-wrap leading-relaxed p-2 rounded"
            style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)", maxHeight: 120, overflow: "auto" }}
          >
            {result.injection_prompt}
          </pre>
        </div>
      )}

      {/* Episodes */}
      {result.episodes.length > 0 && (
        <div className="px-5 py-4">
          <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            Episode Matches
          </p>
          <div className="space-y-2">
            {result.episodes.map(({ episode: ep, score, retrieval_source }) => (
              <div
                key={ep.episode_id}
                className="p-3 rounded-lg"
                style={{ background: "var(--bg-elevated)" }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>
                    {ep.intent}
                  </p>
                  <span className="text-[10px] font-mono flex-shrink-0" style={{ color: "var(--violet-light)" }}>
                    {(score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant="domain" value={ep.domain} size="sm" />
                  <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                    via {retrieval_source}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Semantic memories */}
      {result.semantic_memories.length > 0 && (
        <div className="px-5 pb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            Semantic Memories
          </p>
          <div className="space-y-2">
            {result.semantic_memories.map((sm) => (
              <div
                key={sm.semantic_id}
                className="p-3 rounded-lg"
                style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}
              >
                <Badge variant="factType" value={sm.fact_type} size="sm" className="mb-1.5" />
                <p className="text-[12px]" style={{ color: "var(--text-primary)" }}>
                  {sm.fact}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
