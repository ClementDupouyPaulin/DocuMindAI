from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.auth import RegisterRequest


def get_user_by_email(db: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    return db.execute(statement).scalar_one_or_none()


def get_user_by_id(db: Session, user_id: str) -> User | None:
    statement = select(User).where(User.id == user_id)
    return db.execute(statement).scalar_one_or_none()


def create_user(db: Session, payload: RegisterRequest) -> User:
    user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role="USER",
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email.lower())

    if user is None:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user