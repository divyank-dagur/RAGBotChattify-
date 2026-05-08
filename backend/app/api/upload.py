from __future__ import annotations

import os
import re
import uuid
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.models.user import User
from app.core.deps import get_current_user
from app.config import settings

router = APIRouter(tags=["upload"])


def _sanitize_filename(name: str) -> str:
    name = os.path.basename(name)
    name = re.sub(r"[^\w.\-]", "_", name)
    return name or "unnamed"


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File too large")

    upload_dir = os.path.join(settings.UPLOAD_DIR, "attachments", user.id)
    os.makedirs(upload_dir, exist_ok=True)

    file_id = str(uuid.uuid4())
    safe_name = _sanitize_filename(file.filename or "upload")
    ext = os.path.splitext(safe_name)[1]
    stored_name = f"{file_id}{ext}"
    file_path = os.path.join(upload_dir, stored_name)

    with open(file_path, "wb") as f:
        f.write(content)

    return {
        "id": file_id,
        "filename": file.filename,
        "mime_type": file.content_type,
        "url": f"/api/files/attachments/{user.id}/{stored_name}",
        "size": len(content),
    }
