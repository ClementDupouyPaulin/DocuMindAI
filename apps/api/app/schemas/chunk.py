import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentChunkRead(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    chunk_index: int
    content: str
    token_count: int
    page_number: int | None
    qdrant_point_id: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)