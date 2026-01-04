# Guide de Remplacement des Assets GIF - COMPLÉTÉ

## Contexte

Les assets GIF (Hero et Avatar Alpha) sont maintenant correctement configurés pour fonctionner en production après build Vite. Le code utilise des imports ES modules au lieu de chemins hardcodés.

## État Actuel - ✅ COMPLÉTÉ

### Fichiers GIF Réels en Place
Les vrais fichiers GIF ont été installés avec succès :
- `src/assets/hero/image_hero.gif` (6.2 MB - GIF 400x270) ✅
- `src/assets/chatbot/avatar_alpha_gif.gif` (3.9 MB - GIF 400x593) ✅

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

## Vérification du Build - ✅ RÉUSSI

### Build Vite Complété
Le build a été exécuté avec succès et les GIF sont maintenant dans `dist/assets/` :

```
dist/assets/avatar_alpha_gif-C1SYgnOE.gif    3.9M (GIF 400x593) ✅
dist/assets/image_hero-HXkdnzIf.gif          6.2M (GIF 400x270) ✅
```

Les fichiers ont reçu des hash uniques pour le cache-busting automatique.

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
