# 🖼️ Sources d'images pour la section Hero

## Images recommandées : Employés noirs professionnels souriants

### Option 1 : Pexels (Gratuit, Haute Qualité)

Recherchez sur Pexels avec ces termes :
- "black professionals office smiling"
- "african business team happy"
- "black employees working office"
- "diverse team meeting happy"

**URLs directes suggérées :**

1. **Équipe professionnelle souriante** :
   https://www.pexels.com/search/black%20professionals%20office/

2. **Employés africains au bureau** :
   https://www.pexels.com/search/african%20business%20team/

3. **Collaboration en entreprise** :
   https://www.pexels.com/search/black%20coworkers%20smiling/

### Option 2 : Unsplash (Gratuit)

https://unsplash.com/s/photos/black-professionals-office

### Option 3 : Pixabay (Gratuit)

https://pixabay.com/images/search/african%20business%20office/

## 📥 Comment procéder

### Étape 1 : Télécharger l'image

1. Allez sur Pexels ou Unsplash
2. Cherchez "black professionals office smiling"
3. Téléchargez une image en **haute résolution** (1920x1080 minimum)

### Étape 2 : Créer un GIF animé (si nécessaire)

Si vous avez plusieurs images et voulez un GIF animé :

1. Allez sur https://ezgif.com/maker
2. Uploadez 3-5 images similaires
3. Réglez la vitesse : 1-2 secondes par image
4. Créez le GIF
5. Téléchargez le résultat

Ou utilisez simplement une **image statique** (JPG/PNG) qui fonctionnera aussi bien.

### Étape 3 : Placer l'image

Placez votre image dans :
```
public/assets/hero/image_hero.gif
```

Ou si c'est une image statique (JPG/PNG) :
```
public/assets/hero/image_hero.jpg
```

## 🔧 Configuration automatique

Le système accepte plusieurs formats :
- GIF animé (`.gif`)
- Image statique JPEG (`.jpg`)
- Image statique PNG (`.png`)

### Pour utiliser un JPG au lieu d'un GIF

Si vous téléchargez un JPG depuis Pexels, placez-le dans :
```
public/assets/hero/image_hero.jpg
```

Et le code sera mis à jour automatiquement.

## 🎨 Recommandations visuelles

### Ambiance recherchée
- ✅ Employés souriants et professionnels
- ✅ Bureau moderne et lumineux
- ✅ Diversité et inclusion
- ✅ Ambiance positive et dynamique
- ✅ Collaboration et travail d'équipe

### Caractéristiques techniques
- **Résolution** : 1920x1080px ou supérieure
- **Format** : JPG (plus léger) ou GIF (si animé)
- **Poids** : < 2MB pour JPG, < 5MB pour GIF
- **Couleurs** : Vives et professionnelles

## 🌍 Contexte guinéen

Pour une approche plus locale, vous pouvez :
1. Utiliser des photos d'entreprises guinéennes
2. Chercher "african business professionals"
3. Ajouter des éléments de la culture guinéenne

## 💡 Exemples de recherche Pexels

```
1. "black professionals laptop smiling"
   → Professionnels avec ordinateurs

2. "african office team meeting"
   → Réunions d'équipe

3. "black business people modern office"
   → Bureau moderne

4. "african entrepreneurs happy"
   → Entrepreneurs souriants

5. "diverse team collaboration office"
   → Équipe diverse au travail
```

## 📞 Assistance

Une fois que vous avez téléchargé votre image :
1. Placez-la dans `public/assets/hero/`
2. Nommez-la `image_hero.jpg` ou `image_hero.gif`
3. Lancez `npm run build`
4. Déployez vers la production

Le système détectera automatiquement le format et l'utilisera.
