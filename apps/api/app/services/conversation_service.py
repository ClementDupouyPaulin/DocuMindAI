import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User


def list_conversations_for_user(
    db: Session,
    current_user: User,
) -> list[Conversation]:
    statement = (
        select(Conversation)
        .where(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )

    return list(db.execute(statement).scalars().all())


def get_conversation_for_user(
    db: Session,
    conversation_id: uuid.UUID,
    current_user: User,
) -> tuple[Conversation, list[Message]]:
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

    messages_statement = (
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
    )

    messages = list(db.execute(messages_statement).scalars().all())

    return conversation, messages


def delete_conversation_for_user(
    db: Session,
    conversation_id: uuid.UUID,
    current_user: User,
) -> None:
    conversation, _ = get_conversation_for_user(
        db=db,
        conversation_id=conversation_id,
        current_user=current_user,
    )

    db.delete(conversation)
    db.commit()

def delete_conversation_for_user(
    db: Session,
    conversation_id: uuid.UUID,
    current_user: User,
) -> None:
    conversation = db.get(Conversation, conversation_id)

    if conversation is None or conversation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation introuvable.",
        )

    db.delete(conversation)
    db.commit()