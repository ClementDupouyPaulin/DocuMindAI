from pydantic import BaseModel


class AiStatusRead(BaseModel):
    llm_provider: str
    embedding_provider: str
    llm_model: str
    embedding_model: str
    demo_mode: bool