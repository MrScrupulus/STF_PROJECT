# Commandes de lancement — STF Project

Racine du projet : `STF_Project/`

---

## Tout lancer (Docker)

```bash
cd STF_Project
docker compose up --build
```

**Ports :** Web `3000` · API `8001` · DB `3312` · Expo `8081`

---

## Lancer séparément

### Backend (Symfony)
```bash
cd backend
# Avec Docker (depuis la racine)
docker compose up -d database backend

# Ou en local (PHP 8+, MariaDB tournant)
symfony server:start
# ou : php -S localhost:8000 -t public
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
→ http://localhost:3000

### Mobile (Expo)
```bash
cd mobile
npm install
npx expo start
```
→ QR code dans le terminal

**Avec tunnel (ngrok) — pour notifications push / device distant :**
```bash
cd mobile
npx expo start --tunnel
```

**Script fourni :**
```bash
cd mobile
./start-expo.sh
```
*(Adaptez `REACT_NATIVE_PACKAGER_HOSTNAME` dans le script à votre IP locale si besoin.)*

---

## Récap rapide

| Composant | Commande | URL / port |
|-----------|----------|------------|
| **Tout** | `docker compose up --build` | Web 3000, API 8001, Expo 8081 |
| **Backend** | `docker compose up -d database backend` | API 8001 |
| **Frontend** | `cd frontend && npm run dev` | http://localhost:3000 |
| **Mobile** | `cd mobile && npx expo start` | Expo 8081 |
| **Mobile + tunnel** | `cd mobile && npx expo start --tunnel` | URL ngrok dans le terminal |

---

## Liens dans les emails (vérification, reset MDP) sur téléphone

Pour que le lien reçu par email ouvre la page (puis l’app) **sur un vrai téléphone**, le backend doit être joignable depuis internet. Sinon le navigateur affiche « connexion au serveur impossible ».

1. Exposer le backend avec **ngrok** : `ngrok http 8001`
2. Dans `backend/.env.local` : `APP_BACKEND_URL=https://xxxx.ngrok-free.app` (remplacer par l’URL ngrok)
3. Redémarrer le backend, puis renvoyer un email de vérification (réinscription ou renvoi)

Détails : `backend/EMAIL_LINKS_README.md`

---

## Scheduler (pauses programmées)

En Docker, le service `scheduler` tourne automatiquement. En local :

```bash
cd backend
php bin/console app:process-scheduled-pauses
```
*(À planifier en cron toutes les minutes si besoin.)*

---

## Nettoyage des données (compétitions de test)

Ces commandes SQL permettent de nettoyer une compétition de test (équipes, prises, snapshots, etc.).  
**Toujours exécuter sur une base de test / staging, jamais en prod sans sauvegarde préalable.**

### 1. Retrouver l'ID de la compétition

```sql
SELECT id, name
FROM competitions
WHERE name = 'Nom de la compétition';
```

Note l'`id` (ex. `16`) et remplace‑le dans les commandes suivantes.

### 2. Supprimer les snapshots de classement (competition_team_snapshot)

```sql
DELETE FROM competition_team_snapshot
WHERE competition_id = 16;
```

Au prochain chargement de la compétition terminée, les snapshots seront recréés proprement si besoin.

### 3. Supprimer les prises de la compétition

Lister d'abord les prises (et leurs URLs de photo) :

```sql
SELECT id, photo_url
FROM fish_catch
WHERE competition_id = 16;
```

Puis supprimer les prises :

```sql
DELETE FROM fish_catch
WHERE competition_id = 16;
```

### 4. Détacher ou supprimer les équipes de la compétition

- **Option A — supprimer les équipes de test :**

```sql
DELETE FROM competition_team_members
WHERE team_id IN (SELECT id FROM teams WHERE competition_id = 16);

DELETE FROM teams
WHERE competition_id = 16;
```

- **Option B — garder les équipes mais les désinscrire de la compétition :**

```sql
UPDATE teams
SET competition_id = NULL,
    registration_number = NULL
WHERE competition_id = 16;
```

### 5. Supprimer les données annexes de la compétition

```sql
DELETE FROM competition_perimeters WHERE competition_id = 16;
DELETE FROM competition_species   WHERE competition_id = 16;
DELETE FROM scheduled_pause       WHERE competition_id = 16;
```

### 6. Supprimer la compétition

```sql
DELETE FROM competitions
WHERE id = 16;
```

### 7. Suppression des photos associées (serveur / stockage)

L'application stocke dans `fish_catch.photo_url` **l'URL ou le chemin** de la photo.  
La suppression en base **retire la référence** dans l'app, mais **ne supprime pas le fichier physique**.

1. **Lister les URLs/chemins des photos à supprimer :**

```sql
SELECT photo_url
FROM fish_catch
WHERE competition_id = 16
  AND photo_url IS NOT NULL;
```

2. **Selon ton stockage :**

- **Stockage externe (S3, Cloudinary, etc.)** :  
  - connecte‑toi au dashboard ou utilise le CLI du fournisseur ;  
  - les clés/fichiers sont généralement dérivés de `photo_url` (chemin ou nom de fichier).

- **Fichiers locaux sur le backend** (ex. `public/uploads/...`) :  
  - tu peux supprimer manuellement les fichiers correspondants via SSH ou dans le conteneur Docker, par exemple :

```bash
# Exemple générique à adapter à ton chemin réel
cd /var/www/backend/public
rm path/to/photo1.jpg path/to/photo2.jpg
```

Idéalement, on ajoutera plus tard une commande Symfony (`php bin/console app:cleanup-competition 16`) qui :
- supprime les snapshots,
- supprime les prises,
- nettoie les équipes,
- et supprime les fichiers photo pointés par `photo_url`.
