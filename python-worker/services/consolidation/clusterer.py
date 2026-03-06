"""
Clusterer: groups episodes into thematically related clusters that
can then be compressed into semantic memories by the Compressor.
"""
from __future__ import annotations

import re
from collections import defaultdict
from typing import Any, Dict, List, Tuple

import structlog

logger = structlog.get_logger("rem.python_worker.clusterer")

# Minimum number of episodes required to form a cluster worth compressing.
MIN_CLUSTER_SIZE = 2
# Maximum episodes per cluster sent to the compressor in one shot.
MAX_CLUSTER_SIZE = 20


class Clusterer:
    """
    Groups a list of episode dicts into thematic clusters.

    Current strategy:
    1. Group by domain (provided by the parse step).
    2. Within each domain, sub-cluster by shared intent keywords
       extracted from the `intent` field using a simple n-gram overlap.

    This is intentionally kept simple — a vector-similarity clustering
    pass can be added later without changing the interface.
    """

    def __init__(
        self,
        min_cluster_size: int = MIN_CLUSTER_SIZE,
        max_cluster_size: int = MAX_CLUSTER_SIZE,
    ) -> None:
        self.min_cluster_size = min_cluster_size
        self.max_cluster_size = max_cluster_size

    def cluster(self, episodes: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """
        Given a list of episode dicts, return a list of clusters.
        Each cluster is a non-empty list of episode dicts that share a theme.
        """
        if not episodes:
            return []

        # Step 1 — group by domain.
        by_domain: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        for ep in episodes:
            domain = (ep.get("domain") or "general").lower().strip()
            by_domain[domain].append(ep)

        clusters: List[List[Dict[str, Any]]] = []

        for domain, eps in by_domain.items():
            logger.debug("clustering_domain", domain=domain, count=len(eps))

            if len(eps) < self.min_cluster_size:
                logger.debug("domain_too_small", domain=domain, count=len(eps))
                continue

            # Step 2 — sub-cluster by intent keyword overlap.
            sub_clusters = self._keyword_cluster(eps)

            for sc in sub_clusters:
                if len(sc) < self.min_cluster_size:
                    continue
                # Split oversized clusters.
                for chunk in self._chunk(sc, self.max_cluster_size):
                    clusters.append(chunk)

        logger.info("clustering_done", input_episodes=len(episodes), clusters=len(clusters))
        return clusters

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _keyword_cluster(self, episodes: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """Greedy keyword-overlap sub-clustering within a single domain."""
        if not episodes:
            return []

        # Build keyword sets for each episode.
        kw_sets: List[Tuple[Dict[str, Any], set]] = [
            (ep, self._keywords(ep.get("intent", "") + " " + ep.get("raw_content", "")))
            for ep in episodes
        ]

        assigned = [False] * len(kw_sets)
        clusters: List[List[Dict[str, Any]]] = []

        for i, (ep_i, kw_i) in enumerate(kw_sets):
            if assigned[i]:
                continue
            cluster = [ep_i]
            assigned[i] = True

            for j in range(i + 1, len(kw_sets)):
                if assigned[j]:
                    continue
                ep_j, kw_j = kw_sets[j]
                if kw_i & kw_j:  # non-empty intersection
                    cluster.append(ep_j)
                    assigned[j] = True

            clusters.append(cluster)

        return clusters

    @staticmethod
    def _keywords(text: str) -> set:
        """Extract a set of meaningful tokens from text."""
        tokens = re.findall(r"[a-z]{3,}", text.lower())
        # Remove common stop words.
        stop = {
            "the", "and", "for", "with", "that", "this", "was", "are",
            "from", "has", "have", "been", "will", "can", "its", "not",
            "into", "but", "all", "more", "also", "than", "then",
        }
        return {t for t in tokens if t not in stop}

    @staticmethod
    def _chunk(lst: List[Any], size: int) -> List[List[Any]]:
        """Split a list into chunks of at most `size`."""
        return [lst[i : i + size] for i in range(0, len(lst), size)]
