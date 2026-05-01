from fastapi import HTTPException, status
from openai import OpenAI

from app.core.config import get_settings

settings = get_settings()


class LlmService:
    def __init__(self) -> None:
        if not settings.openai_api_key or settings.openai_api_key == "your-api-key":
            self.client: OpenAI | None = None
        else:
            self.client = OpenAI(api_key=settings.openai_api_key)

    def generate_answer(self, question: str, context: str) -> str:
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


llm_service = LlmService()