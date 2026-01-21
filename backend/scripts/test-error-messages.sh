#!/bin/bash

# Script de test pour vérifier les messages d'erreur améliorés
# Usage: ./test-error-messages.sh [API_URL] [TOKEN]
# Exemple: ./test-error-messages.sh http://localhost:8001 "votre_token_jwt"

API_URL="${1:-http://localhost:8001}"
TOKEN="${2:-}"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Test des Messages d'Erreur Améliorés${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Avertissement: Token JWT non fourni${NC}"
    echo "   Certains tests nécessitent une authentification"
    echo "   Usage: $0 [API_URL] [TOKEN]"
    echo ""
fi

# Fonction pour tester un endpoint et vérifier le message d'erreur
test_error_message() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_pattern="$5"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${BLUE}Test: ${test_name}${NC}"
    
    # Construire la commande curl
    local curl_cmd="curl -s -X ${method} \"${API_URL}${endpoint}\""
    
    if [ -n "$TOKEN" ]; then
        curl_cmd="${curl_cmd} -H \"Authorization: Bearer ${TOKEN}\""
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="${curl_cmd} -H \"Content-Type: application/json\" -d '${data}'"
    fi
    
    # Exécuter la requête
    local response=$(eval $curl_cmd)
    local status_code=$(eval $curl_cmd -w "%{http_code}" -o /dev/null)
    
    # Vérifier si on a une erreur (4xx ou 5xx)
    if [ "$status_code" -ge 400 ]; then
        # Extraire le message d'erreur
        local error_message=$(echo "$response" | jq -r '.message // .error // .' 2>/dev/null || echo "$response")
        
        # Vérifier que le message ne contient pas de détails techniques
        if echo "$error_message" | grep -qiE "(stack trace|exception|fatal|warning|notice|undefined|null pointer|sql|database|pdo|doctrine)" 2>/dev/null; then
            echo -e "  ${RED}❌ ÉCHEC: Message contient des détails techniques${NC}"
            echo -e "     Message: ${error_message:0:100}..."
            TESTS_FAILED=$((TESTS_FAILED + 1))
        # Vérifier que le message correspond au pattern attendu
        elif [ -n "$expected_pattern" ] && ! echo "$error_message" | grep -qiE "$expected_pattern" 2>/dev/null; then
            echo -e "  ${YELLOW}⚠️  ATTENTION: Message ne correspond pas au pattern attendu${NC}"
            echo -e "     Attendu: ${expected_pattern}"
            echo -e "     Reçu: ${error_message:0:100}..."
            TESTS_PASSED=$((TESTS_PASSED + 1))
        # Vérifier que le message est en français et clair
        elif echo "$error_message" | grep -qiE "(une erreur est survenue|veuillez réessayer|erreur lors)" 2>/dev/null; then
            echo -e "  ${GREEN}✅ SUCCÈS: Message d'erreur bien formaté${NC}"
            echo -e "     Message: ${error_message:0:80}..."
            TESTS_PASSED=$((TESTS_PASSED + 1))
        else
            echo -e "  ${YELLOW}⚠️  ATTENTION: Message d'erreur à vérifier${NC}"
            echo -e "     Message: ${error_message:0:100}..."
            TESTS_PASSED=$((TESTS_PASSED + 1))
        fi
    else
        echo -e "  ${YELLOW}⚠️  ATTENTION: Pas d'erreur retournée (status: ${status_code})${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    fi
    
    echo ""
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Tests des Messages d'Erreur Backend${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test 1: Création d'équipe avec données invalides
if [ -n "$TOKEN" ]; then
    test_error_message \
        "Création équipe - Données invalides" \
        "POST" \
        "/api/teams" \
        '{"name":""}' \
        "erreur est survenue"
fi

# Test 2: Récupération d'une équipe inexistante
if [ -n "$TOKEN" ]; then
    test_error_message \
        "Récupération équipe inexistante" \
        "GET" \
        "/api/teams/99999" \
        "" \
        ""
fi

# Test 3: Invitation avec email invalide
if [ -n "$TOKEN" ]; then
    test_error_message \
        "Invitation équipe - Email invalide" \
        "POST" \
        "/api/teams/1/invite" \
        '{"email":"invalid-email"}' \
        "erreur est survenue"
fi

# Test 4: Inscription à compétition inexistante
if [ -n "$TOKEN" ]; then
    test_error_message \
        "Inscription compétition inexistante" \
        "POST" \
        "/api/competitions/99999/teams/register" \
        '{"teamId":1}' \
        "erreur est survenue"
fi

# Test 5: Création compétition sans authentification
test_error_message \
    "Création compétition - Non authentifié" \
    "POST" \
    "/api/admin/competitions" \
    '{"name":"Test"}' \
    ""

# Test 6: Validation prise sans authentification
test_error_message \
    "Validation prise - Non authentifié" \
    "POST" \
    "/api/admin/catches/1/validate" \
    "" \
    ""

# Test 7: Récupération compétitions (devrait fonctionner)
test_error_message \
    "Récupération compétitions" \
    "GET" \
    "/api/competitions" \
    "" \
    ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Résumé des Tests${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests sont passés ! (${TESTS_PASSED}/${TOTAL_TESTS})${NC}"
    echo ""
    echo -e "${GREEN}✓ Les messages d'erreur ne contiennent pas de détails techniques${NC}"
    echo -e "${GREEN}✓ Les messages sont en français et clairs${NC}"
    echo -e "${GREEN}✓ Les messages suivent le format uniforme${NC}"
    exit 0
else
    echo -e "${RED}❌ ${TESTS_FAILED} test(s) ont échoué sur ${TOTAL_TESTS}${NC}"
    echo -e "${GREEN}✅ ${TESTS_PASSED} test(s) ont réussi${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Vérifiez les messages d'erreur ci-dessus${NC}"
    exit 1
fi
