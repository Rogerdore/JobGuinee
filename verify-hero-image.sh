#!/bin/bash

# Script de vérification de l'image Hero
# Ce script vérifie que tout est en place pour le déploiement

echo "🔍 Vérification de l'image Hero..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUCCESS=0
ERRORS=0

# Fonction de vérification
check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "${RED}✗${NC} $2"
        ERRORS=$((ERRORS + 1))
    fi
}

# 1. Vérifier que le fichier source existe
if [ -f "public/assets/hero/image_hero.gif" ]; then
    SIZE=$(ls -lh public/assets/hero/image_hero.gif | awk '{print $5}')
    check 0 "Fichier source existe (public/assets/hero/image_hero.gif) - Taille: $SIZE"
else
    check 1 "Fichier source manquant (public/assets/hero/image_hero.gif)"
fi

# 2. Vérifier que c'est bien un GIF
if [ -f "public/assets/hero/image_hero.gif" ]; then
    if file public/assets/hero/image_hero.gif | grep -q "GIF"; then
        check 0 "Le fichier est bien un GIF valide"
    else
        check 1 "Le fichier n'est pas un GIF valide"
    fi
fi

# 3. Vérifier que le fichier n'est pas trop petit (placeholder)
if [ -f "public/assets/hero/image_hero.gif" ]; then
    SIZE_BYTES=$(stat -f%z "public/assets/hero/image_hero.gif" 2>/dev/null || stat -c%s "public/assets/hero/image_hero.gif" 2>/dev/null)
    if [ "$SIZE_BYTES" -gt 1000 ]; then
        check 0 "La taille du fichier est correcte (> 1KB)"
    else
        check 1 "Le fichier est trop petit (probablement un placeholder)"
    fi
fi

# 4. Vérifier le code
if grep -q "url('/assets/hero/image_hero.gif')" src/pages/Home.tsx; then
    check 0 "Le code utilise le bon chemin (/assets/hero/image_hero.gif)"
else
    check 1 "Le code n'utilise pas le bon chemin"
fi

# 5. Vérifier que dist existe
if [ -d "dist" ]; then
    check 0 "Le dossier dist existe"

    # 6. Vérifier que l'image est dans dist
    if [ -f "dist/assets/hero/image_hero.gif" ]; then
        DIST_SIZE=$(ls -lh dist/assets/hero/image_hero.gif | awk '{print $5}')
        check 0 "Image copiée dans dist (dist/assets/hero/image_hero.gif) - Taille: $DIST_SIZE"
    else
        check 1 "Image manquante dans dist - Relancez: npm run build"
    fi
else
    check 1 "Le dossier dist n'existe pas - Lancez: npm run build"
fi

# 7. Vérifier que test-hero.html existe
if [ -f "dist/test-hero.html" ]; then
    check 0 "Fichier de test créé (dist/test-hero.html)"
else
    check 1 "Fichier de test manquant"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Résultat: ${GREEN}${SUCCESS} succès${NC} - ${RED}${ERRORS} erreurs${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Tout est prêt pour le déploiement !${NC}"
    echo ""
    echo "📦 Prochaines étapes:"
    echo "1. Déployez le dossier 'dist/' vers votre serveur"
    echo "2. Testez avec: https://votre-domaine.com/test-hero.html"
    echo "3. Vérifiez la page d'accueil: https://votre-domaine.com"
    echo ""
    echo "📚 Consultez DEPLOIEMENT_HERO_IMAGE.md pour plus de détails"
else
    echo -e "${RED}⚠ Il y a des erreurs à corriger${NC}"
    echo ""
    if [ ! -d "dist" ]; then
        echo "→ Lancez: npm run build"
    fi
fi

exit $ERRORS
