from __future__ import annotations

import json
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.chat import Chat
from app.core.deps import get_current_user
from app.core.exceptions import NotFoundError, ForbiddenError

router = APIRouter(tags=["export"])


@router.get("/chats/{chat_id}/export")
async def export_chat(
    chat_id: str,
    format: str = Query("markdown", pattern="^(markdown|json)$"),
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

    if format == "json":
        return _export_json(chat)

    return _export_markdown(chat)


def _export_markdown(chat: Chat) -> PlainTextResponse:
    lines = []
    lines.append(f"# {chat.title}")
    lines.append("")
    lines.append(f"**Model:** {chat.model_id}")
    lines.append(f"**Exported:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
    lines.append("")
    lines.append("---")
    lines.append("")

    for msg in chat.messages:
        role_label = "You" if msg.role == "user" else "RAGBot Chattify"
        timestamp = msg.created_at.strftime("%H:%M") if msg.created_at else ""

        lines.append(f"### {role_label} {timestamp}")
        lines.append("")
        lines.append(msg.content)
        lines.append("")

        # Include citations if present
        if msg.citations:
            try:
                citations = json.loads(msg.citations)
                if citations:
                    lines.append("**Sources:**")
                    for i, c in enumerate(citations):
                        source = c.get("source", "Unknown")
                        chunk = c.get("chunk_index", 0)
                        score = c.get("score", 0)
                        confidence = round((1 - score) * 100)
                        lines.append(f"- [{i+1}] {source} (chunk #{chunk+1}, {confidence}% match)")
                    lines.append("")
            except json.JSONDecodeError:
                pass

        lines.append("---")
        lines.append("")

    content = "\n".join(lines)
    filename = f"{chat.title.replace(' ', '_')}_export.md"

    return PlainTextResponse(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _export_json(chat: Chat) -> dict:
    messages = []
    for msg in chat.messages:
        m = {
            "role": msg.role,
            "content": msg.content,
            "timestamp": msg.created_at.isoformat() if msg.created_at else None,
        }
        if msg.citations:
            try:
                m["citations"] = json.loads(msg.citations)
            except json.JSONDecodeError:
                pass
        messages.append(m)

    return {
        "title": chat.title,
        "model": chat.model_id,
        "exported_at": datetime.utcnow().isoformat(),
        "message_count": len(messages),
        "messages": messages,
    }
