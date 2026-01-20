# 📊 Statut du projet - Récapitulatif

**Date de mise à jour** : 26/01/2025

---

## ✅ Ce qui a été fait récemment

### Phase 1 : Bugs critiques et priorité utilisateur
- ✅ **1.3 Quitter une équipe** : Implémenté avec restriction si compétition active (web + mobile)
- ✅ **Correction formatage dates** : Toutes les dates affichent maintenant l'heure locale correcte (UTC → Europe/Paris)
- ✅ **Correction affichage photos** : Photos des prises avec modal plein écran
- ✅ **Champs optionnels** : Téléphone et date de naissance optionnels à l'inscription

### Gestion espèces par compétition
- ✅ **CompetitionSpecies** : Entité backend avec coefficients spécifiques par compétition
- ✅ **Onglet Espèces** : Intégré dans CompetitionDetailScreen (web + mobile)
- ✅ **Création compétition** : Gestion complète des espèces avec coefficients décimaux
- ✅ **Calcul points** : Utilisation du coefficient de compétition au lieu du coefficient global
- ✅ **Filtrage strict** : Prises et scores filtrés par compétition

### Améliorations UX
- ✅ **Tri compétitions** : Ordre "En cours" → "À venir" → "Terminé"
- ✅ **Badge "Inscrit"** : Indication visuelle sur les compétitions où l'utilisateur est inscrit
- ✅ **Format dates optimisé** : Même jour (date + heures), jours différents (dates complètes)
- ✅ **Carte cliquable** : Toute la carte compétition est cliquable
- ✅ **Publication classement** : Admin peut publier/masquer le classement depuis mobile
- ✅ **Admin validation/rejection** : Admin peut valider/rejeter prises depuis mobile
- ✅ **Admin ajout prise** : Admin peut ajouter des prises avec photo (camera/gallery)

---

## 🔴 Phase 1 : Bugs critiques (À FAIRE)

### 1.1 Bug : Inscription ne fonctionne pas (404)
- **Statut** : ❌ Non résolu
- **Problème** : Erreur 404 lors de l'inscription
- **Impact** : Bloque l'accès à l'application
- **Action** : 
  - Vérifier l'endpoint backend `/api/auth/register`
  - Vérifier la configuration API dans `mobile/src/config/api.ts`
  - Tester la connexion backend

### 1.2 Bug : Impossible de s'inscrire à une compétition en cours
- **Statut** : ❓ À vérifier
- **Problème** : L'utilisateur reste bloqué sur la compétition précédente terminée
- **Impact** : Empêche la participation à de nouvelles compétitions
- **Action** :
  - Modifier la logique `isAlreadyRegistered` pour ne considérer que les compétitions actives
  - Vérifier que les équipes des compétitions terminées sont bien libérées

---

## 🟡 Phase 2 : Améliorations UX critiques (À FAIRE)

### 2.1 Améliorer le champ date de naissance
- **Statut** : ❌ Non fait
- **Problème** : Champ texte peu pratique (format YYYY-MM-DD)
- **Action** :
  - Remplacer `TextInput` par un `DatePicker` natif
  - Utiliser `@react-native-community/datetimepicker`
- **Fichiers** : `mobile/src/screens/RegisterScreen.tsx`

### 2.2 Afficher compétitions en cours en premier avec opacité
- **Statut** : ⚠️ Partiellement fait (tri OK, opacité manquante)
- **Action** :
  - ✅ Tri des compétitions (en cours → à venir → terminées) - FAIT
  - ❌ Appliquer opacité réduite aux compétitions terminées - À FAIRE
- **Fichiers** : `mobile/src/screens/CompetitionsScreen.tsx`

---

## 🟢 Phase 3 : Fonctionnalités essentielles (À FAIRE)

### 3.1 Mot de passe oublié
- **Statut** : ❌ Non fait
- **Action** :
  - Ajouter lien "Mot de passe oublié" sur `LoginScreen`
  - Créer écran `ForgotPasswordScreen`
  - Implémenter service `forgotPassword` dans `authService`
- **Fichiers** :
  - `mobile/src/screens/LoginScreen.tsx`
  - `mobile/src/screens/ForgotPasswordScreen.tsx` (nouveau)
  - `mobile/src/services/authService.ts`
  - Backend : endpoint `/api/auth/forgot-password`

### 3.2 Modifier le profil
- **Statut** : ❌ Non fait
- **Action** :
  - Ajouter section "Modifier profil" dans `ProfileScreen`
  - Permettre modification : mot de passe, téléphone, etc.
  - Créer service `updateProfile` dans `authService`
- **Fichiers** :
  - `mobile/src/screens/ProfileScreen.tsx`
  - `mobile/src/services/authService.ts`
  - Backend : endpoint `/api/auth/update-profile`

### 3.3 Quitter une compétition
- **Statut** : ❌ Non fait
- **Action** :
  - Ajouter bouton "Quitter la compétition" dans `CompetitionDetailScreen`
  - Vérifier les règles métier (qui peut quitter ?)
