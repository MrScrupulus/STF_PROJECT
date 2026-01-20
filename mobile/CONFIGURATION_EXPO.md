# Configuration du Project ID Expo pour les notifications push

## Méthode simple (recommandée)

### Étape 1 : Créer un compte/projet sur Expo.dev

1. Allez sur **https://expo.dev**
2. Créez un compte (ou connectez-vous)
3. Cliquez sur **"Create a project"** ou **"New Project"**
4. Choisissez **"Blank"** ou **"Blank (TypeScript)"**
5. Donnez un nom au projet (ex: "STF Mobile" ou "Street Fishing")
6. Une fois créé, le **Project ID** apparaît dans les paramètres du projet

### Étape 2 : Récupérer le Project ID

Le Project ID est un **UUID** qui ressemble à :
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

Vous le trouverez :
- Dans l'URL du projet : `https://expo.dev/accounts/[votre-compte]/projects/[project-id]`
- Dans les paramètres du projet sur expo.dev
- Format : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Étape 3 : Configurer dans app.json

Modifiez `mobile/app.json` et remplacez la section `extra` :

```json
{
  "expo": {
    ...
    "extra": {
      "eas": {
        "projectId": "VOTRE_PROJECT_ID_ICI"
      }
    }
  }
}
```

**Exemple concret :**
```json
{
  "expo": {
    ...
    "extra": {
      "eas": {
        "projectId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      }
    }
  }
}
```

### Alternative : Utiliser un fichier .env

Si vous préférez utiliser un fichier `.env`, créez `mobile/.env` :

```bash
cd mobile
touch .env
```

Puis ajoutez :
```
EXPO_PROJECT_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

## Note importante

- Le code cherche d'abord dans `app.json` (`extra.eas.projectId`)
- Si non trouvé, il cherche dans `.env` (`EXPO_PROJECT_ID`)
- **La méthode recommandée est de le mettre dans `app.json`**

## Vérification

Une fois configuré, redémarrez l'application Expo :
```bash
cd mobile
npm start
```

Les notifications push devraient fonctionner automatiquement après la connexion d'un utilisateur.
