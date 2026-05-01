from fastapi import APIRouter, Depends
from qdrant_client import QdrantClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db

router = APIRouter()
settings = get_settings()


@router.get("")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "documind-api",
    }


@router.get("/db")
def database_health_check(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "service": "postgres",
    }


@router.get("/qdrant")
def qdrant_health_check() -> dict[str, str]:
    client = QdrantClient(url=settings.qdrant_url)
    client.get_collections()

    return {
        "status": "ok",
        "service": "qdrant",
    }
