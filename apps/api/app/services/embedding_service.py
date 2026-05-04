import hashlib
import math

from fastapi import HTTPException, status
from openai import OpenAI

from app.core.config import get_settings

settings = get_settings()


def generate_mock_embedding(text: str, dimension: int = 1536) -> list[float]:
    vector = [0.0] * dimension
    words = text.lower().split()

    if not words:
        words = ["empty"]

    for word in words:
        digest = hashlib.sha256(word.encode("utf-8")).digest()
        index = int.from_bytes(digest[:4], byteorder="big") % dimension
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        vector[index] += sign

    norm = math.sqrt(sum(value * value for value in vector))

    if norm == 0:
        return vector

    return [value / norm for value in vector]


class EmbeddingService:
    def __init__(self) -> None:
        self.provider = settings.embedding_provider.lower()

        if self.provider == "mock":
            self.client: OpenAI | None = None
            return

        if not settings.openai_api_key or settings.openai_api_key == "your-openai-api-key":
            self.client = None
        else:
            self.client = OpenAI(api_key=settings.openai_api_key)

    def embed_text(self, text: str) -> list[float]:
        return self.embed_texts([text])[0]

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if self.provider == "mock":
            return [
                generate_mock_embedding(
                    text=text,
                    dimension=settings.embedding_dimension,
                )
                for text in texts
            ]

        if self.client is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenAI API key is not configured.",
            )

        response = self.client.embeddings.create(
            model=settings.embedding_model,
            input=texts,
        )

        return [item.embedding for item in response.data]


embedding_service = EmbeddingService()
