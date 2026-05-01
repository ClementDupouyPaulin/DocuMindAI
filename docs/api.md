Auth :
POST /auth/register
POST /auth/login
GET /auth/me

Documents :
POST /documents/upload
GET /documents
GET /documents/{id}
POST /documents/{id}/index
GET /documents/{id}/chunks
DELETE /documents/{id}

Chat :
POST /chat/query

Conversations :
GET /conversations
GET /conversations/{id}
DELETE /conversations/{id}

Health :
GET /health
GET /health/db
GET /health/qdrant