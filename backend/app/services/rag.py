from __future__ import annotations

import asyncio
import logging
from functools import partial

from app.vector_store.client import get_chroma_client

logger = logging.getLogger(__name__)


def _query_chroma(query: str, collection_id: str) -> list[dict] | None:
    """Synchronous ChromaDB query — run in executor from async context."""
    client = get_chroma_client()
    collection = client.get_collection(name=f"collection_{collection_id}")
    results = collection.query(query_texts=[query], n_results=5)

    if not results["documents"] or not results["documents"][0]:
        return None

    sources = []
    for i, doc in enumerate(results["documents"][0]):
        metadata = results["metadatas"][0][i] if results["metadatas"] else {}
        sources.append({
            "content": doc,
            "source": metadata.get("source_filename", "Unknown"),
            "chunk_index": metadata.get("chunk_index", i),
            "score": results["distances"][0][i] if results["distances"] else 0,
        })
    return sources


async def get_rag_context(query: str, collection_id: str) -> list[dict] | None:
    """Retrieve relevant document chunks — runs blocking ChromaDB call in executor."""
    try:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, partial(_query_chroma, query, collection_id))
    except Exception:
        logger.exception("RAG retrieval failed for collection %s", collection_id)
        return None
