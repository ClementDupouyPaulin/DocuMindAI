from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.chat import ChatQueryRequest, ChatQueryResponse
from app.services.rag_service import answer_question

router = APIRouter()


@router.post("/query", response_model=ChatQueryResponse)
def query_documents(
    payload: ChatQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ChatQueryResponse:
    return answer_question(
        db=db,
        payload=payload,
        current_user=current_user,
    )
