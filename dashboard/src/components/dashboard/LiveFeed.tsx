"use client";

import React, { useEffect, useState } from "react";
import { Episode } from "@/lib/types";

type Props = {
  fetchEpisodes: () => Promise<Episode[]>;
};

function timeAgo(iso: string) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function LiveFeed({ fetchEpisodes }: Props) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const eps = await fetchEpisodes();
        if (!cancelled) {
          setEpisodes(eps.slice(0, 10));
        }
      } catch (e) {
        // swallow for now
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fetchEpisodes]);

  return (
    <div className="glass rounded-xl p-4 h-80 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-green)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-green)]" />
          </span>
          <span className="text-sm text-[var(--text-secondary)]">Recent Episodes</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {episodes.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] py-6">
            No episodes yet. Connect an agent to start streaming memories.
          </p>
        ) : (
          episodes.map((ep) => (
            <div
              key={ep.episode_id}
              className="flex items-start gap-3 p-2 rounded-lg bg-[rgba(15,23,42,0.9)] border border-[var(--border)] hover:border-[var(--border-bright)] transition-colors"
            >
              <span
                className="mt-1 h-6 w-1 rounded-full"
                style={{
                  backgroundColor:
                    ep.domain === "coding"
                      ? "var(--domain-coding)"
                      : ep.domain === "writing"
                        ? "var(--domain-writing)"
                        : ep.domain === "research"
                          ? "var(--domain-research)"
                          : ep.domain === "planning"
                            ? "var(--domain-planning)"
                            : "var(--domain-general)",
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-1.5 py-0.5 rounded-full bg-[rgba(15,23,42,0.9)] border border-[var(--border-bright)] capitalize">
                      {ep.domain}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[10px]"
                      style={{
                        backgroundColor:
                          ep.outcome === "success"
                            ? "rgba(16,185,129,0.15)"
                            : ep.outcome === "failure"
                              ? "rgba(239,68,68,0.15)"
                              : ep.outcome === "partial"
                                ? "rgba(245,158,11,0.15)"
                                : "rgba(148,163,184,0.15)",
                        color:
                          ep.outcome === "success"
                            ? "var(--outcome-success)"
                            : ep.outcome === "failure"
                              ? "var(--outcome-failure)"
                              : ep.outcome === "partial"
                                ? "var(--outcome-partial)"
                                : "var(--outcome-unknown)",
                      }}
                    >
                      {ep.outcome}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {timeAgo(ep.created_at)}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] truncate">
                  {ep.intent || ep.raw_content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

