#!/bin/bash

# Script pour créer un ZIP prêt à uploader en production

set -e

echo ""
echo "📦 Création du ZIP de production"
echo "================================="
echo ""

# Build du projet
echo "1️⃣  Compilation du projet..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la compilation"
    exit 1
fi

echo "✅ Compilation réussie"
echo ""

# Créer le ZIP
echo "2️⃣  Création du fichier ZIP..."
cd dist
zip -r ../jobguinee-production.zip . -x "*.DS_Store" -x "__MACOSX/*"
cd ..

if [ -f "jobguinee-production.zip" ]; then
    SIZE=$(du -sh jobguinee-production.zip | cut -f1)
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ ZIP CRÉÉ AVEC SUCCÈS !"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📦 Fichier: jobguinee-production.zip"
    echo "📊 Taille: $SIZE"
    echo ""
    echo "📤 ÉTAPES DE DÉPLOIEMENT :"
    echo ""
    echo "1. Connectez-vous à votre cPanel Hostinger"
    echo "2. Ouvrez 'Gestionnaire de fichiers'"
    echo "3. Naviguez vers public_html/"
    echo "4. SUPPRIMEZ tout le contenu de public_html/"
    echo "5. Cliquez sur 'Uploader' et uploadez jobguinee-production.zip"
    echo "6. Une fois uploadé, faites un clic droit → 'Extract'"
    echo "7. Supprimez le fichier .zip après extraction"
    echo ""
    echo "⚠️  N'oubliez pas de vider le cache : Ctrl+Shift+R"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "❌ Erreur lors de la création du ZIP"
    exit 1
fi
