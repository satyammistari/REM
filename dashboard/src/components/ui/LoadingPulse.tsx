import React from "react";

interface LoadingPulseProps {
  rows?: number;
  className?: string;
}

/** Skeleton loading pulse — use while async data is loading. */
export function LoadingPulse({ rows = 3, className = "" }: LoadingPulseProps) {
  return (
    <div className={`space-y-3 ${className}`} aria-busy="true" aria-label="Loading…">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-2">
          <div
            className="h-3 rounded"
            style={{
              width: `${70 + (i % 3) * 10}%`,
              background: "var(--bg-elevated)",
            }}
          />
          <div
            className="h-2 rounded"
            style={{
              width: `${40 + (i % 4) * 12}%`,
              background: "var(--bg-elevated)",
              opacity: 0.6,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/** Single-line shimmer bar. */
export function LoadingBar({ width = "100%", height = 12 }: { width?: string | number; height?: number }) {
  return (
    <div
      className="animate-pulse rounded"
      style={{
        width,
        height,
        background: "var(--bg-elevated)",
      }}
    />
  );
}

/** Full-page centred spinner (minimal). */
export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center p-8">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="var(--border)" strokeWidth="2" />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="var(--violet-light)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
