"use client";
import React, { useEffect, useRef } from "react";
import type { GraphData, GraphEdge, GraphNode } from "@/lib/types";

interface MemoryGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
}

const DOMAIN_COLORS: Record<string, string> = {
  coding: "#a78bfa",
  writing: "#60a5fa",
  research: "#34d399",
  planning: "#fb923c",
  general: "#94a3b8",
};

/** Minimal force-directed graph rendered on a canvas element. */
export function MemoryGraph({ data, width = 800, height = 520 }: MemoryGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!data.nodes.length) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "var(--text-muted)";
      ctx.font = "12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("No graph data available", width / 2, height / 2);
      return;
    }

    // Initialize positions
    const positions: Map<string, { x: number; y: number; vx: number; vy: number }> = new Map();
    data.nodes.forEach((n, i) => {
      const angle = (i / data.nodes.length) * Math.PI * 2;
      const r = Math.min(width, height) * 0.3;
      positions.set(n.id, {
        x: width / 2 + r * Math.cos(angle),
        y: height / 2 + r * Math.sin(angle),
        vx: 0,
        vy: 0,
      });
    });

    const edgeSet = new Set(data.edges.map((e) => `${e.from}-${e.to}`));

    const simulate = () => {
      // Repulsion
      const nodes = data.nodes;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const pi = positions.get(nodes[i].id)!;
          const pj = positions.get(nodes[j].id)!;
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 1200 / (dist * dist);
          pi.vx += (dx / dist) * force;
          pi.vy += (dy / dist) * force;
          pj.vx -= (dx / dist) * force;
          pj.vy -= (dy / dist) * force;
        }
      }

      // Attraction along edges
      data.edges.forEach((e) => {
        const ps = positions.get(e.from);
        const pt = positions.get(e.to);
        if (!ps || !pt) return;
        const dx = pt.x - ps.x;
        const dy = pt.y - ps.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 100) * 0.03;
        ps.vx += (dx / dist) * force;
        ps.vy += (dy / dist) * force;
        pt.vx -= (dx / dist) * force;
        pt.vy -= (dy / dist) * force;
      });

      // Center gravity
      nodes.forEach((n) => {
        const p = positions.get(n.id)!;
        p.vx += (width / 2 - p.x) * 0.005;
        p.vy += (height / 2 - p.y) * 0.005;
      });

      // Apply velocity with damping
      nodes.forEach((n) => {
        const p = positions.get(n.id)!;
        p.vx *= 0.85;
        p.vy *= 0.85;
        p.x = Math.max(16, Math.min(width - 16, p.x + p.vx));
        p.y = Math.max(16, Math.min(height - 16, p.y + p.vy));
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Edges
      data.edges.forEach((e) => {
        const ps = positions.get(e.from);
        const pt = positions.get(e.to);
        if (!ps || !pt) return;
        ctx.beginPath();
        ctx.moveTo(ps.x, ps.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.strokeStyle = e.type === "compressed_into" ? "rgba(139,92,246,0.4)" : "rgba(148,163,184,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Nodes
      data.nodes.forEach((n) => {
        const p = positions.get(n.id)!;
        const r = n.type === "semantic" ? 8 : 6;
        const color = DOMAIN_COLORS[n.domain] ?? "#94a3b8";

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = n.type === "semantic" ? color : color + "99";
        ctx.fill();
        if (n.consolidated) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
    };

    let tick = 0;
    const loop = () => {
      if (tick < 120) simulate();
      draw();
      tick++;
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frameRef.current);
  }, [data, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-[10px] w-full"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    />
  );
}
