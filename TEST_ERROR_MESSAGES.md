# Guide de Test des Messages d'Erreur

Ce guide explique comment utiliser le script de test pour vérifier que les messages d'erreur sont bien formatés et sécurisés.

## 🎯 Objectif

Vérifier que :
- Les messages d'erreur ne contiennent **pas de détails techniques** (stack traces, exceptions, SQL, etc.)
- Les messages sont **en français** et **clairs** pour les utilisateurs
- Les messages suivent le **format uniforme** : "Une erreur est survenue lors de... Veuillez réessayer."

## 🛠️ Utilisation

### Prérequis

1. **Backend Symfony** doit être lancé sur `http://localhost:8001` (ou l'URL spécifiée)
2. **jq** doit être installé pour parser le JSON :
   ```bash
   sudo apt install jq  # Ubuntu/Debian
   # ou
   brew install jq      # macOS
   ```

### Obtenir un Token JWT

Pour les tests nécessitant une authentification :

```bash
# Se connecter via l'API
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"votre@email.com","password":"votre_mot_de_passe"}' \
  | jq -r '.token'
```

### Exécuter le Script

```bash
cd backend/scripts

# Avec token (recommandé pour tous les tests)
export TOKEN="votre_token_jwt_ici"
./test-error-messages.sh http://localhost:8001 "$TOKEN"

# Ou directement
./test-error-messages.sh http://localhost:8001 "votre_token_jwt_ici"

# Sans token (tests limités)
./test-error-messages.sh http://localhost:8001
```

## 📋 Tests Effectués

Le script teste plusieurs scénarios :

1. **Création d'équipe avec données invalides**
   - Vérifie que le message d'erreur est clair et ne contient pas de détails techniques

2. **Récupération d'une équipe inexistante**
   - Vérifie le message d'erreur 404

3. **Invitation avec email invalide**
   - Vérifie la validation des données

4. **Inscription à compétition inexistante**
   - Vérifie le message d'erreur pour ressources introuvables

5. **Actions sans authentification**
   - Vérifie les messages d'erreur 401/403

6. **Récupération compétitions**
   - Vérifie que les requêtes valides fonctionnent

## ✅ Critères de Validation

Un message d'erreur est considéré comme **valide** si :

- ✅ **Ne contient PAS** de détails techniques :
  - Pas de "stack trace"
  - Pas de "exception"
  - Pas de "SQL"
  - Pas de "database"
  - Pas de "PDO"
  - Pas de "Doctrine"
  - Pas de "undefined"
  - Pas de "null pointer"

- ✅ **Est en français** et **clair** :
  - Contient "Une erreur est survenue"
  - Contient "Veuillez réessayer"
  - Ou contient "Erreur lors de" (format ancien mais acceptable)

- ✅ **Suit le format uniforme** :
  - "Une erreur est survenue lors de [action]. Veuillez réessayer."

## 📊 Résultats Attendus

### Exemple de Message Valide ✅

```json
{
  "success": false,
  "message": "Une erreur est survenue lors de la création de l'équipe. Veuillez réessayer plus tard."
}
```

### Exemple de Message Invalide ❌

```json
{
  "success": false,
  "message": "SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry..."
}
```

## 🔍 Tests Manuels Complémentaires

Le script automatise les tests de base, mais vous pouvez aussi tester manuellement :

### Test 1 : Erreur de validation

```bash
curl -X POST http://localhost:8001/api/teams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":""}'
```

**Attendu** : Message clair sur la validation, pas de stack trace

### Test 2 : Erreur 404

```bash
curl -X GET http://localhost:8001/api/teams/99999 \
  -H "Authorization: Bearer $TOKEN"
```

**Attendu** : Message "Équipe non trouvée" ou similaire, pas de détails techniques

### Test 3 : Erreur 500 (simulation)

Tester avec des données qui provoquent une erreur serveur (si possible en dev)

**Attendu** : Message générique "Une erreur est survenue...", pas de stack trace

## 🐛 Dépannage

### Le script ne trouve pas `jq`

```bash
# Installer jq
sudo apt install jq  # Ubuntu/Debian
brew install jq      # macOS
```

### Les tests échouent avec "Connection refused"

- Vérifier que le backend Symfony est bien lancé
- Vérifier l'URL dans le script (par défaut `http://localhost:8001`)

### Les tests nécessitant un token échouent

- Vérifier que le token est valide et non expiré
- Se reconnecter si nécessaire

## 📝 Notes

- Le script teste uniquement les **messages d'erreur**, pas la fonctionnalité complète
- Certains tests peuvent nécessiter des données spécifiques en base
- Les tests sont conçus pour être exécutés en environnement de développement

## 🎯 Prochaines Étapes

Après avoir validé les messages d'erreur :

1. ✅ Vérifier que les messages sont cohérents entre web et mobile
2. ✅ Tester les messages dans l'interface utilisateur réelle
3. ✅ Vérifier que les logs contiennent bien les détails techniques (pour le debugging)
