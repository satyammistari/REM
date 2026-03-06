"use client";

import React, { useState } from "react";

const PY_SNIPPET = `from rem_memory import REMClient

client = REMClient(api_key="rem_sk_...", base_url="http://localhost:8000")

# After each task
await client.write(
    content="User prefers TypeScript over JavaScript",
    agent_id="my-agent",
    user_id="demo-user",
)

# Before each task
memory = await client.retrieve(
    query="What are this user's preferences?",
    agent_id="my-agent",
)
print(memory.injection_prompt)  # Ready for LLM
`;

export function CodeSnippet() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PY_SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <section className="px-6 sm:px-10 pb-16 max-w-5xl mx-auto">
      <div className="glass rounded-2xl p-5 border border-[var(--border-bright)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-secondary)]">Add memory in 10 lines</span>
            <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <span className="px-2 py-0.5 rounded-full bg-[rgba(15,23,42,0.9)] border border-[var(--border)] font-mono">
                Python
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[rgba(15,23,42,0.6)] border border-[var(--border)] font-mono opacity-60">
                TypeScript (soon)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="text-[11px] px-3 py-1 rounded-full bg-[rgba(15,23,42,0.9)] border border-[var(--border-bright)] font-mono text-[var(--text-secondary)] hover:bg-[rgba(15,23,42,0.8)]"
          >
            {copied ? "Copied" : "Copy code"}
          </button>
        </div>
        <div className="relative">
          <pre className="font-mono text-[11px] leading-relaxed bg-[#020617] rounded-xl p-4 overflow-auto">
            {PY_SNIPPET}
          </pre>
        </div>
      </div>
    </section>
  );
}

