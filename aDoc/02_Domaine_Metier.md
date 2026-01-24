# STF Project — Domaine métier & règles

## Concepts principaux
- **Utilisateur** : s’inscrit, vérifie son email, rejoint des équipes, crée des prises, reçoit des notifications.
- **Espèce (Species)** : référentiel des poissons avec coefficient par défaut.
- **Compétition**
  - période : `startDate` / `endDate`
  - paramètres : `teamSize`, `maxParticipants`, `hasNoLimit`, `type`, `isRankingPublic`, `isPaused`, `isBonusEnabled`
  - périmètres (zones) : perimeters
  - espèces autorisées et coefficients potentiellement spécifiques à la compétition
- **Équipe**
  - membres (many-to-many utilisateurs)
  - attaches à une compétition (ou null) + statut `isActive` (historique)
  - score calculé à partir des prises validées
- **Prise (FishCatch)**
  - espèce, taille, photo/commentaire, GPS (lat/long), validée ou non
  - liée à une équipe
  - liée aussi directement à une compétition pour préserver l’historique même si l’équipe change de compétition

## Règles de scoring (équipe)
Implémenté côté backend dans `backend/src/Entity/Competition/Team.php` + `FishCatch::calculatePoints()` :

### 1) Points d’une prise
- \(points = taille \times coefficient\)
- Le coefficient utilisé est :
  - celui de `CompetitionSpecies` si la prise est associée à une compétition et que l’espèce a un coefficient spécifique pour cette compétition
  - sinon le coefficient par défaut de `Species`

### 2) Score d’équipe (pour une compétition)
Le score d’équipe est calculé sur les **prises validées** :
- on prend les **5 meilleures prises** (par points) → somme = **score de base**
- on ajoute un **bonus** de diversité d’espèces :
  - 1 espèce → 0
  - 2 espèces → 50
  - 3 espèces → 100
  - 4 espèces → 150
  - 5 espèces → 200 (max)
- cas spécial : si la seule espèce est un “gobi” (coefficient 0) → bonus 0

## “Inscrit” vs “Participé” (badges)
Principe utilisé côté backend pour enrichir les compétitions avec un flag `isRegistered` :
- **Inscrit** : l’utilisateur a (ou a eu) une équipe associée à la compétition
- **Participé** : la compétition est terminée et l’utilisateur a des preuves historiques (ex. prises liées à la compétition)

Concrètement, la route `GET /api/competitions` calcule `isRegistered` en croisant :
- l’historique d’équipes utilisateur (`TeamRepository::findUserHistory`)
- et les prises liées à ces équipes / à l’utilisateur (`FishCatchRepository`)

## Historique (“Mon historique”)
La route `GET /api/teams/my-history` renvoie :
- les équipes (actives + inactives)
- les prises (paginées) + une base de prise “complète” (espèce, équipe, compétition, points)
- des statistiques agrégées : total prises, points (sur prises validées), stats par espèce, et **nombre de compétitions uniques** (`competitionsCount`).

## Invitations d’équipe
Une invitation (`TeamInvitation`) porte :
- l’équipe
- l’utilisateur invité + l’invitant
- un statut : `pending | accepted | rejected`
- dates : `createdAt`, `respondedAt`

