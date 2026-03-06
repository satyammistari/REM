"use client";
import React from "react";
import { MemoryGraph } from "@/components/graph/MemoryGraph";
import { GraphLegend } from "@/components/graph/GraphLegend";
import type { GraphData } from "@/lib/types";
import { DEMO_EPISODES, DEMO_SEMANTIC_MEMORIES } from "@/lib/demo-data";

// Build a demo graph from demo data
function buildDemoGraph(): GraphData {
  const nodes = [
    ...DEMO_EPISODES.slice(0, 15).map((ep) => ({
      id: ep.episode_id,
      type: "episode" as const,
      label: ep.intent.slice(0, 30),
      domain: ep.domain,
      consolidated: ep.consolidated,
      importance: ep.importance_score,
    })),
    ...DEMO_SEMANTIC_MEMORIES.slice(0, 4).map((sm) => ({
      id: sm.semantic_id,
      type: "semantic" as const,
      label: sm.fact.slice(0, 30),
      domain: sm.domain,
      consolidated: true,
      importance: sm.confidence,
    })),
  ];

  const edges = DEMO_EPISODES.slice(0, 14).map((ep, i) => ({
    from: ep.episode_id,
    to: DEMO_EPISODES[i + 1].episode_id,
    type: "followed_by" as const,
  }));

  // Add compressed_into edges
  DEMO_SEMANTIC_MEMORIES.slice(0, 4).forEach((sm) => {
    sm.source_episode_ids.slice(0, 3).forEach((epId) => {
      const node = nodes.find((n) => n.id === epId);
      if (node) {
        edges.push({ from: epId, to: sm.semantic_id, type: "compressed_into" });
      }
    });
  });

  return { nodes, edges };
}

const demoGraph = buildDemoGraph();

export default function GraphPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Memory Graph
        </h1>
        <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
          Temporal and semantic relationships between episodes and memories.
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <MemoryGraph data={demoGraph} height={560} />
        </div>
        <div className="w-48 flex-shrink-0">
          <GraphLegend />
          <div
            className="mt-3 rounded-[10px] p-3 text-[11px] font-mono space-y-1"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            <div>{demoGraph.nodes.filter((n) => n.type === "episode").length} episodes</div>
            <div>{demoGraph.nodes.filter((n) => n.type === "semantic").length} semantic</div>
            <div>{demoGraph.edges.length} edges</div>
          </div>
        </div>
      </div>
    </div>
  );
}
