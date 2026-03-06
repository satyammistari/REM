"""
REM Benchmark Suite — run_all.py
─────────────────────────────────
Runs all three benchmarks and produces a combined leaderboard summary.

Usage:
    python run_all.py                    # run all benchmarks
    python run_all.py --only longmemeval # run one benchmark
    python run_all.py --only locomo convomem
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

HERE = Path(__file__).parent
load_dotenv(HERE / ".env")

sys.path.insert(0, str(HERE))
from adapters.rem_adapter import health


def banner(text: str) -> None:
    bar = "═" * 60
    print(f"\n╔{bar}╗")
    print(f"║  {text:<58}║")
    print(f"╚{bar}╝\n")


def check_api() -> None:
    from adapters.rem_adapter import health
    if not health():
        import os
        url = os.getenv("REM_API_URL", "http://localhost:8000")
        print(f"\n✗  REM API not reachable at {url}")
        print("   Start the stack first:\n")
        print("   docker compose up -d            # infra")
        print("   cd go-api && go run ./cmd/api   # Go API  :8000")
        print("   cd python-worker && uvicorn main:app --port 8001\n")
        sys.exit(1)
    print("✓  REM API healthy")


ALL_BENCHMARKS = ["longmemeval", "locomo", "convomem"]


def run_all(only: list[str] | None = None) -> None:
    targets = only if only else ALL_BENCHMARKS
    banner(f"REM Benchmark Suite  —  {', '.join(targets)}")

    check_api()

    summaries: dict[str, dict] = {}
    total_start = time.perf_counter()

    for name in targets:
        if name not in ALL_BENCHMARKS:
            print(f"  Unknown benchmark: {name}  (choices: {ALL_BENCHMARKS})")
            continue

        if name == "longmemeval":
            import longmemeval
            summaries[name] = longmemeval.run()
        elif name == "locomo":
            import locomo
            summaries[name] = locomo.run()
        elif name == "convomem":
            import convomem
            summaries[name] = convomem.run()

    total_elapsed = time.perf_counter() - total_start

    # ── leaderboard ───────────────────────────────────────────────────────────
    banner("Results summary")
    col = 28
    print(f"  {'Benchmark':<{col}} {'ExactMatch/HitRate':>18}  {'F1/Precision':>14}  {'P95 lat':>9}")
    print(f"  {'-'*col} {'─'*18}  {'─'*14}  {'─'*9}")

    for name, s in summaries.items():
        score_a = s.get("exact_match") or s.get("injection_hit_rate") or 0
        score_b = s.get("avg_f1") or s.get("avg_context_precision") or 0
        p95     = s.get("p95_latency_ms", 0)
        print(f"  {name:<{col}} {score_a*100:>17.1f}%  {score_b*100:>13.1f}%  {p95:>7.0f}ms")

    print(f"\n  Total elapsed: {total_elapsed:.1f}s")

    # ── combined JSON ──────────────────────────────────────────────────────────
    results_dir = HERE / "results"
    results_dir.mkdir(exist_ok=True)
    out = results_dir / "combined.json"
    with open(out, "w") as f:
        json.dump(summaries, f, indent=2)
    print(f"\n  Combined results → {out}\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="REM Benchmark Suite")
    parser.add_argument(
        "--only",
        nargs="+",
        choices=ALL_BENCHMARKS,
        help="Run only the specified benchmark(s)",
    )
    args = parser.parse_args()
    run_all(only=args.only)


if __name__ == "__main__":
    main()
