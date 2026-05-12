from __future__ import annotations

import os
from pydantic_settings import BaseSettings
from pathlib import Path

# Use /tmp for deployed environments, local data/ for development
_base_dir = Path(__file__).resolve().parent.parent
_data_dir = _base_dir / "data" if (_base_dir / "data").exists() or not os.environ.get("RENDER") else Path("/tmp/ragbot_data")


class Settings(BaseSettings):
    APP_NAME: str = "RAGBot Chattify"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{_data_dir / 'ragbot.db'}"

    # JWT
    JWT_SECRET: str = "change-me-in-production-use-a-strong-random-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "https://rag-bot-chattify.vercel.app"]

    # LLM
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    DEFAULT_MODEL: str = "gpt-4o-mini"

    # Uploads
    UPLOAD_DIR: str = str(_data_dir / "uploads")
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50MB

    # Vector Store
    CHROMA_PERSIST_DIR: str = str(_data_dir / "chroma")
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
