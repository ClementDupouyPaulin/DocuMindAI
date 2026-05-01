from fastapi import HTTPException, status
from openai import OpenAI

from app.core.config import get_settings

settings = get_settings()


class EmbeddingService:
    def __init__(self) -> None:
        if not settings.openai_api_key or settings.openai_api_key == "your-api-key":
            self.client: OpenAI | None = None
        else:
            self.client = OpenAI(api_key=settings.openai_api_key)

    def embed_text(self, text: str) -> list[float]:
        if self.client is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenAI API key is not configured.",
            )

        response = self.client.embeddings.create(
            model=settings.embedding_model,
            input=text,
        )

        return response.data[0].embedding

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if self.client is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenAI API key is not configured.",
            )

        if not texts:
            return []

        response = self.client.embeddings.create(
            model=settings.embedding_model,
            input=texts,
        )

        return [item.embedding for item in response.data]


embedding_service = EmbeddingService()