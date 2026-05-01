from pathlib import Path

from app.services.extraction_service import extract_text_from_txt


def test_extract_text_from_txt(tmp_path: Path) -> None:
    file_path = tmp_path / "sample.txt"
    file_path.write_text("Hello DocuMind AI", encoding="utf-8")

    result = extract_text_from_txt(file_path)

    assert len(result) == 1
    assert result[0]["page_number"] is None
    assert result[0]["text"] == "Hello DocuMind AI"
