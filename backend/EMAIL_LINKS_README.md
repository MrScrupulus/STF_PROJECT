# Liens dans les emails (vérification, reset mot de passe)

Les emails de vérification et de réinitialisation de mot de passe contiennent un lien vers le **backend** (`/redirect/verify-email/...` ou `/redirect/reset-password/...`). Ce lien doit être **accessible depuis le téléphone** quand l’utilisateur clique dedans.

## Problème en dev

Si le backend tourne en local (`http://localhost:8001`), le lien dans l’email pointe vers `http://localhost:8001/...`. Sur un **téléphone**, « localhost » désigne le téléphone lui-même, pas votre machine : le navigateur affiche alors une erreur du type *« La connexion au serveur est impossible »*.

## Solution : tunnel (ngrok) + variable d’environnement

1. **Exposer le backend avec ngrok** (sur la machine où tourne le backend) :
   ```bash
   ngrok http 8001
   ```
   Vous obtenez une URL du type `https://xxxx.ngrok-free.app`.

2. **Dire au backend d’utiliser cette URL dans les liens des emails**  
   Dans le **même dossier** que le backend, créez ou modifiez un fichier **`.env.local`** (à la racine de `backend/`) :
   ```env
   APP_BACKEND_URL=https://xxxx.ngrok-free.app
   ```
   Remplacez `xxxx.ngrok-free.app` par l’URL fournie par ngrok.

3. **Redémarrer le backend** (Symfony lit `.env.local` au démarrage).

4. **Réinscription ou renvoi d’email**  
   Les **nouveaux** emails envoyés contiendront un lien du type  
   `https://xxxx.ngrok-free.app/redirect/verify-email/TOKEN`.  
   En cliquant dessus sur le téléphone, le navigateur pourra joindre le serveur et afficher la page (puis ouvrir l’app si le deep link est géré).

## Récap

| Fichier        | Rôle |
|----------------|------|
| `.env`         | Valeurs par défaut (`APP_BACKEND_URL=http://localhost:8001`) |
| `.env.local`   | Surcharge en dev (ex: `APP_BACKEND_URL=https://xxx.ngrok-free.app`) — **ne pas committer** |

En production, configurez `APP_BACKEND_URL` (et si besoin `APP_FRONTEND_URL`) avec les vraies URLs de votre API et du site web.
