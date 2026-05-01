import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.conversation import ConversationDetailRead, ConversationRead
from app.services.conversation_service import (
    delete_conversation_for_user,
    get_conversation_for_user,
    list_conversations_for_user,
)

router = APIRouter()


@router.get("", response_model=list[ConversationRead])
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ConversationRead]:
    return list_conversations_for_user(
        db=db,
        current_user=current_user,
    )


@router.get("/{conversation_id}", response_model=ConversationDetailRead)
def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationDetailRead:
    conversation, messages = get_conversation_for_user(
        db=db,
        conversation_id=conversation_id,
        current_user=current_user,
    )

    return ConversationDetailRead(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=messages,
    )


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    delete_conversation_for_user(
        db=db,
        conversation_id=conversation_id,
        current_user=current_user,
    )
