# Tests de charge (k6) — STF

Simulation du flux **terrain** : consultation compétition / stats / liste des prises, et **création de prises** (GPS, commentaire, photo base64 optionnelle).

## Installation de k6

- **Linux** : [instructions officielles](https://k6.io/docs/get-started/installation/) (paquet `.deb` ou binaire).
- Vérifier : `k6 version`

## Configuration

```bash
cp loadtests/.env.example loadtests/.env
# Éditer loadtests/.env : BASE_URL, COMPETITION_ID, SPECIES_ID, JWT ou LOGIN_EMAIL/PASSWORD
chmod +x loadtests/run-loadtest.sh
```

## Lancer les tests

Toujours depuis la **racine** du dépôt (le script s’y place tout seul).

| Commande | Description |
|----------|-------------|
| `./loadtests/run-loadtest.sh` | Scénario **complet** : rampe jusqu’à **80 VU**, ~11 min |
| `./loadtests/run-loadtest.sh smoke` | **Court** : 5 VU, ~45 s — vérifie que tout répond |
| `./loadtests/run-loadtest.sh readonly` | Smoke **sans POST** (aucune prise créée en BDD) |

Équivalent manuel :

```bash
export BASE_URL=http://IP:8001 COMPETITION_ID=1 SPECIES_ID=1
export JWT=eyJ...   # ou LOGIN_EMAIL + LOGIN_PASSWORD dans .env

k6 run loadtests/k6/test_peche.js
```

Options utiles en variables d’environnement :

| Variable | Effet |
|----------|--------|
| `READ_ONLY=1` | Uniquement GET (compétition, stats, prises) |
| `INCLUDE_PHOTO=1` | Ajoute une petite image JPEG base64 à chaque POST prise |
| `K6_SCENARIO=smoke` | Remplace les *stages* par une courte montée fixe (voir script) |
| `K6_SMOKE_VUS` / `K6_SMOKE_DURATION` | Personnalise le mode smoke |

Passer des flags k6 en fin de commande :

```bash
./loadtests/run-loadtest.sh smoke --out json=results.json
```

## Limites (à lire avant le jour J)

1. **Un compte** = une équipe : tous les POST partent du même JWT → charge serveur OK, répartition « 80 équipes » non reproduite.
2. **Périmètres GPS** : coordonnées aléatoires → risque de **400** si zones définies ; tester sur une compétition sans périmètre ou ajuster lat/lng dans `test_peche.js`.
3. **Données réelles** : les POST créent des `FishCatch` et des notifs admin → préférer **staging** ou sauvegarde BDD.

## Fichiers

- `k6/test_peche.js` — scénario principal
- `run-loadtest.sh` — charge `.env` et lance k6
- `.env.example` — modèle de configuration (ne pas committer `.env` avec des secrets)
