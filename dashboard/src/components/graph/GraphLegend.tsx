import React from "react";

const LEGEND_ITEMS = [
  { color: "#a78bfa", label: "Coding" },
  { color: "#60a5fa", label: "Writing" },
  { color: "#34d399", label: "Research" },
  { color: "#fb923c", label: "Planning" },
  { color: "#94a3b8", label: "General" },
];

const EDGE_ITEMS = [
  { color: "rgba(148,163,184,0.5)", label: "Temporal (followed_by)" },
  { color: "rgba(139,92,246,0.6)", label: "Semantic (compressed_into)" },
];

export function GraphLegend() {
  return (
    <div
      className="rounded-[10px] p-4 space-y-4"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      {/* Nodes */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
          Domains
        </p>
        <div className="space-y-1.5">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: item.color }}
              />
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Edges */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
          Edges
        </p>
        <div className="space-y-1.5">
          {EDGE_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span
                className="h-px w-5 flex-shrink-0"
                style={{ background: item.color, borderTop: `2px solid ${item.color}` }}
              />
              <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
