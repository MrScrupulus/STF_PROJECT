# STF Project — Architecture

## Structure du repository
- `backend/` : API Symfony (HTTP) + Doctrine + services métier
- `frontend/` : application web Next.js (SSR/CSR)
- `mobile/` : application mobile Expo / React Native
- `docker-compose.yml` : stack locale (MariaDB + backend + frontend + mobile + scheduler)

## Stack technique (résumé)
- **Backend**
  - Symfony `6.4.*` (`backend/composer.json`)
  - Doctrine ORM / Migrations
  - Auth **JWT** (Lexik) + refresh token (Gesdinet)
  - CORS : listener custom `backend/src/EventListener/CorsListener.php`
  - PDF : DomPDF
  - Logs : Monolog (bundle)
- **Web**
  - Next.js `15.1.2`, React `19`
  - React Query `@tanstack/react-query`
  - Leaflet / react-leaflet (carto), Recharts (charts), Sass/Tailwind
- **Mobile**
  - Expo `~54`, React `19.1`, React Native `0.81`
  - axios + interceptors (`mobile/src/services/api.ts`)
  - SecureStore (stockage tokens)
  - expo-notifications (push)

## Flux de données (simple)
1. Web/Mobile appellent l’API Symfony sur `http://localhost:8001` (docker) ou via IP en dev mobile.
2. Auth :
   - login → JWT (et refresh token côté mobile) stockés côté client
   - les requêtes privées envoient `Authorization: Bearer <token>`
3. L’API renvoie majoritairement des payloads JSON contenant `success` + données (`competitions`, `catches`, etc.).

## Environnements / ports (docker)
Défini dans `docker-compose.yml` :
- **DB**: `3312 → 3306` (MariaDB)
- **Backend**: `8001 → 80`
- **Frontend**: `3000 → 3000`
- **Mobile (Expo)**: `8081` + `19000/19001/19002`
- **Scheduler**: container séparé qui exécute une commande toutes les minutes

## Sécurité & accès
- Règles dans `backend/config/packages/security.yaml`
  - routes publiques : login/register, verify-email, reset password, stats publiques, etc.
  - `/api/**` protégé en **JWT** par défaut
- Le frontend web gère le token via `localStorage` (`frontend/src/services/api.js`).
- Le mobile gère le token via `expo-secure-store` (`mobile/src/services/api.ts`).

