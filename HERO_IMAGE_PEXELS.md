# 🎨 Image Hero - Professionnels Africains

## ✅ Configuration actuelle

L'image hero utilise maintenant une photo de **professionnels noirs souriants dans un bureau** depuis Pexels.

### Image utilisée
- **Source** : Pexels (gratuit, usage commercial autorisé)
- **URL** : `https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg`
- **Description** : Professionnels africains souriants dans un bureau moderne
- **Résolution** : 1920px de large (optimisé automatiquement)
- **Animation** : Effet de zoom lent (20 secondes) pour donner une impression de mouvement

## 🎬 Effet d'animation

L'image a un effet d'animation subtile :
- Zoom lent de 1x à 1.05x
- Durée : 20 secondes
- Boucle infinie
- Transition fluide (ease-in-out)

Cela crée une impression de mouvement similaire à un GIF animé.

## 🔄 Alternatives disponibles

Si vous souhaitez changer l'image, voici d'autres options Pexels (déjà dans le code en commentaire) :

### Option 1 : Équipe diverse
```
https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg
```
Équipe de professionnels divers en réunion

### Option 2 : Professionnels souriants (actuelle)
```
https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg
```
Gros plan sur des employés noirs professionnels souriants

### Option 3 : Bureau moderne
```
https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg
```
Environnement de bureau moderne et lumineux

### Option 4 : Collaboration
```
https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg
```
Équipe en mode collaboration

## 📝 Comment changer l'image

Éditez le fichier `src/pages/Home.tsx` à la ligne 340 :

```typescript
style={{ backgroundImage: `url('NOUVELLE_URL_ICI')` }}
```

Remplacez par l'une des URLs alternatives ci-dessus ou utilisez votre propre image.

## 🌍 Images gratuites recommandées

### Pexels
- Recherche : "black professionals office"
- Recherche : "african business team"
- Recherche : "diverse team meeting"

### Unsplash
- Recherche : "black professionals smiling"
- Recherche : "african entrepreneurs"

### Avantages de Pexels
- ✅ Images gratuites
- ✅ Usage commercial autorisé
- ✅ Pas d'attribution requise
- ✅ CDN rapide
- ✅ Optimisation automatique avec paramètres URL

## 🎨 Paramètres d'optimisation URL Pexels

L'URL utilisée inclut des paramètres d'optimisation :
- `?auto=compress` - Compression automatique
- `&cs=tinysrgb` - Espace colorimétrique optimisé
- `&w=1920` - Largeur de 1920px

## 🚀 Déploiement

L'image est chargée directement depuis Pexels, donc :
- ✅ Pas de fichier à uploader
- ✅ Pas de stockage sur votre serveur
- ✅ CDN ultra-rapide de Pexels
- ✅ Fonctionne immédiatement en production

## 💡 Pour une image personnalisée

Si vous souhaitez utiliser votre propre image :

### Option 1 : Héberger localement
1. Placez votre image dans `public/assets/hero/custom-hero.jpg`
2. Modifiez le code pour utiliser : `url('/assets/hero/custom-hero.jpg')`

### Option 2 : Utiliser un CDN externe
1. Uploadez votre image sur un CDN (Cloudinary, ImgBB, etc.)
2. Obtenez l'URL publique
3. Utilisez cette URL dans le code

## 📊 Performance

Avantages de l'approche actuelle :
- Image optimisée automatiquement
- CDN géographiquement distribué
- Cache navigateur
- Compression automatique
- Pas de poids sur votre hébergement

## ✨ Effets visuels

L'image a une opacité de 30% pour :
- Assurer la lisibilité du texte
- Créer un effet de profondeur
- Maintenir le focus sur le contenu
- Style moderne et élégant

Le fond bleu marine (#0E2F56) avec dégradé est visible à travers l'image, créant une harmonie visuelle.

## 🔍 Licence et droits

Les images Pexels sont sous licence Pexels :
- ✅ Usage commercial autorisé
- ✅ Modification autorisée
- ✅ Pas d'attribution requise
- ✅ Utilisation gratuite

Source : https://www.pexels.com/license/

## 🎯 Résultat final

L'image montre maintenant des **professionnels africains souriants** dans un **environnement de bureau moderne**, transmettant :
- Professionnalisme
- Diversité et inclusion
- Dynamisme
- Positivité
- Excellence

Parfait pour une plateforme d'emploi guinéenne moderne !
