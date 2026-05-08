from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class ChatCreate(BaseModel):
    title: str = "New Chat"
    model_id: str = "gpt-4o-mini"
    collection_id: str | None = None


class ChatUpdate(BaseModel):
    title: str | None = None
    model_id: str | None = None
    collection_id: str | None = None
    visibility: str | None = None


class ChatResponse(BaseModel):
    id: str
    title: str
    model_id: str
    collection_id: str | None
    visibility: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChatWithMessages(ChatResponse):
    messages: list["MessageResponse"] = []


from app.schemas.message import MessageResponse  # noqa: E402

ChatWithMessages.model_rebuild()
