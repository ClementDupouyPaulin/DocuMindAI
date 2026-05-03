# Security Notes — DocuMind AI

## Secrets

Les secrets ne doivent jamais être commit dans Git.

Fichiers ignorés :

```txt
.env
.env.local
apps/api/.env
apps/web/.env
```

Les clés OpenAI doivent rester uniquement dans :

```txt
apps/api/.env
```

ou dans les secrets du service de déploiement.

## GitHub Push Protection

GitHub bloque automatiquement les pushs contenant des secrets détectés.

Si une clé est exposée :

1. supprimer la clé du code ;
2. réécrire le commit si nécessaire ;
3. révoquer la clé côté provider ;
4. générer une nouvelle clé.

## Authentification

DocuMind AI utilise JWT.

Les routes privées nécessitent :

```txt
Authorization: Bearer <token>
```

## Mots de passe

Les mots de passe sont hashés avec bcrypt avant stockage en base.

Aucun mot de passe clair ne doit être stocké.

## CORS

En développement, le backend accepte :

```txt
http://localhost:3000
http://127.0.0.1:3000
```

En production, seuls les domaines frontend autorisés doivent être ajoutés.

## Uploads

Les fichiers uploadés sont stockés localement dans :

```txt
storage/uploads
```

Ces fichiers ne doivent pas être versionnés.

## Limitations actuelles

Le projet ne contient pas encore :

- antivirus sur uploads ;
- scan de fichiers ;
- quotas par utilisateur ;
- rate limiting ;
- stockage chiffré ;
- permissions avancées par document.

## Améliorations prévues

- ajouter un rate limiter ;
- limiter le nombre de documents par utilisateur ;
- limiter la taille totale de stockage ;
- ajouter un stockage objet compatible S3 ;
- ajouter des rôles plus avancés ;
- ajouter des logs de sécurité.