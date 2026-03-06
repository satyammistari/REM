"use client";
import React, { useState } from "react";

/* ─── Syntax-highlighted code blocks (inline spans) ─────────────────── */
function PythonCode() {
  return (
    <pre className="p-5 font-mono text-[13px] leading-[1.75] overflow-x-auto" style={{ color: "#cbd5e1" }}>
      <span className="tok-kw">from</span>{" "}rem_memory <span className="tok-kw">import</span>{" "}<span className="tok-fn">REMClient</span>{"\n\n"}
      client = <span className="tok-fn">REMClient</span>(<span className="tok-var">api_key</span>=<span className="tok-str">&quot;rem_sk_...&quot;</span>){"\n\n"}
      <span className="tok-cm"># After agent completes task</span>{"\n"}
      <span className="tok-kw">await</span> client.<span className="tok-fn">write</span>({"\n"}
      {"    "}<span className="tok-var">content</span>=<span className="tok-str">&quot;User prefers TypeScript strict mode&quot;</span>,{"\n"}
      {"    "}<span className="tok-var">agent_id</span>=<span className="tok-str">&quot;agent_123&quot;</span>,{"\n"}
      {"    "}<span className="tok-var">outcome</span>=<span className="tok-str">&quot;success&quot;</span>{"\n"}
      ){"\n\n"}
      <span className="tok-cm"># Before agent starts next task</span>{"\n"}
      memory = <span className="tok-kw">await</span> client.<span className="tok-fn">retrieve</span>({"\n"}
      {"    "}<span className="tok-var">query</span>=<span className="tok-str">&quot;What does this user prefer?&quot;</span>,{"\n"}
      {"    "}<span className="tok-var">agent_id</span>=<span className="tok-str">&quot;agent_123&quot;</span>{"\n"}
      ){"\n"}
      <span className="tok-fn">print</span>(memory.<span className="tok-var">injection_prompt</span>)
    </pre>
  );
}

