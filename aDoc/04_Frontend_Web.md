# STF Project — Frontend Web (Next.js)

## Tech & organisation
- Next.js 15 / React 19 (`frontend/package.json`)
- Pages App Router : `frontend/src/app/**/page.js`
- Services API : `frontend/src/services/*.js`
- Types : `frontend/src/types/*`
- Styles : `frontend/src/styles/**`

## Auth côté web
- Le token JWT est stocké dans `localStorage` (clé `token`).
- Le wrapper `frontend/src/services/api.js` ajoute `Authorization: Bearer ...` sauf pour certaines routes “publiques”.

## Pages principales
Quelques routes web (non exhaustif), mappées par fichiers `page.js` :
- `/login` → `frontend/src/app/login/page.js`
- `/register` → `frontend/src/app/register/page.js`
- `/competitions` → `frontend/src/app/competitions/page.js`
- `/competitions/[id]` → `frontend/src/app/competitions/[id]/page.js`
- `/catches` → `frontend/src/app/catches/page.js`
- `/teams` → `frontend/src/app/teams/page.js`
- `/teams/[id]` → `frontend/src/app/teams/[id]/page.js`
- `/account` (profil) + sous-pages :
  - `/account/history`
  - `/account/change-password`
  - `/account/invitations`
  - `/account/notification-preferences`
- Dashboard admin :
  - `/dashboard`
  - `/dashboard/competitions/create`, `/dashboard/competitions/[id]/edit`
  - `/dashboard/species/create`

## État & données
- Les pages s’appuient sur des services (ex : `authService`, `teamService`, `competitionService`, `notificationService`).
- Le cache / synchro réseau est géré via React Query (selon pages).

## Logs (web)
- Utilitaire : `frontend/src/utils/logger.js` (logs uniquement en dev).
- Recommandation : remplacer progressivement les `console.*` restants dans les services par `logger.*`.

