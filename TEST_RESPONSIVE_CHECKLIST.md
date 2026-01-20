# Checklist de Tests - Responsivité et CSS

## 🎯 Objectif
Valider que tous les changements CSS de la Phase 2 fonctionnent correctement et que la responsivité est cohérente sur toutes les pages.

---

## ✅ Tests de Build

### 1. Build Next.js
- [ ] `npm run build` s'exécute sans erreurs
- [ ] Aucune erreur de compilation SCSS
- [ ] Aucun warning critique

**Commande** : `cd frontend && npm run build`

---

## 📱 Tests de Responsivité

### 2. Mobile (≤ 600px)
Testez sur les tailles suivantes :
- [ ] **375px** (iPhone SE, petits Android)
  - [ ] Dashboard : grille en 1 colonne
  - [ ] Competitions : liste verticale
  - [ ] Teams : cartes empilées
  - [ ] Account : formulaire adapté
  - [ ] Modals : pleine largeur ou presque
  - [ ] Header : menu hamburger fonctionnel
  - [ ] Footer : colonnes empilées

- [ ] **414px** (iPhone 11 Pro Max, Android moyens)
  - [ ] Même vérifications que 375px
  - [ ] Textes lisibles
  - [ ] Boutons accessibles (min 44x44px)

### 3. Tablette (601px - 768px)
- [ ] **768px** (iPad portrait)
  - [ ] Dashboard : grille en 2 colonnes
  - [ ] Competitions : grille adaptée
  - [ ] Modals : largeur optimale
  - [ ] Navigation : visible et fonctionnelle

### 4. Desktop (≥ 769px)
- [ ] **1024px** (iPad landscape, petits écrans)
  - [ ] Dashboard : grille en 2 colonnes
  - [ ] Layout optimal

- [ ] **1280px** (Laptop standard)
  - [ ] Dashboard : grille en 2 colonnes
  - [ ] Conteneurs centrés avec max-width
  - [ ] Espacements cohérents

- [ ] **1920px** (Desktop large)
  - [ ] Contenu ne s'étire pas trop
  - [ ] Max-width respecté
  - [ ] Lisibilité optimale

---

## 🔍 Tests par Page

### 5. Dashboard (`/dashboard`)
- [ ] Grille responsive (1 col mobile, 2 cols desktop)
- [ ] Modals s'adaptent à la taille d'écran
- [ ] Graphiques (pie chart, map) s'affichent correctement
- [ ] Tableaux scrollables sur mobile
- [ ] Boutons accessibles

### 6. Competitions (`/competitions` et `/competitions/[id]`)
- [ ] Liste des compétitions responsive
- [ ] Détails de compétition : graphiques adaptés
- [ ] Carte des prises visible et fonctionnelle
- [ ] Classement lisible sur mobile
- [ ] Badges de statut visibles

### 7. Teams (`/teams` et `/teams/[id]`)
- [ ] Liste des équipes responsive
- [ ] Détails d'équipe : sections colorées visibles
- [ ] Top 5, autres prises, rejetées : bien distinguées
- [ ] Photos de prises adaptées

### 8. Account (`/account`, `/account/edit`, `/account/history`)
- [ ] Formulaires adaptés mobile
- [ ] Champs de saisie accessibles
- [ ] Boutons pleine largeur sur mobile
- [ ] Historique : onglets fonctionnels
- [ ] Grilles de statistiques responsive

### 9. Autres Pages
- [ ] **Home** (`/`) : sections empilées sur mobile
- [ ] **Register/Login** : formulaires adaptés
- [ ] **Catch/Add** : formulaire d'ajout responsive
- [ ] **Legal** : contenu lisible

---

## 🧩 Tests de Composants

### 10. Modals
- [ ] Largeur adaptée (max 900px desktop, ~95% mobile)
- [ ] Centrage correct
- [ ] Boutons accessibles
- [ ] Fermeture fonctionnelle
- [ ] Overlay visible

### 11. Header
- [ ] Menu responsive
- [ ] Notification bell positionnée correctement
- [ ] Logo/titre adaptés

### 12. Footer
- [ ] Colonnes empilées sur mobile
- [ ] Liens accessibles

### 13. Navigation
- [ ] Menu hamburger sur mobile
- [ ] Navigation desktop visible
- [ ] Liens actifs visibles

---

## 🌐 Tests Multi-Navigateurs

### 14. Chrome/Chromium
- [ ] Tous les tests ci-dessus passent
- [ ] Console sans erreurs

### 15. Firefox
- [ ] Tous les tests ci-dessus passent
- [ ] Console sans erreurs

### 16. Safari (si disponible)
- [ ] Tous les tests ci-dessus passent
- [ ] Console sans erreurs

---

## 🐛 Vérifications Console

### 17. Console du Navigateur
- [ ] Aucune erreur JavaScript
- [ ] Aucune erreur CSS
- [ ] Aucun warning critique
- [ ] Vérifier l'onglet "Network" pour les ressources CSS

**Comment tester** :
1. Ouvrir DevTools (F12)
2. Onglet "Console"
3. Filtrer par "Errors" et "Warnings"
4. Vérifier qu'il n'y a que des warnings mineurs (ex: @apply de Tailwind)

---

## 📊 Outils de Test

### Chrome DevTools
1. Ouvrir DevTools (F12)
2. Cliquer sur l'icône "Toggle device toolbar" (Ctrl+Shift+M)
3. Sélectionner les tailles d'écran ou créer des presets personnalisés

### Presets Recommandés
- Mobile S: 320px
- Mobile M: 375px
- Mobile L: 414px
- Tablet: 768px
- Laptop: 1024px
- Desktop: 1280px
- Desktop L: 1920px

---

## ✅ Critères de Validation

### ✅ Succès
- Toutes les pages s'affichent correctement sur toutes les tailles
- Aucune erreur dans la console
- Les breakpoints fonctionnent comme prévu
- Les modals et composants interactifs sont fonctionnels
- La navigation est accessible sur tous les écrans

### ❌ Échec
- Erreurs de build
- Pages cassées sur certaines tailles
- Erreurs JavaScript/CSS dans la console
- Composants non fonctionnels
- Textes illisibles ou boutons inaccessibles

---

## 📝 Notes

- Les warnings `@apply` de Tailwind CSS sont normaux et peuvent être ignorés
- Tester en mode portrait et paysage pour les tablettes
- Vérifier les transitions entre breakpoints (pas de sauts visuels)

---

## 🚀 Après les Tests

Une fois tous les tests validés :
1. Documenter les problèmes trouvés (s'il y en a)
2. Corriger les bugs identifiés
3. Faire un commit final si nécessaire
4. Passer à l'Option 2 (Optimisations Performance)
