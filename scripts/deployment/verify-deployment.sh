#!/bin/bash

# JobGuinée - Script de vérification post-déploiement

set -e

echo "================================================"
echo "🔍 JobGuinée - Vérification du déploiement"
echo "================================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
SITE_URL="${SITE_URL:-https://jobguinee.com}"
MAX_RETRIES=3
RETRY_DELAY=5

# Fonction de log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction de test HTTP
test_url() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3

    log_info "Test: $description"
    echo "  URL: $url"

    local retry=0
    while [ $retry -lt $MAX_RETRIES ]; do
        status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 30 || echo "000")

        if [ "$status_code" = "$expected_status" ]; then
            echo -e "  ${GREEN}✓${NC} Status: $status_code"
            return 0
        else
            retry=$((retry + 1))
            if [ $retry -lt $MAX_RETRIES ]; then
                log_warn "Status: $status_code - Tentative $retry/$MAX_RETRIES"
                sleep $RETRY_DELAY
            fi
        fi
    done

    log_error "Status: $status_code (attendu: $expected_status)"
    return 1
}

# Tests de disponibilité
log_info "=== Tests de disponibilité ==="
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Page d'accueil
if test_url "$SITE_URL" 200 "Page d'accueil"; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 2: Vérification HTTPS
log_info "Test: Redirection HTTPS"
if curl -s -L -I "http://$(echo $SITE_URL | sed 's/https\?:\/\///')" | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
    echo -e "  ${GREEN}✓${NC} HTTPS actif"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_error "HTTPS non actif"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 3: Vérification des assets
log_info "Test: Chargement des assets statiques"
if curl -s "$SITE_URL" | grep -q "assets/"; then
    echo -e "  ${GREEN}✓${NC} Assets trouvés dans le HTML"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_warn "Assets non trouvés dans le HTML"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 4: Vérification de la configuration SPA
log_info "Test: Configuration SPA (404 -> index.html)"
if test_url "$SITE_URL/fake-route-test-12345" 200 "Fallback SPA"; then
    echo -e "  ${GREEN}✓${NC} Routing SPA fonctionnel"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_warn "Routing SPA potentiellement non configuré"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 5: Headers de sécurité
log_info "Test: Headers de sécurité"
headers=$(curl -s -I "$SITE_URL")

check_header() {
    local header=$1
    if echo "$headers" | grep -qi "$header"; then
        echo -e "  ${GREEN}✓${NC} $header présent"
        return 0
    else
        echo -e "  ${YELLOW}○${NC} $header absent"
        return 1
    fi
}

SECURITY_SCORE=0
check_header "X-Content-Type-Options" && SECURITY_SCORE=$((SECURITY_SCORE + 1))
check_header "X-Frame-Options" && SECURITY_SCORE=$((SECURITY_SCORE + 1))
check_header "X-XSS-Protection" && SECURITY_SCORE=$((SECURITY_SCORE + 1))

if [ $SECURITY_SCORE -ge 2 ]; then
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 6: Performance de base
log_info "Test: Temps de réponse"
response_time=$(curl -o /dev/null -s -w "%{time_total}" "$SITE_URL")
response_time_ms=$(echo "$response_time * 1000" | bc)

if (( $(echo "$response_time < 3" | bc -l) )); then
    echo -e "  ${GREEN}✓${NC} Temps de réponse: ${response_time_ms}ms (< 3s)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_warn "Temps de réponse: ${response_time_ms}ms (> 3s)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Résumé
echo "================================================"
log_info "RÉSUMÉ DES TESTS"
echo "================================================"
echo ""
echo "  Tests réussis: ${TESTS_PASSED}"
echo "  Tests échoués: ${TESTS_FAILED}"
echo "  Total: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    log_info "✅ Tous les tests sont passés avec succès!"
    echo ""
    log_info "Déploiement vérifié et fonctionnel"
    exit 0
elif [ $TESTS_FAILED -le 2 ]; then
    log_warn "⚠️ Certains tests ont échoué mais l'application semble fonctionnelle"
    echo ""
    log_warn "Veuillez vérifier les tests échoués"
    exit 0
else
    log_error "❌ Plusieurs tests ont échoué"
    echo ""
    log_error "Le déploiement pourrait avoir des problèmes"
    log_error "Veuillez investiguer immédiatement"
    exit 1
fi
