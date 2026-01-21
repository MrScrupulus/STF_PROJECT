# Checklist de Tests - STF Project

## 📋 Phase 1 : Tests et Stabilisation

### 🔔 Tests Notifications Push Mobile

#### Configuration de base
- [ok] L'app mobile demande bien les permissions de notification au démarrage
- [ok] Le token Expo Push est bien enregistré dans les préférences utilisateur
- [ok] Les préférences de notification sont accessibles depuis le profil
- [ok] Les préférences sont bien sauvegardées après modification

#### Notifications Utilisateur Standard

##### Prise validée (catchValidated)
- [ok] Créer une prise → Admin valide → Notification reçue sur mobile
- [ok] Désactiver "Prise validée" dans préférences → Admin valide → Pas de notification
- [ok] Réactiver "Prise validée" → Notification fonctionne à nouveau

##### Prise rejetée (catchRejected)
- [ ] Créer une prise → Admin rejette → Notification reçue sur mobile
- [ ] Désactiver "Prise rejetée" → Admin rejette → Pas de notification

##### Invitation d'équipe (teamInvitation)
- [ ] Inviter un utilisateur à rejoindre une équipe → Notification reçue
- [ ] Tester depuis différents réseaux (Wi-Fi, 4G/5G)
- [ ] Désactiver "Invitation d'équipe" → Pas de notification
- [ ] Cliquer sur la notification → Redirection vers l'écran d'invitations

##### Inscription compétition (competitionRegistered)
- [ ] S'inscrire à une compétition → Notification reçue
- [ ] Désactiver "Inscription compétition" → Pas de notification

##### Compétition démarrée (competitionStarted)
- [ ] Admin démarre une compétition → Notification reçue pour tous les participants
- [ ] Désactiver "Compétition démarrée" → Pas de notification

##### Compétition terminée (competitionEnded)
- [ ] Admin termine une compétition → Notification reçue
- [ ] Désactiver "Compétition terminée" → Pas de notification

##### Compétition en pause (competitionPaused)
- [ ] Admin met en pause une compétition → Notification reçue
- [ ] Désactiver "Compétition en pause" → Pas de notification

##### Compétition reprise (competitionResumed)
- [ ] Admin reprend une compétition → Notification reçue
- [ ] Désactiver "Compétition reprise" → Pas de notification

#### Notifications Admin (catchPending)
- [ ] Se connecter avec un compte admin
- [ ] Vérifier que "Nouvelle prise en attente" apparaît dans les préférences
- [ ] Créer une prise avec un utilisateur standard → Admin reçoit notification
- [ ] Désactiver "Nouvelle prise en attente" → Pas de notification
- [ ] Vérifier que les non-admins ne voient pas cette option

#### Tests de robustesse
- [ ] Tester avec l'app en foreground (ouverte)
- [ ] Tester avec l'app en background (minimisée)
- [ ] Tester avec l'app fermée (killée)
- [ ] Tester depuis différents réseaux (Wi-Fi, 4G/5G)
- [ ] Tester avec plusieurs notifications simultanées
- [ ] Vérifier que les notifications s'affichent correctement dans le centre de notifications

---

### 🔄 Tests d'Intégration - Parcours Complets

#### Parcours 1 : Création d'équipe et invitation
- [ ] Créer une compétition (admin)
- [ ] Créer une équipe pour cette compétition
- [ ] Inviter un membre par email
- [ ] Se connecter avec le compte invité
- [ ] Vérifier que l'invitation apparaît dans "Mes invitations"
- [ ] Accepter l'invitation
- [ ] Vérifier que l'équipe apparaît dans "Mes équipes"
- [ ] Vérifier que l'équipe est bien active
- [ ] Vérifier que la notification d'invitation a été reçue

#### Parcours 2 : Inscription à une compétition
- [ ] Créer une compétition (admin)
- [ ] S'inscrire à la compétition avec une équipe
- [ ] Vérifier que l'équipe apparaît dans les participants
- [ ] Vérifier que la notification d'inscription a été reçue
- [ ] Admin démarre la compétition
- [ ] Vérifier que la notification de démarrage a été reçue

