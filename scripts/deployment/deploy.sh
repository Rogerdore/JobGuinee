#!/bin/bash

# JobGuinée - Script de déploiement Hostinger
# Ce script est exécuté automatiquement par GitHub Actions

set -e

echo "================================================"
echo "🚀 JobGuinée - Déploiement Production"
echo "================================================"
echo ""

# Variables
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="backups/backup_${TIMESTAMP}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Fonction de log
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Étape 1: Vérification de l'environnement
log_info "Vérification de l'environnement..."

if [ ! -d "dist" ]; then
    log_error "Le dossier 'dist' n'existe pas. Veuillez exécuter 'npm run build' d'abord."
    exit 1
fi

log_info "✓ Dossier dist trouvé"

# Étape 2: Vérification des variables d'environnement
log_info "Vérification des variables d'environnement..."

REQUIRED_VARS=(
    "FTP_HOST"
    "FTP_USERNAME"
    "FTP_PASSWORD"
    "FTP_SERVER_DIR"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        log_error "Variable d'environnement manquante: $var"
        exit 1
    fi
done

log_info "✓ Toutes les variables d'environnement sont présentes"

# Étape 3: Créer un fichier .htaccess pour SPA
log_info "Création du fichier .htaccess pour SPA..."

cat > dist/.htaccess << 'EOF'
# JobGuinée - Configuration Apache pour SPA

# Enable rewrite engine
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Redirect HTTP to HTTPS
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Handle SPA routing
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ /index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache control
<IfModule mod_expires.c>
    ExpiresActive On

    # Images
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"

    # CSS and JavaScript
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"

    # HTML
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# Prevent directory listing
Options -Indexes

# Error pages
ErrorDocument 404 /index.html
EOF

log_info "✓ Fichier .htaccess créé"

# Étape 4: Vérification de sécurité
log_info "Vérification de sécurité..."

if grep -r "sk-" dist/ 2>/dev/null || grep -r "SUPABASE_SERVICE_ROLE_KEY" dist/ 2>/dev/null; then
    log_error "⚠️ ATTENTION: Des secrets potentiels ont été trouvés dans le build!"
    log_error "Déploiement annulé pour des raisons de sécurité."
    exit 1
fi

log_info "✓ Aucun secret exposé détecté"

# Étape 5: Statistiques du build
log_info "Statistiques du build:"
echo "  - Taille totale: $(du -sh dist/ | cut -f1)"
echo "  - Nombre de fichiers: $(find dist/ -type f | wc -l)"
echo "  - Assets principaux:"
du -h dist/assets/*.js 2>/dev/null | head -5 || echo "    Aucun fichier JS trouvé"

# Étape 6: Information de déploiement
echo ""
log_info "Prêt pour le déploiement"
echo "  - Host: ${FTP_HOST}"
echo "  - User: ${FTP_USERNAME}"
echo "  - Destination: ${FTP_SERVER_DIR}"
echo ""

log_info "✅ Toutes les vérifications sont passées"
log_info "Le déploiement FTP sera effectué par GitHub Actions"

exit 0
