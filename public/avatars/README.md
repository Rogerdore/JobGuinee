# Avatar Alpha - Dossier Assets

## 📁 Contenu

- `alpha-animated.svg` - Avatar SVG animé pour le chatbot Alpha

## 🎨 Caractéristiques du SVG

- **Taille**: ~3.5 KB
- **Format**: SVG animé (natif, pas de JS requis)
- **Dimensions**: 200x200px
- **Animations**:
  - Yeux qui clignent
  - Sourire animé
  - Pulse du cercle de fond
  - Rotation de l'arc orange
  - Étoiles scintillantes

## 🔄 Remplacement

Pour remplacer par un GIF animé :

1. Créer/obtenir un GIF animé (recommandé 200x200px)
2. Le copier dans `/public/` avec le nom `avatar_alpha_gif.gif`
3. Le GIF sera automatiquement utilisé en priorité
4. Le SVG restera comme fallback

## ✅ Test

Vérifier que le fichier est accessible :
```
http://localhost:5173/avatars/alpha-animated.svg
```

En production :
```
https://votre-domaine.com/avatars/alpha-animated.svg
```
