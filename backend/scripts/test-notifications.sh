#!/bin/bash

# Script de test pour les notifications push
# Usage: ./test-notifications.sh [type] [userId]
# Exemples:
#   ./test-notifications.sh catch_validated
#   ./test-notifications.sh all
#   ./test-notifications.sh catch_validated 2

API_URL="${API_URL:-http://localhost:8001}"
TOKEN="${TOKEN:-}"  # Token JWT à définir

if [ -z "$TOKEN" ]; then
    echo "❌ Erreur: Variable TOKEN non définie"
    echo "   Exemple: export TOKEN='votre_token_jwt'"
    echo "   Pour obtenir un token, connectez-vous via l'API et récupérez le token"
    exit 1
fi

TYPE="${1:-all}"
USER_ID="${2:-}"

if [ "$TYPE" = "all" ]; then
    echo "📤 Envoi de toutes les notifications de test..."
    if [ -n "$USER_ID" ]; then
        curl -X POST "${API_URL}/api/test/notifications/send-all" \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json" \
            -d "{\"userId\": ${USER_ID}}" \
            | jq .
    else
        curl -X POST "${API_URL}/api/test/notifications/send-all" \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json" \
            | jq .
    fi
else
    echo "📤 Envoi de la notification de type: ${TYPE}"
    if [ -n "$USER_ID" ]; then
        curl -X POST "${API_URL}/api/test/notifications/send" \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json" \
            -d "{\"type\": \"${TYPE}\", \"userId\": ${USER_ID}}" \
            | jq .
    else
        curl -X POST "${API_URL}/api/test/notifications/send" \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json" \
            -d "{\"type\": \"${TYPE}\"}" \
            | jq .
    fi
fi
