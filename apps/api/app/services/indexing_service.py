import logging
import uuid

from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.chunk import DocumentChunk
from app.models.document import Document
from app.models.user import User
from app.services.chunking_service import split_text_into_chunks
from app.services.document_service import get_document_for_user
from app.services.embedding_service import embedding_service
from app.services.extraction_service import extract_text_from_file
from app.services.vector_service import vector_service

logger = logging.getLogger(__name__)


def index_document(
    db: Session,
    document_id: uuid.UUID,
    current_user: User,
    allow_processing_status: bool = False,
) -> Document:
    document = get_document_for_user(
        db=db,
        document_id=document_id,
        current_user=current_user,
    )

    if document.status == "PROCESSING" and not allow_processing_status:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document is already being processed.",
        )

    try:
        document.status = "PROCESSING"
        document.error_message = None
        db.commit()
        db.refresh(document)

        pages = extract_text_from_file(
            storage_path=document.storage_path,
            file_type=document.file_type,
        )

        chunks_data = split_text_into_chunks(pages)

        if not chunks_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No text could be extracted from this document.",
            )

        db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document.id))
        vector_service.delete_document_vectors(document_id=document.id)

        chunks: list[DocumentChunk] = []

        for chunk_data in chunks_data:
            chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=int(chunk_data["chunk_index"]),
                content=str(chunk_data["content"]),
                token_count=int(chunk_data["token_count"]),
                page_number=chunk_data["page_number"],
            )

            db.add(chunk)
            chunks.append(chunk)

        db.flush()

        embeddings = embedding_service.embed_texts([chunk.content for chunk in chunks])

        for chunk, vector in zip(chunks, embeddings, strict=True):
            point_id = vector_service.upsert_chunk_vector(
                chunk=chunk,
                document=document,
                vector=vector,
            )
            chunk.qdrant_point_id = point_id

        document.status = "INDEXED"
        db.commit()
        db.refresh(document)

        return document

    except Exception as exc:
        db.rollback()

        document.status = "FAILED"
        document.error_message = str(exc)
        db.commit()
        db.refresh(document)

        raise


def list_chunks_for_document(
    db: Session,
    document_id: uuid.UUID,
    current_user: User,
) -> list[DocumentChunk]:
    document = get_document_for_user(
        db=db,
        document_id=document_id,
        current_user=current_user,
    )

    statement = (
        select(DocumentChunk)
        .where(DocumentChunk.document_id == document.id)
        .order_by(DocumentChunk.chunk_index.asc())
    )

    return list(db.execute(statement).scalars().all())


def enqueue_document_indexing(
    db: Session,
    document_id: uuid.UUID,
    current_user: User,
    background_tasks: BackgroundTasks,
) -> Document:
    statement = select(Document).where(
        Document.id == document_id,
        Document.user_id == current_user.id,
    )

    document = db.execute(statement).scalar_one_or_none()

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    document.status = "PROCESSING"
    document.error_message = None

    db.commit()
    db.refresh(document)

    background_tasks.add_task(
        index_document_in_background,
        str(document.id),
        str(current_user.id),
    )

    return document


def index_document_in_background(document_id: str, user_id: str) -> None:
    db = SessionLocal()

    try:
        user = db.get(User, uuid.UUID(user_id))

        if user is None:
            return

        index_document(
            db=db,
            document_id=uuid.UUID(document_id),
            current_user=user,
            allow_processing_status=True,
        )

    except Exception as exc:
        logger.exception("Document indexing failed in background task")

        db.rollback()

        document = db.get(Document, uuid.UUID(document_id))

        if document is not None:
            document.status = "FAILED"
            document.error_message = format_indexing_error(exc)
            db.commit()

    finally:
        db.close()


def format_indexing_error(error: Exception) -> str:
    message = str(error)

    if "insufficient_quota" in message or "exceeded your current quota" in message:
        return (
            "Quota OpenAI insuffisant ou limite atteinte. "
            "Vérifie ton billing OpenAI, ton crédit API ou ta clé API."
        )

    if "401" in message or "invalid_api_key" in message:
        return "Clé OpenAI invalide ou non autorisée."

    if "OpenAI API key is not configured" in message:
        return "Clé OpenAI non configurée côté backend."

    if "timed out" in message.lower() or "timeout" in message.lower():
        return "Délai dépassé pendant l’indexation. Réessaie dans quelques instants."

    if "qdrant" in message.lower():
        return "Erreur avec la base vectorielle Qdrant pendant l’indexation."

    if "Stored file not found" in message:
        return "Fichier introuvable sur le stockage local."

    return message[:500]
