"use client";
import React, { useState } from "react";
import { DEMO_SEMANTIC_MEMORIES } from "@/lib/demo-data";
import { SemanticCard } from "@/components/semantic/SemanticCard";

const DOMAINS = ["all", "coding", "planning", "general"] as const;
type DomainFilter = (typeof DOMAINS)[number];

const FACT_TYPES = ["all", "preference", "pattern", "rule", "fact"] as const;
type FactTypeFilter = (typeof FACT_TYPES)[number];

export default function SemanticPage() {
  const [domain, setDomain] = useState<DomainFilter>("all");
  const [factType, setFactType] = useState<FactTypeFilter>("all");
  const [activeOnly, setActiveOnly] = useState(true);

  const filtered = DEMO_SEMANTIC_MEMORIES.filter((sm) => {
    if (domain !== "all" && sm.domain !== domain) return false;
    if (factType !== "all" && sm.fact_type !== factType) return false;
    if (activeOnly && !sm.active) return false;
    return true;
  });

  const filterBtn = (active: boolean) =>
    [
      "px-3 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer border",
      active
        ? "text-white border-transparent"
        : "border-transparent",
    ].join(" ");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Semantic Memories
        </h1>
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          Distilled facts and patterns the agent has consolidated from raw episodes.
        </p>
      </div>

      {/* Filter bar */}
      <div
        className="flex flex-wrap items-center gap-3 mb-6 p-3 rounded-[10px]"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
      >
        {/* Domain */}
        <div className="flex gap-1">
          {DOMAINS.map((d) => (
            <button
              key={d}
              onClick={() => setDomain(d)}
              className={filterBtn(domain === d)}
              style={
                domain === d
                  ? { background: "var(--violet)" }
                  : { color: "var(--text-secondary)", background: "var(--bg-elevated)" }
              }
            >
              {d === "all" ? "All domains" : d}
            </button>
          ))}
        </div>

        <div className="w-px h-4" style={{ background: "var(--border)" }} />

        {/* Fact type */}
        <div className="flex gap-1">
          {FACT_TYPES.map((ft) => (
            <button
              key={ft}
              onClick={() => setFactType(ft)}
              className={filterBtn(factType === ft)}
              style={
                factType === ft
                  ? { background: "var(--violet)" }
                  : { color: "var(--text-secondary)", background: "var(--bg-elevated)" }
              }
            >
              {ft === "all" ? "All types" : ft}
            </button>
          ))}
        </div>

        <div className="w-px h-4" style={{ background: "var(--border)" }} />

        {/* Active toggle */}
        <button
          onClick={() => setActiveOnly((v) => !v)}
          className={filterBtn(activeOnly)}
          style={
            activeOnly
              ? { background: "var(--violet)" }
              : { color: "var(--text-secondary)", background: "var(--bg-elevated)" }
          }
        >
          Active only
        </button>

        <span className="ml-auto text-[12px]" style={{ color: "var(--text-muted)" }}>
          {filtered.length} memories
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className="rounded-[10px] p-10 text-center text-[13px]"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          No memories match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((sm) => (
            <SemanticCard key={sm.semantic_id} memory={sm} />
          ))}
        </div>
      )}
    </div>
  );
}
