# Diagnostic : erreur fetch sur les stats de compétition

**Contexte** : Les graphiques et statistiques ne s'affichent plus (frontend) et aucun visuel sur Expo. Erreur fetch côté frontend.

---

## 1. Endpoints impliqués

| Plateforme | Endpoint | Usage |
|------------|----------|-------|
| Frontend | `GET /api/competitions/{id}/stats` | Stats publiques (camembert, top 3, carte) |
| Mobile | `GET /api/competitions/{id}/stats` | Même endpoint |

**Conditions d'accès** : `isRankingPublic = true` OU utilisateur `ROLE_ADMIN`. Sinon → **403**.

---

## 2. Requêtes SQL de diagnostic (à exécuter dans DBeaver)

### 2.1 Vérifier la compétition de test

```sql
-- Remplace X par l'id de ta compétition de test
SELECT id, name, is_ranking_public, start_date, end_date 
FROM competitions 
WHERE id = X;
```

- Si `is_ranking_public = 0` et que tu n'es pas admin → **403** côté API.

### 2.2 Vérifier les espèces de la compétition

```sql
SELECT cs.id, cs.competition_id, cs.species_id, s.name as species_name
FROM competition_species cs
LEFT JOIN species s ON s.id = cs.species_id
WHERE cs.competition_id = X;
```

- **Problème** : une ligne avec `species_name = NULL` → `competition_species` pointe vers une espèce supprimée. Le backend peut planter dans la boucle `getCompetitionSpecies()` (appel à `getSpecies()->getId()` sur null).

### 2.3 Vérifier les prises de la compétition

```sql
SELECT fc.id, fc.competition_id, fc.team_id, fc.species_id, fc.is_validated,
       t.name as team_name, s.name as species_name
FROM fish_catch fc
LEFT JOIN teams t ON t.id = fc.team_id
LEFT JOIN species s ON s.id = fc.species_id
WHERE fc.competition_id = X AND fc.is_validated = 1;
```

- **Problème** : `team_name = NULL` ou `species_name = NULL` → prise orpheline (team ou species supprimé). La requête Doctrine avec `join('c.team')` peut exclure ces lignes, mais si la jointure échoue ou renvoie des entités incohérentes, une exception peut survenir plus tard dans la boucle (ex. `$catch->getTeam()->getName()`).

### 2.4 Prises sans compétition ou avec competition_id incohérent

```sql
SELECT fc.id, fc.competition_id, fc.team_id, fc.species_id
FROM fish_catch fc
WHERE fc.competition_id IS NULL 
   OR (fc.competition_id = X AND (fc.team_id NOT IN (SELECT id FROM teams) OR fc.species_id NOT IN (SELECT id FROM species)));
```

- Si des lignes remontent → données incohérentes.

### 2.5 Taille du payload (photos en base64 dans fish_catch)

```sql
SELECT COUNT(*) as nb_prises,
       SUM(LENGTH(COALESCE(photo_url, ''))) / 1024 / 1024 as photo_mb
FROM fish_catch
WHERE competition_id = X AND is_validated = 1;
```

- Les stats **n'incluent pas** `photo_url` dans la réponse. En revanche, si d'autres endpoints chargent les prises avec photo et que la réponse devient énorme, ça peut provoquer des timeouts. À vérifier si le fetch échoue par timeout.

---

## 3. Causes possibles (par priorité)

| Cause | Symptôme | Vérification |
|-------|----------|--------------|
| **403** | Classement non publié ou pas admin | `SELECT is_ranking_public FROM competitions WHERE id = X` |
| **Réseau / ngrok** | Fetch échoue (timeout, CORS, URL) | Tester `curl https://ton-ngrok.ngrok-free.app/api/competitions/X/stats` |
| **CompetitionSpecies orphelin** | `getSpecies()` retourne null → crash PHP | Requête 2.2 |
| **fish_catch orpheline** | team ou species supprimé → entité null | Requêtes 2.3 et 2.4 |
| **500 backend** | Exception non gérée | Consulter les logs Symfony : `var/log/dev.log` ou stderr du conteneur |

---

## 4. Actions recommandées

1. **Exécuter les requêtes 2.1 à 2.4** pour la compétition concernée.
2. **Vérifier les logs backend** au moment du fetch : `tail -f backend/var/log/dev.log` (ou équivalent).
3. **Tester l'API en direct** :
   ```bash
   curl -v "https://TON_URL/api/competitions/X/stats"
   ```
4. **Vérifier `is_ranking_public`** : si la compétition a été recréée ou modifiée, le classement peut être repassé en privé.
5. **Corriger les données** si des orphelins sont trouvés :
   - Supprimer les `competition_species` dont `species_id` pointe vers une espèce inexistante.
   - Mettre à jour ou supprimer les `fish_catch` dont `team_id` ou `species_id` est invalide.
