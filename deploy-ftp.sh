#!/bin/bash

# Script de déploiement FTP automatique
# Nécessite lftp installé: sudo apt-get install lftp (Linux) ou brew install lftp (Mac)

set -e

echo "🚀 JobGuinee - Déploiement FTP Automatique"
echo "=========================================="
echo ""

# Vérifier que lftp est installé
if ! command -v lftp &> /dev/null; then
    echo "❌ lftp n'est pas installé"
    echo "Installation:"
    echo "  - Linux: sudo apt-get install lftp"
    echo "  - Mac: brew install lftp"
    exit 1
fi

# Charger les variables d'environnement
if [ ! -f ".env" ]; then
    echo "❌ Fichier .env non trouvé"
    exit 1
fi

source .env

# Vérifier que les variables FTP sont définies
if [ -z "$HOSTINGER_FTP_HOST" ] || [ -z "$HOSTINGER_FTP_USERNAME" ] || [ -z "$HOSTINGER_FTP_PASSWORD" ]; then
    echo "❌ Variables FTP manquantes dans .env"
    echo "Ajoutez:"
    echo "  HOSTINGER_FTP_HOST=votre_host"
    echo "  HOSTINGER_FTP_USERNAME=votre_username"
    echo "  HOSTINGER_FTP_PASSWORD=votre_password"
    exit 1
fi

# Build du projet
echo "📦 Building du projet..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build"
    exit 1
fi

echo "✅ Build réussi!"
echo ""

# Déploiement FTP
echo "🌐 Déploiement vers Hostinger..."
echo "Host: $HOSTINGER_FTP_HOST"
echo "User: $HOSTINGER_FTP_USERNAME"
echo ""

lftp -u "$HOSTINGER_FTP_USERNAME,$HOSTINGER_FTP_PASSWORD" "$HOSTINGER_FTP_HOST" <<EOF
set ssl:verify-certificate no
set ftp:ssl-allow no
cd public_html
mirror -R --delete --verbose dist/ ./
bye
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Déploiement réussi!"
    echo "🌐 Votre site est maintenant en ligne!"
else
    echo ""
    echo "❌ Erreur lors du déploiement FTP"
    exit 1
fi
