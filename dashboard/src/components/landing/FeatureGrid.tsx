import React from "react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

const features: Feature[] = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9.5 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9.5L14.5 3z" />
        <path d="M14 3v6h6" />
      </svg>
    ),
    title: "Episode Capture",
    description: "Every agent interaction is captured as a structured episode with intent, entities, domain, and importance scoring.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
    title: "Semantic Retrieval",
    description: "Hybrid vector + graph retrieval surfaces the most relevant memories ranked by recency, importance, and domain match.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2v20M2 12h20" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    title: "Memory Consolidation",
    description: "Background consolidation distils raw episodes into durable semantic facts, reducing noise and improving precision.",
    highlight: true,
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="18" r="3" />
        <path d="M9 6h6M6 9v6M18 9v6M9 18h6" />
      </svg>
    ),
    title: "Knowledge Graph",
    description: "Neo4j-backed temporal and semantic edges track how memories evolve and relate across sessions.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
        <polygon points="18,2 22,6 12,16 8,16 8,12" />
      </svg>
    ),
    title: "Drop-in SDK",
    description: "Python SDK with LangChain and AutoGen integrations — add persistent memory to any agent in minutes.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    title: "Live Dashboard",
    description: "Real-time visibility into memory health, consolidation queue, retrieval latency, and per-agent stats.",
  },
];

export function FeatureGrid() {
  return (
    <section className="py-20 px-6" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "var(--violet-light)" }}>
            Capabilities
          </p>
          <h2 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            Everything agents need to remember
          </h2>
          <p className="mt-3 text-sm max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
            REM handles the full memory lifecycle — from raw episode ingestion to consolidated semantic facts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-[10px] p-5 transition-colors hover:bg-[var(--bg-hover)]"
              style={{
                background: f.highlight ? "rgba(139,92,246,0.06)" : "var(--bg-surface)",
                border: `1px solid ${f.highlight ? "rgba(139,92,246,0.30)" : "var(--border)"}`,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                style={{
                  background: f.highlight ? "rgba(139,92,246,0.15)" : "var(--bg-elevated)",
                  color: f.highlight ? "var(--violet-light)" : "var(--text-secondary)",
                }}
              >
                {f.icon}
              </div>
              <h3
                className="font-semibold text-[13px] mb-1"
                style={{ color: f.highlight ? "var(--violet-light)" : "var(--text-primary)" }}
              >
                {f.title}
              </h3>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
