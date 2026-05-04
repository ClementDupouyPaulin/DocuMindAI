from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.schemas.ai_status import AiStatusRead
from app.services.vector_service import vector_service

router = APIRouter()
settings = get_settings()


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
    llm_provider = settings.llm_provider
    llm_model = settings.llm_model
    embedding_model = settings.embedding_model
    openai_configured = bool(settings.openai_api_key)

    is_mock = llm_provider == "mock"

    return AiStatusRead(
        llm_provider=llm_provider,
        llm_model=llm_model,
        embedding_provider="mock" if is_mock else "openai",
        embedding_model=embedding_model,
        openai_configured=openai_configured,
        mode_label="Mode démo sans OpenAI" if is_mock else "Mode OpenAI réel",
        message=(
            "DocuMind AI utilise des réponses locales et des embeddings simulés. "
            "Ce mode permet de tester l’application sans clé OpenAI et sans consommation de quota."
            if is_mock
            else "DocuMind AI utilise OpenAI pour générer les réponses et les embeddings."
        ),
    )
