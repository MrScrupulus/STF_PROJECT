# STF Project — Lancement local (résumé)

## Prérequis
- Docker + Docker Compose
- (Optionnel) Node/npm si vous lancez sans Docker

## Lancer toute la stack (recommandé)
À la racine :

```bash
docker compose up --build
```

Ports principaux (cf. `docker-compose.yml`) :
- Web: `http://localhost:3000`
- API: `http://localhost:8001`
- DB: `localhost:3312`
- Expo: `http://localhost:8081`

## Variables d’environnement utiles
- Web : `NEXT_PUBLIC_API_URL` (déjà configuré en docker à `http://localhost:8001`)
- Mobile : `EXPO_PUBLIC_API_URL` (recommandé si device physique / réseau différent)

## Notes mobile (device)
Si vous testez sur un device physique, mettez :
- `EXPO_PUBLIC_API_URL=http://<IP_DE_VOTRE_MACHINE>:8001`

(Sinon le fichier `mobile/src/config/api.ts` contient une IP “dev” par défaut à adapter.)

