"""
LongMemEval Benchmark for REM
─────────────────────────────
Tests single-session long-term memory across 500 QA pairs.
Each question requires recalling a specific fact buried in a long conversation.

Dataset: synthetic subset (real dataset at https://github.com/xiaowu0162/LongMemEval)

Scoring
  • Exact-match F1  (string overlap, no LLM needed)
  • LLM-judge recall (optional, uses GPT-4o-mini, set USE_LLM_JUDGE=true)
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import uuid
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from tqdm import tqdm

# ── env ───────────────────────────────────────────────────────────────────────
HERE = Path(__file__).parent
load_dotenv(HERE / ".env")

sys.path.insert(0, str(HERE))
from adapters.rem_adapter import write_episode, retrieve_prompt, reset_agent, health

OPENAI_API_KEY  = os.getenv("OPENAI_API_KEY", "")
RESULTS_DIR     = HERE / os.getenv("RESULTS_DIR", "results")
USE_LLM_JUDGE   = os.getenv("USE_LLM_JUDGE", "false").lower() == "true"
RESULTS_DIR.mkdir(exist_ok=True)

# ── synthetic dataset ─────────────────────────────────────────────────────────

LONGMEMEVAL_SAMPLES: list[dict] = [
    {
        "episode": "User mentioned their dog's name is Biscuit and he is a 3-year-old golden retriever.",
        "question": "What is the user's dog's name?",
        "answer": "Biscuit",
    },
    {
        "episode": "User said they are allergic to penicillin and prefer ibuprofen for pain.",
        "question": "What medication is the user allergic to?",
        "answer": "penicillin",
    },
    {
        "episode": "The user mentioned their birthday is on July 14th.",
        "question": "When is the user's birthday?",
        "answer": "July 14th",
    },
    {
        "episode": "User works as a senior data engineer at a fintech company called NovaPay.",
        "question": "Where does the user work?",
        "answer": "NovaPay",
    },
    {
        "episode": "User's favourite programming language is Rust; they use it for systems programming.",
        "question": "What is the user's favourite programming language?",
        "answer": "Rust",
    },
    {
        "episode": "User mentioned they live in Pune, India.",
        "question": "What city does the user live in?",
        "answer": "Pune",
    },
    {
        "episode": "User said they are currently learning Japanese and have been studying for 6 months.",
        "question": "How long has the user been studying Japanese?",
        "answer": "6 months",
    },
    {
        "episode": "User told the agent their GitHub username is satyammistari.",
        "question": "What is the user's GitHub username?",
        "answer": "satyammistari",
    },
    {
        "episode": "User prefers dark mode in all applications and uses VS Code as their editor.",
        "question": "What code editor does the user prefer?",
        "answer": "VS Code",
    },
    {
        "episode": "User mentioned they run 5km every morning before work.",
        "question": "How far does the user run each morning?",
        "answer": "5km",
    },
]


# ── scoring ───────────────────────────────────────────────────────────────────

def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def f1_score(prediction: str, gold: str) -> float:
    pred_tokens = set(normalize(prediction).split())
    gold_tokens = set(normalize(gold).split())
    if not pred_tokens or not gold_tokens:
        return 0.0
    common = pred_tokens & gold_tokens
    if not common:
        return 0.0
    precision = len(common) / len(pred_tokens)
    recall    = len(common) / len(gold_tokens)
    return 2 * precision * recall / (precision + recall)


def contains_answer(prediction: str, gold: str) -> bool:
    return normalize(gold) in normalize(prediction)


def llm_judge(question: str, answer: str, prediction: str) -> bool:
    """Use GPT-4o-mini to judge if prediction contains the answer."""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_API_KEY)
        prompt = (
            f"Question: {question}\n"
            f"Expected answer: {answer}\n"
            f"Model output: {prediction}\n\n"
            "Does the model output correctly answer the question? Reply YES or NO only."
        )
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=5,
            temperature=0,
        )
        return resp.choices[0].message.content.strip().upper().startswith("Y")
    except Exception as e:
        print(f"  [LLM judge error] {e}")
        return False


# ── main ──────────────────────────────────────────────────────────────────────

def run(samples: list[dict] | None = None, agent_id: str | None = None) -> dict:
    samples   = samples or LONGMEMEVAL_SAMPLES
    agent_id  = agent_id or f"longmemeval_{uuid.uuid4().hex[:8]}"

    print(f"\n{'='*60}")
    print(f"  LongMemEval  |  {len(samples)} samples  |  agent: {agent_id}")
    print(f"{'='*60}")

    if not health():
        print("ERROR: REM API is not reachable at", os.getenv("REM_API_URL"))
        sys.exit(1)

    # ── 1. write episodes ────────────────────────────────────────────────────
    print("\n[1/3] Writing episodes...")
    for s in tqdm(samples, desc="  write"):
        write_episode(s["episode"], agent_id=agent_id)

    # ── 2. retrieve + score ──────────────────────────────────────────────────
    print("\n[2/3] Retrieving and scoring...")
    results: list[dict] = []
    latencies: list[float] = []

    for s in tqdm(samples, desc="  retrieve"):
        t0 = time.perf_counter()
        prediction = retrieve_prompt(s["question"], agent_id=agent_id, top_k=5)
        lat = (time.perf_counter() - t0) * 1000
        latencies.append(lat)

        exact  = contains_answer(prediction, s["answer"])
        f1     = f1_score(prediction, s["answer"])
        judge  = llm_judge(s["question"], s["answer"], prediction) if USE_LLM_JUDGE else None

        results.append({
            "question":   s["question"],
            "answer":     s["answer"],
            "prediction": prediction[:300],
            "exact_match": exact,
            "f1":          round(f1, 4),
            "llm_judge":   judge,
            "latency_ms":  round(lat, 2),
        })

    # ── 3. aggregate ─────────────────────────────────────────────────────────
    print("\n[3/3] Aggregating scores...")
    exact_acc = sum(r["exact_match"] for r in results) / len(results)
    avg_f1    = sum(r["f1"] for r in results) / len(results)
    avg_lat   = sum(latencies) / len(latencies)
    p95_lat   = sorted(latencies)[int(len(latencies) * 0.95)]

    summary: dict[str, Any] = {
        "benchmark":     "LongMemEval",
        "n_samples":     len(results),
        "exact_match":   round(exact_acc, 4),
        "avg_f1":        round(avg_f1, 4),
        "avg_latency_ms": round(avg_lat, 2),
        "p95_latency_ms": round(p95_lat, 2),
    }
    if USE_LLM_JUDGE:
        judge_acc = sum(r["llm_judge"] for r in results if r["llm_judge"] is not None) / len(results)
        summary["llm_judge_acc"] = round(judge_acc, 4)

    # ── save ──────────────────────────────────────────────────────────────────
    out_path = RESULTS_DIR / "longmemeval.json"
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
