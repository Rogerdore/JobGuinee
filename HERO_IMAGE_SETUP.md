# Configuration de l'image Hero en Production

## Problème résolu

L'image GIF de la section hero n'apparaissait pas en production car elle était importée comme module JavaScript. Elle a été déplacée vers le dossier `public/` pour être servie comme ressource statique.

## Structure actuelle

```
public/
└── assets/
    └── hero/
        ├── README.md
        └── image_hero.gif  <- Votre image GIF ici
```

## Comment ajouter votre image GIF

### Option 1 : Remplacer le fichier existant

1. Placez votre fichier GIF dans `public/assets/hero/`
2. Nommez-le exactement : `image_hero.gif`
3. Lancez `npm run build`
4. Déployez vers la production

### Option 2 : Via FTP/Upload direct

Si vous déployez via FTP :

1. Après le déploiement du build, uploadez votre GIF vers :
   ```
   votre-serveur/assets/hero/image_hero.gif
   ```

2. Vérifiez qu'il est accessible via :
   ```
   https://votre-domaine.com/assets/hero/image_hero.gif
   ```

## Spécifications de l'image

### Recommandé
- **Format** : GIF animé optimisé
- **Résolution** : 1920x1080px minimum
- **Poids** : < 5MB (pour de meilleures performances)
- **FPS** : 15-30 images/seconde
- **Durée** : 3-10 secondes de boucle

### Optimisation

Pour optimiser votre GIF :
1. Utilisez https://ezgif.com/optimize
2. Réduisez le nombre de couleurs
3. Diminuez la résolution si nécessaire
4. Compressez sans perte de qualité visible

## Vérification en production

Après le déploiement :

1. **Vérifiez l'accessibilité de l'image** :
   ```bash
   curl -I https://votre-domaine.com/assets/hero/image_hero.gif
   ```
   Vous devriez obtenir un code HTTP 200

2. **Testez sur la page d'accueil** :
   - Ouvrez https://votre-domaine.com
   - Inspectez la section hero
   - Vérifiez que l'image de fond s'affiche

3. **Console du navigateur** :
   - Ouvrez les DevTools (F12)
   - Vérifiez qu'il n'y a pas d'erreur 404 pour l'image

## Solution de secours

Si l'image ne s'affiche toujours pas :

### 1. Vérifiez les permissions
```bash
chmod 644 public/assets/hero/image_hero.gif
```

### 2. Vérifiez le chemin dans le code
Le chemin utilisé dans `src/pages/Home.tsx` est :
```typescript
style={{ backgroundImage: `url('/assets/hero/image_hero.gif')` }}
```

### 3. Alternative : Utilisez une URL externe
Si vous hébergez l'image ailleurs (CDN, etc.) :
```typescript
style={{ backgroundImage: `url('https://cdn.example.com/hero.gif')` }}
```

## Build et déploiement

```bash
# 1. Placez votre image
cp votre-image.gif public/assets/hero/image_hero.gif

# 2. Build du projet
npm run build

# 3. Vérifiez que l'image est dans dist
ls -lh dist/assets/hero/image_hero.gif

# 4. Déployez le dossier dist/
```

## Notes importantes

- ✅ L'image est maintenant servie depuis `public/` (ressource statique)
- ✅ Pas besoin d'import JavaScript
- ✅ L'image sera automatiquement copiée dans `dist/` lors du build
- ✅ Le chemin `/assets/hero/image_hero.gif` est relatif à la racine du site

## Support

Si l'image ne s'affiche toujours pas après avoir suivi ces étapes, vérifiez :
1. Les logs du serveur web
2. La configuration du serveur (nginx, apache, etc.)
3. Les règles de cache et CDN
4. Les en-têtes HTTP (Content-Type: image/gif)
