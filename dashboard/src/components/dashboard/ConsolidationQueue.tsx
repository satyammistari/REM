"use client";
import React from "react";
import { DEMO_EPISODES } from "@/lib/demo-data";

interface QueueItem {
  episode_id: string;
  intent: string;
  domain: string;
  created_at: string;
  importance_score: number;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function ConsolidationQueue() {
  const pending: QueueItem[] = DEMO_EPISODES.filter((ep) => !ep.consolidated)
    .slice(0, 6)
    .map((ep) => ({
      episode_id: ep.episode_id,
      intent: ep.intent,
      domain: ep.domain,
      created_at: ep.created_at,
      importance_score: ep.importance_score,
    }));

  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-[13px]" style={{ color: "var(--text-primary)" }}>
            Consolidation Queue
          </h3>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{ background: "rgba(139,92,246,0.12)", color: "var(--violet-light)" }}
          >
            {pending.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#10b981" }} />
          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
            running
          </span>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            Queue is empty — all episodes consolidated ✓
          </p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {pending.map((item) => (
            <div
              key={item.episode_id}
              className="flex items-center gap-3 px-5 py-2.5 hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div
                className="w-1 rounded-full self-stretch min-h-[24px]"
                style={{ background: "var(--violet-light)" }}
              />
              <div className="flex-1 min-w-0">
                <div
                  className="text-[12px] truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.intent}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                    {item.domain}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                    {timeAgo(item.created_at)}
                  </span>
                </div>
              </div>
              <div
                className="text-[10px] font-mono flex-shrink-0"
                style={{ color: "var(--text-muted)" }}
              >
                {Math.round(item.importance_score * 100)}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
