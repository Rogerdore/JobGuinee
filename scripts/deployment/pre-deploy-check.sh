#!/bin/bash

# JobGuinée - Script de vérification pré-déploiement
# Vérifie que l'environnement est prêt avant le déploiement

set -e

echo "================================================"
echo "🔍 JobGuinée - Vérification Pré-Déploiement"
echo "================================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Compteurs
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Fonction de log
log_info() {
    echo -e "${GREEN}[✓]${NC} $1"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
}

log_section() {
    echo ""
    echo -e "${BLUE}==>${NC} $1"
    echo ""
}

# Vérification 1: Node.js et npm
log_section "1. Vérification de l'environnement Node.js"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    log_info "Node.js installé: $NODE_VERSION"
else
    log_error "Node.js n'est pas installé"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    log_info "npm installé: $NPM_VERSION"
else
    log_error "npm n'est pas installé"
fi

# Vérification 2: Dependencies
log_section "2. Vérification des dépendances"

if [ -f "package.json" ]; then
    log_info "package.json trouvé"
else
    log_error "package.json manquant"
fi

if [ -f "package-lock.json" ]; then
    log_info "package-lock.json trouvé"
else
    log_warn "package-lock.json manquant (recommandé)"
fi

if [ -d "node_modules" ]; then
    MODULE_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
    log_info "node_modules présent ($MODULE_COUNT packages)"
else
    log_warn "node_modules manquant - exécutez 'npm install'"
fi

# Vérification 3: Configuration
log_section "3. Vérification de la configuration"

if [ -f ".env" ]; then
    log_info ".env trouvé"

    # Vérifier les variables critiques
    if grep -q "VITE_SUPABASE_URL" .env && grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        log_info "Variables Supabase présentes"
    else
        log_error "Variables Supabase manquantes dans .env"
    fi
else
    log_warn ".env manquant - utiliser .env.example comme référence"
fi

if [ -f ".env.example" ]; then
    log_info ".env.example présent"
else
    log_warn ".env.example manquant"
fi

if [ -f "vite.config.ts" ]; then
    log_info "vite.config.ts présent"
else
    log_error "vite.config.ts manquant"
fi

# Vérification 4: Structure du projet
log_section "4. Vérification de la structure du projet"

