# STF Project — Backend (Symfony API)

## Dossier & conventions
- Code API : `backend/src/Controller/**`
- Entités Doctrine : `backend/src/Entity/**`
- Repositories : `backend/src/Repository/**`

## Sécurité / Auth (JWT)
- Configuration : `backend/config/packages/security.yaml`
- JWT (Lexik) sur le firewall `api` (`pattern: ^/api`, `stateless: true`, `jwt: ~`)
- Routes publiques (exemples) : login/register, verify-email, reset password, stats publiques.

## CORS
Pour éviter les blocages CORS même en cas d’erreur 500, un listener ajoute les headers sur :
- les réponses standard
- et les exceptions côté API

Fichier : `backend/src/EventListener/CorsListener.php`.

## Endpoints principaux (non exhaustif)

### Auth & compte
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/verify-email/{token}`
- `POST /password-reset/request`
- `POST /password-reset/reset`
- `PUT /api/auth/password` (changement mot de passe connecté)
- `POST /api/auth/profile` (mise à jour profil)

### Compétitions
- `GET /api/competitions` (liste + pagination + `isRegistered` enrichi si token)
- `GET /api/competitions/{id}` (détails, équipes, pauses/périmètres…)
- endpoints admin (exemples) : `/api/admin/competitions`, `/api/admin/competitions/{id}/stats`
- PDF : contrôleur dédié (export)

### Équipes & invitations
- `GET /api/teams/my-teams`
- `GET /api/teams/my-history`
- invitations : accept/reject/list (voir controller `TeamController` + repo `TeamInvitationRepository`)

### Prises
- `GET /api/catches` (paginé) : `FishCatchController::getUserCatches`
- validation admin : contrôleurs admin (selon routes)

### Notifications
Contrôleur : `backend/src/Controller/NotificationController.php`
- `GET /api/notifications`
- `GET /api/notifications/unread`
- `GET /api/notifications/count`
- `PUT /api/notifications/{id}/read`
- `PUT /api/notifications/read-all`

### Préférences notifications
Contrôleur : `backend/src/Controller/NotificationPreferencesController.php`
- `GET /api/notification-preferences`
- `PUT /api/notification-preferences` (inclut `expoPushToken` si fourni)

## Scheduler (pauses programmées)
Un service “scheduler” tourne dans `docker-compose.yml` et exécute périodiquement :
- `php bin/console app:process-scheduled-pauses`

Objectif : appliquer automatiquement des changements d’état liés aux **ScheduledPauses** (ex : pause/reprise).

