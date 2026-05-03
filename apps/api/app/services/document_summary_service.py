import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.chunk import DocumentChunk
from app.models.document_summary import DocumentSummary
from app.models.user import User
from app.schemas.document_summary import DocumentSummaryRead
from app.services.document_service import get_document_for_user
from app.services.llm_service import llm_service

settings = get_settings()


def build_summary_context(chunks: list[DocumentChunk], max_chars: int = 12000) -> str:
    context_blocks: list[str] = []
    current_size = 0

    for index, chunk in enumerate(chunks, start=1):
        block = f"""
Source [source_{index}]
Chunk: {chunk.chunk_index}
Page: {chunk.page_number or "N/A"}

Extrait:
{chunk.content}
""".strip()

        if current_size + len(block) > max_chars:
            break

        context_blocks.append(block)
        current_size += len(block)

    return "\n\n---\n\n".join(context_blocks)


def get_latest_summary_for_user(
    db: Session,
    document_id: uuid.UUID,
    current_user: User,
) -> DocumentSummaryRead | None:
    document = get_document_for_user(
        db=db,
        document_id=document_id,
        current_user=current_user,
    )

    summary = db.scalar(
        select(DocumentSummary)
        .where(DocumentSummary.document_id == document.id)
        .where(DocumentSummary.user_id == current_user.id)
        .order_by(DocumentSummary.created_at.desc())
        .limit(1)
    )

    if summary is None:
        return None

    return DocumentSummaryRead.model_validate(summary)


def summarize_document_for_user(
    db: Session,
    document_id: uuid.UUID,
    current_user: User,
    force: bool = False,
) -> DocumentSummaryRead:
    document = get_document_for_user(
        db=db,
        document_id=document_id,
        current_user=current_user,
    )

    if not force:
        existing_summary = get_latest_summary_for_user(
            db=db,
            document_id=document.id,
            current_user=current_user,
        )

        if existing_summary is not None:
            return existing_summary

    chunks = list(
        db.scalars(
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document.id)
            .order_by(DocumentChunk.chunk_index)
            .limit(20)
        )
    )

    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun chunk disponible. Indexe d’abord le document.",
        )

    context = build_summary_context(chunks)

    question = """
Résume ce document de manière structurée.

Format attendu :
1. Résumé court
2. Points clés
3. Notions importantes
4. Ce qu’il faut retenir

Réponds uniquement à partir des extraits fournis.
""".strip()

    generated_summary = llm_service.generate_answer(
        question=question,
        context=context,
    )

    summary = DocumentSummary(
        document_id=document.id,
        user_id=current_user.id,
        title=document.title,
        summary=generated_summary,
        chunks_used=len(chunks),
        provider=settings.llm_provider,
    )

    db.add(summary)
    db.commit()
    db.refresh(summary)

    return DocumentSummaryRead.model_validate(summary)