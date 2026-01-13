# 🚀 Guide de Déploiement JobGuinée

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Configuration GitHub](#configuration-github)
4. [Configuration Hostinger](#configuration-hostinger)
5. [Configuration GitHub Actions](#configuration-github-actions)
6. [Variables d'environnement](#variables-denvironnement)
7. [Déploiement automatique](#déploiement-automatique)
8. [Vérification post-déploiement](#vérification-post-déploiement)
9. [Rollback en cas d'erreur](#rollback-en-cas-derreur)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

Ce guide vous accompagne dans la mise en place d'un pipeline de déploiement continu automatisé :

```
Bolt.new (Développement)
    ↓ push automatique
GitHub (Source de vérité)
    ↓ GitHub Actions CI/CD
Build & Tests automatiques
    ↓ FTP Deploy
Hostinger (Production)
    ↓ Vérification automatique
Site en ligne ✅
```

### Principe de base

- **Bolt.new** : Environnement unique pour toutes les modifications
- **GitHub** : Stockage et versioning du code
- **GitHub Actions** : Build, tests et déploiement automatiques
- **Hostinger** : Hébergement de la production

---

## ✅ Prérequis

### Comptes requis

- [ ] Compte GitHub (organisation ou personnel)
- [ ] Compte Hostinger avec accès FTP
- [ ] Compte Supabase avec projet configuré
- [ ] Accès à Bolt.new

### Connaissances recommandées

- Bases de Git et GitHub
- Compréhension des variables d'environnement
- Notions de CI/CD

---

## 🔧 Configuration GitHub

### 1. Créer ou configurer le repository

```bash
# Si le repo n'existe pas encore sur GitHub
# 1. Aller sur github.com
# 2. Créer un nouveau repository "jobguinee"
# 3. Ne pas initialiser avec README (déjà présent dans Bolt.new)
```

### 2. Vérifier la connexion Git depuis Bolt.new

Bolt.new devrait automatiquement pousser vers GitHub. Vérifier que :

- Le repository remote est configuré
- La branche principale est `main` ou `production`
- Les commits sont automatiquement poussés

### 3. Protéger la branche principale

Sur GitHub, aller dans :
```
Settings → Branches → Branch protection rules → Add rule
```

Configuration recommandée :
- [x] Require a pull request before merging (optionnel si seul développeur)
- [x] Require status checks to pass before merging
- [x] Require branches to be up to date before merging
- [ ] Include administrators (à vous de choisir)

---

## 🌐 Configuration Hostinger

### 1. Préparer l'hébergement

1. **Activer Node.js** (si nécessaire) :
   - Aller dans le panneau Hostinger
   - Chercher "Node.js" ou "Application Manager"
   - Activer Node.js pour votre domaine

2. **Obtenir les accès FTP** :
   ```
   Panneau Hostinger → Fichiers → FTP Accounts
   ```

   Informations nécessaires :
   - Host : `ftp.votredomaine.com` ou IP FTP
   - Username : Votre username FTP
   - Password : Votre mot de passe FTP
   - Port : 21 (standard) ou 22 (SFTP)

3. **Déterminer le chemin de déploiement** :

   Généralement :
   - `/public_html/` pour le domaine principal
   - `/public_html/sous-dossier/` pour un sous-dossier
   - `/domains/votredomaine.com/public_html/` dans certains cas

### 2. Configuration du domaine

1. **Pointer le domaine** vers votre hébergement Hostinger
2. **Activer HTTPS/SSL** :
   ```
   Panneau Hostinger → SSL → Let's Encrypt → Installer
   ```
3. **Configurer les redirections** (si nécessaire)

### 3. Tester l'accès FTP

```bash
# Tester la connexion FTP
ftp ftp.votredomaine.com
# Entrer username et password
# Si connecté : succès ✅
```

---

## ⚙️ Configuration GitHub Actions

### 1. Ajouter les secrets GitHub

Aller sur GitHub :
```
Repository → Settings → Secrets and variables → Actions → New repository secret
```

**Secrets obligatoires** :

| Nom du secret | Description | Exemple |
|---------------|-------------|---------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase | `eyJhbGc...` |
| `FTP_HOST` | Host FTP Hostinger | `ftp.jobguinee.com` |
| `FTP_USERNAME` | Username FTP | `votre_username` |
| `FTP_PASSWORD` | Password FTP | `votre_password` |
| `FTP_SERVER_DIR` | Chemin de destination | `/public_html/` |
| `SITE_URL` | URL du site en production | `https://jobguinee.com` |

**Secrets optionnels** (selon fonctionnalités) :

| Nom du secret | Description |
|---------------|-------------|
| `OPENAI_API_KEY` | Clé API OpenAI pour services IA |
| `ORANGE_MONEY_API_KEY` | Clé API Orange Money |
| `MTN_MOMO_API_KEY` | Clé API MTN Mobile Money |

### 2. Vérifier les workflows

Les workflows sont dans `.github/workflows/` :

1. **`ci-checks.yml`** : S'exécute sur tous les push
   - Vérifications de qualité
   - Build de test
   - Vérification de sécurité

2. **`deploy-production.yml`** : S'exécute sur push vers `main`
   - Build production
   - Déploiement FTP vers Hostinger
   - Vérification post-déploiement

### 3. Tester les workflows

1. Faire un petit commit de test :
   ```bash
   # Dans Bolt.new, modifier un fichier (ex: README)
   # Le push sera automatique
   ```

2. Vérifier sur GitHub :
   ```
   Repository → Actions
   ```

   Vous devriez voir les workflows s'exécuter.

---

## 🔐 Variables d'environnement

### Structure des fichiers .env

1. **`.env`** (LOCAL - NE PAS COMMITER)
   - Contient vos vraies valeurs
   - Utilisé en développement
   - Dans `.gitignore`

2. **`.env.example`** (VERSIONNÉ)
   - Template pour développement
   - Valeurs d'exemple
   - Commité sur GitHub

3. **`.env.example.production`** (VERSIONNÉ)
   - Template pour production
   - Documentation complète
   - Commité sur GitHub

### Configuration locale (Bolt.new)

```bash
# 1. Copier le template
cp .env.example .env

# 2. Remplir avec vos vraies valeurs
# Éditer .env avec vos clés Supabase

# 3. Vérifier que .env est dans .gitignore
cat .gitignore | grep ".env"
```

### Configuration production (GitHub Secrets)

Toutes les variables sensibles doivent être dans GitHub Secrets (voir section précédente).

---

## 🚀 Déploiement automatique

### Workflow de déploiement

1. **Modification dans Bolt.new**
   ```
   - Éditer le code
   - Sauvegarder
   - Bolt.new push automatiquement vers GitHub
   ```

2. **GitHub Actions s'exécute automatiquement**
   ```
   ✓ Récupération du code
   ✓ Installation des dépendances
   ✓ Vérification TypeScript
   ✓ Build production
   ✓ Tests de sécurité
   ✓ Upload vers Hostinger (FTP)
   ✓ Vérification post-déploiement
   ```

3. **Site mis à jour automatiquement**
   ```
   Site accessible sur https://jobguinee.com
   ```

### Temps de déploiement

- **Build** : ~2-3 minutes
- **Upload FTP** : ~1-2 minutes
- **Total** : ~3-5 minutes

### Suivi en temps réel

Aller sur GitHub → Actions pour suivre le déploiement en direct.

---

## ✅ Vérification post-déploiement

### 1. Vérification automatique

Le workflow inclut des vérifications automatiques :
- Test de disponibilité du site
- Vérification HTTPS
- Test de routing SPA
- Vérification des headers de sécurité
- Test de performance

### 2. Vérification manuelle

Checklist à faire après chaque déploiement :

- [ ] Site accessible : `https://jobguinee.com`
- [ ] HTTPS actif (cadenas vert)
- [ ] Page d'accueil se charge correctement
- [ ] Navigation fonctionne (tester 2-3 pages)
- [ ] Connexion fonctionne
- [ ] Aucune erreur dans la console (F12)
- [ ] Images et assets se chargent
- [ ] Chatbot Alpha est visible

### 3. Script de vérification

Exécuter depuis votre machine locale :

```bash
# Vérifier le déploiement
./scripts/deployment/verify-deployment.sh

# Ou avec URL personnalisée
SITE_URL=https://jobguinee.com ./scripts/deployment/verify-deployment.sh
```

---

## 🔄 Rollback en cas d'erreur

### Si le déploiement échoue

1. **Identifier la cause** :
   ```
   GitHub → Actions → Voir les logs du workflow échoué
   ```

2. **Le site reste stable** :
   - L'ancien code reste en ligne
   - Aucune interruption de service
   - Pas de déploiement partiel

3. **Corriger le problème** :
   ```
   - Corriger dans Bolt.new
   - Sauvegarder
   - Nouveau déploiement automatique
   ```

### Si le site est cassé après déploiement

**Option 1 : Rollback via GitHub**

```bash
# 1. Trouver le dernier commit fonctionnel
git log --oneline

# 2. Créer une branche de rollback
git checkout -b rollback <commit-hash-fonctionnel>

# 3. Forcer le push
git push origin rollback:main --force

# Le déploiement se fera automatiquement
```

**Option 2 : Rollback via FTP Hostinger**

```bash
# 1. Se connecter en FTP
# 2. Restaurer depuis une backup locale si disponible
# 3. Ou supprimer le dossier et re-déployer manuellement
```

**Option 3 : Désactiver temporairement le site**

```bash
# Créer une page de maintenance
echo "<h1>Maintenance en cours</h1>" > public_html/index.html
```

---

## 🐛 Troubleshooting

### Problème : Build échoue

**Symptômes** :
- GitHub Actions échoue à l'étape "Build production"
- Erreurs TypeScript ou de compilation

**Solutions** :
```bash
# 1. Vérifier localement
npm run build

# 2. Vérifier TypeScript
npm run typecheck

# 3. Vérifier les dépendances
npm ci

# 4. Corriger les erreurs trouvées
```

### Problème : Secrets non définis

**Symptômes** :
- Erreur "Variable d'environnement manquante"
- Build réussit mais erreurs au runtime

**Solutions** :
1. Vérifier GitHub Secrets :
   ```
   Repository → Settings → Secrets and variables → Actions
   ```
2. S'assurer que tous les secrets requis sont définis
3. Re-déclencher le workflow

### Problème : FTP Upload échoue

**Symptômes** :
- Erreur "Cannot connect to FTP"
- "Authentication failed"

**Solutions** :
1. Vérifier les credentials FTP dans GitHub Secrets
2. Tester manuellement la connexion FTP
3. Vérifier que l'IP de GitHub n'est pas bloquée par Hostinger
4. Contacter le support Hostinger si nécessaire

### Problème : Site en blanc après déploiement

**Symptômes** :
- Page blanche
- Erreur 404 sur les assets
- Erreurs dans la console

**Solutions** :
1. Vérifier le chemin de déploiement (`FTP_SERVER_DIR`)
2. Vérifier que le fichier `.htaccess` est présent
3. Vérifier la configuration des chemins dans `vite.config.ts`
4. Vérifier les permissions des fichiers sur Hostinger

### Problème : Routing SPA ne fonctionne pas

**Symptômes** :
- Page d'accueil OK
- Erreur 404 sur les autres routes
- Refresh de page donne 404

**Solutions** :
1. Vérifier que `.htaccess` est déployé
2. Vérifier que mod_rewrite est activé sur Hostinger
3. Ajouter les règles de rewrite :
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^(.*)$ /index.html [L]
   ```

### Problème : CORS errors

**Symptômes** :
- Erreurs CORS dans la console
- Requêtes API bloquées

**Solutions** :
1. Vérifier la configuration CORS sur Supabase
2. Ajouter le domaine dans les origines autorisées
3. Vérifier les headers dans `.htaccess`

---

## 📞 Support et aide

### Ressources

- **Documentation Hostinger** : https://support.hostinger.com
- **GitHub Actions Docs** : https://docs.github.com/actions
- **Supabase Docs** : https://supabase.com/docs

### Contacts

- **Support technique** : support@jobguinee.com
- **Documentation** : Voir les fichiers `*.md` à la racine du projet

---

## 🎉 Félicitations !

Votre pipeline de déploiement continu est configuré !

Chaque modification dans Bolt.new sera automatiquement :
- ✅ Testée
- ✅ Buildée
- ✅ Déployée
- ✅ Vérifiée

Vous pouvez maintenant développer en toute sérénité ! 🚀
