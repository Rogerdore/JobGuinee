# Guide de Manipulation des Images dans l'Éditeur

## 🖼️ Vue d'ensemble

L'éditeur de texte riche permet de manipuler directement les images insérées : collage depuis le presse-papiers et redimensionnement interactif.

## ✨ Fonctionnalités

### 1. 📋 Collage d'Images depuis le Presse-Papiers

**Nouvelle fonctionnalité !** Vous pouvez maintenant coller directement des images dans l'éditeur :

#### Comment coller une image
1. **Copiez une image** depuis n'importe quelle source (navigateur, explorateur de fichiers, capture d'écran)
2. **Cliquez dans l'éditeur** pour positionner le curseur
3. **Appuyez sur Ctrl+V (ou Cmd+V sur Mac)**
4. **L'image apparaît instantanément** à la position du curseur

#### Sources supportées
- ✅ Images copiées depuis un navigateur web
- ✅ Captures d'écran (outil de capture Windows, Snipping Tool)
- ✅ Images copiées depuis l'explorateur de fichiers
- ✅ Images depuis des applications (Photoshop, GIMP, etc.)
- ✅ Images copiées depuis des documents (Word, PDF, etc.)

#### Format
- L'image est automatiquement convertie en **base64**
- Aucune dépendance externe requise
- L'image est intégrée directement dans le contenu

### 2. 🔍 Détection Automatique des Images

Toutes les images insérées dans l'éditeur sont automatiquement détectées et rendues manipulables :
- Images collées depuis le presse-papiers
- Images importées depuis des fichiers
- Images ajoutées via la barre d'outils Quill
- Images dans les blocs importés

### 3. 📏 Redimensionnement Interactif

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
- État par défaut : cursor: default (pas d'interférence avec l'édition)
```

#### Curseurs dynamiques
- **Zone centrale** : `default` (édition normale du texte)
- **Bord droit/bas** : `nwse-resize` (redimensionnement)
- **Coin bas-droit** : `nwse-resize` (redimensionnement diagonal)

## 🔧 Architecture Technique

### 1. Gestion du Collage d'Images

```typescript
useEffect(() => {
  const quill = quillRef.current?.getEditor();
  if (!quill) return;

  const handlePaste = (e: ClipboardEvent) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const items = clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();

        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const range = quill.getSelection(true);

            if (range) {
              quill.insertEmbed(range.index, 'image', base64);
              quill.setSelection(range.index + 1);
              setHasUnsavedChanges(true);
            }
          };
          reader.readAsDataURL(blob);
        }
        break;
      }
    }
  };

  const editorElement = quill.root;
  editorElement.addEventListener('paste', handlePaste);

  return () => {
    editorElement.removeEventListener('paste', handlePaste);
  };
}, []);
```

### 2. Détection et Initialisation des Images

```typescript
useEffect(() => {
  const makeImagesManipulable = () => {
    const quill = quillRef.current?.getEditor();
    const images = quill.root.querySelectorAll('img');

    images.forEach((img: HTMLImageElement) => {
      // Évite les duplications avec data-attribute
      if (img.dataset.manipulable === 'true') return;

      // Marque l'image comme manipulable
      img.dataset.manipulable = 'true';
      img.classList.add('manipulable-image');
      img.draggable = false;

      // Attache les event listeners
      img.addEventListener('mousedown', onMouseDown);
      img.addEventListener('mousemove', updateCursor);
    });
  };

  setTimeout(makeImagesManipulable, 100);
}, [editorContent]);
```

### 3. Gestion du Redimensionnement

```typescript
const onMouseDown = (e: MouseEvent) => {
  const rect = img.getBoundingClientRect();
  const isNearRightEdge = e.clientX > rect.right - 15;
  const isNearBottomEdge = e.clientY > rect.bottom - 15;

  if (isNearRightEdge || isNearBottomEdge) {
    e.preventDefault();
    e.stopPropagation();

    isResizing = true;
    startX = e.clientX;
    startWidth = img.offsetWidth;

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
};

const onMouseMove = (e: MouseEvent) => {
  if (!isResizing) return;

  e.preventDefault();
  const deltaX = e.clientX - startX;
  const newWidth = startWidth + deltaX;

  if (newWidth > 50 && newWidth <= editorElement.offsetWidth) {
    img.style.width = `${newWidth}px`;
    img.style.height = 'auto';
  }
};

const onMouseUp = () => {
  if (isResizing) {
    isResizing = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    setHasUnsavedChanges(true);
  }
};
```

### 4. Styles CSS

```css
.manipulable-image {
  transition: box-shadow 0.2s;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: default !important;
}

.manipulable-image:hover {
  box-shadow: 0 0 0 2px #3b82f6;
  border-color: #3b82f6;
}

.ql-editor img.manipulable-image {
  display: inline-block;
  position: relative;
}

.ql-editor {
  cursor: text;
}
```

## 🎯 Cas d'Usage

### Scénario 1 : Coller une capture d'écran

```
1. Faire une capture d'écran (Win+Shift+S sur Windows)
2. Cliquer dans l'éditeur à l'endroit souhaité
3. Appuyer sur Ctrl+V
4. L'image de la capture apparaît instantanément
5. Redimensionner si nécessaire via les bords
6. Ctrl+S pour enregistrer
```

### Scénario 2 : Copier une image depuis un site web

```
1. Clic droit sur une image web → "Copier l'image"
2. Retourner dans l'éditeur
3. Positionner le curseur
4. Ctrl+V
5. L'image s'insère directement
6. Ajuster la taille si besoin
```

### Scénario 3 : Redimensionner une image collée

```
1. Image collée dans l'éditeur (Ctrl+V)
2. Survoler le bord droit de l'image
3. Le curseur change en ↔️
4. Cliquer et glisser vers la droite ou gauche
5. L'image se redimensionne en temps réel
6. Relâcher pour valider la nouvelle taille
7. Ctrl+S pour enregistrer
```

### Scénario 4 : Redimensionner plusieurs images pour uniformité

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
