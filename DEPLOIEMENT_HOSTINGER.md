# 🚀 Guide Complet de Déploiement sur Hostinger

## 📋 Table des Matières
1. [Prérequis](#prérequis)
2. [Étape 1 : Push vers GitHub](#étape-1--push-vers-github)
3. [Étape 2 : Préparation Hostinger](#étape-2--préparation-hostinger)
4. [Étape 3 : Configuration .htaccess](#étape-3--configuration-htaccess)
5. [Étape 4 : Variables d'Environnement](#étape-4--variables-denvironnement)
6. [Étape 5 : Vérification et Tests](#étape-5--vérification-et-tests)
7. [Maintenance et Mises à Jour](#maintenance-et-mises-à-jour)

---

## Prérequis

### Ce dont vous avez besoin :
- ✅ Compte Hostinger actif
- ✅ Domaine configuré (ex: jobguinee.com)
- ✅ Accès au File Manager ou FTP
- ✅ Accès à votre compte GitHub
- ✅ Clés API Supabase (URL + Anon Key)

---

## Étape 1 : Push vers GitHub

### Option A : Depuis votre Machine Locale (Recommandé)

```bash
# 1. Clonez le dépôt (si pas déjà fait)
git clone https://github.com/Rogerdore/JobGuinee.git
cd JobGuinee

# 2. Vérifiez que vous êtes sur la branche main
git branch

# 3. Téléchargez tous les fichiers du projet Bolt.new
# Copiez-les dans ce dossier JobGuinee

# 4. Vérifiez les fichiers modifiés
git status

# 5. Ajoutez tous les fichiers (incluant dist/)
git add -A

# 6. Créez un commit
git commit -m "Ajout du dossier dist pour déploiement Hostinger"

# 7. Poussez vers GitHub
git push origin main
```

### Option B : Utiliser GitHub Desktop (Plus Simple)

1. Téléchargez GitHub Desktop : https://desktop.github.com/
2. Connectez-vous avec votre compte GitHub
3. Clonez le dépôt `Rogerdore/JobGuinee`
4. Copiez tous les fichiers du projet dans le dossier cloné
5. GitHub Desktop détectera automatiquement les changements
6. Écrivez un message de commit : "Déploiement initial avec dist/"
7. Cliquez sur "Commit to main"
8. Cliquez sur "Push origin"

---

## Étape 2 : Préparation Hostinger

### 2.1 Connexion au File Manager

1. Connectez-vous à **hPanel Hostinger**
2. Allez dans **Fichiers → File Manager**
3. Naviguez vers le dossier **public_html** (ou votre domaine)

### 2.2 Téléchargement depuis GitHub

**Méthode 1 : Via GitHub (Recommandée)**

1. Sur GitHub, allez dans votre dépôt : `https://github.com/Rogerdore/JobGuinee`
2. Cliquez sur le bouton vert **Code**
3. Sélectionnez **Download ZIP**
4. Extrayez le ZIP localement
5. Dans Hostinger File Manager, cliquez sur **Upload Files**
6. Uploadez **UNIQUEMENT le contenu du dossier dist/**

**Méthode 2 : Via FTP (Pour les gros fichiers)**

```
Hôte : ftp.votredomaine.com
Utilisateur : [Votre username FTP]
Mot de passe : [Votre password FTP]
Port : 21
```

Utilisez FileZilla ou WinSCP :
1. Connectez-vous avec les credentials ci-dessus
2. Naviguez vers `/public_html`
3. Uploadez le contenu de `dist/` (pas le dossier dist lui-même)

### 2.3 Structure des Fichiers sur Hostinger

Votre `public_html` doit ressembler à :

```
public_html/
├── index.html
├── robots.txt
├── _redirects
├── assets/
│   ├── index-V75hC_Pv.js
│   ├── index-nV-nr6et.css
│   └── pdf.worker.min-Cpi8b8z3.mjs
└── images (si vous en avez)
```

⚠️ **IMPORTANT** : Ne créez PAS de sous-dossier `dist/` dans `public_html`

---

## Étape 3 : Configuration .htaccess

### 3.1 Créer le fichier .htaccess

Dans le File Manager Hostinger, à la racine de `public_html`, créez un fichier `.htaccess` avec ce contenu :

```apache
# =====================================================
# Configuration .htaccess pour JobGuinee
# Single Page Application (SPA) avec React Router
# =====================================================

# Activer le moteur de réécriture
RewriteEngine On

# Forcer HTTPS (SSL)
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Rediriger www vers non-www (ou inversement selon votre préférence)
RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# =====================================================
# Gestion du routing SPA React
# =====================================================

# Si le fichier ou dossier existe, le servir directement
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Sinon, rediriger vers index.html
RewriteRule . /index.html [L]

# =====================================================
# Configuration de la Sécurité
# =====================================================

# Désactiver la liste des répertoires
Options -Indexes

# Protection contre les injections
<IfModule mod_headers.c>
    # Protection XSS
    Header set X-XSS-Protection "1; mode=block"

    # Empêcher le MIME sniffing
    Header set X-Content-Type-Options "nosniff"

    # Protection Clickjacking
    Header set X-Frame-Options "SAMEORIGIN"

    # Content Security Policy (à ajuster selon vos besoins)
    Header set Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https://your-supabase-url.supabase.co https:;"

    # Referrer Policy
    Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# =====================================================
# Compression GZIP
# =====================================================

<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE image/svg+xml
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# =====================================================
# Cache navigateur
# =====================================================

<IfModule mod_expires.c>
    ExpiresActive On

    # Images
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType image/webp "access plus 1 year"

    # CSS et JavaScript
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"

    # Fonts
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
    ExpiresByType application/font-woff "access plus 1 year"
    ExpiresByType application/font-woff2 "access plus 1 year"

    # HTML (pas de cache)
    ExpiresByType text/html "access plus 0 seconds"
</IfModule>

# =====================================================
# Types MIME
# =====================================================

<IfModule mod_mime.c>
    AddType application/javascript js
    AddType text/css css
    AddType image/svg+xml svg
    AddType application/font-woff woff
    AddType application/font-woff2 woff2
</IfModule>

# =====================================================
# Protection des fichiers sensibles
# =====================================================

# Bloquer l'accès aux fichiers .env
<FilesMatch "^\.env">
    Order allow,deny
    Deny from all
</FilesMatch>

# Bloquer l'accès aux fichiers de config
<FilesMatch "\.(env|git|gitignore|htaccess|htpasswd)$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

### 3.2 Vérifier le .htaccess

1. Sauvegardez le fichier `.htaccess`
2. Testez votre site : `https://votredomaine.com`
3. Testez une route : `https://votredomaine.com/jobs`
4. Si erreur 500, vérifiez les logs dans hPanel

---

## Étape 4 : Variables d'Environnement

### 4.1 Le Problème avec les Variables d'Environnement

⚠️ **IMPORTANT** : Les variables d'environnement dans Vite sont **compilées lors du build**. Elles ne sont PAS lues dynamiquement après le déploiement.

### 4.2 Solution : Reconstruire avec les Bonnes Variables

**Sur votre machine locale**, avant le build :

1. Éditez le fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anon-publique
```

2. Rebuild le projet :

```bash
npm run build
```

3. Re-uploadez le contenu de `dist/` sur Hostinger

### 4.3 Obtenir vos Clés Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings → API**
4. Copiez :
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

⚠️ **NE JAMAIS** partager votre `service_role` key publiquement !

---

## Étape 5 : Vérification et Tests

### 5.1 Checklist de Vérification

```
✅ Site accessible via HTTPS
✅ Redirection HTTP → HTTPS fonctionne
✅ Page d'accueil se charge
✅ Navigation entre pages fonctionne
✅ Refresh sur une route (/jobs) ne donne pas 404
✅ Connexion Supabase fonctionne
✅ Images se chargent
✅ CSS appliqué correctement
✅ Pas d'erreurs dans la Console du navigateur
```

### 5.2 Tests à Effectuer

1. **Test Navigation** :
   - Allez sur `https://votredomaine.com`
   - Cliquez sur différentes pages
   - Appuyez sur F5 (refresh) sur chaque page

2. **Test Console** :
   - Appuyez sur F12
   - Allez dans l'onglet **Console**
   - Vérifiez qu'il n'y a pas d'erreurs rouges

3. **Test Supabase** :
   - Essayez de vous inscrire/connecter
   - Si erreur, vérifiez les variables d'environnement

4. **Test Performance** :
   - Utilisez PageSpeed Insights : https://pagespeed.web.dev/
   - Score cible : > 90

### 5.3 Résolution des Problèmes Courants

**Problème : Erreur 404 sur les routes**
```
Solution : Vérifiez que le .htaccess est bien à la racine de public_html
```

**Problème : Site ne charge pas (page blanche)**
```
Solution :
1. F12 → Console
2. Vérifiez les erreurs
3. Souvent dû aux chemins des fichiers assets
```

**Problème : Erreur Supabase "Invalid API key"**
```
Solution :
1. Vérifiez vos variables dans .env
2. Rebuild le projet : npm run build
3. Re-uploadez dist/
```

**Problème : CSS ne s'applique pas**
```
Solution :
1. Videz le cache du navigateur (Ctrl + Shift + R)
2. Vérifiez que les fichiers CSS sont bien uploadés dans assets/
```

---

## Maintenance et Mises à Jour

### Script de Déploiement Automatique

Créez un fichier `deploy.sh` à la racine de votre projet :

```bash
#!/bin/bash

# =====================================================
# Script de Déploiement JobGuinee vers Hostinger
# =====================================================

echo "🚀 Début du déploiement..."

# 1. Vérifier que .env existe
if [ ! -f .env ]; then
    echo "❌ Erreur : Fichier .env introuvable"
    exit 1
fi

# 2. Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# 3. Build du projet
echo "🔨 Build du projet..."
npm run build

# 4. Vérifier que dist/ existe
if [ ! -d "dist" ]; then
    echo "❌ Erreur : Dossier dist/ introuvable après build"
    exit 1
fi

# 5. Commit et push vers GitHub
echo "📤 Push vers GitHub..."
git add -A
git commit -m "Déploiement $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main

echo "✅ Déploiement terminé !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Téléchargez le ZIP depuis GitHub"
echo "2. Extrayez le contenu de dist/"
echo "3. Uploadez sur Hostinger dans public_html/"
echo ""
```

### Utilisation du Script

```bash
# Rendre le script exécutable
chmod +x deploy.sh

# Lancer le déploiement
./deploy.sh
```

### Processus de Mise à Jour

1. **Modifiez votre code localement**
2. **Testez localement** : `npm run dev`
3. **Buildez** : `npm run build`
4. **Testez le build** : `npm run preview`
5. **Poussez vers GitHub** :
   ```bash
   git add -A
   git commit -m "Description des changements"
   git push origin main
   ```
6. **Téléchargez et uploadez sur Hostinger**

---

## 📊 Monitoring et Analytics

### Configuration Google Analytics (Optionnel)

1. Créez un compte sur https://analytics.google.com
2. Obtenez votre ID de suivi (ex: G-XXXXXXXXXX)
3. Ajoutez dans votre `index.html` avant `</head>` :

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

4. Rebuild et redéployez

---

## 🔒 Sécurité Supplémentaire

### Configuration SSL/HTTPS sur Hostinger

1. Dans hPanel, allez dans **Sécurité → SSL**
2. Activez le certificat SSL gratuit (Let's Encrypt)
3. Attendez 10-15 minutes pour la propagation
4. Testez : https://votredomaine.com

### Configuration CORS pour Supabase

Si vous avez des erreurs CORS :

1. Allez dans votre Dashboard Supabase
2. **Settings → API → CORS**
3. Ajoutez votre domaine : `https://votredomaine.com`

---

## 📞 Support et Aide

### Logs Hostinger

Pour voir les erreurs :
1. hPanel → **Fichiers → Logs**
2. Consultez `error_log`

### Ressources Utiles

- Documentation Hostinger : https://support.hostinger.com
- Documentation Supabase : https://supabase.com/docs
- Support Hostinger : Live Chat dans hPanel

---

## ✅ Checklist Finale

Avant de considérer le déploiement comme terminé :

```
□ Build réussi sans erreurs
□ Fichiers uploadés dans public_html/
□ .htaccess configuré et testé
□ SSL/HTTPS activé et fonctionnel
□ Variables Supabase configurées
□ Toutes les pages accessibles
□ Refresh fonctionne sur toutes les routes
□ Connexion/Inscription fonctionnelle
□ Images et assets chargent correctement
□ Console navigateur sans erreurs
□ Test mobile responsive OK
□ Domaine pointe vers Hostinger
□ DNS propagé (peut prendre 24-48h)
```

---

## 🎉 Félicitations !

Votre application JobGuinee est maintenant en production sur Hostinger !

**URL de production** : https://votredomaine.com

N'oubliez pas de tester régulièrement et de garder vos dépendances à jour.

---

**Dernière mise à jour** : 26 Novembre 2025
**Version** : 1.0.0
