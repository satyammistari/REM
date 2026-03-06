"use client";

import React, { useMemo } from "react";

type Props = {
  totalEpisodes: number;
  consolidatedEpisodes: number;
  totalSemantic: number;
};

export function HealthGauge({ totalEpisodes, consolidatedEpisodes, totalSemantic }: Props) {
  const score = useMemo(() => {
    if (totalEpisodes === 0) return 0;
    const consolidationScore = (consolidatedEpisodes / totalEpisodes) * 60;
    const semanticScore = totalSemantic > 0 ? 40 : 0;
    return Math.round(Math.min(100, consolidationScore + semanticScore));
  }, [totalEpisodes, consolidatedEpisodes, totalSemantic]);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const arc = (clamped / 100) * circumference;

  const strokeColor =
    score < 40
      ? "var(--accent-red)"
      : score < 70
        ? "var(--accent-amber)"
        : "var(--accent-green)";

  return (
    <div className="glass rounded-xl p-5 flex flex-col gap-4 w-full max-w-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--text-secondary)]">Memory Health</span>
      </div>
      <div className="flex items-center gap-4">
        <svg width={150} height={110} viewBox="0 0 160 120">
          <defs>
            <linearGradient id="health-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <g transform="translate(80,100) rotate(-90)">
            <circle
              r={radius}
              fill="none"
              stroke="rgba(15,23,42,0.7)"
              strokeWidth={10}
              strokeDasharray={circumference}
              strokeDashoffset={0}
            />
            <circle
              r={radius}
              fill="none"
              stroke="url(#health-gradient)"
              strokeWidth={10}
              strokeDasharray={`${arc} ${circumference - arc}`}
              strokeDashoffset={circumference / 2}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 0.6s ease-out, stroke 0.3s ease-out" }}
            />
          </g>
        </svg>
        <div className="flex flex-col">
          <span className="text-3xl font-semibold font-display leading-tight">{score}</span>
          <span className="text-xs text-[var(--text-secondary)]">Health Score</span>
          <span className="mt-2 text-[11px] text-[var(--text-muted)] max-w-xs">
            Higher scores mean more consolidated long-term memories and richer semantic graphs.
          </span>
        </div>
      </div>
    </div>
  );
}

