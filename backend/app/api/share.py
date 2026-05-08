from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.chat import Chat
from app.models.share import ShareLink
from app.schemas.chat import ChatWithMessages
from app.core.deps import get_current_user
from app.core.exceptions import NotFoundError, ForbiddenError

router = APIRouter(tags=["share"])


@router.post("/chats/{chat_id}/share")
async def create_share_link(
    chat_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Chat).where(Chat.id == chat_id))
    chat = result.scalar_one_or_none()
    if not chat:
        raise NotFoundError("Chat not found")
    if chat.user_id != user.id:
        raise ForbiddenError()

    # Check for existing non-expired share link
    result = await db.execute(select(ShareLink).where(ShareLink.chat_id == chat_id))
    existing = result.scalar_one_or_none()
    if existing:
        if existing.expires_at and existing.expires_at < datetime.utcnow():
            await db.delete(existing)
            await db.flush()
        else:
            return {"share_id": existing.id, "url": f"/share/{existing.id}"}

    link = ShareLink(chat_id=chat_id, created_by=user.id)
    db.add(link)
    await db.flush()

    return {"share_id": link.id, "url": f"/share/{link.id}"}


@router.get("/share/{share_id}")
async def get_shared_chat(
    share_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ShareLink).where(ShareLink.id == share_id))
    link = result.scalar_one_or_none()
    if not link:
        raise NotFoundError("Share link not found")

    # Check expiry
    if link.expires_at and link.expires_at < datetime.utcnow():
        raise NotFoundError("Share link has expired")

    result = await db.execute(
        select(Chat).options(selectinload(Chat.messages)).where(Chat.id == link.chat_id)
    )
    chat = result.scalar_one_or_none()
    if not chat:
        raise NotFoundError("Chat not found")

    return ChatWithMessages.model_validate(chat)
