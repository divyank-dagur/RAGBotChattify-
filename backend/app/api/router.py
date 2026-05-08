from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.chats import router as chats_router
from app.api.messages import router as messages_router
from app.api.collections import router as collections_router
from app.api.artifacts import router as artifacts_router
from app.api.share import router as share_router
from app.api.models_list import router as models_router
from app.api.upload import router as upload_router

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(chats_router)
api_router.include_router(messages_router)
api_router.include_router(collections_router)
api_router.include_router(artifacts_router)
api_router.include_router(share_router)
api_router.include_router(models_router)
api_router.include_router(upload_router)
