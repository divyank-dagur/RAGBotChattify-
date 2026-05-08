from __future__ import annotations

import json
import logging
from fastapi import APIRouter, Depends, Query, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db, async_session
from app.models.user import User
from app.models.chat import Chat
from app.models.message import Message
from app.models.vote import Vote
from app.schemas.message import MessageCreate, MessageResponse, VoteRequest
from app.core.deps import get_current_user
from app.core.exceptions import NotFoundError, ForbiddenError
from app.services.streaming import generate_sse_stream
from app.services.rag import get_rag_context

logger = logging.getLogger(__name__)

router = APIRouter(tags=["messages"])


@router.get("/chats/{chat_id}/messages", response_model=list[MessageResponse])
async def list_messages(
    chat_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()
    if not chat:
        raise NotFoundError("Chat not found")
    if chat.user_id != user.id:
        raise ForbiddenError()

    result = await db.execute(
        select(Message)
        .where(Message.chat_id == chat_id)
        .order_by(Message.created_at)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()


@router.post("/chats/{chat_id}/messages")
async def send_message(
    chat_id: str,
    body: MessageCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Chat).options(selectinload(Chat.messages)).where(Chat.id == chat_id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise NotFoundError("Chat not found")
    if chat.user_id != user.id:
        raise ForbiddenError()

    # Save user message
    user_msg = Message(
        chat_id=chat_id,
        role="user",
        content=body.content,
        attachments=json.dumps(body.attachments) if body.attachments else None,
    )
    db.add(user_msg)

    # Auto-title from first message
    if len(chat.messages) == 0:
        chat.title = body.content[:80].strip()

    await db.flush()
    await db.commit()

    # Build message history for LLM — combine system prompts into one
    system_parts = [_build_system_prompt()]

    # RAG context
    rag_context = None
    if chat.collection_id:
        rag_context = await get_rag_context(body.content, chat.collection_id)
        if rag_context:
            context_text = "\n\n".join(
                f"[Source: {c['source']}]\n{c['content']}" for c in rag_context
            )
            system_parts.append(
                f"Use the following context to answer. Cite sources when relevant:\n\n{context_text}"
            )

    llm_messages = [{"role": "system", "content": "\n\n---\n\n".join(system_parts)}]

    for msg in chat.messages:
        llm_messages.append({"role": msg.role, "content": msg.content})
    llm_messages.append({"role": "user", "content": body.content})

    model_id = chat.model_id
    citations_json = json.dumps(rag_context) if rag_context else None

    async def stream_and_save():
        """Stream SSE events and save the assistant message after completion."""
        full_content = ""
        token_count = 0

        async for event_str in generate_sse_stream(llm_messages, model_id, rag_context):
            yield event_str

            # Parse the event to accumulate content
            try:
                line = event_str.strip()
                if line.startswith("data: "):
                    data = json.loads(line[6:])
                    if data.get("type") == "token":
                        full_content += data.get("content", "")
                    elif data.get("type") == "done":
                        full_content = data.get("content", full_content)
                        token_count = data.get("token_count", token_count)
            except (json.JSONDecodeError, KeyError):
                pass

        # Save assistant message using a fresh session
        try:
            async with async_session() as save_db:
                assistant_msg = Message(
                    chat_id=chat_id,
                    role="assistant",
                    content=full_content,
                    citations=citations_json,
                    token_count=token_count,
                )
                save_db.add(assistant_msg)
                await save_db.commit()
        except Exception:
            logger.exception("Failed to save assistant message for chat %s", chat_id)

    return StreamingResponse(
        stream_and_save(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Chat-Id": chat_id,
            "X-User-Message-Id": user_msg.id,
        },
    )


@router.post("/chats/{chat_id}/messages/{message_id}/vote")
async def vote_message(
    chat_id: str,
    message_id: str,
    body: VoteRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()
    if not chat or chat.user_id != user.id:
        raise ForbiddenError()

    # Verify message belongs to this chat
    result = await db.execute(
        select(Message).where(Message.id == message_id, Message.chat_id == chat_id)
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise NotFoundError("Message not found in this chat")

    result = await db.execute(
        select(Vote).where(Vote.chat_id == chat_id, Vote.message_id == message_id)
    )
    vote = result.scalar_one_or_none()

    if vote:
        vote.is_upvoted = 1 if body.is_upvoted else 0
    else:
        vote = Vote(chat_id=chat_id, message_id=message_id, is_upvoted=1 if body.is_upvoted else 0)
        db.add(vote)

    return {"status": "ok"}


def _build_system_prompt() -> str:
    return (
        "You are RAGBot Chattify, an intelligent AI assistant. "
        "You provide helpful, accurate, and well-structured responses. "
        "When you have context from documents, cite your sources. "
        "Format your responses using Markdown when appropriate. "
        "For code, always use fenced code blocks with the language specified."
    )
