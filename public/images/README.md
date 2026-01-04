# Images - Dossier Assets

## 📁 Utilisation

Ce dossier est destiné à recevoir les images pour l'application :
- Images de fond (hero backgrounds)
- Bannières
- Illustrations
- Photos de présentation

## ✅ Bonnes Pratiques

### Ajouter une Image

1. Copier l'image dans ce dossier `/public/images/`
2. Utiliser un nom descriptif en kebab-case : `hero-background.jpg`
3. Optimiser l'image avant l'ajout (compression, dimensions appropriées)

### Utiliser l'Image dans le Code

**En React/TSX :**
```tsx
<img src="/images/hero-background.jpg" alt="Description" />

// Ou en arrière-plan
<div style={{ backgroundImage: 'url("/images/hero-background.jpg")' }}>
```

**En Tailwind CSS :**
```tsx
<div className="bg-[url('/images/hero-background.jpg')] bg-cover bg-center">
```

## 📏 Recommandations de Taille

| Type d'Image | Dimensions Recommandées | Format |
|--------------|------------------------|--------|
| Hero Background | 1920x1080px | JPG/WebP |
| Bannière | 1200x400px | JPG/PNG |
| Logo | 200x200px | PNG/SVG |
| Icône | 48x48px | PNG/SVG |
| Photo Profil | 400x400px | JPG/PNG |

## 🚀 Déploiement

Lors du build (`npm run build`), Vite copie automatiquement tous les fichiers de ce dossier vers `/dist/images/`.

Les images sont accessibles via des chemins absolus :
- Dev : `http://localhost:5173/images/votre-image.jpg`
- Prod : `https://votre-domaine.com/images/votre-image.jpg`

## ⚠️ Important

- **Toujours utiliser des chemins absolus** : `/images/...` (pas `./images/...`)
- **Ne pas importer** les images dans le code : `import img from './img.jpg'` ❌
- **Optimiser les images** avant de les ajouter (TinyPNG, Squoosh, etc.)
- **Utiliser WebP** quand possible pour de meilleures performances

## 🎯 Exemple Complet

```tsx
// ❌ À ÉVITER
import heroImg from '../assets/hero.jpg'
<img src={heroImg} />

// ✅ CORRECT
<img src="/images/hero.jpg" alt="Hero" />
```
