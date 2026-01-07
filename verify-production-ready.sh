#!/bin/bash

# Script de vérification pré-déploiement JobGuinée
# Vérifie que l'application est prête pour la production

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Vérification Pré-Déploiement - JobGuinée"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Fonction pour afficher le statut
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        ((ERRORS++))
    fi
}

warn_status() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

info_status() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# 1. Vérifier que Node.js est installé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Environnement de développement"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    check_status 0 "Node.js installé : $NODE_VERSION"
else
    check_status 1 "Node.js n'est pas installé"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    check_status 0 "npm installé : $NPM_VERSION"
else
    check_status 1 "npm n'est pas installé"
fi

echo ""

# 2. Vérifier les fichiers critiques
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Fichiers critiques"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Vérifier les fichiers critiques modifiés
FILES=(
    "src/utils/envValidator.ts"
    "src/lib/supabase.ts"
    "src/components/ErrorBoundary.tsx"
    "src/App.tsx"
    "src/pages/Jobs.tsx"
    "src/components/common/ShareJobModal.tsx"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        check_status 0 "$file existe"
    else
        check_status 1 "$file manquant"
    fi
done

echo ""

# 3. Vérifier le fichier .env
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Configuration d'environnement"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env" ]; then
    check_status 0 "Fichier .env existe"

    # Vérifier les variables critiques
    if grep -q "VITE_SUPABASE_URL=" .env; then
        URL_VALUE=$(grep "VITE_SUPABASE_URL=" .env | cut -d '=' -f2)
        if [ -n "$URL_VALUE" ] && [ "$URL_VALUE" != "your-project-ref" ]; then
            check_status 0 "VITE_SUPABASE_URL configurée"
        else
            warn_status "VITE_SUPABASE_URL n'est pas configurée correctement"
        fi
    else
        warn_status "VITE_SUPABASE_URL manquante dans .env"
    fi

    if grep -q "VITE_SUPABASE_ANON_KEY=" .env; then
        KEY_VALUE=$(grep "VITE_SUPABASE_ANON_KEY=" .env | cut -d '=' -f2)
        if [ -n "$KEY_VALUE" ] && [ "$KEY_VALUE" != "your-anon-key" ]; then
            check_status 0 "VITE_SUPABASE_ANON_KEY configurée"
        else
            warn_status "VITE_SUPABASE_ANON_KEY n'est pas configurée correctement"
        fi
    else
        warn_status "VITE_SUPABASE_ANON_KEY manquante dans .env"
    fi
else
    warn_status "Fichier .env n'existe pas (OK si variables en production)"
fi

echo ""

# 4. Vérifier le build
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Build de production"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "dist" ]; then
    check_status 0 "Dossier dist/ existe"

    # Vérifier les fichiers essentiels
    if [ -f "dist/index.html" ]; then
        check_status 0 "dist/index.html existe"
    else
        check_status 1 "dist/index.html manquant"
    fi

    # Compter les fichiers
    FILE_COUNT=$(find dist -type f | wc -l)
    if [ $FILE_COUNT -gt 100 ]; then
        check_status 0 "Build contient $FILE_COUNT fichiers"
    else
        warn_status "Build contient seulement $FILE_COUNT fichiers (attendu: 250+)"
    fi

    # Vérifier la taille du build
    BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    info_status "Taille du build : $BUILD_SIZE"
else
    check_status 1 "Dossier dist/ n'existe pas - Exécutez 'npm run build'"
fi

echo ""

# 5. Vérifier node_modules
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  Dépendances"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "node_modules" ]; then
    check_status 0 "node_modules/ existe"

    # Vérifier quelques packages critiques
    PACKAGES=("react" "react-dom" "@supabase/supabase-js" "lucide-react")
    for pkg in "${PACKAGES[@]}"; do
        if [ -d "node_modules/$pkg" ]; then
            check_status 0 "Package $pkg installé"
        else
            check_status 1 "Package $pkg manquant"
        fi
    done
else
    check_status 1 "node_modules/ n'existe pas - Exécutez 'npm install'"
fi

echo ""

# 6. Vérifier Git (optionnel)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  Contrôle de version (optionnel)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v git &> /dev/null; then
    check_status 0 "Git installé"

    if git rev-parse --git-dir > /dev/null 2>&1; then
        BRANCH=$(git branch --show-current 2>/dev/null)
        info_status "Branche actuelle : $BRANCH"

        # Vérifier s'il y a des changements non commités
        if git diff-index --quiet HEAD -- 2>/dev/null; then
            info_status "Pas de changements non commités"
        else
            warn_status "Il y a des changements non commités"
        fi
    fi
else
    info_status "Git n'est pas installé (optionnel)"
fi

echo ""

# Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Résumé"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Aucune erreur détectée${NC}"
else
    echo -e "${RED}❌ $ERRORS erreur(s) détectée(s)${NC}"
fi

if [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Aucun avertissement${NC}"
else
    echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s)${NC}"
fi

echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 L'application est prête pour le déploiement !${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Pour déployer :"
    echo "  • Via GitHub Actions : git push origin main"
    echo "  • Manuellement : Uploadez le contenu de dist/ via FTP"
    echo ""
    echo "Consultez DEPLOIEMENT_IMMEDIAT.md pour plus de détails"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}⚠️  Veuillez corriger les erreurs avant de déployer${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
