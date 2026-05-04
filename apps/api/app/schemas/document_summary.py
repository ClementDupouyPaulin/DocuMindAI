import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentSummaryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_id: uuid.UUID
    title: str
    summary: str
    chunks_used: int
    provider: str
    created_at: datetime
