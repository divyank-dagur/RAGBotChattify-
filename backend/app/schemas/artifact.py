from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class ArtifactCreate(BaseModel):
    title: str
    content: str
    kind: str = "code"
    language: str | None = None


class ArtifactUpdate(BaseModel):
    title: str | None = None
    content: str | None = None


class ArtifactResponse(BaseModel):
    id: str
    chat_id: str
    message_id: str | None
    title: str
    content: str
    kind: str
    language: str | None
    version: int
    created_at: datetime

    model_config = {"from_attributes": True}
