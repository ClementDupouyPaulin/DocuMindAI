users :
id, email, hashed_password, full_name, role, created_at, updated_at

documents :
id, user_id, title, filename, file_type, file_size, storage_path, status, error_message, created_at, updated_at

document_chunks :
id, document_id, chunk_index, content, token_count, page_number, qdrant_point_id, created_at

conversations :
id, user_id, title, created_at, updated_at

messages :
id, conversation_id, role, content, sources_json, created_at

rag_queries :
id, user_id, conversation_id, question, retrieved_chunks_json, model_name, latency_ms, created_at