REQUIRED_DIRS=(
    "src"
    "src/components"
    "src/pages"
    "src/services"
    "public"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        log_info "Dossier $dir présent"
    else
        log_error "Dossier $dir manquant"
    fi
done

REQUIRED_FILES=(
    "src/main.tsx"
    "src/App.tsx"
    "index.html"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_info "Fichier $file présent"
    else
        log_error "Fichier $file manquant"
    fi
done

# Vérification 5: Sécurité
log_section "5. Vérification de sécurité"

# Vérifier que .env est dans .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "^\.env$" .gitignore; then
        log_info ".env est dans .gitignore"
    else
        log_error ".env n'est PAS dans .gitignore - CRITIQUE"
    fi
else
    log_error ".gitignore manquant"
fi

# Vérifier qu'il n'y a pas de secrets dans le code
if grep -r "sk-" src/ 2>/dev/null | grep -v "placeholder\|example" | head -1; then
    log_error "Potentiel secret OpenAI détecté dans le code source"
else
    log_info "Pas de secret OpenAI détecté dans src/"
fi

if grep -r "SUPABASE_SERVICE_ROLE_KEY" src/ 2>/dev/null | head -1; then
    log_error "Clé service Supabase détectée dans src/ - NE PAS UTILISER EN FRONTEND"
else
    log_info "Pas de clé service Supabase détectée dans src/"
fi

# Vérification 6: Build
log_section "6. Test de build"

echo "Tentative de build..."
if npm run build > /tmp/build.log 2>&1; then
    log_info "Build réussi"

    if [ -d "dist" ]; then
        DIST_SIZE=$(du -sh dist | cut -f1)
        log_info "Taille du build: $DIST_SIZE"

        FILE_COUNT=$(find dist -type f | wc -l)
        log_info "Nombre de fichiers: $FILE_COUNT"
    else
        log_error "Dossier dist non créé après build"
    fi
else
    log_error "Build échoué - voir /tmp/build.log"
    CHECKS_FAILED=$((CHECKS_FAILED + 10))
fi

# Vérification 7: TypeScript
log_section "7. Vérification TypeScript"

if [ -f "tsconfig.json" ]; then
    log_info "tsconfig.json présent"

    if npm run typecheck > /tmp/typecheck.log 2>&1; then
        log_info "Pas d'erreurs TypeScript critiques"
    else
        log_warn "Erreurs TypeScript détectées (voir /tmp/typecheck.log)"
    fi
else
    log_warn "tsconfig.json manquant"
fi

# Vérification 8: Git
log_section "8. Vérification Git"

if [ -d ".git" ]; then
    log_info "Repository Git initialisé"

    if git remote -v | grep -q "github.com"; then
        REMOTE_URL=$(git remote get-url origin)
        log_info "Remote GitHub configuré: $REMOTE_URL"
    else
        log_warn "Pas de remote GitHub configuré"
    fi

    # Vérifier les fichiers non commités
    UNCOMMITTED=$(git status --porcelain | wc -l)
    if [ "$UNCOMMITTED" -gt 0 ]; then
        log_warn "$UNCOMMITTED fichiers non commités"
    else
        log_info "Tous les fichiers sont commités"
    fi
else
    log_error "Pas de repository Git"
fi

# Vérification 9: Scripts npm
log_section "9. Vérification des scripts npm"

REQUIRED_SCRIPTS=(
    "dev"
    "build"
    "preview"
)

for script in "${REQUIRED_SCRIPTS[@]}"; do
    if grep -q "\"$script\":" package.json; then
        log_info "Script '$script' présent"
    else
        log_error "Script '$script' manquant"
    fi
done

# Vérification 10: Documentation
log_section "10. Vérification de la documentation"

if [ -f "README.md" ]; then
    log_info "README.md présent"
else
    log_warn "README.md manquant"
fi

if [ -d ".github/workflows" ]; then
    WORKFLOW_COUNT=$(find .github/workflows -name "*.yml" | wc -l)
    log_info "GitHub Actions configuré ($WORKFLOW_COUNT workflows)"
else
    log_warn "Pas de GitHub Actions configuré"
fi

# Résumé final
echo ""
echo "================================================"
echo "📊 RÉSUMÉ DES VÉRIFICATIONS"
echo "================================================"
echo ""
echo -e "${GREEN}Réussi:${NC}        $CHECKS_PASSED"
echo -e "${YELLOW}Avertissements:${NC} $CHECKS_WARNING"
echo -e "${RED}Échecs:${NC}        $CHECKS_FAILED"
echo ""
echo "Total de vérifications: $((CHECKS_PASSED + CHECKS_WARNING + CHECKS_FAILED))"
echo ""

# Décision finale
if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ PRÊT POUR LE DÉPLOIEMENT${NC}"
    echo ""
    log_info "Toutes les vérifications critiques sont passées"
    log_info "Vous pouvez procéder au déploiement"
    echo ""
    exit 0
elif [ $CHECKS_FAILED -le 2 ]; then
    echo -e "${YELLOW}⚠️  DÉPLOIEMENT AVEC PRÉCAUTION${NC}"
    echo ""
    log_warn "Quelques problèmes détectés mais non bloquants"
    log_warn "Recommandé de corriger avant le déploiement"
    echo ""
    exit 0
else
    echo -e "${RED}❌ NE PAS DÉPLOYER${NC}"
    echo ""
    log_error "Trop de problèmes détectés ($CHECKS_FAILED échecs)"
    log_error "Veuillez corriger les erreurs avant de déployer"
    echo ""
    echo "Logs disponibles:"
    echo "  - Build: /tmp/build.log"
    echo "  - TypeCheck: /tmp/typecheck.log"
    echo ""
    exit 1
fi
