#!/bin/bash

# Script de déploiement simplifié JobGuinee
# Usage: ./deploy-simple.sh

set -e

echo ""
echo "🚀 JobGuinee - Déploiement en Production"
echo "========================================"
echo ""

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Étape 1: Clean
echo "🧹 Nettoyage des anciens fichiers..."
rm -rf dist/
echo "✅ Nettoyage terminé"
echo ""

# Étape 2: Build
echo "📦 Compilation du projet..."
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ ERREUR lors de la compilation"
    echo "Corrigez les erreurs ci-dessus et réessayez"
    exit 1
fi

echo ""
echo "✅ Compilation réussie!"
echo ""

# Vérifier que dist/ contient les fichiers
if [ ! -f "dist/index.html" ]; then
    echo "❌ Le fichier dist/index.html n'existe pas"
    exit 1
fi

if [ ! -d "dist/assets" ]; then
    echo "❌ Le dossier dist/assets n'existe pas"
    exit 1
fi

echo "✅ Fichiers générés correctement"
echo ""
echo "📁 Contenu de dist/ :"
ls -lh dist/ | grep -v "^total" | head -20
echo ""

# Vérifier la taille du build
DIST_SIZE=$(du -sh dist/ | cut -f1)
echo "📊 Taille totale du build: $DIST_SIZE"
echo ""

# Instructions de déploiement
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ BUILD TERMINÉ AVEC SUCCÈS !"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📤 PROCHAINES ÉTAPES POUR DÉPLOYER :"
echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  Option 1: Déploiement FTP Automatique │"
echo "└─────────────────────────────────────────┘"
echo ""
echo "  Si vous avez configuré .env avec vos credentials FTP :"
echo "  $ ./deploy-ftp.sh"
echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  Option 2: Déploiement FTP Manuel      │"
echo "└─────────────────────────────────────────┘"
echo ""
echo "  1. Ouvrez FileZilla (ou votre client FTP)"
echo "  2. Connectez-vous à votre serveur"
echo "  3. Naviguez vers public_html/"
echo "  4. SUPPRIMEZ tout le contenu de public_html/"
echo "  5. Uploadez TOUT le contenu de dist/ vers public_html/"
echo "  6. Attendez la fin de l'upload"
echo ""
echo "┌─────────────────────────────────────────┐"
echo "│  Option 3: Déploiement via cPanel      │"
echo "└─────────────────────────────────────────┘"
echo ""
echo "  1. Connectez-vous à votre cPanel Hostinger"
echo "  2. Ouvrez 'Gestionnaire de fichiers'"
echo "  3. Allez dans public_html/"
echo "  4. Supprimez tout le contenu existant"
echo "  5. Compressez le dossier dist/ en .zip :"
echo "     $ cd dist && zip -r ../jobguinee-prod.zip . && cd .."
echo "  6. Uploadez jobguinee-prod.zip via cPanel"
echo "  7. Extrayez le .zip dans public_html/"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT APRÈS LE DÉPLOIEMENT :"
echo ""
echo "  1. Videz le cache de votre navigateur :"
echo "     • Windows/Linux: Ctrl + Shift + R"
echo "     • Mac: Cmd + Shift + R"
echo ""
echo "  2. Testez en navigation privée"
echo ""
echo "  3. Si vous ne voyez toujours pas les changements :"
echo "     • Attendez 2-5 minutes (propagation DNS)"
echo "     • Vérifiez que tous les fichiers sont uploadés"
echo "     • Vérifiez les permissions (fichiers: 644, dossiers: 755)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Pour plus d'aide, consultez : GUIDE_DEPLOIEMENT_PRODUCTION.md"
echo ""
