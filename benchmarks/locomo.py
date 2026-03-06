"""
LoCoMo Benchmark for REM  (Long-term Conversation Memory)
─────────────────────────────────────────────────────────
Tests multi-session memory: facts are planted across multiple conversations,
then recalled in a later session. This stresses both episode consolidation
and cross-session retrieval.

Paper: "LoCoMo: Evaluating Long-Context LLMs on Long Conversation Memory"
Dataset subset is synthetic here; swap in the real dataset from HuggingFace:
  datasets.load_dataset("convai/locomo", "test")

Metrics
  ─ Session recall (was the right session retrieved)
  ─ Fact accuracy (does answer contain the planted fact)
  ─ Avg / P95 retrieval latency
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
from adapters.rem_adapter import write_episode, retrieve_prompt, reset_agent, health

RESULTS_DIR = HERE / os.getenv("RESULTS_DIR", "results")
RESULTS_DIR.mkdir(exist_ok=True)

# ── synthetic LoCoMo-style dataset ────────────────────────────────────────────

LOCOMO_SAMPLES: list[dict] = [
    {
        "session": 1,
        "episodes": [
            "In session 1 user asked about Python async patterns.",
            "User shared they are building a real-time notification service.",
            "User noted the service must handle 10k concurrent connections.",
        ],
        "question": "What scale requirement did the user mention for their service?",
        "answer": "10k concurrent connections",
    },
    {
        "session": 2,
        "episodes": [
            "Session 2: User returned asking about Redis pub/sub.",
            "User confirmed they chose Kafka after evaluating Redis and RabbitMQ.",
            "Final decision: Kafka with consumer groups for their notification service.",
        ],
        "question": "What message broker did the user choose?",
        "answer": "Kafka",
    },
    {
        "session": 3,
        "episodes": [
            "Session 3: User is now testing deployment on AWS ECS.",
            "They encountered cold-start latency > 2s; solved with provisioned concurrency.",
            "User mentioned production launch is next Monday.",
        ],
        "question": "What platform is the user deploying their service on?",
        "answer": "AWS ECS",
    },
    {
        "session": 4,
        "episodes": [
            "Session 4: user asked about monitoring; chose Grafana + Prometheus stack.",
            "They set a P99 alert threshold at 500ms.",
        ],
        "question": "What monitoring tools did the user adopt?",
        "answer": "Grafana",
    },
    {
        "session": 5,
        "episodes": [
            "Session 5: User mentioned post-launch — service is handling 8k RPS.",
            "They plan to scale to 50k RPS within three months.",
            "User is happy with Kafka's performance and wants to write a blog post.",
        ],
        "question": "What was the post-launch traffic of the user's service?",
        "answer": "8k RPS",
    },
]


# ── helpers ───────────────────────────────────────────────────────────────────

def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def contains_answer(prediction: str, gold: str) -> bool:
    return normalize(gold) in normalize(prediction)


def f1(prediction: str, gold: str) -> float:
    pred_toks = set(normalize(prediction).split())
    gold_toks = set(normalize(gold).split())
    if not pred_toks or not gold_toks:
        return 0.0
    common = pred_toks & gold_toks
    if not common:
        return 0.0
    p = len(common) / len(pred_toks)
    r = len(common) / len(gold_toks)
    return 2 * p * r / (p + r)


# ── main ──────────────────────────────────────────────────────────────────────

def run(samples=None, agent_id: str | None = None) -> dict:
    samples  = samples or LOCOMO_SAMPLES
    agent_id = agent_id or f"locomo_{uuid.uuid4().hex[:8]}"

    print(f"\n{'='*60}")
    print(f"  LoCoMo  |  {len(samples)} sessions  |  agent: {agent_id}")
    print(f"{'='*60}")

    if not health():
        print("ERROR: REM API is not reachable at", os.getenv("REM_API_URL"))
        sys.exit(1)

    # ── 1. write sessions sequentially ───────────────────────────────────────
    print("\n[1/3] Writing sessions...")
    for s in tqdm(samples, desc="  sessions"):
        for ep in s["episodes"]:
            write_episode(ep, agent_id=agent_id, metadata={"session": s["session"]})
        time.sleep(0.1)      # small gap to let indexing settle

    # ── 2. retrieve ──────────────────────────────────────────────────────────
    print("\n[2/3] Cross-session retrieval...")
    results = []
    latencies = []

    for s in tqdm(samples, desc="  query"):
        t0 = time.perf_counter()
        prediction = retrieve_prompt(s["question"], agent_id=agent_id, top_k=5)
        lat = (time.perf_counter() - t0) * 1000
        latencies.append(lat)

        exact   = contains_answer(prediction, s["answer"])
        f1_val  = f1(prediction, s["answer"])

        results.append({
            "session":      s["session"],
            "question":     s["question"],
            "answer":       s["answer"],
            "prediction":   prediction[:300],
            "exact_match":  exact,
            "f1":           round(f1_val, 4),
            "latency_ms":   round(lat, 2),
        })

    # ── 3. aggregate ─────────────────────────────────────────────────────────
    print("\n[3/3] Aggregating...")
    exact_acc = sum(r["exact_match"] for r in results) / len(results)
    avg_f1    = sum(r["f1"] for r in results) / len(results)
    avg_lat   = sum(latencies) / len(latencies)
    p95_lat   = sorted(latencies)[int(len(latencies) * 0.95)]

    summary = {
        "benchmark":       "LoCoMo",
        "n_sessions":      len(results),
        "exact_match":     round(exact_acc, 4),
        "avg_f1":          round(avg_f1, 4),
        "avg_latency_ms":  round(avg_lat, 2),
        "p95_latency_ms":  round(p95_lat, 2),
    }

    out_path = RESULTS_DIR / "locomo.json"
    with open(out_path, "w") as f:
        json.dump({"summary": summary, "results": results}, f, indent=2)

    print(f"\n  Exact-Match Accuracy : {exact_acc*100:.1f}%")
    print(f"  Avg Token-F1         : {avg_f1*100:.1f}%")
    print(f"  Avg Latency          : {avg_lat:.1f} ms")
    print(f"  P95 Latency          : {p95_lat:.1f} ms")
    print(f"\n  Results saved → {out_path}")

    reset_agent(agent_id)
    return summary


if __name__ == "__main__":
    run()
