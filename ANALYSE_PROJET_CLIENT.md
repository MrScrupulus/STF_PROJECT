# 📊 Analyse du projet Street Fishing — Présentation client

**Date** : 24 janvier 2025  
**Version** : Prête pour démonstration

---

## 1. Vue d'ensemble

**Street Fishing (STF)** est une plateforme multi-clients pour la gestion de compétitions de pêche urbaine :

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| **Backend** | Symfony 6.4, PHP 8, MariaDB | API REST, authentification JWT, logique métier |
| **Frontend Web** | Next.js 15, React 19 | Site web utilisateur + dashboard admin |
| **Mobile** | Expo (React Native) | Application mobile iOS/Android |

---

## 2. Fonctionnalités principales

### ✅ Authentification & compte
- Inscription avec vérification email
- Connexion / déconnexion (JWT + refresh token)
- Profil utilisateur
- Changement de mot de passe
- Réinitialisation mot de passe (lien email)
- Suppression de compte

### ✅ Compétitions
- Liste des compétitions (en cours, à venir, terminées)
- Détail d’une compétition avec classement
- Inscription par équipe
- Espèces et coefficients par compétition
- Zones géographiques (périmètres) pour valider les prises
- Publication du classement par l’admin
- Export PDF des résultats

### ✅ Équipes
- Création d’équipe
- Gestion des membres
- Invitations (envoyer, accepter, refuser)
- Quitter une équipe (avec restriction si compétition active)
- Historique des équipes

### ✅ Prises
- Ajout de prise (photo, espèce, taille, commentaire)
- Géolocalisation et validation dans la zone autorisée
- Validation / rejet par l’admin
- Admin : ajout de prise pour une équipe
- Historique et statistiques

### ✅ Notifications
- Notifications push (Expo)
- Préférences par type de notification
- Liste des notifications non lues

### ✅ Mobile — Interface
- Barre de navigation globale (visible sur toutes les pages sauf Login/Register)
- Menu burger (Accueil, Mes Prises, Espèces, Historique, Notifications, Invitations, Dashboard Admin)
- Mentions légales (menu)
- Guide rapide sur la page d’accueil (tutoriel saisie de prise + création compétition pour admins)
- Deep links (vérification email, reset mot de passe)

---

## 3. Architecture technique

```
STF_Project/
├── backend/          # API Symfony
│   ├── src/Controller/
│   ├── src/Entity/
│   ├── src/Service/   # GeolocationService, EmailService, etc.
│   └── migrations/
├── frontend/         # Next.js
│   └── src/app/      # Pages + dashboard admin
├── mobile/           # Expo React Native
│   └── src/
│       ├── screens/   # 28 écrans
│       ├── components/
│       ├── services/  # API clients
│       └── contexts/  # AuthContext
└── docker-compose.yml
```

---

## 4. Points forts pour la démo

1. **Expérience mobile fluide** : barre de navigation persistante, navigation intuitive
2. **Géolocalisation** : validation des prises dans les zones autorisées
3. **Rôle admin complet** : validation des prises, création de compétitions, gestion des périmètres
4. **Multi-plateforme** : web + mobile avec la même API
5. **Sécurité** : JWT, stockage sécurisé des tokens (SecureStore sur mobile)

---

## 5. Modifications récentes (ce push)

- **Correction barre de navigation** : utilisation de `navigationRef` au lieu des hooks (composant hors navigator)
- **App.tsx** : `onReady` + `onStateChange` pour suivre la route active
- **GlobalBottomTabBar** : reçoit `navigationRef` et `currentRoute` en props
- **MainTabs** : `tabBar={() => null}` pour masquer la barre native
- **react-native-maps** : ajout pour la géolocalisation et les zones (création compétition)
- **app.json** : plugin react-native-maps

---

## 6. Recommandations pour la présentation

1. **Scénario démo** : Connexion → Accueil → Compétitions → Détail → Inscription équipe → Ajout prise
2. **Compte admin** : Montrer la validation des prises et la création de compétition
3. **Ngrok/tunnel** : Utiliser un tunnel pour tester les notifications push en local
4. **Build de développement** : Pour les notifications push complètes, prévoir un development build (Expo Go a des limitations)

---

## 7. État du projet

| Module | Statut | Note |
|--------|--------|------|
| Auth | ✅ Complet | Inscription, login, reset, profil |
| Compétitions | ✅ Complet | CRUD, inscription, classement |
| Équipes | ✅ Complet | CRUD, invitations, quitter |
| Prises | ✅ Complet | Ajout, validation, géolocalisation |
| Notifications | ✅ Complet | Push, préférences |
| Zones/Périmètres | ✅ Backend + Web | Mobile : composants prêts (PerimeterMap, PerimeterManager) |
| UI/UX Mobile | ✅ Amélioré | Barre nav, tutoriel, mentions légales |
