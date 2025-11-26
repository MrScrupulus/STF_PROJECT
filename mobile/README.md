# Street Fishing Mobile App

Application React Native développée avec Expo pour la gestion de compétitions de pêche.

## 🚀 Installation

```bash
npm install
```

## 📱 Démarrage

```bash
# Démarrer Expo
npm start

# Lancer sur Android
npm run android

# Lancer sur iOS
npm run ios
```

## 🔧 Configuration API

Modifiez `src/config/api.ts` pour configurer l'URL de l'API selon votre environnement :

- **Android Emulator** : `http://10.0.2.2:8001`
- **iOS Simulator** : `http://localhost:8001`
- **Device physique** : `http://VOTRE_IP:8001`

## 📦 Structure

```
mobile/
├── src/
│   ├── config/       # Configuration (API, etc.)
│   ├── services/     # Services API
│   ├── screens/      # Écrans de l'application
│   └── types/        # Types TypeScript
├── App.tsx           # Point d'entrée
└── package.json
```

## 🛠️ Technologies

- **React Native** : Framework mobile
- **Expo** : Outils de développement
- **TypeScript** : Typage statique
- **React Query** : Gestion des données
- **React Navigation** : Navigation
- **Expo Secure Store** : Stockage sécurisé des tokens

