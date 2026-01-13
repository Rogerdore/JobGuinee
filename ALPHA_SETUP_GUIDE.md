# Guide d'installation rapide - Avatar Alpha

## ⚡ Installation en 3 étapes

### Étape 1 : Placer l'image de l'avatar

1. **Enregistrer l'image fournie** (homme en costume bleu) sous le nom `alpha-avatar.png`
2. **Placer le fichier** dans le dossier `/public/` du projet
3. **Vérifier le chemin** : `/public/alpha-avatar.png`

```
project/
  ├── public/
  │   ├── alpha-avatar.png  ← ICI
  │   └── ...
  ├── src/
  └── ...
```

### Étape 2 : Vérifier les dépendances

Framer Motion est déjà installé. Pour vérifier :

```bash
npm list framer-motion
```

Si absent, installer :

```bash
npm install framer-motion
```

### Étape 3 : Build et test

```bash
# Build de production
npm run build

# Ou lancer en dev
npm run dev
```

## ✅ Vérification du bon fonctionnement

Une fois le serveur lancé :

1. **Ouvrir l'application** dans le navigateur
2. **Localiser l'avatar Alpha** en bas à droite
3. **Vérifier les animations** :
   - L'avatar respire légèrement (idle)
   - Survol → effet hover + halo
   - Attendre 8s → message proactif
   - Clic → ouverture du chat

## 🎨 Image recommandée

### Spécifications
- **Format** : PNG avec fond transparent ou blanc
- **Dimensions** : 512x512px minimum (idéal : 1024x1024px)
- **Poids** : < 200KB
- **Contenu** : Photo/illustration professionnelle
  - Homme en costume bleu foncé
  - Cravate (bleu ou cyan)
  - Sourire chaleureux
  - Fond uni ou légèrement flouté

### Optimisation de l'image

Si l'image est trop lourde :

```bash
# Avec ImageMagick
convert alpha-avatar.png -resize 1024x1024 -quality 85 alpha-avatar.png

# Avec TinyPNG (en ligne)
https://tinypng.com/
```

## 🔧 Configuration avancée

### Modifier la position

Dans `src/components/chatbot/ChatbotWidget.tsx` :

```typescript
// Ligne ~103
const position = settings.position === 'bottom-left' ? 'left-6' : 'right-6';

// Pour centrer en bas :
const position = 'left-1/2 -translate-x-1/2';
```

### Modifier la taille

Dans `src/components/chatbot/ChatbotWidget.tsx` :

```typescript
// Ligne ~102
const avatarSize = style?.widget_size === 'small' ? 'small' :
                   style?.widget_size === 'large' ? 'large' : 'medium';

// Forcer une taille :
const avatarSize = 'large'; // ou 'medium', 'small'
```

### Modifier le délai d'inactivité

Dans `src/components/chatbot/ChatbotWidget.tsx` :

```typescript
// Ligne ~69
if (timeSinceActivity > 8000 && !showProactiveMessage) {
  // Changer 8000 (8 secondes) à la valeur désirée
}
```

### Modifier le message proactif

Dans `src/components/chatbot/ChatbotWidget.tsx` :

```typescript
// Ligne ~131
proactiveMessage="👋 Votre message personnalisé ici !"
```

## 🎯 Palette de couleurs personnalisée

Pour adapter les couleurs aux couleurs JobGuinée :

### Dans AlphaAvatar.tsx

```typescript
// Lignes concernées :

// Couleur de fond du bouton fermer (ligne ~142)
className="... bg-gradient-to-br from-[#0E2F56] to-[#1a4a7e] ..."

// Couleur de l'indicateur actif (ligne ~238 dans AlphaAvatar.tsx)
className="... bg-[#06B6D4] ..."

// Couleur halo hover (ligne ~201)
style={{ filter: `drop-shadow(0 0 20px rgba(14, 47, 86, 0.5))` }}
```

## 🐛 Problèmes courants

### L'image ne charge pas

**Solution 1** : Vérifier le chemin
```bash
ls public/alpha-avatar.png
# Doit afficher : public/alpha-avatar.png
```

**Solution 2** : Vider le cache
```bash
# Build fresh
rm -rf dist/
npm run build
```

**Solution 3** : Vérifier les droits
```bash
chmod 644 public/alpha-avatar.png
```

### Animations saccadées

**Solution 1** : Réduire la taille de l'image
```bash
# Si > 500KB
convert alpha-avatar.png -quality 80 alpha-avatar-optimized.png
mv alpha-avatar-optimized.png public/alpha-avatar.png
```

**Solution 2** : Désactiver animations complexes
```typescript
// Dans AlphaAvatar.tsx, ligne ~83
const prefersReducedMotion = true; // Force désactivation
```

### Fallback s'affiche au lieu de l'image

C'est normal si :
1. L'image n'est pas encore placée dans `/public/`
2. Le chemin est incorrect
3. L'image est corrompue

Le fallback (icône MessageCircle) assure que l'UX reste fonctionnelle.

## 📱 Test mobile

Pour tester sur mobile :

```bash
# Lancer le dev server
npm run dev

# Obtenir l'IP locale
ipconfig getifaddr en0  # macOS
ip addr show           # Linux

# Accéder depuis mobile
http://192.168.x.x:5173
```

Vérifier :
- ✅ Avatar responsive
- ✅ Tap fonctionne
- ✅ Animations fluides
- ✅ Message proactif lisible

## 🎉 Résultat attendu

Une fois tout configuré :

1. **Avatar professionnel** en bas à droite
2. **Animations fluides** 60fps
3. **Message proactif** après 8s d'inactivité
4. **UX engageante** et mémorable
5. **Performance optimale** < 100ms de chargement

## 📞 Support

En cas de problème :

1. Vérifier la console navigateur (F12)
2. Vérifier les logs serveur
3. Consulter `ALPHA_AVATAR_DOCUMENTATION.md`
4. Vérifier le build avec `npm run build`

---

**Prêt à donner vie à Alpha !** 🚀