#### Parcours 3 : Compétition individuelle (teamSize === 1)
- [ ] Créer une compétition individuelle (teamSize = 1)
- [ ] S'inscrire directement (sans créer d'équipe manuellement)
- [ ] Vérifier qu'une équipe individuelle a été créée automatiquement
- [ ] Vérifier que l'inscription fonctionne correctement

#### Parcours 4 : Modification d'équipe
- [ ] Créer une équipe avec 2 membres
- [ ] S'inscrire à une compétition avec cette équipe
- [ ] Modifier le nom de l'équipe
- [ ] Vérifier que le nom est bien mis à jour
- [ ] Essayer de retirer un membre (doit échouer si compétition active)
- [ ] Essayer d'ajouter un membre (doit fonctionner si place disponible)

#### Parcours 5 : Gestion des prises
- [ ] S'inscrire à une compétition active
- [ ] Créer une prise
- [ ] Vérifier que la prise apparaît dans "Mes prises"
- [ ] Admin valide la prise
- [ ] Vérifier que la notification de validation a été reçue
- [ ] Vérifier que la prise apparaît comme validée

---

### ⚠️ Tests des Cas Limites

#### Équipes
- [ ] Essayer d'inviter un utilisateur déjà dans l'équipe → Doit échouer avec message clair
- [ ] Essayer d'inviter un utilisateur inexistant → Doit échouer avec message clair
- [ ] Essayer d'ajouter un membre quand l'équipe est pleine → Doit échouer
- [ ] Essayer de retirer un membre d'une équipe avec compétition active → Doit échouer
- [ ] Essayer de modifier une équipe inactive → Doit fonctionner
- [ ] Essayer de modifier une équipe active → Doit fonctionner (sauf retirer membre)

#### Compétitions
- [ ] Essayer de s'inscrire à une compétition terminée → Doit échouer
- [ ] Essayer de s'inscrire à une compétition déjà commencée → Doit échouer (ou fonctionner selon règles métier)
- [ ] Essayer de s'inscrire deux fois à la même compétition → Doit échouer
- [ ] Essayer de quitter une compétition active → Doit fonctionner (ou échouer selon règles métier)

#### Notifications
- [ ] Tester avec un token Expo invalide → Doit gérer l'erreur proprement
- [ ] Tester avec les notifications désactivées au niveau système → Doit gérer gracieusement
- [ ] Tester avec plusieurs admins → Tous doivent recevoir les notifications catch_pending

#### Authentification
- [ ] Tester la déconnexion → Les notifications doivent s'arrêter
- [ ] Tester la reconnexion → Le token doit être réenregistré

---

### 🌐 Tests Multi-Réseaux

- [ ] Tester toutes les fonctionnalités en Wi-Fi
- [ ] Tester toutes les fonctionnalités en 4G/5G
- [ ] Tester le passage Wi-Fi → 4G/5G pendant une session
- [ ] Tester avec connexion instable (simulation)

---

## 📝 Notes de Tests

### Date de début : _______________

### Résultats par section :

#### Notifications Push
- ✅ Fonctionne
- ⚠️ Problèmes mineurs
- ❌ Problèmes majeurs

**Notes :**
```
[À remplir pendant les tests]
```

#### Parcours d'Intégration
- ✅ Fonctionne
- ⚠️ Problèmes mineurs
- ❌ Problèmes majeurs

**Notes :**
```
[À remplir pendant les tests]
```

#### Cas Limites
- ✅ Fonctionne
- ⚠️ Problèmes mineurs
- ❌ Problèmes majeurs

**Notes :**
```
[À remplir pendant les tests]
```

---

## 🐛 Bugs Identifiés

### Bug #1
- **Description :**
- **Sévérité :** [Critique / Majeure / Mineure]
- **Étapes pour reproduire :**
- **Comportement attendu :**
- **Comportement observé :**

### Bug #2
- **Description :**
- **Sévérité :** [Critique / Majeure / Mineure]
- **Étapes pour reproduire :**
- **Comportement attendu :**
- **Comportement observé :**

---

## ✅ Validation Finale

- [ ] Tous les tests critiques passent
- [ ] Tous les bugs majeurs sont corrigés
- [ ] Les notifications fonctionnent sur tous les réseaux
- [ ] Les parcours utilisateur sont fluides
- [ ] Les cas limites sont bien gérés

**Date de validation :** _______________

**Validé par :** _______________
