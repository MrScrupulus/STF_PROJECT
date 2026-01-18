# Tests unitaires - Calcul des scores

Ce dossier contient les tests unitaires pour valider le système de calcul des scores.

## Installation

1. Installer les dépendances de développement :
```bash
cd backend
composer install
```

2. PHPUnit sera installé automatiquement via `symfony/test-pack`.

## Exécution des tests

### Tous les tests
```bash
cd backend
./vendor/bin/phpunit
```

### Tests spécifiques
```bash
# Tests pour le calcul des points d'une prise
./vendor/bin/phpunit tests/Entity/Competition/FishCatchTest.php

# Tests pour le calcul du score total d'une équipe
./vendor/bin/phpunit tests/Entity/Competition/TeamScoreCalculationTest.php
```

### Avec couverture de code
```bash
./vendor/bin/phpunit --coverage-html coverage
```

## Scénarios testés

### FishCatchTest
- ✅ Calcul des points pour chaque espèce (Brochet, Perche, Silure, Sandre, Gobi)
- ✅ Gestion des cas limites (pas d'espèce, pas de taille)

### TeamScoreCalculationTest
- ✅ Score avec 1 espèce (pas de bonus)
- ✅ Score avec 2 espèces (bonus de 50)
- ✅ Score avec 3 espèces (bonus de 100)
- ✅ Score avec 5 espèces (bonus de 200 max)
- ✅ Sélection des top 5 meilleures prises
- ✅ Cas spécial : Gobi seul (pas de bonus)
- ✅ Cas spécial : Gobi avec autres espèces (bonus de 50)
- ✅ Exclusion des prises non validées
- ✅ Exemple concret : 10 poissons, 5 espèces, 5 perches de 50cm = 700 pts

## Structure des tests

```
tests/
├── Entity/
│   └── Competition/
│       ├── FishCatchTest.php              # Tests unitaires pour calculatePoints()
│       └── TeamScoreCalculationTest.php   # Tests unitaires pour updateTotalScore()
└── README.md                              # Ce fichier
```

## Notes

- Les tests utilisent des objets mockés (pas de base de données)
- Chaque espèce reçoit un ID unique via réflexion PHP
- Les tests vérifient à la fois le score total et le flag `hasBonus`
