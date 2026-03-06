"use client";
import React, { useState } from "react";
import { DEMO_EPISODES } from "@/lib/demo-data";
import { EpisodeCard } from "@/components/episodes/EpisodeCard";
import { EpisodeDrawer } from "@/components/episodes/EpisodeDrawer";
import { FilterBar } from "@/components/episodes/FilterBar";
import type { Episode } from "@/lib/types";

export default function EpisodesPage() {
  const [selected, setSelected] = useState<Episode | null>(null);
  const [domain, setDomain] = useState("");
  const [outcome, setOutcome] = useState("");
  const [consolidated, setConsolidated] = useState("");
  const [search, setSearch] = useState("");

  const filtered = DEMO_EPISODES.filter((ep) => {
    if (domain && ep.domain !== domain) return false;
    if (outcome && ep.outcome !== outcome) return false;
    if (consolidated === "true" && !ep.consolidated) return false;
    if (consolidated === "false" && ep.consolidated) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!ep.intent.toLowerCase().includes(q) && !ep.raw_content.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setDomain("");
    setOutcome("");
    setConsolidated("");
    setSearch("");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Episodes
        </h1>
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          {filtered.length} of {DEMO_EPISODES.length} episodes
        </p>
      </div>

      <div className="mb-4">
        <FilterBar
          domain={domain}
          outcome={outcome}
          consolidated={consolidated}
          search={search}
          onDomain={setDomain}
          onOutcome={setOutcome}
          onConsolidated={setConsolidated}
          onSearch={setSearch}
          onClear={clearFilters}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map((ep) => (
          <EpisodeCard key={ep.episode_id} episode={ep} onClick={setSelected} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            No episodes match your filters.
          </p>
        </div>
      )}

      <EpisodeDrawer episode={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
