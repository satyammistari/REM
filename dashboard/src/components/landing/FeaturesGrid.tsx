"use client";
import React, { useEffect, useRef, useState } from "react";

const FEATURES = [
  { icon: "📼", title: "Episodic Memory", desc: "Every agent interaction stored as a rich episode with intent, outcome, entities, and emotion signal." },
  { icon: "🔁", title: "Recursive Consolidation", desc: "Episodes are automatically merged into semantic memories via clustering — like sleep for your agents.", highlight: true },
  { icon: "🕸", title: "Causal Graph", desc: "Episodes are linked in a temporal causal graph, enabling retrieval by causal chain, not just similarity." },
  { icon: "⚡", title: "Hybrid Retrieval", desc: "Combines vector similarity (Qdrant) with graph traversal (Neo4j) for < 50ms contextual retrieval." },
  { icon: "🧹", title: "Forgetting Policy", desc: "Configurable decay so low-importance memories fade while high-signal facts persist across months." },
  { icon: "👥", title: "Multi-Agent Memory", desc: "Share memory across agent networks. One agent's learning becomes another's starting point." },
];

export function FeaturesGrid() {
  const [visible, setVisible] = useState<boolean[]>(new Array(FEATURES.length).fill(false));
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const i = refs.current.indexOf(e.target as HTMLDivElement);
        if (i !== -1 && e.isIntersecting) {
          setTimeout(() => setVisible((v) => { const n = [...v]; n[i] = true; return n; }), i * 80);
        }
      });
    }, { threshold: 0.1 });
    refs.current.forEach((r) => r && obs.observe(r));
    return () => obs.disconnect();
  }, []);

  return (
    <section className="py-20 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--violet-light)" }}>FEATURES</span>
        <h2 className="font-display text-[32px] font-bold mt-2" style={{ color: "var(--text-primary)" }}>Built for production agents.</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f, i) => (
          <div key={f.title} ref={(el) => { refs.current[i] = el; }}
            className="rounded-xl p-5 transition-all duration-500"
            style={{
              background: f.highlight ? "rgba(124,58,237,0.06)" : "var(--bg-surface)",
              border: f.highlight ? "1px solid rgba(124,58,237,0.25)" : "1px solid var(--border)",
              boxShadow: f.highlight ? "0 0 30px rgba(124,58,237,0.1)" : undefined,
              opacity: visible[i] ? 1 : 0,
              transform: visible[i] ? "none" : "translateY(16px)",
            }}>
            <div className="text-2xl mb-3">{f.icon}</div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium text-[14px]" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
              {f.highlight && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono" style={{ background: "rgba(124,58,237,0.15)", color: "var(--violet-light)" }}>CORE</span>
              )}
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
