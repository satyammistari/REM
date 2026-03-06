"use client";

import React from "react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 px-6 sm:px-10 max-w-6xl mx-auto">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,#22d3ee_0,#0a0a0f_70%)] opacity-30 blur-3xl" />
        <div className="absolute -left-40 top-40 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,#6366f1_0,#0a0a0f_70%)] opacity-25 blur-3xl" />
      </div>

      <div className="relative grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-10 items-center">
        <div className="space-y-6 animate-slide-up">
          <p className="font-mono text-[11px] tracking-widest text-[var(--text-secondary)] uppercase">
            Open Source · v0.1.0 Beta
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-tight">
            Your AI Agents
            <br />
            <span className="bg-clip-text text-transparent bg-[linear-gradient(90deg,#6366f1,#22d3ee)]">
              Have Amnesia.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-xl">
            REM is the memory operating system for AI agents. Persistent episodic storage,
            recursive consolidation, and instant retrieval — built for production workloads.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[var(--accent-indigo)] text-sm font-medium text-white shadow-lg hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-shadow"
            >
              Get Started Free →
            </Link>
            <Link
              href="https://github.com/yourusername/rem"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-[var(--border-bright)] text-xs font-mono text-[var(--text-secondary)] hover:bg-[rgba(15,23,42,0.9)]"
            >
              View on GitHub
            </Link>
          </div>

          <p className="text-[11px] text-[var(--text-muted)]">
            No credit card required · Open source · Self-hostable
          </p>
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top,#22d3ee20,transparent_55%)] pointer-events-none" />
          <div className="glass rounded-3xl p-5 h-full flex flex-col gap-4 relative">
            <p className="text-xs text-[var(--text-secondary)] mb-2">
              Live memory graph snapshot
            </p>
            <div className="flex-1 relative overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top,#0f172a,#020617)]">
              {/* simple animated nodes, no canvas */}
              <div className="absolute inset-0">
                {Array.from({ length: 24 }).map((_, idx) => {
                  const size = idx % 7 === 0 ? 10 : 6;
                  const delay = (idx * 0.4).toFixed(1);
                  return (
                    <div
                      key={idx}
                      className="absolute rounded-full bg-[rgba(148,163,184,0.28)] animate-float"
                      style={{
                        width: size,
                        height: size,
                        top: `${10 + (idx * 13) % 80}%`,
                        left: `${5 + (idx * 19) % 90}%`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  );
                })}
              </div>
              <div className="absolute inset-0 opacity-25">
                <div className="w-full h-full bg-[radial-gradient(circle_at_center,transparent_0,#020617_60%)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

