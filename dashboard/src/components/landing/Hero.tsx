"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MeshGradient, PulsingBorder } from "@paper-design/shaders-react";
import { motion } from "framer-motion";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [waitlistState, setWaitlistState] = useState<"idle" | "loading" | "done">("idle");

  // Scroll-reveal for .reveal sections throughout the page
  useEffect(() => {
    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            revealObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll(".reveal").forEach((el) => revealObs.observe(el));
    return () => revealObs.disconnect();
  }, []);

  const handleWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setWaitlistState("loading");
    try {
      const stored: string[] = JSON.parse(localStorage.getItem("rem_waitlist") || "[]");
      if (!stored.includes(email)) stored.push(email);
      localStorage.setItem("rem_waitlist", JSON.stringify(stored));
    } catch {}
    fetch("https://api.getwaitlist.com/api/v1/waiter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, waitlist_id: "rem-memory" }),
    })
      .catch(() => {})
      .finally(() => setWaitlistState("done"));
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ minHeight: "calc(100vh - 56px)", background: "#000" }}
    >
      {/* SVG filters */}
      <svg className="absolute inset-0 w-0 h-0">
        <defs>
          <filter id="glass-effect" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0.02
                      0 1 0 0 0.02
                      0 0 1 0 0.05
                      0 0 0 0.9 0"
              result="tint"
            />
          </filter>
          <filter id="text-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Mesh gradient layers */}
      <MeshGradient
        className="absolute inset-0 w-full h-full"
        colors={["#000000", "#7c3aed", "#06b6d4", "#1e1e30", "#4c1d95"]}
        speed={0.3}
      />
      <MeshGradient
        className="absolute inset-0 w-full h-full opacity-40"
        colors={["#000000", "#7c3aed", "#06b6d4", "#f97316"]}
        speed={0.2}
      />

      {/* Main content */}
      <main className="absolute bottom-8 left-8 z-20 max-w-2xl">
        {/* Eyebrow badge */}
        <motion.div
          className="inline-flex items-center px-4 py-2 rounded-full mb-6 relative"
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.1)",
            filter: "url(#glass-effect)",
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div
            className="absolute top-0 left-1 right-1 h-px rounded-full"
            style={{ background: "linear-gradient(90deg,transparent,rgba(124,58,237,0.4),transparent)" }}
          />
          <span className="text-white/90 text-sm font-medium relative z-10 tracking-wide font-mono">
            #1 on LongMemEval · LoCoMo · ConvoMem
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          className="font-bold text-white mb-4 leading-none tracking-tight"
          style={{ fontSize: "clamp(42px,6vw,80px)" }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <span className="block font-normal" style={{ color: "rgba(255,255,255,0.9)" }}>
            Your AI Agents
          </span>
          <motion.span
            className="block font-black"
            style={{
              background: "linear-gradient(135deg,#7c3aed 0%,#06b6d4 50%,#7c3aed 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "url(#text-glow)",
              backgroundSize: "200% 200%",
            }}
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            Have Amnesia.
          </motion.span>
        </motion.h1>

        {/* Sub-heading */}
        <motion.p
          className="font-semibold mb-2"
          style={{ fontSize: "clamp(20px,2.5vw,30px)", color: "rgba(255,255,255,0.75)" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          REM fixes that.
        </motion.p>
        <motion.p
          className="font-light mb-8 leading-relaxed max-w-xl"
          style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", fontFamily: "'Instrument Sans',sans-serif" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          Recursive episodic memory with automatic consolidation. The memory OS for AI agents. One API.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col items-start gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm text-white"
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                  boxShadow: "0 0 30px rgba(124,58,237,0.4)",
                }}
              >
                Start Building Free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <a
                href="https://github.com/satyammistari/REM"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-medium text-sm"
                style={{
                  background: "transparent",
                  border: "2px solid rgba(255,255,255,0.25)",
                  color: "white",
                  backdropFilter: "blur(4px)",
                }}
              >
                View on GitHub
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </motion.div>
          </div>

          {/* Waitlist form */}
          <div className="w-full max-w-md">
            {waitlistState === "done" ? (
              <div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-mono text-sm"
                style={{
                  background: "rgba(124,58,237,0.15)",
                  border: "1px solid rgba(124,58,237,0.4)",
                  color: "#a78bfa",
                  backdropFilter: "blur(8px)",
                }}
              >
                <span style={{ color: "#7c3aed" }}>&#10003;</span> You&apos;re on the list! We&apos;ll email you.
              </div>
            ) : (
              <form onSubmit={handleWaitlist} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-2.5 rounded-full font-mono text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#f1f5f9",
                    backdropFilter: "blur(8px)",
                    caretColor: "#7c3aed",
                  }}
                />
                <button
                  type="submit"
                  disabled={waitlistState === "loading"}
                  className="px-5 py-2.5 rounded-full font-semibold text-sm text-white disabled:opacity-60"
                  style={{ background: "#7c3aed", whiteSpace: "nowrap" }}
                >
                  {waitlistState === "loading" ? "..." : "Join Waitlist"}
                </button>
              </form>
            )}
          </div>

          <p className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
            Open source · MIT License · Self-hostable
          </p>
        </motion.div>
      </main>

      {/* Stats ring — bottom right */}
      <div className="absolute bottom-8 right-8 z-30">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <PulsingBorder
            colors={["#7c3aed", "#06b6d4", "#a78bfa", "#22d3ee", "#4c1d95"]}
            colorBack="#00000000"
            speed={1.5}
            roundness={1}
            thickness={0.1}
            softness={0.2}
            intensity={5}
            spotSize={0.1}
            pulse={0.1}
            smoke={0.5}
            smokeSize={4}
            scale={0.65}
            rotation={0}
            frame={9161408}
            style={{ width: "60px", height: "60px", borderRadius: "50%" }}
          />
          <motion.svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ transform: "scale(1.6)" }}
          >
            <defs>
              <path id="stats-circle" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
            </defs>
            <text
              style={{
                fontSize: "8.5px",
                fill: "rgba(255,255,255,0.7)",
                fontFamily: "'IBM Plex Mono',monospace",
              }}
            >
              <textPath href="#stats-circle" startOffset="0%">
                16.7k Stars - 81.6% Accuracy - 50ms Speed - Open Source -
              </textPath>
            </text>
          </motion.svg>
        </div>
      </div>
    </div>
  );
}
