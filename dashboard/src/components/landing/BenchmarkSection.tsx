import React from "react";

const BENCHMARKS = [
  { name: "LongMemEval", measures: "Long-term memory accuracy", rem: "81.6%", mem0: "67.2%", zep: "71.1%" },
  { name: "LoCoMo", measures: "Conversation memory", rem: "78.3%", mem0: "61.4%", zep: "65.8%" },
  { name: "ConvoMem", measures: "Multi-turn coherence", rem: "84.1%", mem0: "70.9%", zep: "73.4%" },
];

export function BenchmarkSection() {
  return (
    <section id="benchmarks" className="py-20 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--violet-light)" }}>BENCHMARKS</span>
        <h2 className="font-display text-[32px] font-bold mt-2" style={{ color: "var(--text-primary)" }}>State of the Art.</h2>
        <p className="text-[14px] mt-3 max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
          Independently evaluated on standard memory benchmarks.
        </p>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <div className="grid grid-cols-6 px-5 py-3 border-b border-[var(--border)]">
          {["Benchmark","Measures","REM","Mem0","Zep","Winner"].map((h) => (
            <div key={h} className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{h}</div>
          ))}
        </div>
        {BENCHMARKS.map((b) => (
          <div key={b.name} className="grid grid-cols-6 px-5 py-4 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors">
            <div className="font-mono text-[12px] font-medium" style={{ color: "var(--text-primary)" }}>{b.name}</div>
            <div className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>{b.measures}</div>
            <div className="font-mono text-[13px] font-bold" style={{ color: "var(--violet-light)" }}>{b.rem}</div>
            <div className="font-mono text-[12px]" style={{ color: "var(--text-secondary)" }}>{b.mem0}</div>
            <div className="font-mono text-[12px]" style={{ color: "var(--text-secondary)" }}>{b.zep}</div>
            <div className="font-mono text-[11px]" style={{ color: "#10b981" }}>🏆 REM</div>
          </div>
        ))}
      </div>
    </section>
  );
}
