"use client";

import "../globals.css";
import { Sidebar } from "@/components/ui/Sidebar";
import { AgentProvider } from "@/lib/agent-context";
import React from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AgentProvider>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <Sidebar />
        <main className="ml-60 min-h-screen">
          <div className="px-8 py-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </AgentProvider>
  );
}


