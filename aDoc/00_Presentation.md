# STF Project — Présentation (brève)

## Objectif
STF est une plateforme multi-clients (web + mobile) adossée à une API Symfony, orientée **compétitions de street-fishing** :
- gérer des **compétitions**
- gérer des **équipes** et leurs **membres**
- enregistrer des **prises** (espèces, taille, photo, validation)
- calculer un **score** et un **classement**
- suivre l’**historique** utilisateur (prises + équipes + compétitions)
- gérer **invitations** d’équipe et **notifications** (avec préférences)

## Applications
- **Backend** (`backend/`) : API REST Symfony 6.4 + Doctrine (MariaDB), JWT (Lexik) + refresh token (Gesdinet), notifications, export PDF, scheduler.
- **Web** (`frontend/`) : Next.js 15 (React 19) + React Query, pages utilisateur + dashboard admin.
- **Mobile** (`mobile/`) : Expo (React Native) + React Query + axios, authentification JWT stockée en SecureStore.

## Modules fonctionnels (vision produit)
- **Authentification / Compte** : inscription, vérification email, login JWT, profil, changement mdp, reset mdp.
- **Compétitions** : liste/détail, statut (à venir/en cours/terminée), inscription via équipe, participation historique, stats publiques.
- **Équipes** : création, gestion membres, invitations, équipes actives/inactives, historique.
- **Prises** : liste, ajout (mobile/web), validation admin, score calculé.
- **Notifications** : liste, non lues, marquer comme lue, préférences de notifications + token Expo.

