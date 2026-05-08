from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class CollectionCreate(BaseModel):
    name: str
    description: str | None = None


class CollectionResponse(BaseModel):
    id: str
    name: str
    description: str | None
    created_at: datetime
    document_count: int = 0

    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    id: str
    collection_id: str
    filename: str
    mime_type: str
    chunk_count: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
