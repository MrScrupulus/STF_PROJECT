#!/bin/bash

# Script pour exécuter la commande de traitement des pauses programmées
# Ce script sera exécuté toutes les minutes par cron

cd /var/www/html

# Exécuter la commande Symfony
php bin/console app:process-scheduled-pauses
