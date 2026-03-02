# Débrief projet Street Fishing (STF)

**Date** : 24 janvier 2026  
**Objectif** : Analyse globale, problèmes réglés et état actuel.

---

## 1. Vue d’ensemble du projet

**Street Fishing** est une plateforme multi-clients pour la gestion de compétitions de pêche urbaine :

| Composant | Stack | Rôle |
|-----------|--------|------|
| **Backend** | Symfony 6.4, PHP 8, MariaDB | API REST, JWT, logique métier, géolocalisation, emails |
| **Frontend Web** | Next.js 15, React 19 | Site + dashboard admin |
| **Mobile** | Expo (React Native) | App iOS/Android (28 écrans) |

Fonctionnalités principales : **auth**, **compétitions** (CRUD, inscription, classement, périmètres), **équipes** (création, invitations, membres), **prises** (ajout, validation admin, géolocalisation), **notifications push** (Expo, préférences par type).

---

## 2. Problèmes réglés récemment

### Pauses programmées (horaire)
- **Problème** : Création des pauses à une horaire incorrecte (mauvais fuseau).
- **Correction** : Les dates des pauses sont interprétées en **Europe/Paris** puis stockées en UTC (création compétition + modal d’édition frontend). L’heure d’application des pauses est désormais correcte.

### Historique des prises
- **Problème** : L’historique affichait les prises de l’équipe au lieu des prises personnelles.
- **Correction** : L’API `GET /api/teams/my-history` ne renvoie plus que les prises où l’utilisateur est **caughtBy** (prises personnelles). Les stats (total, points, etc.) sont calculées sur ces seules prises.

### Zone autorisée (enregistrement d’une prise)
- **Problème** : Possibilité d’enregistrer une prise alors que l’utilisateur n’est pas dans une zone autorisée.
- **Correction** :  
  - Le backend refusait déjà (GeolocationService).  
  - Côté **mobile** : si la compétition a des périmètres et que le statut est « hors zone », l’envoi du formulaire est **bloqué** avec une alerte invitant à se déplacer ou recapturer la position.

### Préférence « Notifications par email »
- **Ajout** : Option **Recevoir les notifications par email** dans les préférences (backend + web + mobile). La préférence est stockée (`receive_email_notifications`). L’envoi effectif d’emails selon cette préférence reste à brancher dans le flux de notifications si besoin.

### Autres corrections déjà en place (sessions précédentes)
- Barre de navigation globale mobile (visible partout sauf Login/Register), avec `navigationRef` pour éviter les erreurs hors navigator.
- Mentions légales et guide rapide sur l’accueil.
- Géolocalisation et périmètres (carte, création compétition, validation des prises).
- Notifications push : canal Android, JSON_CONTAINS pour les admins, tests automatisés.

---

## 3. Où nous en sommes

### Ce qui est en place et stable
- **Auth** : Inscription, connexion, reset mot de passe, profil, JWT.
- **Compétitions** : Liste, détail, inscription, classement, espèces par compétition, périmètres, pauses programmées, publication du classement.
- **Équipes** : CRUD, invitations, quitter (avec règle si compétition active).
- **Prises** : Ajout (photo, espèce, taille, zone), validation/rejet admin, historique **personnel**.
- **Notifications** : Push Expo, 9 types de préférences, préférence email (stockée), outils de test (API, web, script).
- **Mobile** : Barre de navigation globale, menu burger, écrans principaux, deep links.

### Tests et qualité
- **Notifications** : Très bien couvertes (checklist, tests automatisés, Wi‑Fi/4G, foreground/background/app fermée).
- **Parcours d’intégration** : Partiellement cochés dans la checklist (création équipe, inscription compétition, prises, etc.).
- **Cas limites** : Liste définie (invitations, équipes pleines, compétition en pause, etc.), à valider manuellement.
- **Messages d’erreur** : Guide et script de test pour vérifier format et sécurité.

### À finaliser / à surveiller
- **Parcours complets** : Valider de bout en bout les scénarios de la checklist (création compétition → équipe → invitation → prise → validation).
- **Cas limites** : Exécuter les scénarios (token Expo invalide, non-admin ne voit pas catch_pending, etc.).
- **Optionnel** : Brancher l’envoi d’emails selon `receiveEmailNotifications` si vous activez les notifications par mail.
- **Scheduler** : Vérifier que la commande `app:process-scheduled-pauses` est bien planifiée (cron) pour activer/désactiver les pauses aux bonnes heures.

---

## 4. Synthèse

| Aspect | État |
|--------|------|
| **Fonctionnalités cœur** | En place (auth, compétitions, équipes, prises, zones, pauses) |
| **Mobile UX** | Barre de navigation, historique personnel, blocage hors zone |
| **Notifications** | Push opérationnelles, préférences + email (stockage) |
| **Bugs récents** | Pauses (timezone), historique (personnel), zone (blocage mobile) traités |
| **Tests** | Notifications bien couvertes ; parcours et cas limites à valider |
| **Production** | Démo prête ; cron pauses + tests manuels recommandés avant mise en prod |

Le projet est **en état démo / pré-production** : les briques métier et les corrections demandées sont en place ; la suite consiste à valider les parcours complets et les cas limites, puis à configurer le cron des pauses et, si besoin, l’envoi d’emails selon la préférence.
