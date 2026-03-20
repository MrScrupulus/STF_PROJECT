# Configuration des variables d'environnement — Guide définitif

## Structure simplifiée (4 fichiers seulement)

```
STF_Project/
├── .env                 ← UNIQUE FICHIER POUR DOCKER (à la racine)
├── .env.example         ← Template du .env (commité)
├── backend/
│   ├── .env             ← Template Symfony (commité)
│   ├── .env.local        ← Secrets pour backend en LOCAL (sans Docker)
│   └── .env.test         ← Config des tests PHPUnit (commité)
├── mobile/
│   ├── .env             ← URL API pour Expo (quand lancé en local)
│   └── .env.example     ← Template (commité)
└── frontend/
    └── .env.local        ← Optionnel : si tu lances le frontend en local (sans Docker)
```

---

## Qui lit quoi ?

| Tu lances… | Fichiers utilisés |
|------------|-------------------|
| **`docker compose up`** | `.env` à la racine **uniquement** |
| Backend sans Docker (`symfony server:start`) | `backend/.env` + `backend/.env.local` |
| Expo sans Docker (`npx expo start`) | `mobile/.env` (ou variables du `.env` racine si passées) |
| Frontend sans Docker (`npm run dev`) | `frontend/.env.local` |
| Tests PHPUnit | `backend/.env.test` |

---

## À faire pour Docker

Le fichier **`.env` à la racine** doit contenir :

```env
# Base de données
MARIADB_ROOT_PASSWORD=ton_mot_de_passe
MARIADB_DATABASE=stf_db
MARIADB_USER=MrScrupulus
MARIADB_PASSWORD=ton_mot_de_passe

# Symfony
APP_SECRET=une_cle_32_caracteres

# Mailer
MAILER_DSN=gmail://email:mot_de_passe_app@default

# Mobile (optionnel, pour Expo en tunnel)
EXPO_PUBLIC_API_URL=https://xxx.ngrok-free.dev
```

Puis :

```bash
docker compose up --build
```

---

## Fichiers supprimés / fusionnés

- ~~`mobile/.env.local`~~ → contenu fusionné dans `mobile/.env`
- ~~`BILAN_ENV.md`~~ → remplacé par ce fichier
- ~~`ENV_FILES.md`~~ → remplacé par ce fichier

---

## Récap en une phrase

**Pour Docker :** seule la racine compte. Mets tout dans `.env` à la racine.
