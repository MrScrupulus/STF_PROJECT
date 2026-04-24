# Documentation du projet STF

Ce dossier regroupe **tout ce qui n’est pas du code exécutable** directement lié au produit : schémas, notes d’architecture, guides de dépannage, textes pour portfolio, etc.

## Structure proposée

| Sous-dossier | Rôle |
|--------------|------|
| `uml/` | Diagrammes **PlantUML** (`.puml`) : modèle de données, classes métier, vues d’architecture. |
| `troubleshooting/` | Procédures de diagnostic, check-lists quand quelque chose casse en prod ou en local. |
| `portfolio/` | Textes pour présentation du projet — voir **`presentation-projet.md`** (résumé type fiche portfolio). |

### Ce qu’on laisse souvent à côté du code

- **`loadtests/README.md`** : reste à la racine de `loadtests/` — c’est la doc **du dossier de tests**, pratique pour qui clone et lance k6.
- **`README.md` à la racine du dépôt** : vue d’ensemble du monorepo (si tu en ajoutes un).

Le reste (diagnostics backend isolés, schémas UML lourds, exports) peut vivre ici.

## Visualiser les fichiers `.puml`

- **VS Code / Cursor** : extension « PlantUML » (nécessite Java + Graphviz pour certains diagrammes).
- **En ligne** : copier-coller le contenu sur [plantuml.com/plantuml](https://www.plantuml.com/plantuml/uml/).
- **CI / export** : `plantuml` en CLI pour générer des PNG/SVG si tu veux des images figées pour le portfolio.

## Fichiers présents

- `uml/erd-core-domain.puml` — entités et relations principales (compétition, équipes, prises).
- `uml/class-domain-core.puml` — vue classes métier simplifiée.
- `uml/architecture-logicielle.puml` — clients, API, données.
- `troubleshooting/diagnostic-stats-competition.md` — diagnostic fetch stats (ex-`backend/DIAGNOSTIC_STATS.md`).
- `portfolio/presentation-projet.md` — présentation complète du projet (stack, architecture, dépôt, compétences).
