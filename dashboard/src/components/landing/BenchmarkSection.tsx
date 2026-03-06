"use client";
import React from "react";

const BENCHMARKS = [
  { name: "LongMemEval", measures: "Long-term memory, temporal reasoning", rem: "81.6%",  mem0: "67.2%", zep: "71.4%" },
  { name: "LoCoMo",      measures: "Fact recall, multi-hop reasoning",     rem: "#1",     mem0: "#3",    zep: "#2"   },
  { name: "ConvoMem",    measures: "Preference learning, personalization",  rem: "#1",     mem0: "#3",    zep: "#2"   },
];

export function BenchmarkSection() {
  return (
    <section id="benchmarks" className="py-20 px-6 max-w-5xl mx-auto reveal">
      <div className="text-center mb-12">
        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#475569" }}>BENCHMARKS</span>
        <h2 className="font-display font-bold mt-2" style={{ fontSize: "clamp(28px,3.5vw,40px)", color: "#f1f5f9" }}>State of the Art.</h2>
        <p className="text-[14px] mt-3 max-w-xl mx-auto" style={{ color: "#94a3b8" }}>
          Evaluated on the three major AI memory benchmarks.
        </p>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "#0f0f1a", border: "1px solid #1e1e30" }}>
        {/* Header row */}
        <div className="grid grid-cols-6 px-5 py-3" style={{ background: "#161625", borderBottom: "1px solid #1e1e30" }}>
          {["Benchmark", "What It Measures", "REM", "Mem0", "Zep", "Winner"].map((h) => (
            <div key={h} className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#475569" }}>{h}</div>
          ))}
        </div>
        {BENCHMARKS.map((b) => (
          <div key={b.name} className="grid grid-cols-6 px-5 py-4 transition-colors cursor-default"
            style={{ borderBottom: "1px solid #1e1e30" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#161625")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <div className="font-mono text-[12px] font-semibold" style={{ color: "#f1f5f9" }}>{b.name}</div>
            <div className="font-mono text-[11px]" style={{ color: "#475569" }}>{b.measures}</div>
            <div className="font-mono text-[13px] font-bold" style={{ color: "#a78bfa" }}>{b.rem}</div>
            <div className="font-mono text-[12px]" style={{ color: "#94a3b8" }}>{b.mem0}</div>
            <div className="font-mono text-[12px]" style={{ color: "#94a3b8" }}>{b.zep}</div>
            <div className="font-mono text-[11px] font-semibold" style={{ color: "#a78bfa" }}>🏆 REM</div>
          </div>
        ))}
      </div>

      <div className="text-center mt-5">
        <p className="font-mono text-[12px] mb-2" style={{ color: "#475569" }}>Run your own benchmarks with MemoryBench</p>
        <code className="font-mono text-[12px] px-3 py-1.5 rounded" style={{ background: "#0f0f1a", border: "1px solid #1e1e30", color: "#a78bfa" }}>
          npx skills add rem-ai/memorybench
        </code>
      </div>
    </section>
  );
}
