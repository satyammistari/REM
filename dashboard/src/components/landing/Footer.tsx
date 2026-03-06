import React from "react";
import Link from "next/link";

const LINKS = {
  Product: ["Docs", "API Reference", "SDK", "Changelog"],
  Research: ["Benchmarks", "Paper", "MemoryBench"],
  Community: ["GitHub", "Discord", "Twitter / X"],
};

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid #1e1e30", marginTop: 40 }}>
      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="relative rounded-2xl p-1" style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)" }}>
          <div className="rounded-xl px-8 py-12" style={{ background: "#0f0f1a" }}>
            <h2 className="font-display font-bold mb-3" style={{ fontSize: "clamp(28px,4vw,48px)", color: "#f1f5f9" }}>
              Give your agents a memory.
            </h2>
            <p className="text-[14px] mb-8" style={{ color: "#94a3b8" }}>
              Open source. Self-hostable. Production-ready.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="px-6 py-2.5 rounded-lg text-[14px] font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "#7c3aed", boxShadow: "0 0 30px rgba(124,58,237,0.4)" }}
              >
                Get Started Free →
              </Link>
              <a
                href="/docs"
                className="px-6 py-2.5 rounded-lg text-[13px] font-mono transition-colors hover:bg-[#161625]"
                style={{ border: "1px solid #2a2a42", color: "#94a3b8" }}
              >
                Read the Docs
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Links grid */}
      <div
        className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8"
        style={{ borderTop: "1px solid #1e1e30" }}
      >
        {/* Brand col */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#7c3aed" }} />
            <span className="font-display font-bold text-[15px]" style={{ color: "#f1f5f9" }}>REM</span>
          </div>
          <p className="text-[12px] mb-1" style={{ color: "#475569" }}>Memory OS for AI Agents</p>
          <p className="font-mono text-[11px]" style={{ color: "#475569" }}>MIT License</p>
        </div>
        {Object.entries(LINKS).map(([section, items]) => (
          <div key={section}>
            <h4 className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: "#475569" }}>{section}</h4>
            {items.map((item) => (
              <a key={item} href="#" className="block text-[12px] mb-2 transition-colors hover:text-[#f1f5f9]"
                style={{ color: "#94a3b8" }}>
                {item}
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="py-4 text-center font-mono text-[10px]" style={{ borderTop: "1px solid #1e1e30", color: "#475569" }}>
        © 2025 REM · Built for the agentic future
      </div>
    </footer>
  );
}
