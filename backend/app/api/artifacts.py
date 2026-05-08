from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.chat import Chat
from app.models.artifact import Artifact
from app.schemas.artifact import ArtifactUpdate, ArtifactResponse
from app.core.deps import get_current_user
from app.core.exceptions import NotFoundError, ForbiddenError

router = APIRouter(prefix="/artifacts", tags=["artifacts"])


@router.get("/{artifact_id}", response_model=ArtifactResponse)
async def get_artifact(
    artifact_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Artifact).where(Artifact.id == artifact_id))
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise NotFoundError("Artifact not found")

    result = await db.execute(select(Chat).where(Chat.id == artifact.chat_id))
    chat = result.scalar_one_or_none()
    if not chat or (chat.user_id != user.id and chat.visibility != "public"):
        raise ForbiddenError()

    return artifact


@router.patch("/{artifact_id}", response_model=ArtifactResponse)
async def update_artifact(
    artifact_id: str,
    body: ArtifactUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Artifact).where(Artifact.id == artifact_id))
    artifact = result.scalar_one_or_none()
    if not artifact:
        raise NotFoundError("Artifact not found")

    result = await db.execute(select(Chat).where(Chat.id == artifact.chat_id))
    chat = result.scalar_one_or_none()
    if not chat or chat.user_id != user.id:
        raise ForbiddenError()

    if body.content is not None:
        artifact.content = body.content
        artifact.version += 1
    if body.title is not None:
        artifact.title = body.title

    await db.flush()
    return artifact
