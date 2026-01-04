# Guide de Remplacement des Assets GIF

## Contexte

Les assets GIF (Hero et Avatar Alpha) sont maintenant correctement configurés pour fonctionner en production après build Vite. Le code utilise des imports ES modules au lieu de chemins hardcodés.

## État Actuel

### Fichiers Dummy Actuels
Les fichiers suivants sont des fichiers "dummy" de 20 bytes et **doivent être remplacés** par les vrais GIF :
- `/tmp/cc-agent/61845223/project/src/assets/hero/image_hero.gif` (20 bytes)
- `/tmp/cc-agent/61845223/project/src/assets/chatbot/avatar_alpha_gif.gif` (20 bytes)

### Code Corrigé
Les composants suivants ont été mis à jour pour utiliser les imports ES modules :

1. **AlphaAvatar.tsx** (`src/components/chatbot/AlphaAvatar.tsx`)
   ```typescript
   import alphaGif from '../../assets/chatbot/avatar_alpha_gif.gif';
   // ...
   <img src={alphaGif} alt="Alpha Avatar" />
   ```

2. **Home.tsx** (`src/pages/Home.tsx`)
   ```typescript
   import heroGif from '../assets/hero/image_hero.gif';
   // ...
   <div style={{ backgroundImage: `url(${heroGif})` }}></div>
   ```

## Instructions de Remplacement

### Étape 1 : Localiser les Vrais GIF
Les vrais fichiers GIF doivent se trouver quelque part dans votre système. Cherchez :
- Le GIF du hero/background (animation pour la section hero)
- Le GIF de l'avatar Alpha (animation du chatbot)

### Étape 2 : Remplacer les Fichiers Dummy

```bash
# Remplacer le GIF du Hero
cp /chemin/vers/votre/hero_animation.gif src/assets/hero/image_hero.gif

# Remplacer le GIF de l'Avatar Alpha
cp /chemin/vers/votre/alpha_avatar_animation.gif src/assets/chatbot/avatar_alpha_gif.gif
```

### Étape 3 : Vérifier les Fichiers
```bash
# Vérifier que les fichiers ne sont plus des dummy (doivent faire plus de 20 bytes)
ls -lh src/assets/hero/image_hero.gif
ls -lh src/assets/chatbot/avatar_alpha_gif.gif
```

### Étape 4 : Rebuild
```bash
npm run build
```

### Étape 5 : Vérifier la Génération
```bash
# Les GIF devraient être copiés dans dist/assets/ avec un hash
find dist/assets -name "*.gif"
# Exemple de sortie attendue :
# dist/assets/image_hero-a1b2c3d4.gif
# dist/assets/avatar_alpha_gif-e5f6g7h8.gif
```

## Avantages de Cette Approche

1. **Vite traite les GIF comme des modules** : Ils sont inclus dans le build et reçoivent un hash unique
2. **Cache-busting automatique** : Les noms de fichiers avec hash permettent une mise en cache optimale
3. **Pas de chemins absolus hardcodés** : Fonctionne en dev et en production
4. **Compatible avec le déploiement FTP** : Les assets sont dans dist/ et seront déployés automatiquement

## Déploiement

Une fois les vrais GIF en place et le build effectué :

1. Le workflow GitHub Actions build automatiquement le projet
2. Le contenu de `dist/` est déployé vers `public_html/` sur Hostinger
3. Les GIF avec leurs hash seront accessibles en production

## Vérification en Production

Après déploiement, vérifiez :
- La page d'accueil affiche l'animation du hero en arrière-plan
- Le chatbot Alpha affiche son animation GIF
- Les chemins dans le HTML pointent vers `/assets/xxx-hash.gif`

## Fallback

Le composant AlphaAvatar.tsx contient un fallback vers l'icône MessageCircle de Lucide en cas d'erreur de chargement du GIF.

## Structure Finale

```
src/
  assets/
    hero/
      image_hero.gif          # Vrai GIF du hero (à remplacer)
    chatbot/
      avatar_alpha_gif.gif    # Vrai GIF de l'avatar Alpha (à remplacer)
  components/
    chatbot/
      AlphaAvatar.tsx         # ✅ Utilise import ES module
  pages/
    Home.tsx                  # ✅ Utilise import ES module

dist/ (après build)
  assets/
    image_hero-[hash].gif     # GIF du hero avec hash
    avatar_alpha_gif-[hash].gif  # GIF de l'avatar avec hash
```

## Notes Importantes

- **NE PAS** utiliser le dossier `public/` pour ces GIF
- **NE PAS** utiliser de chemins absolus comme `/hero.gif`
- **TOUJOURS** importer les assets comme modules ES
- Les GIF dummy actuels (20 bytes) ne s'afficheront pas correctement
