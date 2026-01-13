# Guide de Déploiement des Assets pour Production

## 📋 Vue d'ensemble

Ce guide explique comment gérer les images et assets pour que l'application fonctionne correctement en production (Vite + Hostinger).

## ✅ Configuration Actuelle (Correcte)

L'application utilise déjà les **bonnes pratiques** pour Vite :

### 1. Chemins Absolus depuis /public

Tous les chemins d'images utilisent des chemins absolus depuis la racine :

```tsx
// ✅ CORRECT - Chemin absolu depuis /public
<img src="/avatars/alpha-animated.svg" alt="Alpha" />
<img src="/avatar_alpha_gif.gif" alt="Alpha GIF" />
```

```css
/* ✅ CORRECT - Chemin absolu en CSS */
background-image: url("/images/hero-bg.jpg");
```

### 2. Pas d'imports d'images depuis src/

L'application n'utilise **PAS** d'imports d'images depuis `src/assets/` :

```tsx
// ❌ INCORRECT - À NE PAS FAIRE
import logo from '../assets/logo.png'
<img src={logo} />

// ✅ CORRECT - Utiliser /public à la place
<img src="/images/logo.png" />
```

### 3. Structure des Assets

```
/public/
  ├── avatars/
  │   └── alpha-animated.svg          ✅ Avatar SVG animé (fallback)
  ├── images/
  │   └── (vos images futures)
  ├── avatar_alpha_gif.gif            ⚠️ À remplacer par un vrai GIF
  └── (autres fichiers statiques)
```

## 🔧 Actions Requises

### 1. Remplacer le Placeholder Avatar GIF

Le fichier `/public/avatar_alpha_gif.gif` est actuellement un placeholder.

**Pour le remplacer :**

1. Créez ou obtenez un GIF animé pour Alpha (200x200px recommandé)
2. Renommez-le en `avatar_alpha_gif.gif`
3. Copiez-le dans `/public/` (remplacer le fichier existant)
4. OU copiez-le dans `/public/avatars/alpha.gif` et mettez à jour le chemin dans `AlphaAvatar.tsx`

**Solution temporaire actuelle :**
- Un SVG animé (`/avatars/alpha-animated.svg`) sert de fallback
- Si le GIF ne charge pas, le SVG s'affiche automatiquement
- Si le SVG ne charge pas, une icône Material s'affiche

### 2. Logos d'Entreprises

Les logos d'entreprises sont gérés via Supabase Storage :
- URLs complètes depuis Supabase
- Fallback automatique sur initiales de l'entreprise
- Aucune action requise

## 🚀 Déploiement sur Hostinger

### 1. Build de Production

```bash
npm run build
```

Cela génère le dossier `/dist` avec tous les assets optimisés.

### 2. Structure du Dossier dist/

```
/dist/
  ├── assets/          # JS/CSS avec hash
  ├── avatars/         # Copiés depuis /public/avatars/
  ├── images/          # Copiés depuis /public/images/
  ├── index.html       # Point d'entrée
  └── (fichiers de /public copiés à la racine)
```

### 3. Upload vers Hostinger

**Via FTP :**
1. Connectez-vous à votre FTP Hostinger
2. Naviguez vers le dossier `public_html/`
3. Uploadez TOUT le contenu de `/dist/` (pas le dossier dist lui-même)

**Via Script Automatisé :**
```bash
# Déjà configuré dans le projet
npm run deploy
```

### 4. Vérification Post-Déploiement

Testez ces URLs :
- `https://votre-domaine.com/` → Page d'accueil
- `https://votre-domaine.com/avatars/alpha-animated.svg` → Avatar SVG
- `https://votre-domaine.com/avatar_alpha_gif.gif` → Avatar GIF

## 🎨 Ajouter de Nouvelles Images

### Images de Fond / Décoratives

1. Ajoutez l'image dans `/public/images/`
2. Utilisez un chemin absolu :

