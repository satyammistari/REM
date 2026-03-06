"""
scripts/init_neo4j.py
──────────────────────
Bootstrap the Neo4j graph schema required by REM.

Creates constraints and indexes for the node types used by the memory
graph.  Safe to re-run — all statements use CREATE CONSTRAINT IF NOT EXISTS
/ CREATE INDEX IF NOT EXISTS (Neo4j 4.4+).

Run once before starting the stack for the first time:

    python scripts/init_neo4j.py

Environment variables (or .env file):
    NEO4J_URI       default: bolt://localhost:7687
    NEO4J_USER      default: neo4j
    NEO4J_PASSWORD  required
"""
from __future__ import annotations

import os
import sys

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass

try:
    from neo4j import GraphDatabase, exceptions as neo4j_exc
except ImportError:
    print("ERROR: neo4j driver not installed. Run: pip install neo4j", file=sys.stderr)
    sys.exit(1)

# ── Configuration ─────────────────────────────────────────────────────────────
URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
USER = os.getenv("NEO4J_USER", "neo4j")
PASSWORD = os.getenv("NEO4J_PASSWORD", "neo4j_password")

# ── Schema DDL ────────────────────────────────────────────────────────────────
# Each tuple is (description, Cypher statement).
SCHEMA: list[tuple[str, str]] = [
    # ── Agent ──
    (
        "Unique constraint on Agent.agentId",
        "CREATE CONSTRAINT agent_id IF NOT EXISTS FOR (a:Agent) REQUIRE a.agentId IS UNIQUE",
    ),
    # ── Episode ──
    (
        "Unique constraint on Episode.episodeId",
        "CREATE CONSTRAINT episode_id IF NOT EXISTS FOR (e:Episode) REQUIRE e.episodeId IS UNIQUE",
    ),
    (
        "Index on Episode.domain",
        "CREATE INDEX episode_domain IF NOT EXISTS FOR (e:Episode) ON (e.domain)",
    ),
    (
        "Index on Episode.createdAt",
        "CREATE INDEX episode_created_at IF NOT EXISTS FOR (e:Episode) ON (e.createdAt)",
    ),
    (
        "Index on Episode.consolidated",
        "CREATE INDEX episode_consolidated IF NOT EXISTS FOR (e:Episode) ON (e.consolidated)",
    ),
    # ── SemanticMemory ──
    (
        "Unique constraint on SemanticMemory.semanticId",
        "CREATE CONSTRAINT semantic_id IF NOT EXISTS FOR (s:SemanticMemory) REQUIRE s.semanticId IS UNIQUE",
    ),
    (
        "Index on SemanticMemory.domain",
        "CREATE INDEX semantic_domain IF NOT EXISTS FOR (s:SemanticMemory) ON (s.domain)",
    ),
    (
        "Index on SemanticMemory.factType",
        "CREATE INDEX semantic_fact_type IF NOT EXISTS FOR (s:SemanticMemory) ON (s.factType)",
    ),
    # ── User ──
    (
        "Unique constraint on User.userId",
        "CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.userId IS UNIQUE",
    ),
]


def main() -> None:
    print(f"Connecting to Neo4j at {URI} …")
    driver = GraphDatabase.driver(URI, auth=(USER, PASSWORD))

    try:
        driver.verify_connectivity()
        print("  Connected.")
    except neo4j_exc.ServiceUnavailable as exc:
        print(f"ERROR: Cannot connect to Neo4j — {exc}", file=sys.stderr)
        sys.exit(1)

    with driver.session() as session:
        for description, cypher in SCHEMA:
            print(f"  {description} …", end=" ")
            try:
                session.run(cypher)
                print("OK")
            except Exception as exc:  # noqa: BLE001
                print(f"WARN ({exc})")

    driver.close()
    print("Neo4j schema initialisation complete.")


if __name__ == "__main__":
    main()
