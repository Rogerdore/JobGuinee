#!/bin/bash

# =====================================================
# Script de Déploiement JobGuinee vers Hostinger
# =====================================================

echo "🚀 Début du déploiement JobGuinee..."
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Vérifier que .env existe
echo "📋 Vérification du fichier .env..."
if [ ! -f .env ]; then
    echo -e "${RED}❌ Erreur : Fichier .env introuvable${NC}"
    echo "Créez un fichier .env avec vos variables Supabase"
    exit 1
fi
echo -e "${GREEN}✅ Fichier .env trouvé${NC}"
echo ""

# 2. Vérifier les variables Supabase dans .env
echo "🔍 Vérification des variables Supabase..."
if ! grep -q "VITE_SUPABASE_URL" .env || ! grep -q "VITE_SUPABASE_ANON_KEY" .env; then
    echo -e "${YELLOW}⚠️  Attention : Variables Supabase manquantes dans .env${NC}"
    echo "Assurez-vous d'avoir :"
    echo "  - VITE_SUPABASE_URL=https://votre-projet.supabase.co"
    echo "  - VITE_SUPABASE_ANON_KEY=votre-clé-publique"
    echo ""
    read -p "Continuer quand même ? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ Variables Supabase configurées${NC}"
fi
echo ""

# 3. Installer les dépendances
echo "📦 Installation des dépendances npm..."
if ! npm install; then
    echo -e "${RED}❌ Erreur lors de l'installation des dépendances${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dépendances installées${NC}"
echo ""

# 4. Build du projet
echo "🔨 Build du projet en production..."
if ! npm run build; then
    echo -e "${RED}❌ Erreur lors du build${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build réussi${NC}"
echo ""

# 5. Vérifier que dist/ existe et contient des fichiers
echo "📂 Vérification du dossier dist/..."
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erreur : Dossier dist/ introuvable après build${NC}"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ Erreur : index.html manquant dans dist/${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dossier dist/ créé et valide${NC}"
echo ""

# 6. Afficher les fichiers buildés
echo "📋 Contenu du build :"
ls -lh dist/
echo ""

# 7. Vérifier si git est initialisé
echo "🔍 Vérification du dépôt git..."
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git non initialisé. Initialisation...${NC}"
    git init
    git branch -M main
    echo -e "${GREEN}✅ Git initialisé${NC}"
fi
echo ""

# 8. Vérifier si le remote existe
if ! git remote | grep -q "origin"; then
    echo -e "${YELLOW}⚠️  Remote 'origin' non configuré${NC}"
    read -p "Entrez l'URL de votre dépôt GitHub (ex: https://github.com/username/repo.git) : " repo_url
    git remote add origin "$repo_url"
    echo -e "${GREEN}✅ Remote ajouté${NC}"
fi
echo ""

# 9. Vérifier le statut git
echo "📊 Statut git :"
git status --short
echo ""

# 10. Demander confirmation avant commit
echo -e "${YELLOW}📤 Prêt à commiter et pousser vers GitHub${NC}"
read -p "Continuer ? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Déploiement annulé"
    exit 0
fi

# 11. Commit et push vers GitHub
echo "💾 Commit des changements..."
git add -A

# Demander un message de commit
echo ""
read -p "Message de commit (laisser vide pour message auto) : " commit_message
if [ -z "$commit_message" ]; then
    commit_message="Déploiement $(date '+%Y-%m-%d %H:%M:%S')"
fi

if ! git commit -m "$commit_message"; then
    echo -e "${YELLOW}⚠️  Rien à commiter ou erreur de commit${NC}"
fi
echo ""

echo "📤 Push vers GitHub..."
if ! git push -u origin main; then
    echo -e "${RED}❌ Erreur lors du push vers GitHub${NC}"
    echo "Vérifiez vos credentials et votre connexion"
    exit 1
fi
echo -e "${GREEN}✅ Push réussi vers GitHub${NC}"
echo ""

# 12. Créer un ZIP pour upload manuel (optionnel)
echo "📦 Création d'une archive ZIP pour Hostinger..."
if command -v zip &> /dev/null; then
    cd dist
    zip -r ../jobguinee-dist.zip . -q
    cd ..
    echo -e "${GREEN}✅ Archive créée : jobguinee-dist.zip${NC}"
    echo "   Taille : $(du -h jobguinee-dist.zip | cut -f1)"
else
    echo -e "${YELLOW}⚠️  Commande 'zip' non trouvée, archive non créée${NC}"
fi
echo ""

# 13. Messages finaux
echo -e "${GREEN}✅ ═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Déploiement terminé avec succès !${NC}"
echo -e "${GREEN}✅ ═══════════════════════════════════════${NC}"
echo ""
echo "📋 Prochaines étapes pour Hostinger :"
echo ""
echo "   Méthode 1 : Upload ZIP"
echo "   1. Connectez-vous à hPanel Hostinger"
echo "   2. Allez dans File Manager → public_html"
echo "   3. Uploadez jobguinee-dist.zip"
echo "   4. Extrayez l'archive dans public_html/"
echo ""
echo "   Méthode 2 : Téléchargement GitHub"
echo "   1. Allez sur : https://github.com/Rogerdore/JobGuinee"
echo "   2. Cliquez sur Code → Download ZIP"
echo "   3. Extrayez localement"
echo "   4. Uploadez le contenu de dist/ sur Hostinger"
echo ""
echo "⚠️  N'oubliez pas :"
echo "   - Créer le fichier .htaccess (voir DEPLOIEMENT_HOSTINGER.md)"
echo "   - Activer SSL/HTTPS"
echo "   - Vérifier que les fichiers sont dans public_html/ (pas dans un sous-dossier)"
echo ""
echo "📖 Documentation complète : DEPLOIEMENT_HOSTINGER.md"
echo ""
