# Configuration des Notifications Push

## Installation

Pour activer les notifications push, vous devez installer le package `expo-notifications` :

```bash
cd mobile
npm install expo-notifications
```

## Configuration Expo Project ID

### Option 1 : Via EAS CLI (Recommandé - automatique)

```bash
cd mobile
npx eas init
```

Cela va :
- Créer automatiquement un Project ID Expo
- Le configurer dans `app.json` sous `extra.eas.projectId`
- Pas besoin de `.env` dans ce cas

### Option 2 : Manuellement via Expo.dev

1. Allez sur https://expo.dev
2. Créez un compte ou connectez-vous
3. Créez un nouveau projet (ou utilisez un projet existant)
4. Le Project ID se trouve dans les paramètres du projet
   - Format : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (UUID)

5. **Mettez-le dans `app.json`** (recommandé) :
   ```json
   {
     "expo": {
       "extra": {
         "eas": {
           "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
         }
       }
     }
   }
   ```

   OU dans un fichier `.env` à la racine du dossier `mobile/` :
   ```
   EXPO_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

### Note importante

Le code cherche d'abord dans `app.json` (`extra.eas.projectId`), puis dans `.env` (`EXPO_PROJECT_ID`). 
**La méthode recommandée est de le mettre dans `app.json` via EAS CLI.**

## Initialisation dans l'application

Les notifications sont automatiquement initialisées lors de la connexion de l'utilisateur. Le token Expo Push est enregistré dans les préférences de notifications.

## Utilisation

1. Les utilisateurs peuvent gérer leurs préférences de notifications depuis le profil
2. Les notifications push sont envoyées automatiquement selon les préférences
3. Les admins ont des notifications spécifiques (prises en attente de validation)

## Types de notifications

- `catch_validated` : Prise validée
- `catch_rejected` : Prise rejetée
- `team_invitation` : Invitation d'équipe
- `competition_registered` : Inscription à une compétition
- `competition_started` : Début de compétition
- `competition_ended` : Fin de compétition
- `competition_paused` : Compétition en pause
- `competition_resumed` : Compétition reprise
- `catch_pending` : Prise en attente (admin uniquement)
