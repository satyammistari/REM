"use client";

import React, { useEffect, useState } from "react";
import { Activity, Brain, Gauge, Users } from "lucide-react";

type MetricCardProps = {
  label: string;
  icon: React.ReactNode;
  value: number;
  suffix?: string;
};

function MetricCard({ label, icon, value, suffix }: MetricCardProps) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 600;

    const animate = (ts: number) => {
      const progress = Math.min(1, (ts - start) / duration);
      setDisplay(Math.round(value * progress));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className="glass rounded-xl p-4 flex flex-col gap-3 hover:border-[var(--border-bright)] transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          <span className="text-[var(--text-muted)]">{icon}</span>
          <span>{label}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold font-display">{display.toLocaleString()}</span>
        {suffix && <span className="text-xs text-[var(--text-secondary)]">{suffix}</span>}
      </div>
    </div>
  );
}

type Props = {
  totalEpisodes: number;
  totalSemantic: number;
  totalAgents: number;
  avgLatencyMs: number;
};

export function MetricsRow({ totalEpisodes, totalSemantic, totalAgents, avgLatencyMs }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Total Episodes"
        icon={<Activity size={16} />}
        value={totalEpisodes}
      />
      <MetricCard
        label="Semantic Memories"
        icon={<Brain size={16} />}
        value={totalSemantic}
      />
      <MetricCard
        label="Active Agents"
        icon={<Users size={16} />}
        value={totalAgents}
      />
      <MetricCard
        label="Avg Retrieval Latency"
        icon={<Gauge size={16} />}
        value={avgLatencyMs}
        suffix="ms"
      />
    </div>
  );
}

