from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.chunk import DocumentChunk
from app.models.conversation import Conversation
from app.models.document import Document
from app.models.message import Message
from app.models.user import User
from app.schemas.stats import DashboardStatsRead

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("/dashboard", response_model=DashboardStatsRead)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardStatsRead:
    total_documents = db.scalar(
        select(func.count(Document.id)).where(Document.user_id == current_user.id)
    )

    indexed_documents = db.scalar(
        select(func.count(Document.id)).where(
            Document.user_id == current_user.id,
            Document.status == "INDEXED",
        )
    )

    processing_documents = db.scalar(
        select(func.count(Document.id)).where(
            Document.user_id == current_user.id,
            Document.status == "PROCESSING",
        )
    )

    failed_documents = db.scalar(
        select(func.count(Document.id)).where(
            Document.user_id == current_user.id,
            Document.status == "FAILED",
        )
    )

    total_chunks = db.scalar(
        select(func.count(DocumentChunk.id))
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(Document.user_id == current_user.id)
    )

    total_conversations = db.scalar(
        select(func.count(Conversation.id)).where(
            Conversation.user_id == current_user.id
        )
    )

    total_messages = db.scalar(
        select(func.count(Message.id))
        .join(Conversation, Conversation.id == Message.conversation_id)
        .where(Conversation.user_id == current_user.id)
    )

    return DashboardStatsRead(
        total_documents=total_documents or 0,
        indexed_documents=indexed_documents or 0,
        processing_documents=processing_documents or 0,
        failed_documents=failed_documents or 0,
        total_chunks=total_chunks or 0,
        total_conversations=total_conversations or 0,
        total_messages=total_messages or 0,
    )