import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.services.vector_service import vector_service
from app.core.config import get_settings
from app.models.document import Document
from app.models.user import User

settings = get_settings()

ALLOWED_EXTENSIONS = {
    ".pdf": "PDF",
    ".txt": "TXT",
}


def _get_file_type(filename: str) -> str:
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Only PDF and TXT files are allowed for V1.",
        )

    return ALLOWED_EXTENSIONS[extension]


def create_document_from_upload(
    db: Session,
    file: UploadFile,
    current_user: User,
    title: str | None = None,
) -> Document:
    original_filename = file.filename or "uploaded-file"
    file_type = _get_file_type(original_filename)

    content = file.file.read()
    file_size = len(content)

    max_size_bytes = settings.max_upload_size_mb * 1024 * 1024

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File is too large. Max size is {settings.max_upload_size_mb} MB.",
        )

    document_id = uuid.uuid4()
    extension = Path(original_filename).suffix.lower()

    user_upload_dir = Path(settings.upload_dir) / str(current_user.id)
    user_upload_dir.mkdir(parents=True, exist_ok=True)

    stored_filename = f"{document_id}{extension}"
    storage_path = user_upload_dir / stored_filename

    storage_path.write_bytes(content)

    document = Document(
        id=document_id,
        user_id=current_user.id,
        title=title or Path(original_filename).stem,
        filename=original_filename,
        file_type=file_type,
        file_size=file_size,
        storage_path=str(storage_path),
        status="UPLOADED",
    )

    try:
        db.add(document)
        db.commit()
        db.refresh(document)
    except Exception:
        db.rollback()

        if storage_path.exists():
            storage_path.unlink()

        raise

    return document


def list_documents_for_user(db: Session, current_user: User) -> list[Document]:
    statement = (
        select(Document)
        .where(Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
    )

    return list(db.execute(statement).scalars().all())


def get_document_for_user(
    db: Session,
    document_id: uuid.UUID,
    current_user: User,
) -> Document:
    statement = select(Document).where(
        Document.id == document_id,
        Document.user_id == current_user.id,
    )

    document = db.execute(statement).scalar_one_or_none()

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    return document


def delete_document_for_user(
    db: Session,
    document_id: uuid.UUID,
    current_user: User,
) -> None:
    document = get_document_for_user(db, document_id, current_user)

    storage_path = Path(document.storage_path)

    if storage_path.exists():
        storage_path.unlink()

    vector_service.delete_document_vectors(document_id=document.id)

    db.delete(document)
    db.commit()
