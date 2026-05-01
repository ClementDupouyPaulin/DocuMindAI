from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

router = APIRouter()


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
    return {
        "status": "todo",
        "service": "qdrant",
    }