function GoCode() {
  return (
    <pre className="p-5 font-mono text-[13px] leading-[1.75] overflow-x-auto" style={{ color: "#cbd5e1" }}>
      client := rem.<span className="tok-fn">NewClient</span>(<span className="tok-str">&quot;rem_sk_...&quot;</span>){"\n\n"}
      client.<span className="tok-fn">WriteEpisode</span>(ctx, rem.<span className="tok-fn">Episode</span>{"{"}{"\n"}
      {"    "}Content: <span className="tok-str">&quot;User prefers TypeScript strict mode&quot;</span>,{"\n"}
      {"    "}AgentID: <span className="tok-str">&quot;agent_123&quot;</span>,{"\n"}
      {"    "}Outcome: <span className="tok-str">&quot;success&quot;</span>,{"\n"}
      {"})"}{"\n\n"}
      result, _ := client.<span className="tok-fn">Retrieve</span>(ctx, rem.<span className="tok-fn">Query</span>{"{"}{"\n"}
      {"    "}Query:   <span className="tok-str">&quot;user preferences&quot;</span>,{"\n"}
      {"    "}AgentID: <span className="tok-str">&quot;agent_123&quot;</span>,{"\n"}
      {"})"}{"\n"}
      fmt.<span className="tok-fn">Println</span>(result.<span className="tok-var">InjectionPrompt</span>)
    </pre>
  );
}

function LangChainCode() {
  return (
    <pre className="p-5 font-mono text-[13px] leading-[1.75] overflow-x-auto" style={{ color: "#cbd5e1" }}>
      <span className="tok-kw">from</span>{" "}rem_memory.integrations <span className="tok-kw">import</span>{" "}<span className="tok-fn">REMMemory</span>{"\n\n"}
      memory = <span className="tok-fn">REMMemory</span>({"\n"}
      {"    "}<span className="tok-var">api_key</span>=<span className="tok-str">&quot;rem_sk_...&quot;</span>,{"\n"}
      {"    "}<span className="tok-var">agent_id</span>=<span className="tok-str">&quot;agent_123&quot;</span>{"\n"}
      ){"\n\n"}
      chain = <span className="tok-fn">ConversationChain</span>({"\n"}
      {"    "}<span className="tok-var">llm</span>=<span className="tok-fn">ChatOpenAI</span>(),{"\n"}
      {"    "}<span className="tok-var">memory</span>=memory  <span className="tok-cm"># drop-in replacement</span>{"\n"}
      ){"\n"}
      <span className="tok-cm"># Agent now remembers everything.</span>
    </pre>
  );
}

const TABS = [
  { id: "python",    label: "Python",    filename: "agent.py",   Component: PythonCode,    rawCode: `from rem_memory import REMClient\n\nclient = REMClient(api_key="rem_sk_...")\n\n# After agent completes task\nawait client.write(\n    content="User prefers TypeScript strict mode",\n    agent_id="agent_123",\n    outcome="success"\n)\n\n# Before agent starts next task\nmemory = await client.retrieve(\n    query="What does this user prefer?",\n    agent_id="agent_123"\n)\nprint(memory.injection_prompt)` },
  { id: "go",        label: "Go",        filename: "main.go",    Component: GoCode,        rawCode: `client := rem.NewClient("rem_sk_...")\n\nclient.WriteEpisode(ctx, rem.Episode{\n    Content: "User prefers TypeScript strict mode",\n    AgentID: "agent_123",\n    Outcome: "success",\n})\n\nresult, _ := client.Retrieve(ctx, rem.Query{\n    Query:   "user preferences",\n    AgentID: "agent_123",\n})\nfmt.Println(result.InjectionPrompt)` },
  { id: "langchain", label: "LangChain", filename: "chain.py",   Component: LangChainCode, rawCode: `from rem_memory.integrations import REMMemory\n\nmemory = REMMemory(\n    api_key="rem_sk_...",\n    agent_id="agent_123"\n)\n\nchain = ConversationChain(\n    llm=ChatOpenAI(),\n    memory=memory  # drop-in replacement\n)\n# Agent now remembers everything.` },
] as const;

const FEATURES = [
  "Automatic episode consolidation",
  "Recursive semantic memory extraction",
  "Causal graph linking",
  "LangChain + AutoGen ready",
];

export function CodeSection() {
  const [tab, setTab] = useState<"python" | "go" | "langchain">("python");
  const [copied, setCopied] = useState(false);
  const current = TABS.find((t) => t.id === tab)!;

  const copy = async () => {
    await navigator.clipboard.writeText(current.rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 px-6 max-w-[1100px] mx-auto reveal">
      <div className="grid md:grid-cols-[45%_55%] gap-14 items-start">

        {/* Left */}
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#475569" }}>
            SIMPLE INTEGRATION
          </span>
          <h2 className="font-display font-bold mt-3 mb-4" style={{ fontSize: "clamp(28px,3.5vw,40px)", color: "#f1f5f9" }}>
            Memory in 3 lines.
          </h2>
          <p className="text-[14px] leading-relaxed mb-7" style={{ color: "#94a3b8" }}>
            No vector DB setup. No embedding pipelines.<br />
            Just write, retrieve, done.
          </p>
          <ul className="flex flex-col gap-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <span className="mt-0.5 w-4 h-4 flex-shrink-0 rounded-full flex items-center justify-center text-[10px]"
                  style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>✓</span>
                <span className="text-[13px]" style={{ color: "#94a3b8" }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: code tabs */}
        <div className="rounded-xl overflow-hidden" style={{ background: "#0f0f1a", border: "1px solid #1e1e30" }}>
          {/* Tab bar */}
          <div className="flex items-center border-b" style={{ borderColor: "#1e1e30" }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className="px-4 py-3 text-[12px] font-medium transition-colors border-b-2"
                style={{
                  color: tab === t.id ? "#a78bfa" : "#475569",
                  borderColor: tab === t.id ? "#7c3aed" : "transparent",
                  background: "transparent",
                }}
              >
                {t.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-3 px-3">
              <span className="font-mono text-[10px]" style={{ color: "#475569" }}>{current.filename}</span>
              <button
                onClick={copy}
                className="px-2.5 py-1 rounded text-[11px] font-mono transition-colors hover:bg-[#161625]"
                style={{ color: copied ? "#10b981" : "#475569", border: "1px solid #1e1e30" }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Code content */}
          <current.Component />
        </div>
      </div>
    </section>
  );
}
