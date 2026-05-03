# RAG Pipeline — DocuMind AI

## Objectif

Le pipeline RAG de DocuMind AI permet de répondre à des questions utilisateur à partir de documents importés.

L’objectif est d’éviter un simple chatbot généraliste et de produire des réponses basées sur des sources précises.

## Pipeline d’indexation

```txt
1. Upload document
        ↓
2. Détection du type de fichier
        ↓
3. Extraction du texte
        ↓
4. Nettoyage du texte
        ↓
5. Découpage en chunks
        ↓
6. Génération des embeddings
        ↓
7. Stockage relationnel PostgreSQL
        ↓
8. Stockage vectoriel Qdrant
        ↓
9. Statut INDEXED
```

## Formats supportés

DocuMind AI supporte actuellement :

- PDF ;
- DOCX ;
- TXT.

## Extraction

### PDF

Les fichiers PDF sont lus page par page afin de conserver le numéro de page lorsque c’est possible.

### DOCX

Les fichiers DOCX sont extraits à partir :

- des paragraphes ;
- des tableaux.

### TXT

Les fichiers TXT sont lus directement en UTF-8 avec tolérance aux erreurs d’encodage.

## Chunking

Le texte extrait est nettoyé puis découpé en chunks.

Chaque chunk contient :

- un identifiant ;
- un index ;
- le contenu ;
- le nombre estimé de tokens ;
- le document source ;
- le numéro de page si disponible.

## Embeddings

Chaque chunk est transformé en vecteur numérique.

Le modèle utilisé par défaut est :

```txt
text-embedding-3-small
```

La dimension utilisée est :

```txt
1536
```

## Stockage Qdrant

Chaque point Qdrant contient :

- le vecteur ;
- le chunk_id ;
- le document_id ;
- le user_id ;
- le titre du document ;
- le nom du fichier ;
- le numéro de chunk ;
- le numéro de page ;
- le contenu du chunk.

## Pipeline de question

```txt
1. Question utilisateur
        ↓
2. Embedding de la question
        ↓
3. Recherche vectorielle Qdrant
        ↓
4. Filtrage par user_id
        ↓
5. Filtrage optionnel par document_id
        ↓
6. Filtrage par score minimum
        ↓
7. Construction du contexte
        ↓
8. Appel LLM
        ↓
9. Réponse sourcée
        ↓
10. Sauvegarde conversation + messages
```

## Sources

Chaque réponse contient une liste de sources :

- document ;
- fichier ;
- chunk ;
- page ;
- score ;
- extrait ;
- contenu complet.

Cela permet à l’utilisateur de vérifier d’où vient l’information.

## Filtres RAG

L’interface de chat permet :

- de sélectionner un ou plusieurs documents ;
- de définir un score minimum ;
- de visualiser l’extrait source complet.

## Limites actuelles

Le pipeline actuel ne fait pas encore :

- recherche hybride dense/sparse ;
- reranking ;
- streaming ;
- évaluation automatique de la qualité RAG ;
- détection avancée des hallucinations.

## Améliorations prévues

- ajout d’un reranker ;
- recherche hybride ;
- mode strict “répondre uniquement avec les sources” ;
- scoring qualité ;
- benchmarks sur un set de questions ;
- export PDF des résumés.