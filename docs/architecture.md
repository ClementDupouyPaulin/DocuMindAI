# Architecture — DocuMind AI

## Overview

DocuMind AI est une application full-stack RAG permettant d’importer des documents PDF, DOCX et TXT, de les indexer dans une base vectorielle, puis de poser des questions avec réponses sourcées.

L’architecture est séparée en plusieurs couches afin de garder un projet maintenable, testable et évolutif.

## Architecture globale

```txt
User
 ↓
Next.js Frontend
 ↓
FastAPI Backend
 ↓
PostgreSQL + Qdrant + OpenAI API
```

## Structure du monorepo

```txt
DocuMindAI/
│
├── apps/
│   ├── web/                  # Frontend Next.js
│   └── api/                  # Backend FastAPI
│
├── docs/                     # Documentation technique
├── storage/                  # Fichiers uploadés localement
├── .github/workflows/        # CI/CD
├── docker-compose.yml
└── README.md
```

## Frontend

Le frontend est développé avec Next.js, TypeScript et Tailwind CSS.

Il contient :

- une landing page publique ;
- une authentification login/register ;
- un dashboard analytique ;
- une page de gestion des documents ;
- une interface de chat RAG ;
- des filtres de documents ;
- un panneau de sources.

## Backend

Le backend est développé avec FastAPI.

Il contient plusieurs couches :

```txt
api/routes      → endpoints HTTP
schemas         → validation Pydantic
models          → modèles SQLAlchemy
services        → logique métier
db              → session, migrations, base SQLAlchemy
core            → configuration, sécurité
tests           → tests backend
```

## Base relationnelle

PostgreSQL stocke :

- les utilisateurs ;
- les documents ;
- les chunks ;
- les conversations ;
- les messages ;
- les métadonnées RAG.

## Base vectorielle

Qdrant stocke :

- les embeddings des chunks ;
- les métadonnées de recherche ;
- les scores de similarité.

## Services principaux

### Auth service

Gère :

- inscription ;
- connexion ;
- hash des mots de passe ;
- génération JWT ;
- récupération de l’utilisateur connecté.

### Document service

Gère :

- upload ;
- suppression ;
- listing ;
- statut d’indexation.

### Extraction service

Gère :

- extraction PDF ;
- extraction TXT ;
- extraction DOCX.

### Chunking service

Gère :

- nettoyage du texte ;
- découpage en chunks ;
- estimation du nombre de tokens.

### Embedding service

Gère :

- génération des embeddings via OpenAI ;
- abstraction du provider d’embeddings.

### Vector service

Gère :

- création de collection Qdrant ;
- stockage des vecteurs ;
- recherche vectorielle ;
- filtres par utilisateur et document.

### RAG service

Gère :

- récupération des chunks pertinents ;
- construction du prompt ;
- appel LLM ;
- réponse sourcée.

## Choix d’architecture

Le projet utilise une architecture modulaire pour éviter les gros fichiers monolithiques.

Les routes FastAPI restent simples et délèguent la logique métier aux services.

Cette structure permet :

- une meilleure lisibilité ;
- des tests plus simples ;
- une séparation claire des responsabilités ;
- une évolution progressive vers des workers, du streaming ou du reranking.