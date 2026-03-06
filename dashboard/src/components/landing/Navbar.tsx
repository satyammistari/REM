"use client";
import React, { useState } from "react";
import Link from "next/link";

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 flex items-center px-6 md:px-10"
      style={{
        height: 56,
        background: "rgba(8,8,15,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid #1e1e30",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <span className="relative flex items-center justify-center w-5 h-5">
          <span
            className="absolute w-full h-full rounded-full animate-ping-slow"
            style={{ background: "rgba(124,58,237,0.35)" }}
          />
          <span className="relative w-2.5 h-2.5 rounded-full" style={{ background: "#7c3aed" }} />
        </span>
        <span className="font-display font-bold text-[17px]" style={{ color: "#f1f5f9" }}>
          REM
        </span>
        <span
          className="px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest"
          style={{
            background: "rgba(124,58,237,0.15)",
            color: "#a78bfa",
            border: "1px solid rgba(124,58,237,0.3)",
          }}
        >
          beta
        </span>
      </div>

      {/* Center links */}
      <div className="hidden md:flex items-center gap-7 mx-auto font-mono text-[12px]" style={{ color: "#94a3b8" }}>
        <a href="/docs" className="hover:text-[#f1f5f9] transition-colors">Docs</a>
        <a
          href="https://github.com/satyammistari/REM"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[#f1f5f9] transition-colors"
        >
          GitHub ↗
        </a>
        <a href="#benchmarks" className="hover:text-[#f1f5f9] transition-colors">Benchmarks</a>
        <a href="#how-it-works" className="hover:text-[#f1f5f9] transition-colors">How It Works</a>
      </div>

      {/* Right CTAs */}
      <div className="hidden md:flex items-center gap-3 ml-auto flex-shrink-0">
        <a
          href="https://github.com/satyammistari/REM"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors hover:bg-[#1a1a2e]"
          style={{ color: "#94a3b8", border: "1px solid #1e1e30" }}
        >
          ★ GitHub
        </a>
        <Link
          href="/dashboard"
          className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "#7c3aed", boxShadow: "0 0 20px rgba(124,58,237,0.35)" }}
        >
          Get API Key →
        </Link>
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden ml-auto p-1.5 flex flex-col gap-1"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        <span className="block w-5 h-0.5" style={{ background: "#94a3b8" }} />
        <span className="block w-5 h-0.5" style={{ background: "#94a3b8" }} />
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="absolute top-[56px] left-0 right-0 flex flex-col gap-1 px-6 py-4 md:hidden"
          style={{ background: "#0f0f1a", borderBottom: "1px solid #1e1e30" }}
        >
          {["Docs", "GitHub ↗", "Benchmarks", "How It Works"].map((l) => (
            <a
              key={l}
              href="#"
              className="py-2 font-mono text-[13px] transition-colors hover:text-[#f1f5f9]"
              style={{ color: "#94a3b8", borderBottom: "1px solid #1e1e30" }}
            >
              {l}
            </a>
          ))}
          <Link href="/dashboard" className="mt-2 px-4 py-2 rounded-lg text-center text-[13px] font-semibold text-white" style={{ background: "#7c3aed" }}>
            Get API Key →
          </Link>
        </div>
      )}
    </nav>
  );
}
