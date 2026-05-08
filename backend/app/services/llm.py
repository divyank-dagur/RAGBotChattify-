from __future__ import annotations

from collections.abc import AsyncGenerator

from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

from app.config import settings

AVAILABLE_MODELS = [
    {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "provider": "openai"},
    {"id": "gpt-4o", "name": "GPT-4o", "provider": "openai"},
    {"id": "gpt-4.1-mini", "name": "GPT-4.1 Mini", "provider": "openai"},
    {"id": "gpt-4.1", "name": "GPT-4.1", "provider": "openai"},
    {"id": "claude-sonnet-4-6", "name": "Claude Sonnet 4.6", "provider": "anthropic"},
    {"id": "claude-haiku-4-5-20251001", "name": "Claude Haiku 4.5", "provider": "anthropic"},
]

# Reusable clients to avoid creating new connection pools per request
_openai_client: AsyncOpenAI | None = None
_anthropic_client: AsyncAnthropic | None = None


def _get_openai() -> AsyncOpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


def _get_anthropic() -> AsyncAnthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _anthropic_client


def get_provider(model_id: str) -> str:
    for m in AVAILABLE_MODELS:
        if m["id"] == model_id:
            return m["provider"]
    return "openai"


async def stream_openai(messages: list[dict], model: str) -> AsyncGenerator[str, None]:
    client = _get_openai()
    stream = await client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
        max_tokens=4096,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content


async def stream_anthropic(messages: list[dict], model: str) -> AsyncGenerator[str, None]:
    client = _get_anthropic()

    # Collect ALL system messages into one, keep non-system messages in order
    system_parts = []
    filtered = []
    for m in messages:
        if m["role"] == "system":
            system_parts.append(m["content"])
        else:
            filtered.append(m)

    system_msg = "\n\n---\n\n".join(system_parts) if system_parts else None

    kwargs = {"model": model, "messages": filtered, "max_tokens": 4096, "stream": True}
    if system_msg:
        kwargs["system"] = system_msg

    async with client.messages.stream(**kwargs) as stream:
        async for text in stream.text_stream:
            yield text


async def stream_chat(messages: list[dict], model: str) -> AsyncGenerator[str, None]:
    provider = get_provider(model)
    if provider == "anthropic":
        async for token in stream_anthropic(messages, model):
            yield token
    else:
        async for token in stream_openai(messages, model):
            yield token
