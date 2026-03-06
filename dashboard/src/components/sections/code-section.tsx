"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check, Terminal } from "lucide-react";

const tabs = [
  { id: "python", label: "Python SDK" },
  { id: "go", label: "Go SDK" },
  { id: "langchain", label: "LangChain" },
  { id: "curl", label: "REST API" },
];

const codeSnippets: Record<string, { lines: { text: string; type: string }[] }> =
  {
    python: {
      lines: [
        { text: "from rem_memory import REMClient", type: "import" },
        { text: "", type: "blank" },
        { text: "client = REMClient(api_key=\"rem_sk_...\")", type: "code" },
        { text: "", type: "blank" },
        { text: "# After agent completes task", type: "comment" },
        { text: "await client.write(", type: "code" },
        { text: "    content=\"User prefers TypeScript strict mode\",", type: "indent" },
        { text: "    agent_id=\"agent_123\",", type: "indent" },
        { text: "    outcome=\"success\"", type: "indent" },
        { text: ")", type: "code" },
        { text: "", type: "blank" },
        { text: "# Before agent starts next task", type: "comment" },
        { text: "memory = await client.retrieve(", type: "code" },
        { text: "    query=\"What does this user prefer?\",", type: "indent" },
        { text: "    agent_id=\"agent_123\"", type: "indent" },
        { text: ")", type: "code" },
        { text: "print(memory.injection_prompt)", type: "code" },
      ],
    },
    go: {
      lines: [
        { text: "client := rem.NewClient(\"rem_sk_...\")", type: "code" },
        { text: "", type: "blank" },
        { text: "client.WriteEpisode(ctx, rem.Episode{", type: "code" },
        { text: "    Content: \"User prefers TypeScript strict mode\",", type: "indent" },
        { text: "    AgentID: \"agent_123\",", type: "indent" },
        { text: "    Outcome: \"success\",", type: "indent" },
        { text: "})", type: "code" },
        { text: "", type: "blank" },
        { text: "result, _ := client.Retrieve(ctx, rem.Query{", type: "code" },
        { text: "    Query:   \"user preferences\",", type: "indent" },
        { text: "    AgentID: \"agent_123\",", type: "indent" },
        { text: "})", type: "code" },
        { text: "fmt.Println(result.InjectionPrompt)", type: "code" },
      ],
    },
    langchain: {
      lines: [
        { text: "from rem_memory.integrations import REMMemory", type: "import" },
        { text: "", type: "blank" },
        { text: "memory = REMMemory(", type: "code" },
        { text: "    api_key=\"rem_sk_...\",", type: "indent" },
        { text: "    agent_id=\"agent_123\"", type: "indent" },
        { text: ")", type: "code" },
        { text: "", type: "blank" },
        { text: "chain = ConversationChain(", type: "code" },
        { text: "    llm=ChatOpenAI(),", type: "indent" },
        { text: "    memory=memory  # drop-in replacement", type: "indent" },
        { text: ")", type: "code" },
        { text: "", type: "blank" },
      ],
    },
    curl: {
      lines: [
        { text: "# Write an episode", type: "comment" },
        { text: "curl -X POST https://api.rem.dev/v1/episodes \\", type: "code" },
        { text: "  -H \"Authorization: Bearer rem_sk_...\" \\", type: "indent" },
        { text: "  -H \"Content-Type: application/json\" \\", type: "indent" },
        { text: "  -d '{", type: "indent" },
        { text: "    \"agent_id\": \"assistant-42\",", type: "indent2" },
        {
          text: "    \"content\": \"User asked about Q3 revenue forecast.\",",
          type: "indent2",
        },
        {
          text: "    \"metadata\": { \"session\": \"s_99\", \"user\": \"alice\" }",
          type: "indent2",
        },
        { text: "  }'", type: "indent" },
        { text: "", type: "blank" },
        { text: "# Retrieve relevant memories", type: "comment" },
        { text: "curl -X POST https://api.rem.dev/v1/retrieve \\", type: "code" },
        { text: "  -H \"Authorization: Bearer rem_sk_...\" \\", type: "indent" },
        { text: "  -H \"Content-Type: application/json\" \\", type: "indent" },
        { text: "  -d '{", type: "indent" },
        { text: "    \"agent_id\": \"assistant-42\",", type: "indent2" },
        { text: "    \"query\": \"Q3 revenue discussion\",", type: "indent2" },
        { text: "    \"top_k\": 5", type: "indent2" },
        { text: "  }'", type: "indent" },
      ],
    },
  };

// Token-based syntax highlighter (GitHub Dark palette)
type Token = { text: string; color: string; italic?: boolean };

const PYTHON_KEYWORDS = /^(from|import|await|async|def|class|return|if|elif|else|for|in|with|as|not|and|or|True|False|None|print)\b/;
const GO_KEYWORDS = /^(func|package|import|var|const|type|range|make|new|nil|map|return|if|else|for|fmt)\b/;
const CURL_KEYWORDS = /^(curl|Content-Type|Authorization)\b/;

