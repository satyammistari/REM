"use client";
import React, { useEffect, useRef, useState } from "react";

interface CounterProps {
  target: number;
  duration?: number; // ms
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

function Counter({ target, duration = 2000, suffix = "", prefix = "", decimals = 0 }: CounterProps) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * target);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString();

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

interface LiveCounterProps {
  className?: string;
}

const STATS = [
  { label: "Episodes processed", target: 48_321, suffix: "+" },
  { label: "Semantic memories", target: 12_800, suffix: "+" },
  { label: "Avg retrieval", target: 42, suffix: "ms", prefix: "" },
  { label: "Agents active", target: 1_200, suffix: "+" },
];

export function LiveCounter({ className = "" }: LiveCounterProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`grid grid-cols-2 md:grid-cols-4 gap-6 ${className}`}>
      {STATS.map((stat) => (
        <div key={stat.label} className="text-center">
          <div
            className="text-3xl font-bold font-mono mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            {visible ? (
              <Counter target={stat.target} suffix={stat.suffix} prefix={stat.prefix} />
            ) : (
              "0"
            )}
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
