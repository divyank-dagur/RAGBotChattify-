import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Chat(Base):
    __tablename__ = "chats"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String, default="New Chat")
    model_id: Mapped[str] = mapped_column(String, default="gpt-4o-mini")
    collection_id: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("collections.id", ondelete="SET NULL"), nullable=True
    )
    visibility: Mapped[str] = mapped_column(String, default="private")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan", order_by="Message.created_at")
    collection = relationship("Collection", back_populates="chats")
    artifacts = relationship("Artifact", back_populates="chat", cascade="all, delete-orphan")
    share_links = relationship("ShareLink", back_populates="chat", cascade="all, delete-orphan")
