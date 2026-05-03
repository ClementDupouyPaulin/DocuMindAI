from pydantic import BaseModel


class DashboardStatsRead(BaseModel):
    total_documents: int
    indexed_documents: int
    processing_documents: int
    failed_documents: int
    total_chunks: int
    total_conversations: int
    total_messages: int