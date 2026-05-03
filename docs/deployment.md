# Deployment — DocuMind AI

## Déploiement actuel

Le projet utilise actuellement :

- GitHub Pages pour le frontend ;
- Docker Compose pour le développement local ;
- PostgreSQL local via Docker ;
- Qdrant local via Docker ;
- FastAPI local via Docker.

## Frontend GitHub Pages

Le frontend est exporté statiquement avec Next.js puis déployé sur GitHub Pages via GitHub Actions.

URL :

```txt
https://clementdupouypaulin.com/DocuMindAI/
```

## Backend local

Le backend est lancé avec Docker Compose :

```bash
docker compose up -d --build
```

API :

```txt
http://localhost:8000
```

Swagger :

```txt
http://localhost:8000/docs
```

## Variables d’environnement

### Backend

Fichier :

```txt
apps/api/.env
```

Variables principales :

```env
DATABASE_URL=postgresql+psycopg://documind:documind@postgres:5432/documind
QDRANT_URL=http://qdrant:6333
JWT_SECRET_KEY=change-me
OPENAI_API_KEY=your-openai-api-key
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend

Fichier :

```txt
apps/web/.env
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## CI/CD

Trois workflows GitHub Actions sont configurés :

### API CI

Vérifie :

- installation Python ;
- Ruff ;
- Black ;
- Pytest.

### Web CI

Vérifie :

- npm ci ;
- TypeScript ;
- build Next.js.

### GitHub Pages Deploy

Déploie automatiquement le frontend statique.

## Déploiement production recommandé

Pour rendre l’application entièrement publique :

```txt
Frontend  → GitHub Pages
Backend   → Render / Railway / Fly.io
Database  → Render PostgreSQL / Supabase
Vector DB → Qdrant Cloud
Storage   → S3 / MinIO / Cloudflare R2
```

## Étapes futures

1. Déployer FastAPI sur Render ou Railway.
2. Créer une base PostgreSQL managée.
3. Migrer Qdrant vers Qdrant Cloud.
4. Remplacer le stockage local par S3/R2.
5. Mettre à jour `NEXT_PUBLIC_API_URL`.
6. Ajouter monitoring et logs applicatifs.