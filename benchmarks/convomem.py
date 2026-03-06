"""
ConvoMem Benchmark for REM
──────────────────────────
Measures memory injection quality in a live conversation loop.
After writing N turns, each follow-up question should be answerable
purely from the injected context (no model fine-tuning, no chat history).

Metrics
  ─ Injection hit rate   (correct answer appears in injection_prompt)
  ─ Context precision    (fraction of returned snippets that are relevant)
  ─ Avg / P95 latency
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import uuid
from pathlib import Path

from dotenv import load_dotenv
from tqdm import tqdm

HERE = Path(__file__).parent
load_dotenv(HERE / ".env")

sys.path.insert(0, str(HERE))
from adapters.rem_adapter import write_episode, retrieve, reset_agent, health

RESULTS_DIR = HERE / os.getenv("RESULTS_DIR", "results")
RESULTS_DIR.mkdir(exist_ok=True)

# ── synthetic ConvoMem dataset ────────────────────────────────────────────────
# Each sample has:
#   turns  – conversation context to write as episodes
#   probe  – follow-up question asked after turns are stored
#   answer – expected string that must appear in injection_prompt

CONVOMEM_SAMPLES = [
    {
        "turns": [
            "Alice: I just booked flights to Tokyo for Golden Week.",
            "Bot: Great! How long will you stay?",
            "Alice: 10 days. Arriving April 29, leaving May 9.",
            "Bot: Do you have accommodation sorted?",
            "Alice: Staying at Shinjuku Granbell Hotel.",
        ],
        "probe": "Where is Alice staying in Tokyo?",
        "answer": "Shinjuku Granbell Hotel",
    },
    {
        "turns": [
            "User: My invoice number is INV-20481 and it's overdue by 14 days.",
            "Agent: I can see that. Your account is with Enterprise plan.",
            "User: Yes, started January 2026. Monthly billing.",
            "Agent: Payment method on file is Visa ending in 4242.",
            "User: I want to switch to annual billing to save 20%.",
        ],
        "probe": "What billing cycle does the user want to switch to?",
        "answer": "annual",
    },
    {
        "turns": [
            "Dev: I'm getting a 429 error on the /embeddings endpoint.",
            "Support: You're on the Free tier with 60 RPM limit.",
            "Dev: I need at least 500 RPM for our use case.",
            "Support: The Pro tier gives 1000 RPM.",
            "Dev: OK, upgrading to Pro. My project ID is proj_x7k2.",
        ],
        "probe": "What is the developer's project ID?",
        "answer": "proj_x7k2",
    },
    {
        "turns": [
            "Maria: My laptop model is Dell XPS 15 9530.",
            "Support: Serial number?",
            "Maria: SN-99A7B2C.",
            "Support: Warranty expires December 2026.",
            "Maria: I need a screen replacement under warranty.",
        ],
        "probe": "What is Maria's laptop serial number?",
        "answer": "SN-99A7B2C",
    },
    {
        "turns": [
            "Coach: Your marathon PB is 3:42:11 from last October.",
            "Runner: I want to go sub-3:30 at the Berlin Marathon.",
            "Coach: We'll target weekly mileage of 80km.",
            "Runner: I can train 6 days a week.",
            "Coach: Race day is September 27.",
        ],
        "probe": "What race is the runner targeting?",
        "answer": "Berlin Marathon",
    },
    {
        "turns": [
            "CS: Order #ORD-554412 was dispatched via DHL.",
            "Customer: Tracking number?",
            "CS: DHL tracking is 1Z999AA10123456784.",
            "Customer: Expected delivery?",
            "CS: Estimated delivery March 10, 2026.",
        ],
        "probe": "What is the DHL tracking number for the order?",
        "answer": "1Z999AA10123456784",
    },
    {
        "turns": [
            "User: I'm vegetarian and have a nut allergy.",
            "Chef Bot: Noted. Any cuisine preference?",
            "User: I love South Indian food.",
            "Chef Bot: Spice level preference?",
            "User: Medium — no bird's eye chillies please.",
        ],
        "probe": "What cuisine preference did the user mention?",
        "answer": "South Indian",
    },
    {
        "turns": [
            "Trader: I hold 200 shares of NVDA at avg cost $420.",
            "Advisor: Current price is $875.",
            "Trader: My stop-loss is set at $800.",
            "Advisor: Your unrealized gain is ~$91,000.",
            "Trader: I want to take 50% profit if it hits $920.",
        ],
        "probe": "At what price does the trader want to take 50% profit?",
        "answer": "$920",
    },
]


# ── helpers ───────────────────────────────────────────────────────────────────

def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def injection_hit(prompt: str, answer: str) -> bool:
    return normalize(answer) in normalize(prompt)


def context_precision(memories: list[dict], answer: str) -> float:
    """Fraction of returned memory snippets that contain the answer."""
    if not memories:
        return 0.0
    hits = sum(1 for m in memories if normalize(answer) in normalize(str(m)))
    return hits / len(memories)


# ── main ──────────────────────────────────────────────────────────────────────

def run(samples=None, agent_id: str | None = None) -> dict:
    samples   = samples or CONVOMEM_SAMPLES
    agent_id  = agent_id or f"convomem_{uuid.uuid4().hex[:8]}"

    print(f"\n{'='*60}")
    print(f"  ConvoMem  |  {len(samples)} conversations  |  agent: {agent_id}")
    print(f"{'='*60}")

    if not health():
        print("ERROR: REM API is not reachable at", os.getenv("REM_API_URL"))
        sys.exit(1)

    results   = []
    latencies = []

    print()
    for s in tqdm(samples, desc="  convo"):
        # write turns
        for turn in s["turns"]:
            write_episode(turn, agent_id=agent_id)

        # probe
        t0 = time.perf_counter()
        result = retrieve(s["probe"], agent_id=agent_id, top_k=5)
        lat = (time.perf_counter() - t0) * 1000
        latencies.append(lat)

        prompt    = result.get("injection_prompt", "")
        memories  = result.get("memories", [])

        hit       = injection_hit(prompt, s["answer"])
        precision = context_precision(memories, s["answer"])

        results.append({
            "probe":             s["probe"],
            "answer":            s["answer"],
            "injection_hit":     hit,
            "context_precision": round(precision, 4),
            "latency_ms":        round(lat, 2),
        })

        reset_agent(agent_id)   # fresh memory per conversation

    # ── aggregate ─────────────────────────────────────────────────────────────
    hit_rate  = sum(r["injection_hit"] for r in results) / len(results)
    avg_prec  = sum(r["context_precision"] for r in results) / len(results)
    avg_lat   = sum(latencies) / len(latencies)
    p95_lat   = sorted(latencies)[int(len(latencies) * 0.95)]

    summary = {
        "benchmark":           "ConvoMem",
        "n_conversations":     len(results),
        "injection_hit_rate":  round(hit_rate, 4),
        "avg_context_precision": round(avg_prec, 4),
        "avg_latency_ms":      round(avg_lat, 2),
        "p95_latency_ms":      round(p95_lat, 2),
    }

    out_path = RESULTS_DIR / "convomem.json"
    with open(out_path, "w") as f:
        json.dump({"summary": summary, "results": results}, f, indent=2)

    print(f"\n  Injection Hit Rate   : {hit_rate*100:.1f}%")
    print(f"  Avg Context Precision: {avg_prec*100:.1f}%")
    print(f"  Avg Latency          : {avg_lat:.1f} ms")
    print(f"  P95 Latency          : {p95_lat:.1f} ms")
    print(f"\n  Results saved → {out_path}")

    return summary


if __name__ == "__main__":
    run()
