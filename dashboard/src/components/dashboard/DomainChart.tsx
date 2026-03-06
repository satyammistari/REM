"use client";

import React from "react";
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from "recharts";

type Props = {
  data: Record<string, number>;
};

const COLORS: Record<string, string> = {
  coding: "var(--domain-coding)",
  writing: "var(--domain-writing)",
  research: "var(--domain-research)",
  planning: "var(--domain-planning)",
  general: "var(--domain-general)",
};

export function DomainChart({ data }: Props) {
  const entries = Object.entries(data || {}).filter(([, v]) => v > 0);
  const total = entries.reduce((acc, [, v]) => acc + v, 0);
  const chartData = entries.map(([key, value]) => ({ name: key, value }));

  return (
    <div className="glass rounded-xl p-4 h-72 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[var(--text-secondary)]">Domains</span>
        <span className="text-xs text-[var(--text-muted)]">{total} episodes</span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
            >
              {chartData.map((entry, index) => {
                const color = COLORS[entry.name] || "var(--domain-general)";
                return <Cell key={index} fill={color} />;
              })}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#020617",
                borderColor: "#1e293b",
                borderRadius: 8,
              }}
              labelStyle={{ color: "#e2e8f0" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-[var(--text-secondary)]">
        {chartData.map((entry) => (
          <span
            key={entry.name}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(15,23,42,0.9)] border border-[var(--border)]"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: COLORS[entry.name] || "var(--domain-general)" }}
            />
            <span className="capitalize">{entry.name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

