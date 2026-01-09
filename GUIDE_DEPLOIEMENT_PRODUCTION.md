# 🚀 Guide de Déploiement en Production

## 📋 Méthodes de Déploiement

### ✅ Méthode 1 : Déploiement Automatique via FTP

#### Prérequis
```bash
# Installer lftp
# Linux:
sudo apt-get install lftp

# Mac:
brew install lftp
```

#### Configuration
1. Vérifiez que votre fichier `.env` contient :
```env
HOSTINGER_FTP_HOST=ftp.votredomaine.com
HOSTINGER_FTP_USERNAME=votre_username
HOSTINGER_FTP_PASSWORD=votre_password
```

#### Déploiement
```bash
# Donner les permissions d'exécution (première fois seulement)
chmod +x deploy-ftp.sh

# Lancer le déploiement
./deploy-ftp.sh
```

Le script va :
1. ✅ Compiler le projet (`npm run build`)
2. ✅ Se connecter à votre serveur FTP
3. ✅ Uploader tous les fichiers du dossier `dist/` vers `public_html/`
4. ✅ Supprimer les anciens fichiers

---

### ✅ Méthode 2 : Déploiement Manuel via FTP (FileZilla)

#### Étape 1 : Build du projet
```bash
npm run build
```

#### Étape 2 : Connexion FTP
1. Ouvrez **FileZilla** (ou votre client FTP)
2. Connectez-vous avec :
   - Host : `ftp.votredomaine.com`
   - Username : votre username FTP
   - Password : votre password FTP
   - Port : `21`

#### Étape 3 : Upload des fichiers
1. Sur votre ordinateur (gauche) : Naviguez vers le dossier `dist/`
2. Sur le serveur (droite) : Naviguez vers `public_html/`
3. **IMPORTANT** : Supprimez d'abord tout le contenu de `public_html/`
4. Sélectionnez TOUT le contenu du dossier `dist/` (pas le dossier lui-même)
5. Faites un glisser-déposer vers `public_html/`
6. Attendez que tous les fichiers soient uploadés

---

### ✅ Méthode 3 : Déploiement via GitHub Actions (Automatique)

Cette méthode déploie automatiquement à chaque fois que vous faites un `git push`.

#### Configuration (une seule fois)
1. Allez sur votre repository GitHub
2. Cliquez sur **Settings** → **Secrets and variables** → **Actions**
3. Ajoutez ces secrets :
   - `FTP_SERVER` = `ftp.votredomaine.com`
   - `FTP_USERNAME` = votre username FTP
   - `FTP_PASSWORD` = votre password FTP

#### Utilisation
```bash
git add .
git commit -m "Mise à jour des couleurs"
git push origin main
```

Le déploiement se fait automatiquement ! Surveillez l'onglet **Actions** sur GitHub.

---

## 🔍 Vérification du Déploiement

### 1. Vérifier les fichiers sur le serveur
Assurez-vous que `public_html/` contient :
```
public_html/
├── index.html          ← IMPORTANT !
├── assets/
│   ├── index-*.js     ← Vos fichiers JS
│   ├── index-*.css    ← Vos styles CSS
│   └── ...
├── logo_jobguinee.png
├── avatar_alpha.png
└── ...
```

### 2. Vider le cache du navigateur
Après le déploiement :
1. **Chrome/Edge** : `Ctrl + Shift + R` (Windows) ou `Cmd + Shift + R` (Mac)
2. **Firefox** : `Ctrl + F5` (Windows) ou `Cmd + Shift + R` (Mac)
3. **Safari** : `Cmd + Option + R` (Mac)

### 3. Vérifier en navigation privée
Ouvrez une fenêtre de navigation privée et visitez votre site.

---

## 🐛 Résolution des Problèmes

### ❌ Problème : "Je ne vois pas mes modifications"

**Solutions :**

1. **Vider le cache du navigateur**
   ```
   Ctrl + Shift + R (ou Cmd + Shift + R sur Mac)
   ```

2. **Vérifier que le build est récent**
   ```bash
   npm run build
   ls -l dist/index.html
   ```
   La date doit être récente (aujourd'hui).

3. **Vérifier les fichiers uploadés**
   - Connectez-vous en FTP
   - Vérifiez que `public_html/index.html` existe
   - Vérifiez la date de modification du fichier

4. **Supprimer complètement l'ancien contenu**
   Avant d'uploader, supprimez TOUT dans `public_html/` sauf :
   - `.htaccess` (si présent, ne pas supprimer)
   - Autres fichiers système (commencent par `.`)

---

### ❌ Problème : "Erreur 404 ou page blanche"

**Solutions :**

1. **Vérifier le fichier `.htaccess`**

   Créez ou modifiez `public_html/.htaccess` :
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

2. **Vérifier les permissions des fichiers**
   - Fichiers : `644`
   - Dossiers : `755`

---

### ❌ Problème : "Les assets (CSS/JS) ne se chargent pas"

**Solutions :**

1. **Vérifier la structure des dossiers**
   ```
   public_html/
   ├── index.html
   └── assets/         ← Doit exister !
       ├── *.js
       ├── *.css
       └── ...
   ```

2. **Uploader le dossier assets/** complet
   Assurez-vous que TOUS les fichiers dans `dist/assets/` sont uploadés.

3. **Vérifier les chemins dans index.html**
   Ouvrez `public_html/index.html` et vérifiez que les chemins commencent par `/assets/`

---

## 🎯 Checklist de Déploiement

Avant chaque déploiement :

- [ ] `npm run build` exécuté avec succès
- [ ] Aucune erreur dans la console du build
- [ ] Le dossier `dist/` contient `index.html` et `assets/`
- [ ] Connexion FTP fonctionnelle
- [ ] Sauvegarde de l'ancien contenu (optionnel)
- [ ] Suppression du contenu de `public_html/`
- [ ] Upload de TOUT le contenu de `dist/`
- [ ] Vérification en navigation privée
- [ ] Cache du navigateur vidé

---

## 📞 Support

Si le problème persiste :

1. Vérifiez les logs du serveur (dans votre panel Hostinger)
2. Vérifiez la console JavaScript du navigateur (F12)
3. Testez avec un autre navigateur
4. Contactez le support Hostinger si nécessaire

---

## 🔄 Déploiement Rapide (Résumé)

```bash
# 1. Build
npm run build

# 2. Déployer
./deploy-ftp.sh

# 3. Vérifier
# - Ouvrir le site en navigation privée
# - Vider le cache : Ctrl + Shift + R
```

C'est fait ! 🎉
