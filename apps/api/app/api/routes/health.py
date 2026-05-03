from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.schemas.ai_status import AiStatusRead
from app.services.vector_service import vector_service

router = APIRouter()


@router.get("")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/db")
def health_check_db() -> dict[str, str]:
    with SessionLocal() as db:
        db.execute(text("SELECT 1"))

    return {"status": "ok"}


@router.get("/qdrant")
def health_check_qdrant() -> dict[str, str]:
    vector_service.ensure_collection_exists()

    return {"status": "ok"}


@router.get("/ai", response_model=AiStatusRead)
def get_ai_status() -> AiStatusRead:
    settings = get_settings()

    llm_provider = settings.llm_provider.lower()
    embedding_provider = settings.embedding_provider.lower()

    return AiStatusRead(
        llm_provider=llm_provider,
        embedding_provider=embedding_provider,
        llm_model=settings.llm_model,
        embedding_model=settings.embedding_model,
        demo_mode=llm_provider == "mock" or embedding_provider == "mock",
    )