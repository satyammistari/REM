import React from "react";
import Link from "next/link";
import { Hero } from "@/components/landing/Hero";
import { CodeSnippet } from "@/components/landing/CodeSnippet";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)]/80 backdrop-blur-xl bg-[#020617]/60 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm tracking-tight">REM</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border-bright)] text-[var(--text-secondary)]">
              Recursive Episodic Memory
            </span>
          </div>
          <nav className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
            <Link href="/docs" className="hover:text-[var(--text-primary)]">
              Docs
            </Link>
            <Link
              href="https://github.com/yourusername/rem"
              className="hover:text-[var(--text-primary)]"
            >
              GitHub
            </Link>
            <Link
              href="/dashboard"
              className="ml-2 inline-flex items-center px-3 py-1.5 rounded-full bg-[var(--accent-indigo)] text-[11px] text-white font-medium"
            >
              Get Started →
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <Hero />

        <section className="px-6 sm:px-10 max-w-5xl mx-auto pb-12">
          <h2 className="font-display text-xl mb-4">Why REM?</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="glass rounded-xl p-4">
              <h3 className="font-medium mb-2">Agents Forget</h3>
              <p className="text-[var(--text-secondary)]">
                Every conversation starts from zero context. REM lets agents accumulate persistent
                episodic memory over weeks and months.
              </p>
            </div>
            <div className="glass rounded-xl p-4">
              <h3 className="font-medium mb-2">Context Limits</h3>
              <p className="text-[var(--text-secondary)]">
                128k tokens is not enough for months of work. REM compresses histories into durable
                semantic memories.
              </p>
            </div>
            <div className="glass rounded-xl p-4">
              <h3 className="font-medium mb-2">Beyond RAG</h3>
              <p className="text-[var(--text-secondary)]">
                Most RAG just retrieves documents. REM builds a causal graph of episodes and learned
                facts that actually evolves.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 sm:px-10 max-w-5xl mx-auto pb-12">
          <h2 className="font-display text-xl mb-4">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="glass rounded-xl p-4">
              <span className="text-[10px] font-mono text-[var(--text-secondary)] mb-1">
                01 · WRITE
              </span>
              <p className="text-[var(--text-secondary)]">
                Agents stream episodes after each task: intent, entities, outcomes, and raw content.
              </p>
            </div>
            <div className="glass rounded-xl p-4">
              <span className="text-[10px] font-mono text-[var(--text-secondary)] mb-1">
                02 · CONSOLIDATE
              </span>
              <p className="text-[var(--text-secondary)]">
                The Python worker clusters similar episodes and compresses them into semantic
                memories.
              </p>
            </div>
            <div className="glass rounded-xl p-4">
              <span className="text-[10px] font-mono text-[var(--text-secondary)] mb-1">
                03 · RETRIEVE
              </span>
              <p className="text-[var(--text-secondary)]">
                Before each new task, REM injects the most relevant episodes and facts into the LLM
                prompt.
              </p>
            </div>
          </div>
        </section>

        <CodeSnippet />
      </main>

      <footer className="border-t border-[var(--border)] mt-10">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-4 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
          <span>REM — built for the agentic future.</span>
          <span>MIT Licensed</span>
        </div>
      </footer>
    </div>
  );
}

