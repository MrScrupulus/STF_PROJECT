#!/bin/bash

# Démarrer le serveur Symfony sur toutes les interfaces
cd /var/www/html

# Créer les répertoires nécessaires s'ils n'existent pas
mkdir -p var/cache
mkdir -p var/log
mkdir -p var/sessions

# Corriger les permissions
chmod -R 777 var/

# Attendre que la base de données soit prête
echo "En attente de la base de données..."
while ! nc -z database 3306; do
  sleep 1
done
echo "Base de données prête!"

# Démarrer PHP-FPM en arrière-plan
php-fpm -D

# Démarrer Nginx en premier plan
nginx -g 'daemon off;'

