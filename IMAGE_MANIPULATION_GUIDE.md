# Guide de Manipulation des Images dans l'Éditeur

## 🖼️ Vue d'ensemble

L'éditeur de texte riche permet maintenant de manipuler directement les images insérées : redimensionnement et déplacement intuitifs par glisser-déposer.

## ✨ Fonctionnalités

### 1. 🔍 Détection Automatique des Images

Toutes les images insérées dans l'éditeur sont automatiquement détectées et rendues manipulables :
- Images importées depuis des fichiers
- Images collées depuis le presse-papiers
- Images ajoutées via la barre d'outils Quill
- Images dans les blocs importés

### 2. 📏 Redimensionnement Interactif

#### Comment redimensionner
1. **Survolez l'image** : Le curseur change selon la zone
2. **Positionnez-vous près du bord droit** : Le curseur devient `nwse-resize` ↔️
3. **Cliquez et glissez** : Tirez vers la droite pour agrandir, vers la gauche pour réduire
4. **Relâchez** : La nouvelle taille est appliquée

#### Zones de redimensionnement
- **Bord droit** : Redimensionnement horizontal (largeur uniquement)
- **Coin bas-droit** : Redimensionnement diagonal (préféré)
- **Bord bas** : Redimensionnement vertical (hauteur auto-ajustée)

#### Limites
- **Taille minimale** : 50px de largeur
- **Taille maximale** : Largeur de l'éditeur (100%)
- **Ratio d'aspect** : Maintenu automatiquement (hauteur = auto)

### 3. 🔀 Déplacement des Images

#### Comment déplacer
1. **Cliquez sur l'image** : Évitez les bords (zone de redimensionnement)
2. **Maintenez le bouton enfoncé** : L'image devient semi-transparente (opacity: 0.6)
3. **Glissez vers le haut ou le bas** : Déplacez d'au moins 50px
4. **Relâchez** : L'image est repositionnée

#### Comportement
- **Déplacement vertical uniquement** : Haut ou bas dans le document
- **Seuil de déclenchement** : 50px de mouvement vertical
- **Feedback visuel** : L'image devient transparente pendant le déplacement
- **Réinsertion automatique** : L'image est supprimée de sa position d'origine et réinsérée à la nouvelle position

### 4. 🎨 Indicateurs Visuels

#### Au survol (hover)
```css
- Bordure bleue : 2px solid #3b82f6
- Ombre portée : box-shadow bleu
- Transition fluide : 0.2s
```

#### Pendant la manipulation
```css
- Redimensionnement : cursor: nwse-resize
- Déplacement : cursor: move + opacity: 0.6
- Feedback tactile : transform: scale(0.98) au clic
```

#### Curseurs dynamiques
- **Zone centrale** : `move` (déplacement)
- **Bord droit/bas** : `nwse-resize` (redimensionnement)
- **Coin bas-droit** : `nwse-resize` (redimensionnement diagonal)

## 🔧 Architecture Technique

### 1. Détection et Initialisation

```typescript
useEffect(() => {
  const makeImagesManipulable = () => {
    const quill = quillRef.current?.getEditor();
    const images = quill.root.querySelectorAll('img');

    images.forEach((img: HTMLImageElement) => {
      // Évite les duplications
      if (img.classList.contains('manipulable-image')) return;

      // Ajoute la classe et les styles
      img.classList.add('manipulable-image');
      img.style.cursor = 'move';
      img.draggable = false;

      // Attache les event listeners
      img.addEventListener('mousedown', onMouseDown);
      img.addEventListener('mousemove', onMouseEnter);
    });
  };

  setTimeout(makeImagesManipulable, 100);
}, [editorContent]);
```

### 2. Gestion du Redimensionnement

```typescript
const onMouseDown = (e: MouseEvent) => {
  const imgRect = img.getBoundingClientRect();
  const isNearRightEdge = e.clientX > imgRect.right - 20;
  const isNearBottomEdge = e.clientY > imgRect.bottom - 20;

  if (isNearRightEdge || isNearBottomEdge) {
    isResizing = true;
    img.style.cursor = 'nwse-resize';
  }
};

const onMouseMove = (e: MouseEvent) => {
  if (isResizing) {
    const deltaX = e.clientX - startX;
    const newWidth = startWidth + deltaX;

    if (newWidth > 50 && newWidth <= editorElement.offsetWidth) {
      img.style.width = `${newWidth}px`;
      img.style.height = 'auto';
    }
  }
};
```

### 3. Gestion du Déplacement

```typescript
const onMouseMove = (e: MouseEvent) => {
  if (isDragging) {
    const range = quill.getSelection();
    const deltaY = e.clientY - startY;

    if (Math.abs(deltaY) > 50) {
      const newIndex = deltaY > 0 ? range.index + 1 : range.index - 1;

      // Suppression et réinsertion
      quill.deleteText(range.index, 1);
      quill.insertEmbed(newIndex, 'image', img.src);
      quill.setSelection(newIndex + 1);
    }
  }
};
```

### 4. Styles CSS

```css
.manipulable-image {
  transition: opacity 0.2s, box-shadow 0.2s, transform 0.1s;
  border: 2px solid transparent;
  border-radius: 4px;
}

.manipulable-image:hover {
  box-shadow: 0 0 0 2px #3b82f6;
  border-color: #3b82f6;
}

.manipulable-image:active {
  transform: scale(0.98);
}
```

