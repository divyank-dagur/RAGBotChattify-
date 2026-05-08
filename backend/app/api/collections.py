from __future__ import annotations

import os
import re
import uuid
import asyncio
import logging
from functools import partial
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User
from app.models.collection import Collection
from app.models.document import Document
from app.schemas.collection import CollectionCreate, CollectionResponse, DocumentResponse
from app.core.deps import get_current_user
from app.core.exceptions import NotFoundError, ForbiddenError
from app.config import settings
from app.services.ingestion import ingest_document
from app.vector_store.client import get_chroma_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/collections", tags=["collections"])


def _sanitize_filename(name: str) -> str:
    """Strip path components and dangerous characters from a filename."""
    # Take only the basename, remove path separators
    name = os.path.basename(name)
    # Remove anything that's not alphanumeric, dash, underscore, or dot
    name = re.sub(r"[^\w.\-]", "_", name)
    return name or "unnamed"


@router.get("", response_model=list[CollectionResponse])
async def list_collections(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Collection).where(Collection.user_id == user.id).order_by(Collection.created_at.desc())
    )
    collections = result.scalars().all()

    response = []
    for c in collections:
        count_result = await db.execute(
            select(func.count()).select_from(Document).where(Document.collection_id == c.id)
        )
        doc_count = count_result.scalar() or 0
        resp = CollectionResponse.model_validate(c)
        resp.document_count = doc_count
        response.append(resp)
    return response


@router.post("", response_model=CollectionResponse, status_code=201)
async def create_collection(
    body: CollectionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    collection = Collection(user_id=user.id, name=body.name, description=body.description)
    db.add(collection)
    await db.flush()
    resp = CollectionResponse.model_validate(collection)
    resp.document_count = 0
    return resp


@router.delete("/{collection_id}", status_code=204)
async def delete_collection(
    collection_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Collection).where(Collection.id == collection_id))
    collection = result.scalar_one_or_none()
    if not collection:
        raise NotFoundError("Collection not found")
    if collection.user_id != user.id:
        raise ForbiddenError()

    # Clean up ChromaDB collection
    try:
        client = get_chroma_client()
        client.delete_collection(name=f"collection_{collection_id}")
    except Exception:
        logger.warning("Failed to delete ChromaDB collection %s", collection_id)

    # Clean up uploaded files
    upload_dir = os.path.join(settings.UPLOAD_DIR, collection_id)
    if os.path.isdir(upload_dir):
        import shutil
        shutil.rmtree(upload_dir, ignore_errors=True)

    await db.delete(collection)


@router.get("/{collection_id}/documents", response_model=list[DocumentResponse])
async def list_documents(
    collection_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Collection).where(Collection.id == collection_id))
    collection = result.scalar_one_or_none()
    if not collection or collection.user_id != user.id:
        raise NotFoundError("Collection not found")

    result = await db.execute(
        select(Document).where(Document.collection_id == collection_id).order_by(Document.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{collection_id}/documents", response_model=DocumentResponse, status_code=201)
async def upload_document(
    collection_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Collection).where(Collection.id == collection_id))
    collection = result.scalar_one_or_none()
    if not collection or collection.user_id != user.id:
        raise NotFoundError("Collection not found")

    # Read file with size limit
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large. Max {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB")

    # Sanitize filename to prevent path traversal
    safe_name = _sanitize_filename(file.filename or "upload")
    doc_id = str(uuid.uuid4())
    upload_dir = os.path.join(settings.UPLOAD_DIR, collection_id)
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{doc_id}_{safe_name}")

    # Write file in executor to avoid blocking
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, partial(_write_file, file_path, content))

    doc = Document(
        id=doc_id,
        collection_id=collection_id,
        filename=file.filename or safe_name,
        mime_type=file.content_type or "application/octet-stream",
        file_path=file_path,
        status="processing",
    )
    db.add(doc)
    await db.flush()

    # Ingest in executor to avoid blocking event loop
    try:
        chunk_count = await loop.run_in_executor(
            None, partial(ingest_document, collection_id, doc_id, file_path, file.filename or safe_name)
        )
        doc.chunk_count = chunk_count
        doc.status = "ready"
    except Exception:
        logger.exception("Ingestion failed for document %s", doc_id)
        doc.status = "error"

    await db.flush()
    return doc


@router.delete("/documents/{document_id}", status_code=204)
async def delete_document(
    document_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise NotFoundError("Document not found")

    # Verify ownership through collection
    result = await db.execute(select(Collection).where(Collection.id == doc.collection_id))
    collection = result.scalar_one_or_none()
    if not collection or collection.user_id != user.id:
        raise ForbiddenError()

    # Remove vectors from ChromaDB
    try:
        client = get_chroma_client()
        chroma_col = client.get_collection(name=f"collection_{doc.collection_id}")
        # Delete all chunks for this document
        chunk_ids = [f"{document_id}_chunk_{i}" for i in range(doc.chunk_count)]
        if chunk_ids:
            chroma_col.delete(ids=chunk_ids)
    except Exception:
        logger.warning("Failed to delete vectors for document %s", document_id)

    # Remove file from disk
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    await db.delete(doc)


def _write_file(path: str, content: bytes) -> None:
    with open(path, "wb") as f:
        f.write(content)
