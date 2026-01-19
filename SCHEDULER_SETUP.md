# Configuration du Scheduler pour les Pauses Programmées

## 📋 Vue d'ensemble

Le scheduler est un service Docker qui exécute automatiquement la commande `app:process-scheduled-pauses` toutes les minutes pour activer/désactiver les pauses programmées des compétitions.

## 🚀 Démarrage

Le scheduler démarre automatiquement avec Docker Compose :

```bash
docker-compose up -d
```

## 🔍 Vérification

### Vérifier que le scheduler fonctionne

```bash
# Voir les logs du scheduler
docker-compose logs scheduler

# Voir les logs en temps réel
docker-compose logs -f scheduler

# Vérifier le statut
docker-compose ps scheduler
```

### Tester manuellement la commande

```bash
# Depuis le conteneur backend
docker exec stf_backend php bin/console app:process-scheduled-pauses

# Ou depuis l'hôte (si PHP est installé)
cd backend && php bin/console app:process-scheduled-pauses
```

## ⚙️ Configuration

### Fréquence d'exécution

Par défaut, le scheduler exécute la commande **toutes les 60 secondes** (1 minute).

Pour modifier la fréquence, éditez `docker-compose.yml` et changez la valeur de `sleep` :

```yaml
# Exécution toutes les 30 secondes
sleep 30

# Exécution toutes les 5 minutes
sleep 300
```

### Arrêter/Démarrer le scheduler

```bash
# Arrêter
docker-compose stop scheduler

# Démarrer
docker-compose start scheduler

# Redémarrer
docker-compose restart scheduler
```

## 📊 Fonctionnement

1. **Toutes les minutes**, le scheduler exécute `app:process-scheduled-pauses`
2. La commande vérifie :
   - Les pauses qui doivent être **activées** (startDate <= maintenant <= endDate)
   - Les pauses qui doivent être **désactivées** (endDate < maintenant)
3. Pour chaque pause à activer :
   - Met `isPaused = true` sur la compétition
   - Envoie des notifications à tous les membres des équipes inscrites
4. Pour chaque pause à désactiver :
   - Vérifie s'il n'y a pas d'autres pauses actives
   - Met `isPaused = false` si aucune autre pause n'est active
   - Envoie des notifications de reprise

## 🐛 Dépannage

### Le scheduler ne démarre pas

```bash
# Vérifier les logs
docker-compose logs scheduler

# Vérifier que la base de données est accessible
docker exec stf_scheduler php bin/console dbal:run-sql "SELECT 1"
```

### Les pauses ne s'activent pas

1. Vérifier que les dates sont correctes dans la base de données
2. Vérifier que `isActive = true` pour les pauses programmées
3. Vérifier les logs du scheduler pour voir les erreurs éventuelles

### Modifier manuellement une pause

```bash
# Se connecter au conteneur
docker exec -it stf_backend bash

# Exécuter la commande manuellement
php bin/console app:process-scheduled-pauses
```

## 📝 Notes

- Le scheduler est **indépendant** du service backend
- Il partage les mêmes volumes et variables d'environnement
- Les erreurs dans le scheduler n'affectent pas le backend
- Le scheduler redémarre automatiquement en cas de crash (restart: unless-stopped)
