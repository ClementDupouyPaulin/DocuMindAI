Pipeline indexation :
upload → extraction texte → nettoyage → chunking → embeddings → Qdrant → status INDEXED

Pipeline question :
question → embedding question → recherche Qdrant → top chunks → prompt contexte → réponse LLM → sources

Ajoute aussi :
- statuts document : UPLOADED, PROCESSING, INDEXED, FAILED
- chunk_size = 1200
- chunk_overlap = 200
- modèle embedding : text-embedding-3-small
- limites actuelles : pas encore reranking, hybrid search, streaming