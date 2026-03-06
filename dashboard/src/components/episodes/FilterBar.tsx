"use client";
import React from "react";

interface FilterBarProps {
  domain: string;
  outcome: string;
  consolidated: string;
  search: string;
  onDomain: (v: string) => void;
  onOutcome: (v: string) => void;
  onConsolidated: (v: string) => void;
  onSearch: (v: string) => void;
  onClear: () => void;
}

const selectStyle: React.CSSProperties = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  borderRadius: 6,
  padding: "4px 8px",
  fontSize: 12,
  fontFamily: "var(--font-mono, monospace)",
  outline: "none",
  cursor: "pointer",
};

export function FilterBar({
  domain,
  outcome,
  consolidated,
  search,
  onDomain,
  onOutcome,
  onConsolidated,
  onSearch,
  onClear,
}: FilterBarProps) {
  const hasFilters = domain || outcome || consolidated || search;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <input
        type="text"
        placeholder="Search episodes…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="flex-1 min-w-[160px] text-[12px] px-3 py-1.5 rounded-md outline-none focus:ring-1 focus:ring-[var(--violet-light)]"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-mono, monospace)",
        }}
      />

      {/* Domain */}
      <select value={domain} onChange={(e) => onDomain(e.target.value)} style={selectStyle}>
        <option value="">All domains</option>
        {["coding", "writing", "research", "planning", "analysis", "communication", "general"].map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      {/* Outcome */}
      <select value={outcome} onChange={(e) => onOutcome(e.target.value)} style={selectStyle}>
        <option value="">All outcomes</option>
        {["success", "failure", "partial", "unknown"].map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      {/* Consolidated */}
      <select value={consolidated} onChange={(e) => onConsolidated(e.target.value)} style={selectStyle}>
        <option value="">Any state</option>
        <option value="true">Consolidated</option>
        <option value="false">Pending</option>
      </select>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={onClear}
          className="text-[11px] font-mono px-3 py-1.5 rounded-md transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
