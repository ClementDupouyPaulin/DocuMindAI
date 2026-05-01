# DocuMind AI

DocuMind AI is a full-stack RAG platform that allows users to upload PDF and TXT documents, index them into a vector database, and ask natural-language questions with sourced answers.

The goal of this project is to demonstrate a complete AI-oriented software architecture: document ingestion, text extraction, chunking, embeddings, vector search, RAG answer generation, authentication, full-stack UI, PostgreSQL persistence, Qdrant vector storage, Docker, and technical documentation.

## Features

### Authentication
- User registration
- User login
- JWT authentication
- Protected API routes
- Protected frontend pages

### Document management
- Upload PDF/TXT files
- Store uploaded files locally
- Store document metadata in PostgreSQL
- Display document status
- Delete documents
- Re-index documents

### RAG pipeline
- Extract text from documents
- Clean extracted text
- Split text into chunks
- Generate embeddings
- Store vectors in Qdrant
- Search relevant chunks by semantic similarity
- Generate answers with OpenAI
- Return sourced answers

### Chat
- Ask questions about indexed documents
- Retrieve relevant sources
- Display citations and previews
- Save conversations
- Load previous conversations

## Tech Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS

### Backend
- FastAPI
- Python
- SQLAlchemy
- Alembic
- Pydantic

### Data
- PostgreSQL
- Qdrant

### AI
- OpenAI API
- Embeddings
- Retrieval-Augmented Generation

### DevOps
- Docker
- Docker Compose
- Git
- GitHub

## Architecture

```txt
documind-ai/
│
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # FastAPI backend
│
├── docs/             # Technical documentation
├── storage/          # Local uploaded files
├── docker-compose.yml
└── README.md