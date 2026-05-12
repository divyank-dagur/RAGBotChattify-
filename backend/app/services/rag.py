from __future__ import annotations

import asyncio
import logging
import re
from functools import partial

from rank_bm25 import BM25Okapi

from app.vector_store.client import get_chroma_client

logger = logging.getLogger(__name__)

# Distance threshold — chunks above this are considered low-confidence
LOW_CONFIDENCE_THRESHOLD = 1.4
HIGH_CONFIDENCE_THRESHOLD = 0.8

# Weight for combining vector and BM25 scores (0-1, higher = more vector weight)
VECTOR_WEIGHT = 0.6
BM25_WEIGHT = 0.4


def _tokenize(text: str) -> list[str]:
    """Simple whitespace + punctuation tokenizer for BM25."""
    return re.findall(r"\w+", text.lower())


def _query_hybrid(query: str, collection_id: str) -> list[dict] | None:
    """Hybrid search: combines ChromaDB vector search with BM25 keyword search."""
    client = get_chroma_client()
    collection = client.get_collection(name=f"collection_{collection_id}")

    # Fetch more candidates for re-ranking
    n_candidates = 15
    results = collection.query(query_texts=[query], n_results=n_candidates)

    if not results["documents"] or not results["documents"][0]:
        return None

    docs = results["documents"][0]
    metas = results["metadatas"][0] if results["metadatas"] else [{}] * len(docs)
    distances = results["distances"][0] if results["distances"] else [999] * len(docs)

    # --- BM25 keyword scoring ---
    tokenized_docs = [_tokenize(doc) for doc in docs]
    query_tokens = _tokenize(query)

    bm25_scores = [0.0] * len(docs)
    if any(tokenized_docs) and query_tokens:
        try:
            bm25 = BM25Okapi(tokenized_docs)
            bm25_scores = list(bm25.get_scores(query_tokens))
        except (ValueError, ZeroDivisionError):
            pass

    # Normalize scores to 0-1 range
    max_distance = max(distances) if distances else 1
    min_distance = min(distances) if distances else 0
    dist_range = max_distance - min_distance if max_distance != min_distance else 1

    max_bm25 = max(bm25_scores) if max(bm25_scores) > 0 else 1

    # --- Combine scores ---
    scored = []
    for i, doc in enumerate(docs):
        # Convert distance to similarity (lower distance = higher similarity)
        vector_sim = 1.0 - ((distances[i] - min_distance) / dist_range)
        bm25_sim = bm25_scores[i] / max_bm25

        hybrid_score = (VECTOR_WEIGHT * vector_sim) + (BM25_WEIGHT * bm25_sim)

        scored.append({
            "content": doc,
            "source": metas[i].get("source_filename", "Unknown"),
            "chunk_index": metas[i].get("chunk_index", i),
            "score": distances[i],  # Keep original distance for confidence check
            "hybrid_score": hybrid_score,
        })

    # Sort by hybrid score (descending — higher is better)
    scored.sort(key=lambda x: x["hybrid_score"], reverse=True)

    # Return top 5 re-ranked results
    top = scored[:5]

    # Remove hybrid_score from output (keep score as distance for confidence)
    for item in top:
        item.pop("hybrid_score", None)

    return top


def compute_confidence(sources: list[dict]) -> str:
    """Compute overall retrieval confidence: high, medium, or low."""
    if not sources:
        return "none"
    best_score = min(s["score"] for s in sources)
    if best_score <= HIGH_CONFIDENCE_THRESHOLD:
        return "high"
    elif best_score <= LOW_CONFIDENCE_THRESHOLD:
        return "medium"
    return "low"


async def get_rag_context(query: str, collection_id: str) -> tuple[list[dict] | None, str]:
    """Hybrid retrieval: vector + BM25 keyword search. Returns (sources, confidence_level)."""
    try:
        loop = asyncio.get_event_loop()
        sources = await loop.run_in_executor(None, partial(_query_hybrid, query, collection_id))
        if sources:
            confidence = compute_confidence(sources)
            filtered = [s for s in sources if s["score"] <= LOW_CONFIDENCE_THRESHOLD]
            if filtered:
                return filtered, confidence
            return sources[:1], "low"
        return None, "none"
    except Exception:
        logger.exception("RAG retrieval failed for collection %s", collection_id)
        return None, "none"