function tokenize(line: string): Token[] {
  // Full-line comment
  if (/^\s*(#|\/\/)/.test(line)) {
    return [{ text: line, color: "#8b949e", italic: true }];
  }

  const tokens: Token[] = [];
  let rest = line;

  const rules: [RegExp, string, (boolean | undefined)?][] = [
    // keywords
    [PYTHON_KEYWORDS, "#ff7b72"],
    [GO_KEYWORDS, "#ff7b72"],
    [CURL_KEYWORDS, "#ff7b72"],
    // string literals (double, single, backtick)
    [/^"(?:[^"\\]|\\.)*"|^'(?:[^'\\]|\\.)*'|^`[^`]*`/, "#a5d6ff"],
    // flag-style args (-H, -X, -d) for curl
    [/^-[A-Za-z]+/, "#ffa657"],
    // built-in calls: print, fmt.Println, fmt.Printf
    [/^(print|fmt\.[A-Za-z]+)(?=\()/, "#79c0ff"],
    // function / method call names
    [/^[A-Za-z_][A-Za-z0-9_]*(?=\()/, "#d2a8ff"],
    // := operator
    [/^:=/, "#ff7b72"],
    // numbers
    [/^[0-9]+(?:\.[0-9]+)?/, "#f0883e"],
    // URL-like tokens (https://...)
    [/^https?:\/\/[^\s'"]+/, "#a5d6ff"],
    // identifiers
    [/^[A-Za-z_][A-Za-z0-9_.]*/, "#e6edf3"],
    // punctuation / operators
    [/^[{}()\[\],.:=<>!|\\*+/%-]+/, "#e6edf3"],
    // whitespace (preserve)
    [/^ +/, "#e6edf3"],
    // anything else char-by-char
    [/^./, "#e6edf3"],
  ];

  while (rest.length > 0) {
    let matched = false;
    for (const [re, color, italic] of rules) {
      const m = rest.match(re);
      if (m) {
        tokens.push({ text: m[0], color, italic: italic ?? false });
        rest = rest.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push({ text: rest[0], color: "#e6edf3" });
      rest = rest.slice(1);
    }
  }
  return tokens;
}

function CodeLine({ text, type }: { text: string; type: string }) {
  if (!text) return <div className="h-4" />;

  const getPadding = () => {
    if (type === "indent2") return "pl-16";
    if (type === "indent") return "pl-8";
    return "";
  };

  const tokens = tokenize(text);

  return (
    <div className={`flex items-start leading-6 ${getPadding()}`}>
      {tokens.map((tok, i) => (
        <span
          key={i}
          style={{ color: tok.color, fontStyle: tok.italic ? "italic" : undefined }}
          className="font-mono text-sm"
        >
          {tok.text}
        </span>
      ))}
    </div>
  );
}

export function CodeSection() {
  const [activeTab, setActiveTab] = useState("python");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = codeSnippets[activeTab].lines
      .map((l) => l.text)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      id="code"
      className="w-full flex flex-col items-center justify-center px-5 md:px-10 py-0 divide-y-0"
    >
      <div className="border-x mx-5 md:mx-10 w-full">
        <div className="relative px-6 md:px-16 py-16 md:py-24">
          {/* Section header */}
          <div className="text-center mb-12">
            <p className="border border-border bg-accent rounded-full text-sm h-8 px-4 inline-flex items-center gap-2 mb-6">
              <Terminal className="w-3.5 h-3.5" />
              Quickstart
            </p>
            <h2 className="text-3xl md:text-4xl font-serif tracking-tighter text-balance text-center text-primary mb-4">
              Three lines to give your agent memory
            </h2>
            <p className="text-muted-foreground text-center text-balance font-medium max-w-xl mx-auto">
              Install the SDK, write episodes, retrieve memories. That&apos;s it.
              REM handles consolidation, indexing, and graph construction behind
              the scenes.
            </p>
          </div>

          {/* Install command */}
          <div className="max-w-2xl mx-auto mb-6">
            <div className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl px-5 py-3 font-mono text-sm">
              <span className="text-muted-foreground select-none">$</span>
              <span className="text-foreground/80">pip install rem-memory</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("pip install rem-memory");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Code block */}
          <div className="max-w-4xl mx-auto rounded-2xl overflow-hidden border border-border shadow-xl">
            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-muted/60 border-b border-border px-4 py-2.5">
              {/* Traffic lights */}
              <div className="flex gap-1.5 mr-4">
                <div className="w-3 h-3 rounded-full bg-red-400/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                <div className="w-3 h-3 rounded-full bg-green-400/70" />
              </div>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <button
                onClick={handleCopy}
                className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-background"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Code area */}
            <div className="bg-[#0d1117] dark:bg-[#0d1117] min-h-[360px] p-6 overflow-x-auto">
              {/* Line numbers + code */}
              <div className="flex gap-4">
                {/* Line numbers */}
                <div className="flex flex-col items-end select-none shrink-0">
                  {codeSnippets[activeTab].lines.map((line, i) => (
                    <div
                      key={i}
                      className="h-6 text-xs font-mono leading-6"
                      style={{ color: "#3d444d" }}
                    >
                      {line.text ? i + 1 : ""}
                    </div>
                  ))}
                </div>
                {/* Code lines */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="flex-1 min-w-0"
                  >
                    {codeSnippets[activeTab].lines.map((line, i) => (
                      <CodeLine key={i} text={line.text} type={line.type} />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mt-12">
            {[
              { value: "81.6%", label: "LongMemEval accuracy" },
              { value: "<50ms", label: "Retrieval latency" },
              { value: "MIT", label: "Open source license" },
              { value: "3 SDKs", label: "Python, Go, REST" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold font-mono text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
