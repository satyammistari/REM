"use client";

import React, { createContext, useContext, useState, useMemo } from "react";

type AgentContextValue = {
  agentId: string | null;
  setAgentId: (id: string | null) => void;
};

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

export function AgentProvider({ children }: { children: React.ReactNode }) {
  const [agentId, setAgentId] = useState<string | null>(null);

  const value = useMemo(() => ({ agentId, setAgentId }), [agentId]);

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be inside AgentProvider");
  return ctx;
}
