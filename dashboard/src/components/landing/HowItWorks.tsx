import React from "react";

const STEPS = [
  {
    num: "01",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    title: "Agent completes task",
    desc: "REM parses the episode, extracts entities, embeds it, and stores across all memory layers.",
    code: "rem.write(episode)",
    highlight: false,
  },
  {
    num: "02",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
      </svg>
    ),
    title: "Memory evolves automatically",
    desc: "Episodes compress into semantic memories. Patterns become persistent, durable knowledge.",
    code: "engine.consolidate()",
    highlight: true,
  },
  {
    num: "03",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    title: "Context injected instantly",
    desc: "Before each task, REM retrieves the most relevant memories and formats them for your LLM.",
    code: "rem.retrieve(query)",
    highlight: false,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-6 max-w-5xl mx-auto reveal">
      <div className="text-center mb-14">
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#475569" }}>HOW IT WORKS</span>
        <h2 className="font-display font-bold mt-2" style={{ fontSize: "clamp(28px,3.5vw,40px)", color: "#f1f5f9" }}>Three steps. One memory OS.</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-5 relative">
        {STEPS.map((s, i) => (
          <div key={s.num} className="relative rounded-xl p-6 flex flex-col gap-4"
            style={{
              background: s.highlight ? "rgba(124,58,237,0.05)" : "#0f0f1a",
              border: s.highlight ? "1px solid #7c3aed" : "1px solid #1e1e30",
              boxShadow: s.highlight ? "0 0 30px rgba(124,58,237,0.1)" : undefined,
            }}>
            {/* THE REM DIFFERENCE badge */}
            {s.highlight && (
              <div className="absolute -top-3 left-5">
                <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest"
                  style={{ background: "#7c3aed", color: "white" }}>THE REM DIFFERENCE</span>
              </div>
            )}
            {/* Number decoration */}
            <div className="font-display font-extrabold text-[48px] leading-none select-none"
              style={{ color: s.highlight ? "rgba(124,58,237,0.2)" : "#1e1e30" }}>{s.num}</div>
            <div className="flex items-start gap-3 -mt-4">
              <span className="mt-0.5">{s.icon}</span>
              <div>
                <h3 className="font-display font-semibold text-[16px]" style={{ color: "#f1f5f9" }}>{s.title}</h3>
                <p className="text-[13px] leading-relaxed mt-1" style={{ color: "#94a3b8" }}>{s.desc}</p>
              </div>
            </div>
            <code className="font-mono text-[12px] px-3 py-2 rounded-md" style={{ background: "#0a0a14", border: "1px solid #1e1e30", color: "#a78bfa" }}>
              {s.code}
            </code>
            {/* Arrow between boxes */}
            {i < STEPS.length - 1 && (
              <div className="hidden md:flex flex-col items-center absolute -right-[14px] top-1/2 -translate-y-1/2 z-10">
                <span className="font-mono text-[16px]" style={{ color: "#2a2a42" }}>→</span>
                <span className="font-mono text-[9px]" style={{ color: "#475569" }}>async</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
