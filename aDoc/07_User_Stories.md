# STF Project — User Stories (simples)

## Rôles
- **Visiteur** : utilisateur non connecté
- **Utilisateur** : utilisateur connecté (ROLE_USER)
- **Admin** : administrateur (ROLE_ADMIN)

## Visiteur
- **US-001 — S’inscrire**
  - En tant que visiteur, je veux créer un compte avec email/mot de passe pour accéder aux fonctionnalités.
- **US-002 — Vérifier mon email**
  - En tant que visiteur, je veux vérifier mon adresse email via un lien pour activer mon compte.
- **US-003 — Me connecter**
  - En tant que visiteur, je veux me connecter pour accéder à mon profil, mes équipes, mes prises et les compétitions.
- **US-004 — Réinitialiser mon mot de passe**
  - En tant que visiteur, je veux demander une réinitialisation et définir un nouveau mot de passe si je l’ai oublié.

## Utilisateur
- **US-010 — Voir mon profil**
  - En tant qu’utilisateur, je veux consulter mes infos (nom, email, etc.).
- **US-011 — Modifier mon profil**
  - En tant qu’utilisateur, je veux modifier mes informations personnelles.
- **US-012 — Changer mon mot de passe**
  - En tant qu’utilisateur, je veux changer mon mot de passe de manière sécurisée.

- **US-020 — Consulter les compétitions**
  - En tant qu’utilisateur, je veux voir la liste des compétitions, leur statut (à venir/en cours/terminée) et le détail.
- **US-021 — S’inscrire à une compétition via une équipe**
  - En tant qu’utilisateur, je veux créer/rejoindre une équipe pour m’inscrire à une compétition.
- **US-022 — Visualiser mes badges**
  - En tant qu’utilisateur, je veux voir si je suis **Inscrit** à une compétition, et si j’y ai **Participé** lorsqu’elle est terminée.

- **US-030 — Gérer mes équipes**
  - En tant qu’utilisateur, je veux voir mes équipes (actives et historiques) et accéder à leur détail.
- **US-031 — Inviter un membre**
  - En tant qu’utilisateur, je veux inviter une personne dans mon équipe.
- **US-032 — Répondre à une invitation**
  - En tant qu’utilisateur, je veux accepter ou refuser une invitation d’équipe.

- **US-040 — Enregistrer une prise**
  - En tant qu’utilisateur, je veux ajouter une prise (espèce, taille, photo/commentaire, position si besoin).
- **US-041 — Consulter mes prises**
  - En tant qu’utilisateur, je veux voir la liste de mes prises (paginée), avec points et statut de validation.
- **US-042 — Consulter mon historique**
  - En tant qu’utilisateur, je veux voir un historique (prises + équipes + stats agrégées) et naviguer rapidement vers les pages associées.

- **US-050 — Recevoir des notifications**
  - En tant qu’utilisateur, je veux recevoir des notifications (invitation, compétition, validation prise…).
- **US-051 — Consulter et marquer comme lues**
  - En tant qu’utilisateur, je veux voir mes notifications, le nombre de non lues, et les marquer comme lues.
- **US-052 — Régler mes préférences**
  - En tant qu’utilisateur, je veux activer/désactiver des types de notifications et enregistrer mon token push.

## Admin
- **US-100 — Administrer les compétitions**
  - En tant qu’admin, je veux créer/modifier des compétitions et gérer leurs paramètres (pauses, périmètres, espèces).
- **US-101 — Valider / rejeter des prises**
  - En tant qu’admin, je veux valider ou rejeter des prises, avec un motif si nécessaire.
- **US-102 — Suivre les statistiques**
  - En tant qu’admin, je veux accéder à des statistiques et exports (selon les pages/contrôleurs admin).

