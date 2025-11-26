# 🚀 Guide Rapide de Déploiement Hostinger

## ⚡ Version Ultra-Rapide (5 minutes)

### Étape 1 : Build Local
```bash
# Sur votre machine
npm install
npm run build
```

### Étape 2 : Upload sur Hostinger

1. Connectez-vous à **hPanel** → **File Manager**
2. Allez dans **public_html**
3. **Supprimez tout** ce qui est dans public_html
4. Uploadez **UNIQUEMENT le contenu** du dossier `dist/`
   - ✅ index.html
   - ✅ robots.txt
   - ✅ _redirects
   - ✅ dossier assets/
   - ✅ images

### Étape 3 : Créer .htaccess

Dans File Manager, créez un fichier `.htaccess` dans public_html :

```apache
RewriteEngine On

# Forcer HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# SPA Routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### Étape 4 : Activer SSL

1. hPanel → **Sécurité** → **SSL**
2. Activez le certificat SSL gratuit
3. Attendez 10 minutes

### Étape 5 : Tester

Allez sur `https://votredomaine.com`

✅ **C'est tout !**

---

## 🔧 En Cas de Problème

### Site ne charge pas (page blanche)
- F12 → Console → Vérifiez les erreurs
- Vérifiez que les fichiers sont à la racine de public_html (pas dans un sous-dossier)

### Erreur 404 sur les routes (/jobs, /login, etc.)
- Vérifiez que le fichier `.htaccess` existe
- Vérifiez qu'il est à la racine de public_html

### Erreur Supabase
- Avant le build, vérifiez votre `.env` :
  ```env
  VITE_SUPABASE_URL=https://votre-projet.supabase.co
  VITE_SUPABASE_ANON_KEY=votre-clé-publique
  ```
- Rebuild : `npm run build`
- Re-uploadez

---

## 📋 Structure Finale sur Hostinger

```
public_html/
├── .htaccess          ← À créer manuellement
├── index.html         ← Du dossier dist/
├── robots.txt         ← Du dossier dist/
├── _redirects         ← Du dossier dist/
└── assets/            ← Du dossier dist/
    ├── index-V75hC_Pv.js
    ├── index-nV-nr6et.css
    └── pdf.worker.min-Cpi8b8z3.mjs
```

---

## 🔄 Pour Mettre à Jour

1. Modifiez votre code
2. `npm run build`
3. Uploadez le contenu de `dist/` sur Hostinger (remplacez les anciens fichiers)

---

## 📖 Documentation Complète

Pour plus de détails, voir **DEPLOIEMENT_HOSTINGER.md**
