/**
 * Shared utility functions for the REM dashboard.
 */

/** Format an ISO timestamp as a relative time string (e.g. "3m ago"). */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/** Format a number with K/M suffix (e.g. 1200 → "1.2K"). */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Truncate a string to maxLen, appending "…" if needed. */
export function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1) + "…";
}

/** Clamp a number between min and max (inclusive). */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Convert an importance score (0–1) to a colour hex string. */
export function importanceColor(score: number): string {
  if (score >= 0.8) return "#a78bfa"; // violet
  if (score >= 0.6) return "#60a5fa"; // blue
  if (score >= 0.4) return "#34d399"; // green
  return "#64748b"; // muted
}

/** Domain → display colour mapping. */
export const DOMAIN_COLORS: Record<string, string> = {
  coding: "#a78bfa",
  writing: "#60a5fa",
  research: "#34d399",
  planning: "#fb923c",
  analysis: "#f472b6",
  communication: "#facc15",
  general: "#94a3b8",
};

/** Outcome → colour mapping. */
export const OUTCOME_COLORS: Record<string, string> = {
  success: "#10b981",
  failure: "#ef4444",
  partial: "#f59e0b",
  unknown: "#64748b",
};

/** Format latency in ms to a human-readable string. */
export function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/** Convert a snake_case or camelCase string to Title Case. */
export function toTitleCase(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Build query-string from an object, omitting undefined/null values. */
export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const pairs: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      pairs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return pairs.length ? `?${pairs.join("&")}` : "";
}
