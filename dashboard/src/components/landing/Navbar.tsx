"use client";
import React, { useState } from "react";
import Link from "next/link";

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 h-14 flex items-center border-b border-[var(--border)] px-6"
      style={{ background: "rgba(8,8,15,0.85)", backdropFilter: "blur(16px)" }}>
      <div className="flex items-center gap-2.5">
        <span className="relative flex items-center justify-center w-5 h-5">
          <span className="absolute w-full h-full rounded-full bg-[var(--violet)] opacity-20 animate-ping" />
          <span className="relative w-2.5 h-2.5 rounded-full bg-[var(--violet)]" />
        </span>
        <span className="font-display font-bold text-[16px]" style={{ color: "var(--text-primary)" }}>REM</span>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest"
          style={{ background: "rgba(124,58,237,0.15)", color: "var(--violet-light)", border: "1px solid rgba(124,58,237,0.25)" }}>beta</span>
      </div>
      <div className="hidden md:flex items-center gap-6 mx-auto text-[12px]" style={{ color: "var(--text-secondary)" }}>
        {["Docs","GitHub","Research","Benchmarks"].map(l => (
          <a key={l} href={l === "Benchmarks" ? "#benchmarks" : "#"}
            className="hover:text-[var(--text-primary)] transition-colors">{l}</a>
        ))}
      </div>
      <div className="hidden md:flex items-center gap-3 ml-auto">
        <a href="https://github.com" className="font-mono text-[11px] flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-[var(--bg-hover)] transition-colors"
          style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}>★ 1.2k</a>
        <Link href="/dashboard" className="px-4 py-1.5 rounded-full text-[12px] font-medium text-white transition-all hover:opacity-90"
          style={{ background: "var(--violet)", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}>Get API Key →</Link>
      </div>
      <button className="md:hidden ml-auto p-1.5" onClick={() => setOpen(v => !v)}>
        <span className="block w-4 h-0.5 bg-[var(--text-secondary)] mb-1" />
        <span className="block w-4 h-0.5 bg-[var(--text-secondary)]" />
      </button>
    </nav>
  );
}
