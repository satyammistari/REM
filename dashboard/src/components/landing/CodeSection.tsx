"use client";
import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

const TABS = [
  {
    id: "python",
    label: "Python",
    filename: "agent.py",
    code: `from rem_memory import REMClient

client = REMClient(api_key="rem_live_sk_...")

# Store an episode
client.write_episode(
    agent_id="my-agent",
    task="Refactor auth module",
    outcome="success",
    domain="coding",
    raw_content="User prefers TypeScript strict mode."
)

# Retrieve relevant memory before next task
context = client.retrieve(
    agent_id="my-agent",
    query="User coding preferences"
)
print(context.injection_prompt)`,
  },
  {
    id: "go",
    label: "Go",
    filename: "main.go",
    code: `import rem "github.com/rem-ai/rem-go"

client := rem.New("rem_live_sk_...")

// Write episode
client.WriteEpisode(ctx, rem.Episode{
    AgentID: "my-agent",
    Task:    "Refactor auth module",
    Outcome: "success",
    Domain:  "coding",
})

// Retrieve context
result, _ := client.Retrieve(ctx, rem.Query{
    AgentID: "my-agent",
    Query:   "User coding preferences",
})
fmt.Println(result.InjectionPrompt)`,
  },
  {
    id: "langchain",
    label: "LangChain",
    filename: "chain.py",
    code: `from rem_memory.integrations.langchain import REMMemory
from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationChain

memory = REMMemory(
    api_key="rem_live_sk_...",
    agent_id="my-agent"
)

llm = ChatOpenAI(model="gpt-4o")
chain = ConversationChain(llm=llm, memory=memory)

# Memory is automatically injected
response = chain.predict(
    input="Continue the TypeScript refactor"
)`,
  },
];

export function CodeSection() {
  const [tab, setTab] = useState("python");
  const [copied, setCopied] = useState(false);
  const current = TABS.find((t) => t.id === tab)!;

  const copy = async () => {
    await navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 px-6 max-w-6xl mx-auto">
      <div className="grid md:grid-cols-[5fr_6fr] gap-12 items-center">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--violet-light)" }}>
            INTEGRATION
          </span>
          <h2 className="font-display text-[32px] font-bold mt-2 mb-4" style={{ color: "var(--text-primary)" }}>
            Memory in 3 lines.
          </h2>
          <p className="text-[14px] leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
            Drop REM into any agent framework. Python, Go, or LangChain — same API.
          </p>
          {["Write episodes after every task","Retrieval auto-injects context","Works with any LLM or framework"].map((f) => (
            <div key={f} className="flex items-center gap-2 mb-2">
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                style={{ background: "rgba(6,182,212,0.15)", color: "var(--cyan-light)" }}>✓</span>
              <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{f}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center border-b border-[var(--border)] px-4">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="px-4 py-3 text-[12px] font-medium transition-colors border-b-2"
                style={{ color: tab === t.id ? "var(--violet-light)" : "var(--text-muted)", borderColor: tab === t.id ? "var(--violet)" : "transparent" }}>
                {t.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-3">
              <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>{current.filename}</span>
              <button onClick={copy} className="p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors">
                {copied ? <Check size={13} style={{ color: "#10b981" }} /> : <Copy size={13} style={{ color: "var(--text-muted)" }} />}
              </button>
            </div>
          </div>
          <pre className="p-5 text-[12px] font-mono leading-relaxed overflow-x-auto"
            style={{ color: "var(--text-code)" }}>{current.code}</pre>
        </div>
      </div>
    </section>
  );
}