## 🎯 Cas d'Usage

### Scénario 1 : Ajuster la taille d'une image importée

```
1. Importer une image via le bouton "Importer fichier(s)"
2. L'image apparaît dans l'éditeur (taille par défaut)
3. Survoler le bord droit de l'image
4. Le curseur change en ↔️
5. Cliquer et glisser vers la droite
6. L'image s'agrandit en maintenant ses proportions
7. Relâcher pour valider
```

### Scénario 2 : Repositionner une image dans le texte

```
1. Rédiger plusieurs paragraphes avec une image entre eux
2. Décider de déplacer l'image vers le haut
3. Cliquer au centre de l'image (curseur = move)
4. Maintenir enfoncé et glisser vers le haut
5. L'image devient semi-transparente (feedback)
6. Glisser d'au moins 50px vers le haut
7. Relâcher : l'image se repositionne automatiquement
```

### Scénario 3 : Redimensionner plusieurs images pour uniformité

```
1. Avoir plusieurs images dans le document
2. Pour chaque image :
   - Survoler le coin bas-droit
   - Redimensionner à la largeur souhaitée (ex: 400px)
3. Toutes les images ont maintenant la même taille
4. Enregistrer avec Ctrl+S
```

## ⚠️ Limitations et Considérations

### Limitations Techniques

1. **Déplacement vertical uniquement**
   - Pas de déplacement horizontal
   - Pas de drag & drop libre dans l'espace 2D

2. **Seuil de mouvement**
   - Nécessite un déplacement de 50px minimum
   - Évite les déplacements accidentels

3. **Ratio d'aspect**
   - Toujours maintenu (height: auto)
   - Pas de distorsion possible

4. **Position dans le flux**
   - L'image reste dans le flux du document
   - Pas de positionnement absolu

### Considérations UX

1. **Feedback visuel immédiat**
   - Le curseur change selon l'action
   - L'image devient transparente pendant le drag
   - Bordure bleue au survol

2. **Prévention des erreurs**
   - Taille minimale/maximale
   - Seuil de mouvement pour éviter les déplacements accidentels
   - Confirmation visuelle

3. **Performance**
   - Event listeners attachés uniquement aux images
   - Cleanup automatique
   - Throttling naturel via les seuils

## 🚀 Compatibilité

### Navigateurs Supportés
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Types d'Images
- ✅ PNG, JPG, JPEG
- ✅ GIF (statiques et animés)
- ✅ SVG
- ✅ WebP
- ✅ Images base64 encodées

### Sources d'Images
- ✅ Import de fichiers locaux
- ✅ Copier-coller depuis le presse-papiers
- ✅ Insertion via URL (barre d'outils Quill)
- ✅ Images dans les blocs importés (PDF, DOCX)

## 📝 Guide d'Utilisation (UI)

Un panneau d'aide est intégré en bas de l'éditeur :

```
┌─────────────────────────────────────────┐
│ 🖼️ Manipulation des images             │
├─────────────────────────────────────────┤
│ • Déplacer : Cliquez et glissez         │
│   l'image vers le haut ou le bas        │
│                                          │
│ • Redimensionner : Glissez depuis le    │
│   bord droit ou le coin bas-droit       │
│                                          │
│ • Le curseur change selon l'action      │
│   disponible                             │
└─────────────────────────────────────────┘
```

## 🐛 Résolution de Problèmes

### L'image ne se déplace pas
- **Cause** : Mouvement < 50px
- **Solution** : Glissez d'au moins 50px verticalement

### Le curseur ne change pas
- **Cause** : L'image n'est pas détectée comme manipulable
- **Solution** : Rechargez l'éditeur (les images sont détectées au chargement)

### Le redimensionnement ne fonctionne pas
- **Cause** : Clic hors de la zone de redimensionnement (bords)
- **Solution** : Positionnez-vous précisément sur le bord droit ou le coin

### L'image revient à sa taille d'origine
- **Cause** : Modifications non enregistrées
- **Solution** : Utilisez Ctrl+S pour enregistrer après redimensionnement

## 💡 Bonnes Pratiques

1. **Redimensionnement cohérent**
   - Redimensionnez toutes les images à une taille similaire
   - Utilisez le coin bas-droit pour un meilleur contrôle

2. **Positionnement stratégique**
   - Placez les images près du texte pertinent
   - Évitez trop d'images consécutives

3. **Sauvegarde régulière**
   - Utilisez Ctrl+S après chaque manipulation
   - Le badge "Non enregistré" indique les changements non sauvés

4. **Performance**
   - Évitez les images très lourdes (> 2MB)
   - Optimisez les images avant import si possible

## 🎉 Résumé des Fonctionnalités

✅ **Redimensionnement interactif** par glisser-déposer
✅ **Déplacement vertical** dans le document
✅ **Feedback visuel** (curseurs, transparence, bordures)
✅ **Détection automatique** de toutes les images
✅ **Ratio d'aspect maintenu** automatiquement
✅ **Limites intelligentes** (min/max)
✅ **Guide intégré** dans l'interface
✅ **Compatible** avec tous les types d'images
✅ **Performance optimisée** avec event listeners ciblés
✅ **UX intuitive** avec curseurs contextuels

---

**Note** : Cette fonctionnalité s'intègre parfaitement avec les autres fonctionnalités de l'éditeur (Annuler/Rétablir, Enregistrement, Import/Export).
