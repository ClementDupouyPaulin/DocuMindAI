from fastapi import HTTPException, status
from openai import OpenAI

from app.core.config import get_settings

settings = get_settings()


class LlmService:
    def __init__(self) -> None:
        self.provider = settings.llm_provider.lower()

        if self.provider == "mock":
            self.client: OpenAI | None = None
            return

        if not settings.openai_api_key or settings.openai_api_key == "your-openai-api-key":
            self.client = None
        else:
            self.client = OpenAI(api_key=settings.openai_api_key)

    def generate_answer(self, question: str, context: str) -> str:
        if self.provider == "mock":
            return self._generate_mock_answer(question=question, context=context)

        if self.client is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenAI API key is not configured.",
            )

        system_prompt = """
Tu es DocuMind AI, un assistant documentaire RAG.

Règles :
- Réponds uniquement à partir du contexte fourni.
- Si le contexte ne contient pas la réponse, dis clairement que les documents ne permettent pas de répondre.
- Cite les sources utilisées avec le format [source_1], [source_2], etc.
- Sois clair, précis et synthétique.
- N'invente aucune information.
""".strip()

        user_prompt = f"""
QUESTION :
{question}

CONTEXTE :
{context}

Réponds à la question avec des citations de sources.
""".strip()

        response = self.client.responses.create(
            model=settings.llm_model,
            input=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
        )

        return response.output_text

    def _generate_mock_answer(self, question: str, context: str) -> str:
        if not context.strip():
            return (
                "Mode démo : aucun contexte pertinent n’a été retrouvé dans les documents "
                "pour répondre à cette question."
            )

        excerpts = self._extract_mock_excerpts(context)

        if not excerpts:
            return (
                "Mode démo : les documents ont été retrouvés, mais aucun extrait exploitable "
                "n’a pu être résumé."
            )

        bullet_points = "\n".join(
            f"- {excerpt} [source_{index}]"
            for index, excerpt in enumerate(excerpts, start=1)
        )

        return (
            "Mode démo sans OpenAI.\n\n"
            f"Question : {question}\n\n"
            "Synthèse basée sur les sources retrouvées :\n"
            f"{bullet_points}\n\n"
            "Cette réponse est générée localement à partir des chunks récupérés. "
            "Elle sert à démontrer le fonctionnement RAG sans consommer de quota OpenAI."
        )

    def _extract_mock_excerpts(self, context: str, max_excerpts: int = 3) -> list[str]:
        excerpts: list[str] = []

        for block in context.split("---"):
            marker = "Extrait:"
            if marker not in block:
                continue

            excerpt = block.split(marker, maxsplit=1)[1].strip()
            excerpt = " ".join(excerpt.split())

            if not excerpt:
                continue

            if len(excerpt) > 220:
                excerpt = f"{excerpt[:220]}..."

            excerpts.append(excerpt)

            if len(excerpts) >= max_excerpts:
                break

        return excerpts


llm_service = LlmService()