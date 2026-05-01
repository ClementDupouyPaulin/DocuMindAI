from app.services.chunking_service import clean_text, estimate_token_count, split_text_into_chunks


def test_clean_text_removes_extra_spaces_and_newlines() -> None:
    raw_text = "Hello     world\n\n\n\nThis is   DocuMind."
    cleaned = clean_text(raw_text)

    assert cleaned == "Hello world\n\nThis is DocuMind."


def test_estimate_token_count_returns_at_least_one() -> None:
    assert estimate_token_count("") == 1
    assert estimate_token_count("abcd") == 1
    assert estimate_token_count("a" * 100) == 25


def test_split_text_into_chunks_creates_chunks() -> None:
    pages = [
        {
            "page_number": 1,
            "text": "A" * 2500,
        }
    ]

    chunks = split_text_into_chunks(
        pages=pages,
        chunk_size=1000,
        chunk_overlap=100,
    )

    assert len(chunks) >= 2
    assert chunks[0]["chunk_index"] == 0
    assert chunks[0]["page_number"] == 1
    assert chunks[0]["token_count"] is not None
    assert len(str(chunks[0]["content"])) <= 1000