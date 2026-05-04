from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "DocuMind AI"
    environment: str = "development"

    database_url: str
    qdrant_url: str
    qdrant_api_key: str | None = None
    qdrant_collection_name: str = "documind_chunks"

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    openai_api_key: str | None = None

    # Par défaut : mode portfolio/demo sans consommation OpenAI.
    # En production réelle, tu override avec LLM_PROVIDER=openai.
    llm_provider: str = "mock"
    llm_model: str = "mock"

    embedding_provider: str = "mock"
    embedding_model: str = "text-embedding-3-small"
    embedding_dimension: int = 1536

    upload_dir: str = "/app/storage/uploads"
    max_upload_size_mb: int = 25

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        url = str(value)

        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)

        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)

        return url

    @field_validator("openai_api_key", "qdrant_api_key", mode="before")
    @classmethod
    def empty_string_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None

        cleaned_value = str(value).strip()

        if cleaned_value == "":
            return None

        return cleaned_value

    @field_validator("llm_provider", "embedding_provider", mode="before")
    @classmethod
    def normalize_provider(cls, value: str) -> str:
        return str(value).strip().lower()


@lru_cache
def get_settings() -> Settings:
    return Settings()


def get_cors_origins() -> list[str]:
    settings = get_settings()

    return [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
