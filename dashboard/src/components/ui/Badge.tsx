import React from "react";

const DOMAIN_STYLE: Record<string, { bg: string; color: string }> = {
  coding:   { bg: "rgba(129,140,248,0.12)", color: "#818cf8" },
  writing:  { bg: "rgba(52,211,153,0.12)",  color: "#34d399" },
  research: { bg: "rgba(251,191,36,0.12)",  color: "#fbbf24" },
  planning: { bg: "rgba(96,165,250,0.12)",  color: "#60a5fa" },
  general:  { bg: "rgba(148,163,184,0.12)", color: "#94a3b8" },
};

const OUTCOME_STYLE: Record<string, { bg: string; color: string }> = {
  success: { bg: "rgba(16,185,129,0.12)",  color: "#10b981" },
  failure: { bg: "rgba(239,68,68,0.12)",   color: "#ef4444" },
  partial: { bg: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
  unknown: { bg: "rgba(100,116,139,0.12)", color: "#64748b" },
};

const FACT_STYLE: Record<string, { bg: string; color: string }> = {
  preference: { bg: "rgba(124,58,237,0.12)", color: "var(--violet-light)" },
  rule:       { bg: "rgba(6,182,212,0.12)",  color: "var(--cyan-light)" },
  pattern:    { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  skill:      { bg: "rgba(16,185,129,0.12)", color: "#10b981" },
  fact:       { bg: "rgba(148,163,184,0.12)", color: "#94a3b8" },
};

interface BadgeProps {
  variant: "domain" | "outcome" | "factType" | "default";
  value: string;
  size?: "sm" | "md";
}

export function Badge({ variant, value, size = "sm" }: BadgeProps) {
  let style = { bg: "rgba(148,163,184,0.12)", color: "#94a3b8" };
  if (variant === "domain") style = DOMAIN_STYLE[value] ?? style;
  if (variant === "outcome") style = OUTCOME_STYLE[value] ?? style;
  if (variant === "factType") style = FACT_STYLE[value] ?? style;

  const pad = size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-1 text-[11px]";

  return (
    <span
      className={`inline-flex items-center rounded font-mono uppercase tracking-wider ${pad}`}
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}25` }}
    >
      {value}
    </span>
  );
}
