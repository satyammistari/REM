"use client";
import React from "react";
import { Badge } from "@/components/ui/Badge";
import type { Episode } from "@/lib/types";

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

const OUTCOME_DOT: Record<string, string> = {
  success: "#10b981",
  failure: "#ef4444",
  partial: "#f59e0b",
  unknown: "#64748b",
};

interface EpisodeCardProps {
  episode: Episode;
  onClick?: (ep: Episode) => void;
}

export function EpisodeCard({ episode: ep, onClick }: EpisodeCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(ep)}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(ep)}
      className="rounded-[10px] p-4 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5"
            style={{ background: OUTCOME_DOT[ep.outcome] ?? OUTCOME_DOT.unknown }}
          />
          <p
            className="text-[13px] font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {ep.intent}
          </p>
        </div>
        <div className="flex-shrink-0 text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
          {relativeTime(ep.created_at)}
        </div>
      </div>

      {/* Content preview */}
      <p
        className="text-[11px] leading-relaxed mb-3 line-clamp-2"
        style={{ color: "var(--text-muted)" }}
      >
        {ep.raw_content}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="domain" value={ep.domain} size="sm" />
        <Badge variant="outcome" value={ep.outcome} size="sm" />
        {ep.consolidated && (
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}
          >
            consolidated
          </span>
        )}
        <span
          className="ml-auto text-[10px] font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          imp {Math.round(ep.importance_score * 100)}%
        </span>
      </div>
    </div>
  );
}
