# Todo / Backlog — Street Fishing (STF)

**À traiter après la session test terrain (février 2025).**

---

## 1. Périmètres et pauses planifiées (mobile)

**Constat actuel**
- **Frontend (PC)** : Création et édition des périmètres et pauses programmées.
- **Mobile** : Consommation des périmètres pour la validation GPS des prises, mais **aucune interface dédiée** pour visualiser ou informer l'utilisateur.

**À faire**
- [ ] Écran ou modal "Pauses programmées" sur mobile pour afficher les créneaux de pause.
- [ ] Afficher les périmètres (zone de pêche autorisée) sur la carte lors de l'ajout d'une prise.
- [ ] Mieux notifier / synchroniser les changements côté mobile lorsque les pauses ou périmètres sont modifiés depuis le frontend.

---

## 2. Carte Google Map dans la compétition : zone de pêche non visible

**Constat actuel**
- L'onglet / carte Google Map dans la page détail d'une compétition **ne montre pas la zone de pêche autorisée** (périmètres).
- Les périmètres existent en base et sont utilisés pour la validation GPS, mais ne sont pas affichés sur la carte de la compétition.

**À faire**
- [ ] Afficher les périmètres (polygones) sur la carte de la compétition (frontend et/ou mobile).
- [ ] Donner un aperçu visuel de la zone de pêche autorisée aux participants et admins.

---

## 3. Statistiques publiées : carte et chronologie

**Constat actuel**
- Les stats publiques affichent le camembert (répartition par espèce) et le top 3 par espèce.
- Pas de vue spatiale ni temporelle des prises.

**À faire**
- [ ] **Carte des prises** : Sous le graphique camembert, ajouter une carte avec les pings (positions GPS) de toutes les prises validées de la compétition.
- [ ] **Graphique chronologique** : Ajouter un graphique temporel (ex. prises par heure/jour) pour visualiser l'activité au fil du temps.
- [ ] **Séparation des blocs** : Envisager de séparer clairement :
  - **Bloc Espèces** : camembert + top 3 par espèce (réponse à "quoi a été pêché ?")
  - **Bloc Carte & Chronologie** : carte des pings + graphique temporel (réponse à "où et quand ?")

---

## 4. Mobile : flux « caméra d'abord » pour l'ajout de prise

**Fait** ✅
- [x] Inverser le flux : Clic sur « Ajouter une prise » → **ouverture immédiate de la caméra** → photo prise → affichage du formulaire avec la photo déjà associée.
- [x] L'heure de la photo (`caughtAt`) fait foi pour la date officielle de la prise (pas le clic sur « Enregistrer »).

---

## 5. Admin : ajout de prise pour compétition terminée

**Fait** ✅
- [x] L'admin peut sélectionner une compétition terminée et ajouter une prise à un participant (corrections, oublis).

---

## 6. Autres améliorations (parité frontend / mobile)

- [ ] **Stockage local / offline** : File d'attente des prises quand pas de réseau, envoi différé au retour de la connexion.
- [x] **Stockage photos** : Fichiers dans `APP_UPLOADS_PATH` (ex. `/home/mr_scrupulus/stock`) au lieu de base64.
- [ ] **Create catch admin** : Ajouter une page "Créer une prise (admin)" sur le frontend pour parité avec mobile.
- [ ] **Endpoints deleteAccount** : Harmoniser entre frontend (`/users/profile`) et mobile (`/api/auth/account`).
