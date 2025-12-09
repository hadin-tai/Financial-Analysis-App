"""Health check endpoint."""
from fastapi import APIRouter
from app.core.config import HF_MODEL

router = APIRouter()

@router.get("/health")
async def health():
    """Lightweight health check endpoint."""
    return {"status": "ok", "service": "insightedge-chatbot", "model": HF_MODEL}
