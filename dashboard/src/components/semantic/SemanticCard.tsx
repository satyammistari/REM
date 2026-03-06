import React from "react";
import type { SemanticMemory } from "@/lib/types";

interface SemanticCardProps {
  memory: SemanticMemory;
  onClick?: (m: SemanticMemory) => void;
}

const FACT_TYPE_COLORS: Record<string, string> = {
  preference: "#a78bfa",
  rule: "#60a5fa",
  pattern: "#34d399",
  skill: "#fb923c",
  fact: "#f472b6",
};

export function SemanticCard({ memory: m, onClick }: SemanticCardProps) {
  const color = FACT_TYPE_COLORS[m.fact_type] ?? "#94a3b8";

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => onClick?.(m)}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(m)}
      className={`rounded-[10px] p-4 ${onClick ? "cursor-pointer" : ""} hover:bg-[var(--bg-hover)] transition-colors`}
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-start gap-2 mb-3">
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ background: color + "22", color }}
        >
          {m.fact_type}
        </span>
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
          style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}
        >
          {m.domain}
        </span>
      </div>

      {/* Fact content */}
      <p
        className="text-[13px] leading-relaxed mb-3"
        style={{ color: "var(--text-primary)" }}
      >
        {m.fact}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
            conf
          </span>
          <div
            className="w-20 h-1 rounded-full overflow-hidden"
            style={{ background: "var(--bg-elevated)" }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${m.confidence * 100}%`, background: color }}
            />
          </div>
          <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
            {Math.round(m.confidence * 100)}%
          </span>
        </div>
        <span className="text-[10px] font-mono ml-auto" style={{ color: "var(--text-muted)" }}>
          {m.evidence_count} episodes
        </span>
      </div>
    </div>
  );
}
