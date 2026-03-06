import React from "react";

interface ConfidenceBarProps {
  value: number; // 0–1
  label?: string;
  color?: string;
  size?: "sm" | "md";
}

export function ConfidenceBar({
  value,
  label,
  color = "var(--violet-light)",
  size = "md",
}: ConfidenceBarProps) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  const height = size === "sm" ? 4 : 6;

  return (
    <div className="w-full">
      {(label !== undefined || true) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
              {label}
            </span>
          )}
          <span className="text-[11px] font-mono ml-auto" style={{ color: "var(--text-secondary)" }}>
            {pct}%
          </span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, background: "var(--bg-elevated)" }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
