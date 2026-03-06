import React from "react";
import Link from "next/link";

const LINKS = {
  Product: ["Dashboard","Docs","API Reference","Changelog"],
  Research: ["Benchmarks","Architecture","Blog","Paper"],
  Community: ["GitHub","Discord","Twitter","Newsletter"],
};

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-10">
      {/* CTA */}
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="rounded-2xl p-8" style={{ border: "1px solid rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.04)" }}>
          <h2 className="font-display text-[28px] font-bold mb-3" style={{ color: "var(--text-primary)" }}>
            Give your agents a memory.
          </h2>
          <p className="text-[14px] mb-6" style={{ color: "var(--text-secondary)" }}>
            Open source, self-hostable, no vendor lock-in.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard" className="px-5 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all hover:opacity-90"
              style={{ background: "var(--violet)", boxShadow: "0 0 30px rgba(124,58,237,0.3)" }}>
              Start Building Free →
            </Link>
            <a href="https://github.com" className="px-5 py-2.5 rounded-lg text-[12px] font-mono border hover:bg-[var(--bg-hover)] transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
              View on GitHub ↗
            </a>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--violet)]" />
            <span className="font-display font-bold text-[15px]" style={{ color: "var(--text-primary)" }}>REM</span>
          </div>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Recursive Episodic Memory for agents.</p>
        </div>
        {Object.entries(LINKS).map(([section, items]) => (
          <div key={section}>
            <h4 className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>{section}</h4>
            {items.map((item) => (
              <a key={item} href="#" className="block text-[12px] mb-2 hover:text-[var(--text-primary)] transition-colors"
                style={{ color: "var(--text-secondary)" }}>{item}</a>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--border)] py-4 text-center font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>
        © 2025 REM · Built for the agentic future · MIT Licensed
      </div>
    </footer>
  );
}