- **Fichiers** :
  - `mobile/src/screens/CompetitionDetailScreen.tsx`
  - Backend : endpoint `/api/competitions/{id}/leave`

### 3.4 Filtres compétitions (en cours/terminées)
- **Statut** : ❌ Non fait
- **Action** :
  - Ajouter onglets ou boutons de filtre dans `CompetitionsScreen`
  - Filtrer par statut : Toutes / En cours / Terminées / À venir
- **Fichiers** : `mobile/src/screens/CompetitionsScreen.tsx`

---

## 🔵 Phase 4 : Fonctionnalités avancées (À FAIRE)

### 4.1 Système d'invitation équipe avec approbation
- **Statut** : ❌ Non fait
- **Action** :
  - Modifier le système d'invitation pour nécessiter une approbation
  - Ajouter écran de gestion des invitations
  - Notifications pour nouvelles invitations
- **Fichiers** :
  - `mobile/src/screens/TeamDetailScreen.tsx`
  - `mobile/src/screens/InvitationsScreen.tsx` (nouveau)
  - Backend : logique d'approbation

### 4.2 Modifier équipe (nom, membres)
- **Statut** : ❌ Non fait
- **Action** :
  - Ajouter possibilité de modifier nom d'équipe
  - Gérer les droits (admin équipe vs membres)
  - Permettre retrait de membres
- **Fichiers** :
  - `mobile/src/screens/TeamDetailScreen.tsx`
  - Backend : gestion des droits équipe

### 4.3 Admin : Créer compétition (mobile)
- **Statut** : ❌ Non fait
- **Action** :
  - Créer écran `AdminCreateCompetitionScreen`
  - Réutiliser la logique du web si possible
- **Fichiers** :
  - `mobile/src/screens/AdminCreateCompetitionScreen.tsx` (nouveau)

### 4.4 Admin : Historique pauses manuelles
- **Statut** : ❌ Non fait
- **Action** :
  - Ajouter section historique dans `AdminDashboardScreen`
  - Afficher toutes les pauses (automatiques + manuelles)
- **Fichiers** :
  - `mobile/src/screens/AdminDashboardScreen.tsx`
  - Backend : endpoint historique pauses

---

## 🟣 Phase 5 : Améliorations navigation et UX (À FAIRE)

### 5.1 Améliorer la navigation mobile
- **Statut** : ❌ Non fait
- **Suggestions** :
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
- **Fichiers** :
  - `mobile/App.tsx` (navigation)
  - `mobile/src/components/Header.tsx`
  - `mobile/src/screens/HomeScreen.tsx`

### 5.2 Réduire redondance historique/prises
- **Statut** : ❌ Non fait
- **Problème** : Onglets "prises" et "historique" redondants
- **Action** :
  - Fusionner en un seul onglet "Historique"
  - Afficher vue d'ensemble avec dernières prises
  - Onglet "Prises" à l'intérieur de l'historique
- **Fichiers** : `mobile/src/screens/HistoryScreen.tsx`

---

## 📊 Résumé par priorité

### 🔴 URGENT (Phase 1)
- [ ] 1.1 Bug inscription (404)
- [ ] 1.2 Bug inscription compétition en cours

### 🟡 IMPORTANT (Phase 2)
- [ ] 2.1 DatePicker pour date de naissance
- [ ] 2.2 Opacité compétitions terminées

### 🟢 ESSENTIEL (Phase 3)
- [ ] 3.1 Mot de passe oublié
- [ ] 3.2 Modifier profil
- [ ] 3.3 Quitter compétition
- [ ] 3.4 Filtres compétitions

### 🔵 AVANCÉ (Phase 4)
- [ ] 4.1 Invitations avec approbation
- [ ] 4.2 Modifier équipe
- [ ] 4.3 Admin créer compétition mobile
- [ ] 4.4 Historique pauses manuelles

### 🟣 UX GLOBALE (Phase 5)
- [ ] 5.1 Navigation améliorée (bottom nav)
- [ ] 5.2 Réduire redondance historique/prises

---

## 🎯 Prochaines étapes recommandées

1. **Vérifier les bugs Phase 1** (1.1 et 1.2) - 1-2h
2. **Phase 2** : DatePicker + opacité - 2-3h
3. **Phase 3** : Fonctionnalités essentielles - 6-8h
4. **Phase 4** : Fonctionnalités avancées - 8-12h
5. **Phase 5** : Navigation et UX globale - 6-8h

**Total estimé restant** : 23-33 heures de développement

---

## ❓ Questions métier à clarifier

1. **Espèces et coefficients** : ✅ RÉSOLU - Les espèces sont maintenant spécifiques par compétition
2. **Nombre de personnes par équipe** : Y a-t-il une limite selon les compétitions ?
3. **Droits équipe** : Y a-t-il un admin d'équipe ou tous les membres ont les mêmes droits ?
4. **Réutilisation équipe** : Si on refait une compétition avec la même équipe, peut-on reprendre l'équipe ?
