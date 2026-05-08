from __future__ import annotations

import json
import logging
from collections.abc import AsyncGenerator

from app.services.llm import stream_chat

logger = logging.getLogger(__name__)


def sse_event(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


async def generate_sse_stream(
    messages: list[dict],
    model: str,
    rag_context: list[dict] | None = None,
) -> AsyncGenerator[str, None]:
    """Generate SSE events from LLM streaming response."""
    if rag_context:
        yield sse_event({"type": "citation", "sources": rag_context})

    full_content = ""
    token_count = 0

    try:
        async for token in stream_chat(messages, model):
            full_content += token
            token_count += 1
            yield sse_event({"type": "token", "content": token})
    except Exception as e:
        logger.exception("LLM streaming error")
        yield sse_event({"type": "error", "content": f"Streaming error: {type(e).__name__}"})

    yield sse_event({
        "type": "done",
        "content": full_content,
        "token_count": token_count,
    })
