from pathlib import Path

from fastapi import HTTPException, status
from pypdf import PdfReader


def extract_text_from_file(storage_path: str, file_type: str) -> list[dict[str, int | str | None]]:
    path = Path(storage_path)

    if not path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stored file not found.",
        )

    if file_type == "TXT":
        return extract_text_from_txt(path)

    if file_type == "PDF":
        return extract_text_from_pdf(path)

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unsupported file type for extraction: {file_type}",
    )


def extract_text_from_txt(path: Path) -> list[dict[str, int | str | None]]:
    text = path.read_text(encoding="utf-8", errors="ignore")

    return [
        {
            "page_number": None,
            "text": text,
        }
    ]


def extract_text_from_pdf(path: Path) -> list[dict[str, int | str | None]]:
    reader = PdfReader(str(path))
    pages: list[dict[str, int | str | None]] = []

    for index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""

        pages.append(
            {
                "page_number": index,
                "text": text,
            }
        )

    return pages