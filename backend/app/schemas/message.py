from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class MessageCreate(BaseModel):
    content: str
    attachments: list[dict] | None = None


class MessageResponse(BaseModel):
    id: str
    chat_id: str
    role: str
    content: str
    citations: str | None
    attachments: str | None
    token_count: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class VoteRequest(BaseModel):
    is_upvoted: bool
