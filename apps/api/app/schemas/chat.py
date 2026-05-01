import uuid

from pydantic import BaseModel, Field


class ChatQueryRequest(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    conversation_id: uuid.UUID | None = None
    top_k: int = Field(default=5, ge=1, le=10)
    document_ids: list[uuid.UUID] | None = None
    min_score: float = Field(default=0.0, ge=0.0, le=1.0)


class SourceRead(BaseModel):
    chunk_id: uuid.UUID
    document_id: uuid.UUID
    title: str
    filename: str
    page_number: int | None
    chunk_index: int
    score: float
    content_preview: str
    content: str


class ChatQueryResponse(BaseModel):
    conversation_id: uuid.UUID
    answer: str
    sources: list[SourceRead]