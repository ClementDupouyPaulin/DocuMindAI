import uuid

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.chunk import DocumentChunk
from app.models.document import Document
from app.models.user import User
from app.services.chunking_service import split_text_into_chunks
from app.services.document_service import get_document_for_user
from app.services.extraction_service import extract_text_from_file


def index_document(
    db: Session,
    document_id: uuid.UUID,
    current_user: User,
) -> Document:
    document = get_document_for_user(
        db=db,
        document_id=document_id,
        current_user=current_user,
    )

    if document.status == "PROCESSING":
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

        chunks = split_text_into_chunks(pages)

        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No text could be extracted from this document.",
            )

        db.execute(
            delete(DocumentChunk).where(DocumentChunk.document_id == document.id)
        )

        for chunk in chunks:
            db.add(
                DocumentChunk(
                    document_id=document.id,
                    chunk_index=int(chunk["chunk_index"]),
                    content=str(chunk["content"]),
                    token_count=int(chunk["token_count"]),
                    page_number=chunk["page_number"],
                )
            )

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