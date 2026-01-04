# 📁 Structure des Assets - /public/

## ✅ Organisation Actuelle

```
/public/
├── avatars/                           ← Avatar du chatbot Alpha
│   ├── alpha-animated.svg            ✅ Avatar SVG animé (3.5 KB)
│   └── README.md                      ✅ Documentation du dossier
│
├── images/                            ← Images de l'application
│   └── README.md                      ✅ Guide d'utilisation
│
├── avatar_alpha_gif.gif               ⚠️ Placeholder à remplacer
├── test-production-assets.html        ✅ Page de test des assets
│
└── (autres fichiers existants)

```

## 🎯 Fichiers Principaux

### Avatar Alpha (Chatbot)

| Fichier | Chemin | Status | Utilisation |
|---------|--------|--------|-------------|
| SVG Animé | `/avatars/alpha-animated.svg` | ✅ Prêt | Fallback principal |
| GIF | `/avatar_alpha_gif.gif` | ⚠️ Placeholder | À remplacer |

**Code d'utilisation :**
```tsx
// Dans AlphaAvatar.tsx
<img src="/avatar_alpha_gif.gif" />        // Priorité 1
<img src="/avatars/alpha-animated.svg" />   // Fallback
```

### Dossier Images

**Chemin :** `/public/images/`
**Status :** ✅ Prêt à recevoir des images
**Usage :** Images de fond, bannières, illustrations

**Exemple d'utilisation :**
```tsx
<img src="/images/hero-bg.jpg" alt="Hero" />
<div className="bg-[url('/images/banner.jpg')]"></div>
```

## 🔧 Chemins d'Accès

### En Développement (Local)
```
http://localhost:5173/avatars/alpha-animated.svg
http://localhost:5173/images/votre-image.jpg
http://localhost:5173/test-production-assets.html
```

### En Production
```
https://votre-domaine.com/avatars/alpha-animated.svg
https://votre-domaine.com/images/votre-image.jpg
https://votre-domaine.com/test-production-assets.html
```

## 📦 Build de Production

Lors de `npm run build`, Vite copie **automatiquement** tous les fichiers de `/public/` vers `/dist/` :

```
/dist/
├── avatars/
│   └── alpha-animated.svg
├── images/
│   └── (vos images)
├── avatar_alpha_gif.gif
├── test-production-assets.html
└── index.html
```

## ✅ Vérification Rapide

**Tester les URLs maintenant (dev) :**
```bash
# Avatar SVG
curl -I http://localhost:5173/avatars/alpha-animated.svg

# Page de test
curl -I http://localhost:5173/test-production-assets.html
```

**Après déploiement (prod) :**
```bash
# Avatar SVG
curl -I https://votre-domaine.com/avatars/alpha-animated.svg

# Page de test
curl -I https://votre-domaine.com/test-production-assets.html
```

## 📝 Ajouter de Nouvelles Images

### 1. Pour le Hero Background
```bash
# 1. Copier l'image
cp votre-hero-bg.jpg public/images/

# 2. Utiliser dans le code
<div className="bg-[url('/images/votre-hero-bg.jpg')] bg-cover bg-center">
```

### 2. Pour les Logos d'Entreprises
Les logos sont gérés via **Supabase Storage** (pas dans /public/).
Utilisez le composant `CompanyLogo.tsx` qui gère automatiquement les URLs Supabase.

### 3. Pour l'Avatar Alpha
Si vous voulez remplacer le GIF :
```bash
# 1. Copier votre GIF (200x200px recommandé)
cp votre-alpha.gif public/avatar_alpha_gif.gif

# 2. Rebuild
npm run build

# 3. Redéployer
```

## 🚀 Déploiement

### Build Local
```bash
npm run build
# Vérifie /dist/ contient bien avatars/, images/, etc.
```

### Upload vers Hostinger
```bash
# Via FTP
1. Connecter au FTP Hostinger
2. Aller dans public_html/
3. Uploader TOUT le contenu de /dist/
4. Vérifier permissions : 644 (fichiers), 755 (dossiers)
```

## 🎨 Bonnes Pratiques

| ✅ À FAIRE | ❌ À ÉVITER |
|-----------|-------------|
| Chemins absolus `/images/...` | Chemins relatifs `./images/...` |
| Fichiers dans `/public/` | Fichiers dans `/src/assets/` |
| Noms en kebab-case | Noms avec espaces |
| Images optimisées | Images non compressées |
| Format WebP si possible | JPG lourds |

## 🔍 Diagnostic

### Image ne s'affiche pas ?

1. **Vérifier le chemin** :
   ```bash
   # Le fichier existe-t-il ?
   ls -l public/images/votre-image.jpg
   ```

2. **Vérifier en dev** :
   - Ouvrir http://localhost:5173/images/votre-image.jpg
   - Doit afficher l'image directement

3. **Vérifier le build** :
   ```bash
   npm run build
   ls -l dist/images/votre-image.jpg
   # Le fichier doit exister dans dist/
   ```

4. **Vérifier la console** :
   - F12 → Console
   - Chercher les erreurs 404

## 📚 Documentation Complète

- `ASSETS_DEPLOYMENT_GUIDE.md` - Guide complet de déploiement
- `CORRECTION_PRODUCTION_COMPLETE.md` - Rapport des corrections
- `public/avatars/README.md` - Doc du dossier avatars
- `public/images/README.md` - Doc du dossier images

## 🎯 Status Global

| Élément | Status |
|---------|--------|
| Structure `/public/` | ✅ Organisée |
| Avatar SVG | ✅ Créé et fonctionnel |
| Dossiers avatars/ et images/ | ✅ Créés avec docs |
| Système de fallback | ✅ Implémenté |
| Page de test | ✅ Créée |
| Build production | ✅ Testé (45.34s) |
| Documentation | ✅ Complète |

---

**🚀 Prêt pour la production !**

Tous les assets sont correctement organisés dans `/public/` et seront automatiquement copiés dans `/dist/` lors du build.
