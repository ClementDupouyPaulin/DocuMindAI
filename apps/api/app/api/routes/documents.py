import uuid

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.document import DocumentRead
from app.services.document_service import (
    create_document_from_upload,
    delete_document_for_user,
    get_document_for_user,
    list_documents_for_user,
)

router = APIRouter()


@router.post(
    "/upload",
    response_model=DocumentRead,
    status_code=status.HTTP_201_CREATED,
)
def upload_document(
    file: UploadFile = File(...),
    title: str | None = Form(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentRead:
    return create_document_from_upload(
        db=db,
        file=file,
        current_user=current_user,
        title=title,
    )


@router.get("", response_model=list[DocumentRead])
def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DocumentRead]:
    return list_documents_for_user(db=db, current_user=current_user)


@router.get("/{document_id}", response_model=DocumentRead)
def get_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentRead:
    return get_document_for_user(
        db=db,
        document_id=document_id,
        current_user=current_user,
    )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    delete_document_for_user(
        db=db,
        document_id=document_id,
        current_user=current_user,
    )