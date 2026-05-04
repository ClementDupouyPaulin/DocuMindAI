from pydantic import BaseModel


class AiStatusRead(BaseModel):
    llm_provider: str
    llm_model: str
    embedding_provider: str
    embedding_model: str
    openai_configured: bool
    mode_label: str
    message: str
