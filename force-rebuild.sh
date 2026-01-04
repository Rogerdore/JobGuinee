#!/bin/bash

# Script de rebuild forcé avec cache bust
# Usage: ./force-rebuild.sh

echo "=========================================="
echo "Rebuild Forcé - Fix insertBefore"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Nettoyer complètement
echo -e "${YELLOW}1. Nettoyage complet...${NC}"
rm -rf dist/
rm -rf node_modules/.vite
echo -e "${GREEN}✓${NC} Nettoyage terminé"
echo ""

# 2. Rebuild
echo -e "${YELLOW}2. Rebuild de l'application...${NC}"
npm run build

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓${NC} Build réussi"
else
  echo -e "${RED}✗${NC} Build échoué"
  exit 1
fi
echo ""

# 3. Vérifications
echo -e "${YELLOW}3. Vérifications...${NC}"

# Vérifier modal-root
if grep -q 'id="modal-root"' dist/index.html; then
  echo -e "${GREEN}✓${NC} modal-root présent dans dist/index.html"
else
  echo -e "${RED}✗${NC} modal-root MANQUANT"
  exit 1
fi

# Vérifier .htaccess
if [ -f "dist/.htaccess" ]; then
  echo -e "${GREEN}✓${NC} .htaccess présent dans dist/"
else
  echo -e "${YELLOW}⚠${NC} .htaccess manquant"
fi

echo ""

# 4. Instructions de déploiement
echo "=========================================="
echo -e "${GREEN}Build prêt pour déploiement!${NC}"
echo "=========================================="
echo ""
echo "Options de déploiement:"
echo ""
echo "Option 1 - GitHub Actions (Automatique):"
echo "  git add ."
echo "  git commit -m 'Force rebuild - Fix insertBefore'"
echo "  git push origin main"
echo ""
echo "Option 2 - FTP Manuel:"
echo "  Uploadez TOUT le contenu de dist/ vers public_html/"
echo "  Activez 'Afficher fichiers cachés' pour .htaccess"
echo ""
echo "Option 3 - Script de déploiement:"
echo "  ./deploy-manual.sh"
echo ""
echo "=========================================="
echo "IMPORTANT APRÈS DÉPLOIEMENT:"
echo "=========================================="
echo ""
echo "1. Attendez 2-3 minutes (GitHub Actions)"
echo "2. Videz le cache Hostinger:"
echo "   Panel > Performance > Clear Cache"
echo "3. Videz le cache navigateur:"
echo "   Ctrl+Shift+Delete > Tout vider"
echo "4. Testez en mode incognito:"
echo "   Ctrl+Shift+N (Chrome)"
echo "5. Vérifiez le code source:"
echo "   Clic droit > Voir le code source"
echo "   Recherchez: <div id=\"modal-root\"></div>"
echo "6. Vérifiez la console (F12)"
echo ""
echo "=========================================="
