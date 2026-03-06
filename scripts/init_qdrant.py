"""
scripts/init_qdrant.py
─────────────────────
Initialise the Qdrant collection(s) required by REM.

Run once before starting the stack for the first time:

    python scripts/init_qdrant.py

Environment variables (or .env file):
    QDRANT_HOST        default: localhost
    QDRANT_PORT        default: 6334  (gRPC); HTTP is 6333
    QDRANT_COLLECTION  default: rem_episodes
    OPENAI_EMBED_MODEL default: text-embedding-3-small
"""
from __future__ import annotations

import os
import sys

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
except ImportError:
    pass  # python-dotenv optional

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams, OptimizersConfig
except ImportError:
    print("ERROR: qdrant-client is not installed. Run: pip install qdrant-client", file=sys.stderr)
    sys.exit(1)

# ── Configuration ─────────────────────────────────────────────────────────────
HOST = os.getenv("QDRANT_HOST", "localhost")
PORT = int(os.getenv("QDRANT_PORT", "6334"))
COLLECTION = os.getenv("QDRANT_COLLECTION", "rem_episodes")

# Dimension must match your embedding model:
#   text-embedding-3-small → 1536
#   text-embedding-3-large → 3072
#   text-embedding-ada-002 → 1536
MODEL = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")
DIM_MAP = {
    "text-embedding-3-small": 1536,
    "text-embedding-3-large": 3072,
    "text-embedding-ada-002": 1536,
}
VECTOR_DIM = DIM_MAP.get(MODEL, 1536)


def main() -> None:
    print(f"Connecting to Qdrant at {HOST}:{PORT} …")
    client = QdrantClient(host=HOST, port=PORT)

    existing = {c.name for c in client.get_collections().collections}

    if COLLECTION in existing:
        print(f"  Collection '{COLLECTION}' already exists — skipping creation.")
    else:
        print(f"  Creating collection '{COLLECTION}' (dim={VECTOR_DIM}, distance=Cosine) …")
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE),
            optimizers_config=OptimizersConfig(
                default_segment_number=2,
                memmap_threshold=20_000,
            ),
        )
        print(f"  Collection '{COLLECTION}' created.")

    # Verify
    info = client.get_collection(COLLECTION)
    print(f"  Status        : {info.status}")
    print(f"  Vectors count : {info.vectors_count}")
    print(f"  Points count  : {info.points_count}")
    print("Done.")


if __name__ == "__main__":
    main()
