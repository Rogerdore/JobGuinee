#!/bin/bash

# Script de déploiement manuel pour JobGuinee
# Ce script doit être exécuté depuis votre machine locale

set -e

echo "🚀 JobGuinee - Déploiement Manuel"
echo "=================================="
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# Étape 1: Build du projet
echo "📦 Étape 1/3: Building du projet..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build"
    exit 1
fi

echo "✅ Build réussi!"
echo ""

# Étape 2: Préparer les fichiers
echo "📁 Étape 2/3: Préparation des fichiers..."
cd dist

# Créer une archive pour le transfert
tar -czf ../jobguinee-dist.tar.gz .
cd ..

echo "✅ Archive créée: jobguinee-dist.tar.gz"
echo ""

# Étape 3: Instructions FTP
echo "🌐 Étape 3/3: Instructions de déploiement FTP"
echo ""
echo "Vous pouvez maintenant transférer les fichiers de deux façons:"
echo ""
echo "Option A - Via FileZilla (Recommandé):"
echo "  1. Ouvrez FileZilla"
echo "  2. Connectez-vous avec vos identifiants Hostinger"
echo "  3. Naviguez vers le dossier public_html/"
echo "  4. Uploadez TOUT le contenu du dossier 'dist/'"
echo ""
echo "Option B - Via FTP en ligne de commande:"
echo "  Utilisez la commande suivante (remplacez les variables):"
echo ""
echo "  lftp -u \$FTP_USERNAME,\$FTP_PASSWORD \$FTP_HOST <<EOF"
echo "  mirror -R dist/ public_html/"
echo "  bye"
echo "  EOF"
echo ""
echo "Option C - Via le File Manager Hostinger:"
echo "  1. Connectez-vous à votre panneau Hostinger"
echo "  2. Allez dans 'File Manager'"
echo "  3. Naviguez vers public_html/"
echo "  4. Uploadez le fichier jobguinee-dist.tar.gz"
echo "  5. Extrayez-le dans public_html/"
echo ""
echo "✅ Build prêt pour le déploiement!"
echo ""
echo "📊 Statistiques du build:"
du -sh dist/
echo ""
echo "📁 Fichiers dans dist/:"
ls -lh dist/ | head -20
