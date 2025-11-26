# 📱 Application Mobile React Native - Street Fishing

## ✅ Structure créée

L'application mobile React Native avec Expo a été créée dans le dossier `mobile/`.

### Structure

```
mobile/
├── src/
│   ├── config/          # Configuration API
│   ├── services/        # Services API (auth, competitions, catches, species)
│   ├── screens/         # Écrans de l'application
│   └── types/           # Types TypeScript
├── App.tsx              # Point d'entrée
├── package.json
└── app.json
```

## 🚀 Installation et démarrage

### Option 1 : Via Docker Compose (Recommandé)

```bash
# Lancer tous les services (backend, frontend, mobile)
docker-compose up -d

# Voir les logs du serveur mobile
docker-compose logs -f mobile

# Le serveur Expo sera accessible sur http://localhost:8081
```

**Note** : Le serveur Expo tournera dans Docker, mais vous devrez toujours utiliser Expo Go sur votre téléphone ou un émulateur pour tester l'application.

### Option 2 : Installation locale

```bash
cd mobile

# Installer les dépendances
npm install

# Démarrer Expo
npm start

# Lancer sur Android
npm run android

# Lancer sur iOS
npm run ios
```

## 🔧 Configuration API

**Important** : Modifiez `mobile/src/config/api.ts` selon votre environnement :

```typescript
// Android Emulator
return 'http://10.0.2.2:8001';

// iOS Simulator
return 'http://localhost:8001';

// Device physique
return 'http://192.168.1.XXX:8001'; // Votre IP locale
```

Pour trouver votre IP locale :
```bash
# Linux/Mac
ip addr show | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

## 📱 Écrans disponibles

- ✅ **LoginScreen** : Connexion
- ✅ **HomeScreen** : Accueil avec navigation
- ✅ **CompetitionsScreen** : Liste des compétitions
- ✅ **CompetitionDetailScreen** : Détails d'une compétition avec classement
- ✅ **CatchesScreen** : Liste des prises
- ✅ **ProfileScreen** : Profil utilisateur

## 🔌 Services API

Tous les services sont prêts :
- ✅ `authService` : Authentification JWT
- ✅ `competitionsService` : Gestion des compétitions
- ✅ `catchesService` : Gestion des prises
- ✅ `speciesService` : Liste des espèces

## 📦 Technologies

- **React Native** 0.74
- **Expo** ~51.0
- **TypeScript**
- **React Query** : Gestion des données
- **React Navigation** : Navigation
- **Expo Secure Store** : Stockage sécurisé des tokens
- **Axios** : Client HTTP

## 🎯 Prochaines étapes

1. Tester la connexion API depuis l'app mobile
2. Ajouter l'upload de photos pour les prises
3. Implémenter la géolocalisation
4. Ajouter les notifications push
5. Mode hors-ligne avec cache

## 📝 Notes

- L'application utilise le port **8001** pour l'API (comme configuré dans le docker-compose)
- Les tokens JWT sont stockés de manière sécurisée avec Expo Secure Store
- L'authentification est gérée automatiquement avec les intercepteurs axios

