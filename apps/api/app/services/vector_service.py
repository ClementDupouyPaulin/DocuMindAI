import uuid

from qdrant_client import QdrantClient
from qdrant_client.http import models

from app.core.config import get_settings
from app.models.chunk import DocumentChunk
from app.models.document import Document

settings = get_settings()


class VectorService:
    def __init__(self) -> None:
        self.client = QdrantClient(url=settings.qdrant_url)
        self.collection_name = settings.qdrant_collection_name

    def ensure_collection_exists(self) -> None:
        collection_exists = self.client.collection_exists(
            collection_name=self.collection_name,
        )

        if collection_exists:
            return

        self.client.create_collection(
            collection_name=self.collection_name,
            vectors_config=models.VectorParams(
                size=settings.embedding_dimension,
                distance=models.Distance.COSINE,
            ),
        )

    def upsert_chunk_vector(
        self,
        chunk: DocumentChunk,
        document: Document,
        vector: list[float],
    ) -> str:
        self.ensure_collection_exists()

        point_id = str(uuid.uuid4())

        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                models.PointStruct(
                    id=point_id,
                    vector=vector,
                    payload={
                        "chunk_id": str(chunk.id),
                        "document_id": str(document.id),
                        "user_id": str(document.user_id),
                        "filename": document.filename,
                        "title": document.title,
                        "chunk_index": chunk.chunk_index,
                        "page_number": chunk.page_number,
                        "content": chunk.content,
                    },
                )
            ],
        )

        return point_id

    def delete_document_vectors(self, document_id: uuid.UUID) -> None:
        self.ensure_collection_exists()

        self.client.delete(
            collection_name=self.collection_name,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="document_id",
                            match=models.MatchValue(value=str(document_id)),
                        )
                    ]
                )
            ),
        )


vector_service = VectorService()