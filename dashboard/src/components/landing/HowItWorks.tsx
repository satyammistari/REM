import React from "react";

const STEPS = [
  { num: "01", title: "Write", desc: "Agents stream episodes after each task — intent, entities, outcome, raw content. One API call." },
  { num: "02", title: "Consolidate", desc: "The Python worker clusters similar episodes and compresses them into durable semantic memories using recursive summarization.", highlight: true },
  { num: "03", title: "Retrieve", desc: "Before each new task, REM injects the most relevant episodes and learned facts into the LLM context window." },
];

export function HowItWorks() {
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--violet-light)" }}>HOW IT WORKS</span>
        <h2 className="font-display text-[32px] font-bold mt-2" style={{ color: "var(--text-primary)" }}>Three steps. One memory OS.</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6 relative">
        {STEPS.map((s, i) => (
          <div key={s.num} className="relative rounded-xl p-6"
            style={{
              background: s.highlight ? "rgba(124,58,237,0.06)" : "var(--bg-surface)",
              border: s.highlight ? "1px solid rgba(124,58,237,0.3)" : "1px solid var(--border)",
              boxShadow: s.highlight ? "0 0 40px rgba(124,58,237,0.12)" : undefined,
            }}>
            {s.highlight && (
              <div className="absolute -top-3 left-4">
                <span className="px-2 py-1 rounded text-[9px] font-mono uppercase tracking-widest"
                  style={{ background: "var(--violet)", color: "white" }}>The REM Difference</span>
              </div>
            )}
            <div className="font-mono text-[11px] mb-3" style={{ color: "var(--violet-light)" }}>{s.num}</div>
            <h3 className="font-display text-[20px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{s.title}</h3>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.desc}</p>
            {i < STEPS.length - 1 && (
              <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10 font-mono text-[10px]"
                style={{ color: "var(--text-muted)" }}>→</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
