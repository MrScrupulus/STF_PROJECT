# Message de commit - Gestion espèces par compétition et corrections critiques

## Résumé
Implémentation complète de la gestion des espèces spécifiques par compétition avec coefficients personnalisés, correction des bugs critiques de filtrage des prises, et améliorations UX majeures.

## Fonctionnalités principales

### Backend
- **Nouvelle entité CompetitionSpecies** : Gestion des espèces avec coefficients spécifiques par compétition
- **Migration base de données** : Tables `competition_species` et colonne `is_bonus_enabled`
- **Calcul des points** : Utilisation du coefficient de compétition au lieu du coefficient global
- **Filtrage strict** : Prises et scores filtrés par compétition pour éviter les mélanges
- **Nouveau contrôleur** : `CompetitionFishCatchController` séparé pour les prises de compétition
- **Endpoint utilisateur** : `/api/catches` pour récupérer toutes les prises d'un utilisateur

### Frontend Web
- **Onglet Espèces** : Affichage des espèces configurées avec leurs coefficients dans le détail compétition
- **Création compétition** : Gestion complète des espèces (ajout, coefficient décimal, points bonus)
- **Tri compétitions** : Ordre "En cours" → "À venir" → "Terminé"
- **Badge "Inscrit"** : Indication visuelle sur les compétitions où l'utilisateur est inscrit
- **Quitter équipe** : Fonctionnalité avec restriction si compétition active
- **Correction IDs** : Utilisation de `parseInt` pour éviter les erreurs de type

### Mobile
- **Onglet Espèces** : Intégré dans `CompetitionDetailScreen` (retiré de HomeScreen)
- **Publication classement** : Admin peut publier/masquer le classement depuis mobile
- **Format dates** : Affichage optimisé (même jour : date + heures, jours différents : dates complètes)
- **Carte cliquable** : Toute la carte compétition est cliquable (pas seulement le bouton)
- **Affichage photos** : Photos des prises avec modal plein écran
- **Champs optionnels** : Téléphone et date de naissance optionnels à l'inscription
- **Clear cache** : Vidage du cache React Query à la déconnexion
- **Protection erreurs** : Utilisation de `team?.catches` pour éviter les crashes

## Corrections de bugs

1. **Coefficient incorrect** : Le coefficient affiché utilisait celui de l'espèce globale au lieu de celui de la compétition
2. **Prises mélangées** : Les prises d'autres compétitions s'affichaient dans les compétitions en cours
3. **Score incorrect** : Le score utilisait toutes les prises au lieu de celles de la compétition courante
4. **"Compétition non trouvée"** : Erreur due au type string au lieu d'entier pour les IDs
5. **"team.catches.filter is not a function"** : Protection avec optional chaining ajoutée
6. **Session mobile** : Cache React Query non vidé à la déconnexion
7. **Erreur 405** : Conflit de routes résolu en séparant les contrôleurs

## Améliorations techniques

- **Coefficient décimal** : Support des valeurs décimales (1.5, 0.5) avec gestion des séparateurs "," et "."
- **Points bonus** : Renommage de "Points de base" en "Points bonus"
- **Filtrage compétition** : Méthodes `getScoreForCompetition()` et filtrage strict dans `TeamController`
- **Eager loading** : Chargement des `CompetitionSpecies` avec la compétition
- **Mapping coefficients** : Utilisation de `competitionSpeciesMap` pour performance

## Fichiers modifiés

### Backend (9 fichiers)
- `CompetitionController.php` - Stats avec coefficients de compétition
- `TeamController.php` - Prises avec coefficients de compétition
- `CompetitionFishCatchController.php` - Nouveau fichier
- `FishCatchController.php` - Endpoint utilisateur
- `Competition.php` - Relation CompetitionSpecies
- `FishCatch.php` - Calcul avec coefficient compétition
- `Team.php` - Méthodes score par compétition
- 2 migrations

### Frontend (6 fichiers)
- `competitions/[id]/page.js` - Onglet espèces, parseInt
- `competitions/page.js` - Tri et badge
- `dashboard/competitions/create/page.js` - Gestion espèces
- `dashboard/page.js` - Affichage espèces
- `teams/page.js` - Quitter équipe
- Styles associés

### Mobile (10 fichiers)
- `CompetitionDetailScreen.tsx` - Onglet espèces, parseInt, publication
- `CompetitionsScreen.tsx` - Format dates, tri, badge
- `TeamDetailScreen.tsx` - Protection, quitter équipe
- `AddCatchScreen.tsx` - Erreurs, espèces compétition
- `CatchesScreen.tsx` - Photos
- `RegisterScreen.tsx` - Champs optionnels
- `ProfileScreen.tsx` - Clear cache
- `Header.tsx` - Clear cache
- `HomeScreen.tsx` - Retrait onglet espèces
- Services mis à jour

## Tests recommandés

- [ ] Créer une compétition avec espèces et coefficients personnalisés
- [ ] Vérifier que le coefficient affiché correspond à celui de la compétition
- [ ] Vérifier que les prises sont bien filtrées par compétition
- [ ] Vérifier que le score est correct pour chaque compétition
- [ ] Tester "Quitter équipe" avec/sans compétition active
- [ ] Vérifier l'affichage des photos sur mobile
- [ ] Tester la déconnexion/reconnexion sur mobile
- [ ] Vérifier le tri des compétitions
- [ ] Vérifier le badge "Inscrit"
