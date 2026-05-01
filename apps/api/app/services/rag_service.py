import time
import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.rag_query import RagQuery
from app.models.user import User
from app.schemas.chat import ChatQueryRequest, ChatQueryResponse, SourceRead
from app.services.embedding_service import embedding_service
from app.services.llm_service import llm_service
from app.services.vector_service import vector_service

settings = get_settings()


def answer_question(
    db: Session,
    payload: ChatQueryRequest,
    current_user: User,
) -> ChatQueryResponse:
    started_at = time.perf_counter()
    question = payload.question.strip()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty.",
        )

    conversation = _get_or_create_conversation(
        db=db,
        conversation_id=payload.conversation_id,
        current_user=current_user,
        question=question,
    )

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=question,
    )
    db.add(user_message)
    db.flush()

    query_vector = embedding_service.embed_text(question)

    retrieved_chunks = vector_service.search_similar_chunks(
        query_vector=query_vector,
        user_id=current_user.id,
        limit=payload.top_k,
        document_ids=payload.document_ids,
        min_score=payload.min_score,
    )

    sources = _build_sources(retrieved_chunks)

    if not retrieved_chunks:
        answer = (
            "Je n’ai pas trouvé d’extrait pertinent dans vos documents pour répondre "
            "à cette question."
        )
    else:
        context = _build_context(retrieved_chunks)

        answer = llm_service.generate_answer(
            question=question,
            context=context,
        )

    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=answer,
        sources_json=[source.model_dump(mode="json") for source in sources],
    )
    db.add(assistant_message)

    latency_ms = int((time.perf_counter() - started_at) * 1000)

    rag_query = RagQuery(
        user_id=current_user.id,
        conversation_id=conversation.id,
        question=question,
        retrieved_chunks_json=retrieved_chunks,
        model_name=settings.llm_model,
        latency_ms=latency_ms,
    )
    db.add(rag_query)

    conversation.updated_at = datetime.now(UTC)

    db.commit()
    db.refresh(conversation)

    return ChatQueryResponse(
        conversation_id=conversation.id,
        answer=answer,
        sources=sources,
    )


def _get_or_create_conversation(
    db: Session,
    conversation_id: uuid.UUID | None,
    current_user: User,
    question: str,
) -> Conversation:
    if conversation_id is not None:
        statement = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )

        conversation = db.execute(statement).scalar_one_or_none()

        if conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found.",
            )

        return conversation

    conversation = Conversation(
        user_id=current_user.id,
        title=question[:80],
    )

    db.add(conversation)
    db.flush()

    return conversation


def _build_context(retrieved_chunks: list[dict]) -> str:
    context_parts: list[str] = []

    for index, chunk in enumerate(retrieved_chunks, start=1):
        source_label = f"source_{index}"

        title = chunk.get("title") or "Document sans titre"
        filename = chunk.get("filename") or "fichier inconnu"
        page_number = chunk.get("page_number")
        content = chunk.get("content") or ""

        page_info = f"page {page_number}" if page_number else "page inconnue"

        context_parts.append(
            f"[{source_label}]\n"
            f"Document: {title}\n"
            f"Fichier: {filename}\n"
            f"Localisation: {page_info}\n"
            f"Extrait:\n{content}"
        )

    return "\n\n---\n\n".join(context_parts)


def _build_sources(retrieved_chunks: list[dict]) -> list[SourceRead]:
    sources: list[SourceRead] = []

    for chunk in retrieved_chunks:
        content = str(chunk.get("content") or "")
        preview = content[:300]

        if len(content) > 300:
            preview += "..."

        if not chunk.get("chunk_id") or not chunk.get("document_id"):
            continue

        sources.append(
            SourceRead(
                chunk_id=chunk["chunk_id"],
                document_id=chunk["document_id"],
                title=str(chunk.get("title") or "Document sans titre"),
                filename=str(chunk.get("filename") or "fichier inconnu"),
                page_number=chunk.get("page_number"),
                chunk_index=int(chunk.get("chunk_index") or 0),
                score=float(chunk.get("score") or 0),
                content_preview=preview,
                content=content,
            )
        )

    return sources
