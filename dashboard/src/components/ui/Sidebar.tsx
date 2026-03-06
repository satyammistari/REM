"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Network,
  Sparkles,
  Terminal,
  Key,
  Settings,
  ChevronDown,
  LogOut,
  Cpu,
} from "lucide-react";
import { useAgent } from "@/lib/agent-context";

const NAV_ITEMS = [
  { label: "Overview",      href: "/dashboard",            icon: LayoutDashboard, exact: true },
  { label: "Episodes",      href: "/dashboard/episodes",   icon: BookOpen },
  { label: "Memory Graph",  href: "/dashboard/graph",      icon: Network },
  { label: "Semantic",      href: "/dashboard/semantic",   icon: Sparkles },
  { label: "Playground",    href: "/dashboard/playground", icon: Terminal },
  { label: "API Keys",      href: "/dashboard/api-keys",   icon: Key },
  { label: "Settings",      href: "/dashboard/settings",   icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { agentId } = useAgent();
  const [agentOpen, setAgentOpen] = useState(false);

  const isActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const displayId = agentId ?? "agent_demo_cursor";
  const displayName = "Cursor Coding Assistant";

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{
        width: 240,
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-[var(--border)]">
        <span className="relative flex items-center justify-center w-6 h-6">
          <span className="absolute w-full h-full rounded-full bg-[var(--violet)] opacity-20 animate-ping" />
          <span className="relative w-3 h-3 rounded-full bg-[var(--violet)]" />
        </span>
        <span className="font-display font-bold text-[17px] text-[var(--text-primary)] tracking-tight">
          REM
        </span>
        <span
          className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest"
          style={{
            background: "rgba(124,58,237,0.15)",
            color: "var(--violet-light)",
            border: "1px solid rgba(124,58,237,0.25)",
          }}
        >
          beta
        </span>
      </div>

      <div className="px-4 py-3 border-b border-[var(--border)]">
        <button
          onClick={() => setAgentOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-colors hover:bg-[var(--bg-hover)]"
          style={{ border: "1px solid var(--border)" }}
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[var(--bg-elevated)]">
            <Cpu size={12} className="text-[var(--violet-light)]" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-[12px] text-[var(--text-primary)] truncate">
              {displayName}
            </div>
            <div className="font-mono text-[10px] text-[var(--text-muted)] truncate">
              {displayId.slice(0, 20)}
            </div>
          </div>
          <ChevronDown
            size={12}
            className="text-[var(--text-muted)] transition-transform"
            style={{ transform: agentOpen ? "rotate(180deg)" : "none" }}
          />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150"
              style={{
                background: active ? "rgba(124,58,237,0.1)" : "transparent",
                color: active ? "var(--violet-light)" : "var(--text-secondary)",
                borderLeft: active ? "2px solid var(--violet)" : "2px solid transparent",
              }}
            >
              <item.icon size={14} style={{ opacity: active ? 1 : 0.6 }} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-2">
        <div
          className="rounded-lg p-3"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-[var(--text-muted)]">EPISODES</span>
            <span className="font-mono text-[10px] text-[var(--violet-light)]">4,218 / 10k</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-hover)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: "42.18%", background: "var(--violet)" }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-[var(--border)]">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[12px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
          <LogOut size={13} />
          Sign out
        </button>
        <p className="mt-2 font-mono text-[9px] text-[var(--text-muted)] text-center tracking-widest">
          v0.3.0-alpha
        </p>
      </div>
    </aside>
  );
}
