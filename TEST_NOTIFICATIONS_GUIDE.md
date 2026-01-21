# Guide de Test des Notifications Push

Ce guide explique comment utiliser les outils de test automatisés pour tester toutes les notifications push de l'application.

## 🎯 Objectif

Tester rapidement toutes les notifications push sans avoir à créer manuellement des prises, équipes, compétitions, etc.

## 🛠️ Méthodes de Test

### Méthode 1 : Interface Web (Recommandée)

1. **Accéder à la page de test** :
   - URL : `http://localhost:3000/test-notifications` (ou votre URL frontend)
   - ⚠️ **Vous devez être connecté en tant qu'administrateur**

2. **Utiliser l'interface** :
   - Optionnel : Spécifier un ID utilisateur cible (sinon, les notifications seront envoyées à votre compte)
   - Cliquer sur "📤 Envoyer toutes les notifications" pour tester toutes les notifications d'un coup
   - Ou cliquer sur un type spécifique pour tester une seule notification

3. **Vérifier sur mobile** :
   - Vérifiez que votre téléphone reçoit bien les notifications
   - Testez avec l'app en foreground, background, et fermée
   - Vérifiez que les notifications respectent les préférences utilisateur

### Méthode 2 : Script Bash

1. **Obtenir un token JWT** :
   ```bash
   # Se connecter via l'API et récupérer le token
   curl -X POST http://localhost:8001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"password"}' \
     | jq -r '.token'
   ```

2. **Exporter le token** :
   ```bash
   export TOKEN="votre_token_jwt_ici"
   export API_URL="http://localhost:8001"  # Optionnel, par défaut localhost:8001
   ```

3. **Utiliser le script** :
   ```bash
   # Envoyer toutes les notifications
   cd backend/scripts
   ./test-notifications.sh all

   # Envoyer une notification spécifique
   ./test-notifications.sh catch_validated

   # Envoyer à un utilisateur spécifique
   ./test-notifications.sh catch_validated 2
   ```

### Méthode 3 : API Directe (cURL)

1. **Obtenir un token JWT** (voir méthode 2)

2. **Envoyer une notification** :
   ```bash
   curl -X POST http://localhost:8001/api/test/notifications/send \
     -H "Authorization: Bearer VOTRE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"type": "catch_validated"}'
   ```

3. **Envoyer toutes les notifications** :
   ```bash
   curl -X POST http://localhost:8001/api/test/notifications/send-all \
     -H "Authorization: Bearer VOTRE_TOKEN" \
     -H "Content-Type: application/json"
   ```

## 📋 Types de Notifications Disponibles

| Type | Description | Méthode de test |
|------|-------------|-----------------|
| `catch_validated` | Prise validée | ✅ Test disponible |
| `catch_rejected` | Prise rejetée | ✅ Test disponible |
| `team_invitation` | Invitation d'équipe | ✅ Test disponible |
| `competition_registered` | Inscription compétition | ✅ Test disponible |
| `competition_started` | Compétition démarrée | ✅ Test disponible |
| `competition_ended` | Compétition terminée | ✅ Test disponible |
| `competition_paused` | Compétition en pause | ✅ Test disponible |
| `competition_resumed` | Compétition reprise | ✅ Test disponible |
| `catch_pending` | Nouvelle prise en attente (admin) | ✅ Test disponible |

## ✅ Checklist de Test Rapide

Utilisez ces outils pour cocher rapidement les tests dans `TESTS_CHECKLIST.md` :

### Configuration de base
- [ ] L'app mobile demande bien les permissions ✅ (déjà testé)
- [ ] Le token Expo Push est bien enregistré ✅ (déjà testé)
- [ ] Les préférences de notification sont accessibles ✅ (déjà testé)
- [ ] Les préférences sont bien sauvegardées ✅ (déjà testé)

### Tests avec les outils automatisés

1. **Tester toutes les notifications d'un coup** :
   - Utiliser "Envoyer toutes les notifications" dans l'interface web
   - Vérifier que toutes les notifications arrivent sur mobile
   - ✅ Cocher dans la checklist

2. **Tester chaque type individuellement** :
   - Cliquer sur chaque type dans l'interface web
   - Vérifier la réception sur mobile
   - ✅ Cocher dans la checklist

3. **Tester avec préférences désactivées** :
   - Désactiver un type de notification dans les préférences
   - Envoyer la notification de test correspondante
   - Vérifier qu'elle n'arrive PAS
   - Réactiver et vérifier qu'elle arrive
   - ✅ Cocher dans la checklist

4. **Tester les notifications admin** :
   - Se connecter avec un compte admin
   - Envoyer la notification `catch_pending`
   - Vérifier la réception
   - ✅ Cocher dans la checklist

5. **Tester depuis différents réseaux** :
   - Wi-Fi : Utiliser les outils de test
   - 4G/5G : Utiliser les outils de test
   - ✅ Cocher dans la checklist

6. **Tester avec l'app dans différents états** :
   - Foreground : Envoyer une notification
   - Background : Minimiser l'app, envoyer une notification
   - Fermée : Kill l'app, envoyer une notification
   - ✅ Cocher dans la checklist

## 🔍 Vérifications Importantes

### Avant de tester
- ✅ L'app mobile est bien connectée et authentifiée
- ✅ Le token Expo Push est enregistré (vérifier dans les préférences)
- ✅ Les permissions de notification sont accordées sur le téléphone
- ✅ Le backend est accessible depuis le mobile (via ngrok)

### Pendant les tests
- ✅ Vérifier les logs du backend pour voir si les notifications sont envoyées
- ✅ Vérifier les logs Expo pour voir si les notifications sont reçues
- ✅ Vérifier que les notifications respectent les préférences utilisateur

### Après les tests
- ✅ Mettre à jour `TESTS_CHECKLIST.md` avec les résultats
- ✅ Noter les bugs éventuels dans la section dédiée

## 🐛 Dépannage

### Les notifications n'arrivent pas

1. **Vérifier le token Expo Push** :
   - Aller dans les préférences de notification
   - Vérifier que `expoPushToken` n'est pas null

2. **Vérifier les permissions** :
   - Vérifier que les permissions de notification sont accordées sur le téléphone
   - Réinstaller l'app si nécessaire

3. **Vérifier les préférences** :
   - Vérifier que le type de notification est activé dans les préférences

4. **Vérifier les logs** :
   - Vérifier les logs du backend (symfony console)
   - Vérifier les logs Expo dans la console du mobile

### Erreur 403 (Forbidden)

- Vérifier que vous êtes connecté en tant qu'administrateur
- Vérifier que le token JWT est valide

### Erreur 401 (Unauthorized)

- Vérifier que vous êtes bien connecté
- Vérifier que le token JWT n'a pas expiré
- Se reconnecter si nécessaire

## 📝 Notes

- Les notifications de test utilisent des données fictives (ID 999, noms de test)
- Les notifications de test sont réelles et seront stockées dans la base de données
- Vous pouvez supprimer les notifications de test depuis l'interface si nécessaire
- Les outils de test sont uniquement accessibles aux administrateurs
