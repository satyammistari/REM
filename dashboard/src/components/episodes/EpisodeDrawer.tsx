"use client";
import React, { useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import type { Episode } from "@/lib/types";

interface EpisodeDrawerProps {
  episode: Episode | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
      <dt className="text-[11px] font-mono w-32 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
        {label}
      </dt>
      <dd className="text-[12px] flex-1" style={{ color: "var(--text-primary)" }}>
        {value}
      </dd>
    </div>
  );
}

export function EpisodeDrawer({ episode, onClose }: EpisodeDrawerProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!episode) return null;

  const ep = episode;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed right-0 top-0 bottom-0 z-50 w-[480px] overflow-y-auto flex flex-col"
        style={{ background: "var(--bg-surface)", borderLeft: "1px solid var(--border)" }}
        role="dialog"
        aria-label="Episode detail"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0"
          style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
        >
          <h2 className="font-semibold text-[14px]" style={{ color: "var(--text-primary)" }}>
            Episode Detail
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--bg-elevated)] transition-colors"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-5">
          {/* Intent */}
          <p
            className="font-medium text-[15px] mb-4 leading-snug"
            style={{ color: "var(--text-primary)" }}
          >
            {ep.intent}
          </p>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap mb-5">
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
          </div>

          {/* Metadata */}
          <dl className="mb-5">
            <Row label="episode_id" value={<code className="text-[11px]">{ep.episode_id}</code>} />
            <Row label="agent_id" value={<code className="text-[11px]">{ep.agent_id}</code>} />
            <Row label="importance" value={`${Math.round(ep.importance_score * 100)}%`} />
            <Row label="emotion" value={ep.emotion_signal} />
            <Row label="retrievals" value={String(ep.retrieval_count)} />
            <Row label="created" value={new Date(ep.created_at).toLocaleString()} />
          </dl>

          {/* Raw content */}
          <div className="mb-5">
            <p className="text-[11px] font-mono mb-2" style={{ color: "var(--text-muted)" }}>
              raw_content
            </p>
            <p
              className="text-[12px] leading-relaxed p-3 rounded-lg"
              style={{ background: "var(--bg-elevated)", color: "var(--text-primary)" }}
            >
              {ep.raw_content}
            </p>
          </div>

          {/* Entities */}
          {ep.parsed_entities?.length > 0 && (
            <div>
              <p className="text-[11px] font-mono mb-2" style={{ color: "var(--text-muted)" }}>
                entities
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ep.parsed_entities.map((e) => (
                  <span
                    key={e}
                    className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
