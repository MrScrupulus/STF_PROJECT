# Plan d'action - Retours tests utilisateurs (Perrine)

**Date** : 26/01/2025  
**Source** : Rapport de tests Perrine (20/01/26)

---

## 📊 Analyse du rapport

### Catégories de problèmes identifiés

1. **🐛 Bugs critiques** (3)
2. **⚡ Priorités utilisateur** (1)
3. **✨ Fonctionnalités manquantes** (8)
4. **🎨 Améliorations UX/UI** (4)
5. **❓ Questions métier** (3)

---

## 🎯 Plan d'action priorisé

### 🔴 Phase 1 : Bugs critiques et priorité utilisateur (URGENT)

#### 1.1 Bug : Inscription ne fonctionne pas (404)
- **Problème** : Erreur 404 lors de l'inscription
- **Impact** : Bloque l'accès à l'application
- **Action** : 
  - Vérifier l'endpoint backend `/api/auth/register`
  - Vérifier la configuration API dans `mobile/src/config/api.ts`
  - Tester la connexion backend
- **Fichiers concernés** :
  - `mobile/src/services/authService.ts`
  - `mobile/src/config/api.ts`
  - Backend : route d'inscription

#### 1.2 Bug : Impossible de s'inscrire à une compétition en cours
- **Problème** : L'utilisateur reste bloqué sur la compétition précédente terminée
- **Impact** : Empêche la participation à de nouvelles compétitions
- **Action** :
  - Modifier la logique `isAlreadyRegistered` pour ne considérer que les compétitions actives
  - Vérifier que les équipes des compétitions terminées sont bien libérées
- **Fichiers concernés** :
  - `mobile/src/screens/CompetitionDetailScreen.tsx` (ligne 151-153)
  - Backend : logique de libération des équipes

#### 1.3 PRIORITÉ : Pouvoir quitter une équipe
- **Problème** : Pas de bouton pour quitter une équipe
- **Impact** : Bloque les tests et l'utilisation normale
- **Action** :
  - Ajouter un bouton "Quitter l'équipe" dans `TeamDetailScreen`
  - Le service `leaveTeam` existe déjà dans `teamService.ts`
  - Ajouter confirmation avant action
- **Fichiers concernés** :
  - `mobile/src/screens/TeamDetailScreen.tsx`
  - `mobile/src/services/teamService.ts` (service déjà existant)

---

### 🟡 Phase 2 : Améliorations UX critiques

#### 2.1 Améliorer le champ date de naissance
- **Problème** : Champ texte peu pratique (format YYYY-MM-DD)
- **Action** :
  - Remplacer `TextInput` par un `DatePicker` natif
  - Utiliser `@react-native-community/datetimepicker`
- **Fichiers concernés** :
  - `mobile/src/screens/RegisterScreen.tsx`

#### 2.2 Afficher compétitions en cours en premier
- **Problème** : Toutes les compétitions ont la même visibilité
- **Action** :
  - Trier les compétitions (en cours → à venir → terminées)
  - Appliquer opacité réduite aux compétitions terminées
- **Fichiers concernés** :
  - `mobile/src/screens/CompetitionsScreen.tsx`

---

### 🟢 Phase 3 : Fonctionnalités essentielles

#### 3.1 Mot de passe oublié
- **Action** :
  - Ajouter lien "Mot de passe oublié" sur `LoginScreen`
  - Créer écran `ForgotPasswordScreen`
  - Implémenter service `forgotPassword` dans `authService`
- **Fichiers concernés** :
  - `mobile/src/screens/LoginScreen.tsx`
  - `mobile/src/screens/ForgotPasswordScreen.tsx` (nouveau)
  - `mobile/src/services/authService.ts`

#### 3.2 Modifier le profil
- **Action** :
  - Ajouter section "Modifier profil" dans `ProfileScreen`
  - Permettre modification : mot de passe, téléphone, etc.
  - Créer service `updateProfile` dans `authService`
- **Fichiers concernés** :
  - `mobile/src/screens/ProfileScreen.tsx`
  - `mobile/src/services/authService.ts`

#### 3.3 Quitter une compétition
- **Action** :
  - Ajouter bouton "Quitter la compétition" dans `CompetitionDetailScreen`
  - Vérifier les règles métier (qui peut quitter ?)
- **Fichiers concernés** :
  - `mobile/src/screens/CompetitionDetailScreen.tsx`
  - Backend : endpoint pour quitter compétition

#### 3.4 Filtres compétitions (en cours/terminées)
- **Action** :
  - Ajouter onglets ou boutons de filtre dans `CompetitionsScreen`
  - Filtrer par statut : Toutes / En cours / Terminées / À venir
- **Fichiers concernés** :
  - `mobile/src/screens/CompetitionsScreen.tsx`

---

### 🔵 Phase 4 : Fonctionnalités avancées

#### 4.1 Système d'invitation équipe avec approbation
- **Action** :
  - Modifier le système d'invitation pour nécessiter une approbation
  - Ajouter écran de gestion des invitations
  - Notifications pour nouvelles invitations
