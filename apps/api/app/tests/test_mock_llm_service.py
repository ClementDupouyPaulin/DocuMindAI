from app.services.llm_service import LlmService


def test_mock_summary_does_not_repeat_prompt_format() -> None:
    service = LlmService()

    context = """
Source [source_1]
Chunk: 0
Page: N/A

Extrait:
DocuMind AI est une application documentaire basée sur une recherche vectorielle.
Elle permet d'importer des fichiers, de les découper en chunks et de poser des questions sourcées.

---

Source [source_2]
Chunk: 1
Page: N/A

Extrait:
Le projet utilise FastAPI, Next.js, PostgreSQL et Qdrant pour construire une architecture RAG.
""".strip()

    answer = service._generate_mock_answer(
        question="Résume ce document de manière structurée.",
        context=context,
    )

    assert "Mode démo sans OpenAI" in answer
    assert "1. Résumé court" in answer
    assert "2. Points clés" in answer
    assert "Question :" not in answer
    assert "Format attendu" not in answer


def test_mock_qa_uses_sources() -> None:
    service = LlmService()

    context = """
Source [source_1]
Chunk: 0
Page: N/A

Extrait:
Le backend expose une API REST sécurisée avec authentification JWT et endpoints documentaires.
""".strip()

    answer = service._generate_mock_answer(
        question="Quelle technologie est utilisée côté backend ?",
        context=context,
    )

    assert "Mode démo sans OpenAI" in answer
    assert "[source_1]" in answer