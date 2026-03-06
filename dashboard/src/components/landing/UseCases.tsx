import React from "react";

const CASES = [
  { icon: "💻", title: "Coding Agents", desc: "Remember user preferences, project conventions, and past bugs across every session." },
  { icon: "🤖", title: "Personal Assistants", desc: "Build agents that know your habits, preferences, and long-term goals." },
  { icon: "🔬", title: "Research Agents", desc: "Accumulate domain knowledge across hundreds of research sessions." },
  { icon: "🎧", title: "Customer Support", desc: "Agents that remember every past interaction and never ask the same question twice." },
  { icon: "🌐", title: "Multi-Agent Teams", desc: "Share memory across an agent network — one agent's insight benefits all." },
  { icon: "❤", title: "Healthcare AI", desc: "Persistent patient context that evolves safely over time." },
];

export function UseCases() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--violet-light)" }}>USE CASES</span>
        <h2 className="font-display text-[32px] font-bold mt-2" style={{ color: "var(--text-primary)" }}>Every agent. Every domain.</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CASES.map((c) => (
          <div key={c.title} className="rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
            <div className="text-2xl mb-3">{c.icon}</div>
            <h3 className="font-medium text-[14px] mb-1.5" style={{ color: "var(--text-primary)" }}>{c.title}</h3>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
