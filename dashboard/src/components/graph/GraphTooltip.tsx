import React from "react";
import type { GraphNode } from "@/lib/types";

interface GraphTooltipProps {
  node: GraphNode | null;
  x: number;
  y: number;
}

export function GraphTooltip({ node, x, y }: GraphTooltipProps) {
  if (!node) return null;

  return (
    <div
      className="absolute pointer-events-none rounded-lg px-3 py-2 text-[11px] shadow-xl z-50"
      style={{
        left: x + 12,
        top: y - 8,
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-bright)",
        color: "var(--text-primary)",
        minWidth: 180,
      }}
    >
      <div className="font-medium mb-1 truncate max-w-[200px]">{node.label || node.id}</div>
      <dl className="space-y-0.5">
        <div className="flex justify-between gap-4">
          <dt style={{ color: "var(--text-muted)" }}>type</dt>
          <dd className="font-mono">{node.type}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt style={{ color: "var(--text-muted)" }}>domain</dt>
          <dd className="font-mono">{node.domain}</dd>
        </div>
        {node.type === "episode" && (
          <div className="flex justify-between gap-4">
            <dt style={{ color: "var(--text-muted)" }}>consolidated</dt>
            <dd className="font-mono">{node.consolidated ? "yes" : "no"}</dd>
          </div>
        )}
        {node.importance !== undefined && (
          <div className="flex justify-between gap-4">
            <dt style={{ color: "var(--text-muted)" }}>importance</dt>
            <dd className="font-mono">{Math.round(node.importance * 100)}%</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