```tsx
// Composant React
<div style={{ backgroundImage: 'url("/images/hero-bg.jpg")' }}>

// Ou en CSS/Tailwind
<div className="bg-[url('/images/hero-bg.jpg')]">
```

### Icônes et Petits Assets

Privilégiez :
1. **Lucide React** pour les icônes (déjà installé)
2. **SVG inline** pour les icônes personnalisées
3. **SVG dans /public** pour les logos

### Images Dynamiques (depuis DB)

Les images stockées dans Supabase Storage :
- Utilisez les URLs complètes depuis Supabase
- Déjà géré par `CompanyLogo.tsx`

## ⚠️ Erreurs Courantes à Éviter

### 1. Chemins Relatifs en Production

```tsx
// ❌ NE FONCTIONNE PAS en production
<img src="./images/logo.png" />
<img src="../assets/logo.png" />

// ✅ FONCTIONNE en production
<img src="/images/logo.png" />
```

### 2. Imports d'Images

```tsx
// ❌ À ÉVITER (sauf si nécessaire pour le tree-shaking)
import logo from '../assets/logo.png'

// ✅ PRÉFÉRER
// Mettre dans /public/ et utiliser chemin absolu
<img src="/images/logo.png" />
```

### 3. URL() en CSS avec Chemins Relatifs

```css
/* ❌ Peut poser problème */
background: url('../images/bg.jpg');

/* ✅ Meilleure pratique */
background: url('/images/bg.jpg');
```

## 📊 Résumé des Bonnes Pratiques

| ✅ À FAIRE | ❌ À ÉVITER |
|-----------|-------------|
| Chemins absolus depuis `/` | Chemins relatifs `./` ou `../` |
| Assets dans `/public/` | Assets dans `/src/assets/` |
| URLs Supabase pour uploads | Images en dur pour contenu dynamique |
| SVG pour icônes/logos | PNG/JPG pour icônes |
| Fallbacks pour images | Pas de gestion d'erreur |

## 🔍 Diagnostic des Problèmes

### Image ne s'affiche pas en production ?

1. **Vérifiez le chemin** :
   ```bash
   # Sur le serveur, vérifiez que le fichier existe
   curl https://votre-domaine.com/images/votre-image.jpg
   ```

2. **Vérifiez la console du navigateur** :
   - Ouvrez DevTools (F12)
   - Onglet Console → Erreurs 404 ?
   - Onglet Network → L'image est-elle chargée ?

3. **Vérifiez les permissions** :
   - Sur Hostinger, les fichiers doivent avoir les permissions 644
   - Les dossiers doivent avoir les permissions 755

### Avatar Alpha ne s'affiche pas ?

L'application a 3 niveaux de fallback :
1. GIF principal (`/avatar_alpha_gif.gif`)
2. SVG animé (`/avatars/alpha-animated.svg`)
3. Icône Material (MessageCircle)

Si aucun ne s'affiche, vérifiez la console pour les erreurs.

## 📚 Ressources

- [Vite - Static Asset Handling](https://vitejs.dev/guide/assets.html)
- [Vite - Public Directory](https://vitejs.dev/guide/assets.html#the-public-directory)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

## 🎯 Checklist de Déploiement

- [ ] Remplacer `/public/avatar_alpha_gif.gif` par un vrai GIF
- [ ] Vérifier que tous les chemins sont absolus (`/...`)
- [ ] Tester le build : `npm run build`
- [ ] Vérifier le dossier `/dist/` contient tous les assets
- [ ] Uploader le contenu de `/dist/` vers Hostinger
- [ ] Tester toutes les pages sur le domaine de production
- [ ] Vérifier l'avatar Alpha s'affiche correctement
- [ ] Vérifier les logos d'entreprises s'affichent

---

**Note :** Ce système est déjà configuré correctement dans le code. Il suffit de remplacer le placeholder GIF par un vrai fichier pour que tout fonctionne parfaitement en production.
