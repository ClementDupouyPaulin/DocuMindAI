import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class MessageRead(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    content: str
    sources_json: list[dict[str, Any]] | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationDetailRead(ConversationRead):
    messages: list[MessageRead]