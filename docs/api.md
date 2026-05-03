# API Documentation — DocuMind AI

## Base URL

En local :

```txt
http://localhost:8000
```

Documentation Swagger :

```txt
http://localhost:8000/docs
```

## Authentification

L’API utilise une authentification JWT.

Les routes privées nécessitent :

```txt
Authorization: Bearer <access_token>
```

## Endpoints Auth

### Register

```txt
POST /auth/register
```

Body :

```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Test User"
}
```

### Login

```txt
POST /auth/login
```

Body :

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Current user

```txt
GET /auth/me
```

## Endpoints Documents

### Upload document

```txt
POST /documents/upload
```

Type :

```txt
multipart/form-data
```

Champs :

```txt
file: PDF, DOCX or TXT
title: optional
```

### List documents

```txt
GET /documents
```

Retourne les documents de l’utilisateur connecté.

### Get document

```txt
GET /documents/{document_id}
```

### Index document

```txt
POST /documents/{document_id}/index
```

Lance l’indexation du document en arrière-plan.

Statuts possibles :

```txt
UPLOADED
PROCESSING
INDEXED
FAILED
```

### Delete document

```txt
DELETE /documents/{document_id}
```

Supprime le document et ses métadonnées.

## Endpoints Chat

### Query chat

```txt
POST /chat/query
```

Body :

```json
{
  "question": "Résume ce document",
  "conversation_id": null,
  "top_k": 5,
  "document_ids": null,
  "min_score": 0
}
```

Réponse :

```json
{
  "conversation_id": "uuid",
  "answer": "Réponse générée",
  "sources": [
    {
      "chunk_id": "uuid",
      "document_id": "uuid",
      "title": "Document title",
      "filename": "document.pdf",
      "page_number": 1,
      "chunk_index": 0,
      "score": 0.84,
      "content_preview": "Extrait court",
      "content": "Extrait complet"
    }
  ]
}
```

## Endpoints Conversations

### List conversations

```txt
GET /conversations
```

### Get conversation detail

```txt
GET /conversations/{conversation_id}
```

Retourne une conversation et ses messages.

## Endpoints Stats

### Dashboard stats

```txt
GET /stats/dashboard
```

Retourne :

```json
{
  "total_documents": 6,
  "indexed_documents": 5,
  "processing_documents": 0,
  "failed_documents": 1,
  "total_chunks": 111,
  "total_conversations": 2,
  "total_messages": 4
}
```

## Endpoints Health

### API health

```txt
GET /health
```

### Database health

```txt
GET /health/db
```

### Qdrant health

```txt
GET /health/qdrant
```

## Erreurs communes

### 401 Unauthorized

Utilisateur non connecté ou token expiré.

### 400 Bad Request

Payload invalide ou fichier non supporté.

### 404 Not Found

Ressource introuvable.

### 409 Conflict

Document déjà en cours de traitement.

### 500 Internal Server Error

Erreur inattendue côté backend.