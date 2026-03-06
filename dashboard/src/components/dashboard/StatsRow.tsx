"use client";
import React from "react";
import { BookOpen, Sparkles, Zap, Activity } from "lucide-react";

const STATS = [
  { label: "Episodes",         value: "4,218", sub: "total stored",       icon: BookOpen,  color: "#7c3aed", delta: "+124" },
  { label: "Semantic Memories",value: "1,847", sub: "consolidated facts",  icon: Sparkles,  color: "#06b6d4", delta: "+37" },
  { label: "Avg Retrieval",    value: "42ms",  sub: "p50 latency",         icon: Zap,       color: "#10b981", delta: "-3ms" },
  { label: "Memory Health",    value: "87%",   sub: "consolidation score", icon: Activity,  color: "#f59e0b" },
];

function ArcGauge({ pct }: { pct: number }) {
  const r = 28, cx = 36, cy = 36;
  const toR = (deg: number) => (deg * Math.PI) / 180;
  const arc = (deg: number) => `${cx + r * Math.cos(toR(deg))},${cy + r * Math.sin(toR(deg))}`;
  const start = -200, sweep = 220;
  const end = start + sweep * (pct / 100);
  const large = sweep * (pct / 100) > 180 ? 1 : 0;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <path d={`M ${arc(start)} A ${r} ${r} 0 1 1 ${arc(start + sweep)}`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" strokeLinecap="round" />
      {pct > 0 && <path d={`M ${arc(start)} A ${r} ${r} 0 ${large} 1 ${arc(end)}`} fill="none" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" />}
    </svg>
  );
}

export function StatsRow() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map((s, i) => (
        <div key={s.label} className="rounded-[10px] p-5 transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center justify-center w-8 h-8 rounded-md" style={{ background: s.color + "15" }}>
              <s.icon size={15} style={{ color: s.color }} />
            </div>
            {i === 3 ? <ArcGauge pct={87} /> : s.delta && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>{s.delta}</span>
            )}
          </div>
          <div className="mt-3">
            <div className="font-display text-[26px] font-bold" style={{ color: "var(--text-primary)" }}>{s.value}</div>
            <div className="font-medium text-[12px] mt-0.5" style={{ color: "var(--text-primary)" }}>{s.label}</div>
            <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
