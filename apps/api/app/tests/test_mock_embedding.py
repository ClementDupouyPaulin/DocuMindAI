from app.services.embedding_service import generate_mock_embedding


def test_generate_mock_embedding_has_expected_dimension() -> None:
    embedding = generate_mock_embedding("Hello DocuMind", dimension=1536)

    assert len(embedding) == 1536


def test_generate_mock_embedding_is_deterministic() -> None:
    first = generate_mock_embedding("same text", dimension=128)
    second = generate_mock_embedding("same text", dimension=128)

    assert first == second


def test_generate_mock_embedding_changes_with_text() -> None:
    first = generate_mock_embedding("first text", dimension=128)
    second = generate_mock_embedding("second text", dimension=128)

    assert first != second
