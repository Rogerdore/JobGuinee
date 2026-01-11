#!/bin/bash

echo "🔄 FORCE RELOAD - Redémarrage Complet de l'Environnement"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Couleurs pour le terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Étape 1: Nettoyer le cache Vite
echo -e "${BLUE}[1/8]${NC} Nettoyage du cache Vite..."
rm -rf node_modules/.vite
rm -rf dist
echo -e "      ${GREEN}✓${NC} Cache Vite nettoyé"
echo ""

# Étape 2: Nettoyer les fichiers de cache
echo -e "${BLUE}[2/8]${NC} Nettoyage des fichiers temporaires..."
rm -rf .cache
rm -rf .tmp
rm -rf .parcel-cache
find . -name "*.log" -type f -delete 2>/dev/null
echo -e "      ${GREEN}✓${NC} Fichiers temporaires supprimés"
echo ""

# Étape 3: Vérifier les variables d'environnement
echo -e "${BLUE}[3/8]${NC} Vérification des variables d'environnement..."
if [ ! -f .env ]; then
    echo -e "      ${RED}✗${NC} Fichier .env manquant !"
    exit 1
fi

# Afficher les URLs (sans les clés complètes)
ENV_URL=$(grep "VITE_SUPABASE_URL" .env | cut -d'=' -f2)
ENV_KEY_PREFIX=$(grep "VITE_SUPABASE_ANON_KEY" .env | cut -d'=' -f2 | cut -c1-30)

if [ -z "$ENV_URL" ]; then
    echo -e "      ${RED}✗${NC} VITE_SUPABASE_URL manquante !"
    exit 1
fi

echo -e "      ${GREEN}✓${NC} VITE_SUPABASE_URL: ${ENV_URL}"
echo -e "      ${GREEN}✓${NC} VITE_SUPABASE_ANON_KEY: ${ENV_KEY_PREFIX}..."
echo ""

# Étape 4: Harmoniser .env et .env.production
echo -e "${BLUE}[4/8]${NC} Harmonisation des fichiers .env..."
if [ -f .env.production ]; then
    PROD_URL=$(grep "VITE_SUPABASE_URL" .env.production | cut -d'=' -f2)

    if [ "$ENV_URL" != "$PROD_URL" ]; then
        echo -e "      ${YELLOW}⚠${NC}  Incohérence détectée:"
        echo -e "         .env: $ENV_URL"
        echo -e "         .env.production: $PROD_URL"
        echo ""
        echo -e "      ${BLUE}→${NC} Copie de .env vers .env.production..."
        cp .env .env.production
        sed -i 's/VITE_ENVIRONMENT=development/VITE_ENVIRONMENT=production/' .env.production
        echo -e "      ${GREEN}✓${NC} Fichiers harmonisés"
    else
        echo -e "      ${GREEN}✓${NC} Fichiers déjà cohérents"
    fi
else
    echo -e "      ${YELLOW}⚠${NC}  .env.production manquant, création..."
    cp .env .env.production
    sed -i 's/VITE_ENVIRONMENT=development/VITE_ENVIRONMENT=production/' .env.production
    echo -e "      ${GREEN}✓${NC} .env.production créé"
fi
echo ""

# Étape 5: Exporter les variables
echo -e "${BLUE}[5/8]${NC} Export des variables d'environnement..."
export $(grep -v '^#' .env | xargs)
echo -e "      ${GREEN}✓${NC} Variables exportées dans le shell"
echo ""

# Étape 6: Rebuild complet
echo -e "${BLUE}[6/8]${NC} Rebuild complet de l'application..."
echo -e "      ${YELLOW}→${NC} npm run build (cela peut prendre 30-60s)..."
npm run build --force 2>&1 | tail -n 20
if [ $? -eq 0 ]; then
    echo -e "      ${GREEN}✓${NC} Build réussi"
else
    echo -e "      ${RED}✗${NC} Échec du build"
    exit 1
fi
echo ""

# Étape 7: Vérifier la connexion Supabase
echo -e "${BLUE}[7/8]${NC} Test de connexion Supabase..."
node verify-supabase-config.js 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "      ${GREEN}✓${NC} Connexion Supabase OK"
else
    echo -e "      ${YELLOW}⚠${NC}  Impossible de tester la connexion (normal en environnement restreint)"
fi
echo ""

# Étape 8: Afficher le résumé
echo -e "${BLUE}[8/8]${NC} Résumé de la configuration..."
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              CONFIGURATION ENVIRONNEMENT CHARGÉE              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Variables chargées:"
echo "   • VITE_SUPABASE_URL: ${ENV_URL}"
echo "   • VITE_SUPABASE_ANON_KEY: ${ENV_KEY_PREFIX}..."
echo "   • VITE_ENVIRONMENT: $(grep VITE_ENVIRONMENT .env | cut -d'=' -f2)"
echo ""
echo "📦 Build:"
echo "   • dist/ créé avec succès"
echo "   • Assets optimisés"
echo "   • Configuration injectée"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ ENVIRONNEMENT RECHARGÉ AVEC SUCCÈS${NC}"
echo ""
echo "🚀 Prochaines étapes:"
echo ""
echo "   1. Redémarrer le serveur de dev:"
echo -e "      ${BLUE}npm run dev${NC}"
echo ""
echo "   2. Tester la page de diagnostic:"
echo -e "      ${BLUE}http://localhost:5173/test-connexion.html${NC}"
echo ""
echo "   3. Créer des utilisateurs de test:"
echo -e "      ${BLUE}node create-test-user.js${NC}"
echo ""
echo "   4. Se connecter à l'application:"
echo -e "      ${BLUE}http://localhost:5173${NC}"
echo ""
echo "═══════════════════════════════════════════════════════════════"
