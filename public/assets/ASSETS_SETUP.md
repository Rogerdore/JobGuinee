# Configuration des Assets pour la Production

## Images Hero

Pour que l'image GIF de la section hero s'affiche correctement en production :

1. **Placez votre fichier GIF** dans le dossier `public/assets/hero/`
2. **Nommez le fichier** : `image_hero.gif`
3. **Vérifications** :
   - Le fichier doit être dans : `public/assets/hero/image_hero.gif`
   - L'image sera accessible via : `https://votre-domaine.com/assets/hero/image_hero.gif`

## Structure des dossiers

```
public/
├── assets/
│   ├── hero/
│   │   └── image_hero.gif    <- Votre image GIF ici
│   └── chatbot/
│       └── avatar_alpha.gif
```

## Vérification en production

Après le déploiement, vérifiez que l'image est accessible en visitant :
`https://votre-domaine.com/assets/hero/image_hero.gif`

## Alternative temporaire

Si vous n'avez pas encore l'image GIF, vous pouvez :
1. Utiliser une image JPEG/PNG statique
2. Modifier le chemin dans `src/pages/Home.tsx` ligne 333

## Optimisation

Pour de meilleures performances :
- Optimisez le GIF avec des outils comme ezgif.com
- Gardez la taille du fichier sous 5MB
- Utilisez une résolution adaptée (1920x1080 recommandé)
