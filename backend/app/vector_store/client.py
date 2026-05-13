from __future__ import annotations

import chromadb
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction

from app.config import settings

_client: chromadb.ClientAPI | None = None
_embedding_fn: OpenAIEmbeddingFunction | None = None


def get_chroma_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
    return _client


def get_embedding_function() -> OpenAIEmbeddingFunction:
    """Use OpenAI embeddings — lightweight, no local model download needed."""
    global _embedding_fn
    if _embedding_fn is None:
        _embedding_fn = OpenAIEmbeddingFunction(
            api_key=settings.OPENAI_API_KEY,
            model_name="text-embedding-3-small",
        )
    return _embedding_fn


def get_or_create_collection(collection_id: str) -> chromadb.Collection:
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=f"collection_{collection_id}",
        metadata={"hnsw:space": "cosine"},
        embedding_function=get_embedding_function(),
    )
