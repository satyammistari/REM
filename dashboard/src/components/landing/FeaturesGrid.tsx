"use client";
import React, { useEffect, useRef, useState } from "react";

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: "Episodic Memory",
    desc: "Every interaction stored with causal links — intent, outcome, entities, and temporal context.",
    highlight: false,
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
        <path d="M18 9a9 9 0 0 1-9 9"/>
      </svg>
    ),
    title: "Recursive Consolidation",
    desc: "Episodes compress into semantic facts automatically — like REM sleep for your agents.",
    highlight: true,
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    ),
    title: "Causal Graph",
    desc: "Graph-native temporal and causal linking. Retrieve by causal chain, not just similarity.",
    highlight: false,
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    title: "Hybrid Retrieval",
    desc: "RAG + graph + semantic in one call. Combines Qdrant and Neo4j for &lt; 50ms results.",
    highlight: false,
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
      </svg>
    ),
    title: "Forgetting Policy",
    desc: "Expired memories auto-archived. Configurable decay curves for all memory types.",
    highlight: false,
    soon: true,
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: "Multi-Agent",
    desc: "Shared memory across agent swarms. One agent's learning becomes every agent's knowledge.",
    highlight: false,
    soon: true,
  },
];

export function FeaturesGrid() {
  const [visible, setVisible] = useState<boolean[]>(new Array(FEATURES.length).fill(false));
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const i = refs.current.indexOf(e.target as HTMLDivElement);
          if (i !== -1 && e.isIntersecting) {
            setTimeout(() => setVisible((v) => { const n = [...v]; n[i] = true; return n; }), i * 80);
          }
        });
      },
      { threshold: 0.1 }
    );
    refs.current.forEach((r) => r && obs.observe(r));
    return () => obs.disconnect();
  }, []);

  return (
    <section className="py-20 px-6 max-w-6xl mx-auto reveal">
      <div className="text-center mb-12">
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#475569" }}>FEATURES</span>
        <h2 className="font-display font-bold mt-2" style={{ fontSize: "clamp(28px,3.5vw,40px)", color: "#f1f5f9" }}>
          Built for production agents.
        </h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            ref={(el) => { refs.current[i] = el; }}
            className="rounded-xl p-5 flex flex-col gap-3 transition-all duration-500 cursor-default group"
            style={{
              background: f.highlight ? "rgba(124,58,237,0.05)" : "#0f0f1a",
              border: f.highlight ? "1px solid rgba(124,58,237,0.35)" : "1px solid #1e1e30",
              boxShadow: f.highlight ? "0 0 30px rgba(124,58,237,0.1)" : undefined,
              opacity: visible[i] ? 1 : 0,
              transform: visible[i] ? "none" : "translateY(16px)",
            }}
            onMouseEnter={(e) => {
              if (!f.highlight) (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a42";
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              if (!f.highlight) (e.currentTarget as HTMLDivElement).style.borderColor = "#1e1e30";
              (e.currentTarget as HTMLDivElement).style.transform = visible[i] ? "none" : "translateY(16px)";
            }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: f.highlight ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)" }}>
              {f.icon}
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-[14px]" style={{ color: "#f1f5f9" }}>{f.title}</h3>
              {f.highlight && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                  style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>CORE</span>
              )}
              {"soon" in f && f.soon && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono"
                  style={{ background: "rgba(148,163,184,0.1)", color: "#64748b", border: "1px solid #1e1e30" }}>COMING SOON</span>
              )}
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "#94a3b8" }}
              dangerouslySetInnerHTML={{ __html: f.desc }} />
          </div>
        ))}
      </div>
    </section>
  );
}
