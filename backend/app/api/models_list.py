from fastapi import APIRouter
from app.services.llm import AVAILABLE_MODELS

router = APIRouter(tags=["models"])


@router.get("/models")
async def list_models():
    return {"models": AVAILABLE_MODELS}
