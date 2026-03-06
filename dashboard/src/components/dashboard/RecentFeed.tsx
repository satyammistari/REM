"use client";
import React from "react";
import { DEMO_EPISODES } from "@/lib/demo-data";
import { Badge } from "@/components/ui/Badge";

const OUTCOME_DOT: Record<string, string> = {
  success: "#10b981", failure: "#ef4444", partial: "#f59e0b", unknown: "#64748b",
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

export function RecentFeed() {
  const episodes = DEMO_EPISODES.slice(0, 8);
  return (
    <div className="rounded-[10px] overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
        <h3 className="font-medium text-[13px]" style={{ color: "var(--text-primary)" }}>Recent Episodes</h3>
        <a href="/dashboard/episodes" className="font-mono text-[10px] hover:underline" style={{ color: "var(--violet-light)" }}>View all →</a>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {episodes.map((ep) => (
          <div key={ep.episode_id} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: OUTCOME_DOT[ep.outcome] ?? OUTCOME_DOT.unknown }} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{ep.intent}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="domain" value={ep.domain} size="sm" />
                <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {ep.consolidated ? "consolidated" : "pending"}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>{relativeTime(ep.created_at)}</div>
              <div className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>{Math.round(ep.importance_score * 100)}% imp</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
