#!/bin/bash

# Script de vérification du fix insertBefore
# Usage : ./verify-portal-fix.sh

echo "=========================================="
echo "Vérification Fix insertBefore/Portal"
echo "=========================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# 1. Vérifier modal-root dans index.html source
echo "1. Vérification de index.html (source)"
if grep -q 'id="modal-root"' index.html; then
  echo -e "${GREEN}✓${NC} modal-root présent dans index.html"
else
  echo -e "${RED}✗${NC} modal-root MANQUANT dans index.html"
  ((ERRORS++))
fi
echo ""

# 2. Vérifier modal-root dans dist/index.html
echo "2. Vérification de dist/index.html (build)"
if [ -f "dist/index.html" ]; then
  if grep -q 'id="modal-root"' dist/index.html; then
    echo -e "${GREEN}✓${NC} modal-root présent dans dist/index.html"
  else
    echo -e "${RED}✗${NC} modal-root MANQUANT dans dist/index.html"
    echo "   Exécutez: npm run build"
    ((ERRORS++))
  fi
else
  echo -e "${RED}✗${NC} dist/index.html n'existe pas"
  echo "   Exécutez: npm run build"
  ((ERRORS++))
fi
echo ""

# 3. Vérifier ModernModal utilise createPortal
echo "3. Vérification de ModernModal.tsx"
if grep -q "createPortal" src/components/modals/ModernModal.tsx; then
  echo -e "${GREEN}✓${NC} ModernModal utilise createPortal"

  if grep -q "from 'react-dom'" src/components/modals/ModernModal.tsx; then
    echo -e "${GREEN}✓${NC} Import react-dom présent"
  else
    echo -e "${RED}✗${NC} Import react-dom MANQUANT"
    ((ERRORS++))
  fi
else
  echo -e "${RED}✗${NC} ModernModal n'utilise PAS createPortal"
  ((ERRORS++))
fi
echo ""

# 4. Vérifier que ModalPortal existe
echo "4. Vérification de ModalPortal.tsx"
if [ -f "src/components/common/ModalPortal.tsx" ]; then
  echo -e "${GREEN}✓${NC} ModalPortal.tsx existe"

  if grep -q "createPortal" src/components/common/ModalPortal.tsx; then
    echo -e "${GREEN}✓${NC} ModalPortal utilise createPortal"
  fi
else
  echo -e "${YELLOW}⚠${NC} ModalPortal.tsx non trouvé (optionnel)"
fi
echo ""

# 5. Vérifier .htaccess (pour le fix précédent)
echo "5. Vérification de .htaccess (bonus)"
if [ -f "dist/.htaccess" ]; then
  echo -e "${GREEN}✓${NC} .htaccess présent dans dist/"
else
  echo -e "${YELLOW}⚠${NC} .htaccess manquant (exécutez: npm run build)"
fi
echo ""

# 6. Rechercher d'autres modaux qui n'utilisent pas Portal
echo "6. Analyse des modaux sans Portal"
MODAL_COUNT=$(grep -r "className=\"fixed inset-0" src/components --include="*.tsx" | wc -l)
PORTAL_COUNT=$(grep -r "createPortal\|ModalPortal" src/components --include="*.tsx" | wc -l)

echo "   Modaux trouvés (fixed inset-0): $MODAL_COUNT"
echo "   Modaux utilisant Portal: $PORTAL_COUNT"

if [ $MODAL_COUNT -gt $PORTAL_COUNT ]; then
  DIFF=$((MODAL_COUNT - PORTAL_COUNT))
  echo -e "${YELLOW}⚠${NC} $DIFF modal(aux) pourrai(en)t bénéficier de Portal"
  echo "   Consultez FIX_INSERTBEFORE_ERROR.md pour la liste"
else
  echo -e "${GREEN}✓${NC} Tous les modaux principaux utilisent Portal"
fi
echo ""

# 7. Vérifier que le build est à jour
echo "7. Vérification de la fraîcheur du build"
if [ -d "dist" ]; then
  DIST_TIME=$(stat -c %Y dist/index.html 2>/dev/null || stat -f %m dist/index.html 2>/dev/null)
  SOURCE_TIME=$(stat -c %Y index.html 2>/dev/null || stat -f %m index.html 2>/dev/null)

  if [ "$DIST_TIME" -ge "$SOURCE_TIME" ]; then
    echo -e "${GREEN}✓${NC} Build est à jour"
  else
    echo -e "${YELLOW}⚠${NC} Build semble obsolète"
    echo "   Exécutez: npm run build"
  fi
fi
echo ""

# Résumé
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✓ TOUT EST OK - Fix insertBefore appliqué${NC}"
  echo ""
  echo "Prochaines étapes:"
  echo "1. Déployer sur Hostinger:"
  echo "   git add ."
  echo "   git commit -m 'Fix: insertBefore - React Portals'"
  echo "   git push origin main"
  echo ""
  echo "2. Vérifier en production:"
  echo "   - Ouvrir la console (F12)"
  echo "   - Tester les modaux"
  echo "   - Vérifier aucune erreur insertBefore"
else
  echo -e "${RED}✗ $ERRORS ERREUR(S) DÉTECTÉE(S)${NC}"
  echo ""
  echo "Actions requises:"
  echo "1. Corrigez les erreurs ci-dessus"
  echo "2. Exécutez: npm run build"
  echo "3. Relancez: ./verify-portal-fix.sh"
fi
echo "=========================================="
