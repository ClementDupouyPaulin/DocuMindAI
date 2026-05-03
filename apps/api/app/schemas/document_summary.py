import uuid
from datetime import datetime

from pydantic import BaseModel


class DocumentSummaryRead(BaseModel):
    document_id: uuid.UUID
    title: str
    summary: str
    chunks_used: int
    provider: str
    generated_at: datetime