- **Fichiers concernés** :
  - `mobile/src/screens/TeamDetailScreen.tsx`
  - `mobile/src/screens/InvitationsScreen.tsx` (nouveau)
  - Backend : logique d'approbation

#### 4.2 Modifier équipe (nom, membres)
- **Action** :
  - Ajouter possibilité de modifier nom d'équipe
  - Gérer les droits (admin équipe vs membres)
  - Permettre retrait de membres
- **Fichiers concernés** :
  - `mobile/src/screens/TeamDetailScreen.tsx`
  - Backend : gestion des droits équipe

#### 4.3 Admin : Créer compétition (mobile)
- **Action** :
  - Créer écran `AdminCreateCompetitionScreen`
  - Réutiliser la logique du web si possible
- **Fichiers concernés** :
  - `mobile/src/screens/AdminCreateCompetitionScreen.tsx` (nouveau)

#### 4.4 Admin : Historique pauses manuelles
- **Action** :
  - Ajouter section historique dans `AdminDashboardScreen`
  - Afficher toutes les pauses (automatiques + manuelles)
- **Fichiers concernés** :
  - `mobile/src/screens/AdminDashboardScreen.tsx`
  - Backend : endpoint historique pauses

---

### 🟣 Phase 5 : Améliorations navigation et UX

#### 5.1 Améliorer la navigation mobile
- **Suggestions de Perrine** :
  - Menu burger en haut à droite (profil, déconnexion)
  - Icône notifications en haut à droite (accès direct)
  - Barre de navigation en bas avec icônes :
    - Accueil
    - Compétitions
    - Équipes
    - Appareil photo (ajouter prise) au centre
  - Dashboard avec icônes sur l'accueil
- **Action** :
  - Implémenter `BottomTabNavigator` avec React Navigation
  - Réorganiser le Header
  - Améliorer `HomeScreen` avec icônes
- **Fichiers concernés** :
  - `mobile/App.tsx` (navigation)
  - `mobile/src/components/Header.tsx`
  - `mobile/src/screens/HomeScreen.tsx`

#### 5.2 Réduire redondance historique/prises
- **Problème** : Onglets "prises" et "historique" redondants
- **Action** :
  - Fusionner en un seul onglet "Historique"
  - Afficher vue d'ensemble avec dernières prises
  - Onglet "Prises" à l'intérieur de l'historique
- **Fichiers concernés** :
  - `mobile/src/screens/HistoryScreen.tsx`

---

## ❓ Questions métier à clarifier

1. **Espèces et coefficients** : Est-ce que les espèces et coefficients changent selon les compétitions ?
   - Si oui, comment gérer cela dans l'interface ?

2. **Nombre de personnes par équipe** : Y a-t-il une limite selon les compétitions ?
   - Si oui, où afficher cette information et les restrictions ?

3. **Droits équipe** : Y a-t-il un admin d'équipe ou tous les membres ont les mêmes droits ?
   - Impact sur la modification d'équipe et les invitations

4. **Réutilisation équipe** : Si on refait une compétition avec la même équipe, peut-on reprendre l'équipe ?
   - Ou faut-il créer une nouvelle équipe similaire ?

---

## 📝 Notes techniques

### Services déjà disponibles
- ✅ `teamService.leaveTeam()` - Existe mais pas exposé dans l'UI
- ✅ `teamService.inviteMember()` - Existe
- ✅ `teamService.registerToCompetition()` - Existe

### Endpoints à vérifier/créer
- ⚠️ `/api/auth/register` - Vérifier si fonctionne
- ❓ `/api/auth/forgot-password` - À créer
- ❓ `/api/auth/update-profile` - À créer
- ❓ `/api/competitions/{id}/leave` - À créer
- ❓ `/api/teams/{id}/invitations` - À créer pour gestion invitations
- ❓ `/api/admin/competitions/create` - À vérifier si existe
- ❓ `/api/admin/pauses/history` - À créer

---

## 🚀 Ordre d'exécution recommandé

1. **Phase 1** (URGENT) : Corriger les bugs et ajouter "Quitter équipe"
2. **Phase 2** : Améliorations UX critiques (date picker, tri compétitions)
3. **Phase 3** : Fonctionnalités essentielles (mdp oublié, profil, filtres)
4. **Phase 4** : Fonctionnalités avancées (invitations, admin)
5. **Phase 5** : Navigation et UX globale

---

## 📊 Estimation

- **Phase 1** : 2-3 heures
- **Phase 2** : 2-3 heures
- **Phase 3** : 6-8 heures
- **Phase 4** : 8-12 heures
- **Phase 5** : 6-8 heures

**Total estimé** : 24-34 heures de développement

---

## ✅ Validation

- [ ] Phase 1 complétée et testée
- [ ] Phase 2 complétée et testée
- [ ] Phase 3 complétée et testée
- [ ] Phase 4 complétée et testée
- [ ] Phase 5 complétée et testée
- [ ] Tests utilisateurs de validation effectués
