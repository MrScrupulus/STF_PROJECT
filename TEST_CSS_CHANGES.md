# Guide de test des changements CSS

## 🚀 Démarrage

1. **Vérifier que Docker est lancé** (si vous utilisez Docker) :
   ```bash
   docker-compose ps
   ```

2. **Ou lancer le frontend directement** :
   ```bash
   cd frontend
   npm run dev
   ```

3. **Ouvrir le navigateur** : http://localhost:3000

---

## ✅ Checklist de test

### 1. Dashboard Admin - Modals

#### Test Modal de détails de compétition
- [ ] Aller sur `/dashboard`
- [ ] Cliquer sur une compétition dans le tableau
- [ ] **Vérifier** :
  - La modal s'ouvre correctement
  - La largeur de la modal est d'environ 900px (plus large qu'avant)
  - Le contenu est bien centré
  - Le bouton de fermeture (×) fonctionne
  - Les statistiques s'affichent correctement (graphique + carte)

#### Test Modal de rejet de prise
- [ ] Dans le dashboard, section "Prises en attente"
- [ ] Cliquer sur "Rejeter" pour une prise
- [ ] **Vérifier** :
  - La modal s'ouvre
  - Le formulaire de rejet s'affiche correctement
  - Le textarea est stylé correctement
  - Les boutons "Rejeter" et "Annuler" fonctionnent

#### Test Modal de confirmation de rôle
- [ ] Cliquer sur un switch de rôle (Admin/User)
- [ ] **Vérifier** :
  - La modal de confirmation s'affiche
  - Les boutons "Confirmer" et "Annuler" sont visibles et fonctionnent

### 2. Variables CSS - Thème

#### Test Mode clair
- [ ] Vérifier que les couleurs sont cohérentes :
  - Statut "À venir" : bleu clair (#60a5fa)
  - Statut "En cours" : vert (#34d399)
  - Statut "Terminée" : rouge (#f87171)
  - Rôle Admin : vert (#34d399)
  - Rôle User : rouge (#f87171)

#### Test Mode sombre (si disponible)
- [ ] Activer le mode sombre (si le toggle existe)
- [ ] Vérifier que les couleurs s'adaptent correctement

### 3. Styles de boutons

- [ ] Vérifier que tous les boutons ont un style cohérent :
  - Boutons primaires : bleu (#2563eb)
  - Boutons danger : rouge (#dc2626)
  - Boutons confirm : vert (#16a34a)
  - Boutons cancel : gris clair (#f3f4f6)

### 4. Responsivité

- [ ] Tester sur différentes tailles d'écran :
  - Desktop (1920x1080)
  - Tablette (768px)
  - Mobile (375px)
- [ ] Vérifier que les modals s'adaptent correctement

### 5. Console du navigateur

- [ ] Ouvrir la console (F12)
- [ ] Vérifier qu'il n'y a **aucune erreur CSS**
- [ ] Vérifier qu'il n'y a **aucun warning**

---

## 🔍 Vérifications techniques dans l'inspecteur

### Vérifier les variables CSS

1. Ouvrir l'inspecteur (F12)
2. Sélectionner un élément avec un statut (ex: "En cours")
3. Dans l'onglet "Computed", vérifier :
   - `background-color` utilise `var(--status-ongoing-bg)`
   - `color` utilise `var(--status-ongoing-text)`

### Vérifier la consolidation des modals

1. Ouvrir une modal
2. Inspecter l'élément `.modal__content`
3. Vérifier qu'il n'y a **qu'une seule définition** de `.modal__content` dans les styles
4. Vérifier que `max-width: 900px` est bien appliqué

### Vérifier l'absence de duplications

1. Dans l'onglet "Sources" de l'inspecteur
2. Chercher "dashboard.module.scss"
3. Vérifier qu'il n'y a **qu'une seule définition** de `.modal`

---

## 🐛 Problèmes potentiels à vérifier

### Si les modals ne s'affichent pas :
- Vérifier la console pour les erreurs
- Vérifier que les styles sont bien chargés
- Rafraîchir la page (Ctrl+F5)

### Si les couleurs sont incorrectes :
- Vérifier que `theme.scss` est bien importé
- Vérifier que les variables CSS sont bien définies dans `:root`
- Vérifier dans l'inspecteur que les variables sont résolues

### Si les styles sont incohérents :
- Vérifier qu'il n'y a pas de conflits CSS
- Vérifier l'ordre de chargement des styles
- Vérifier les spécificités CSS (pas de `!important` en trop)

---

## 📝 Notes

- Les changements CSS sont en temps réel avec Next.js (hot reload)
- Si vous ne voyez pas les changements, essayez un hard refresh (Ctrl+F5)
- Les styles sont générés dans `.next/static/css/` lors du build

---

## ✅ Validation finale

Une fois tous les tests passés :
- [ ] Toutes les modals fonctionnent
- [ ] Les variables CSS sont utilisées correctement
- [ ] Aucune erreur dans la console
- [ ] Les styles sont cohérents sur toutes les pages
- [ ] La responsivité fonctionne

**Si tout est OK, vous pouvez continuer avec les optimisations UX/UI !** 🎉
