# Guide de l'Éditeur de Texte Riche

## 📝 Nouveau: Description de l'Offre avec Éditeur Enrichi

Le champ **"Description de l'offre"** a été transformé en un éditeur de texte riche complet permettant de créer des offres d'emploi professionnelles avec un formatage avancé.

---

## ✨ Fonctionnalités Principales

### 1. **Formatage de Texte**
- **Gras** (Ctrl+B): Mettre le texte en gras
- **Italique** (Ctrl+I): Mettre le texte en italique
- **Souligné** (Ctrl+U): Souligner le texte
- **Taille de police**: 7 tailles disponibles (Très petit → Géant)
- **Couleur du texte**: Sélecteur de couleur personnalisé

### 2. **Alignement**
- Aligner à gauche
- Centrer
- Aligner à droite

### 3. **Listes**
- Liste à puces (non ordonnée)
- Liste numérotée (ordonnée)

### 4. **Import de Fichiers**

#### Types de fichiers supportés:
- **PDF**: Affichage des 3 premières pages avec aperçu visuel
- **Word (.doc, .docx)**: Conversion automatique en HTML formaté
- **Images**: JPG, PNG, GIF, WEBP, SVG
- **Scans**: Tous formats d'images supportés

#### Comment importer:
1. Cliquez sur le bouton **"Importer PDF/Images"**
2. Sélectionnez un ou plusieurs fichiers
3. Les fichiers sont automatiquement intégrés dans la description
4. Vous pouvez continuer à éditer autour des fichiers importés

### 5. **Copier-Coller**
- Collez du texte depuis n'importe quelle source
- Le texte est automatiquement nettoyé
- Conserve la structure de base (paragraphes, listes)

---

## 🎯 Cas d'Usage

### Scénario 1: Créer une offre depuis zéro
1. Cliquez sur **"Utiliser un modèle professionnel"** pour partir d'une structure
2. Modifiez les sections avec l'éditeur
3. Ajoutez du formatage (gras, couleurs, listes)
4. Importez des images ou PDF si nécessaire

### Scénario 2: Importer une offre existante (PDF/Word)
1. Cliquez sur **"Importer PDF/Images"**
2. Sélectionnez votre document
3. Le contenu est automatiquement intégré
4. Modifiez et formatez selon vos besoins

### Scénario 3: Copier-coller depuis un document
1. Copiez le texte depuis Word, Google Docs, etc.
2. Collez directement dans l'éditeur (Ctrl+V)
3. Appliquez le formatage souhaité
4. Ajoutez des images/scans complémentaires

### Scénario 4: Ajouter des visuels
1. Rédigez votre description
2. Cliquez sur **"Importer PDF/Images"**
3. Ajoutez des logos, photos, infographies, scans
4. Les images sont insérées directement dans le texte

---

## 💡 Conseils et Bonnes Pratiques

### Structure Recommandée
```
1. Titre du poste (H1 - Grand, Couleur bleue)
2. Informations clés (Gras)
3. PRÉSENTATION DU POSTE (H2 - Orange)
   - Paragraphe descriptif
4. MISSIONS PRINCIPALES (H2)
   - Liste à puces
5. PROFIL RECHERCHÉ (H2)
   - Paragraphe + listes
6. COMPÉTENCES CLÉS (H2)
   - Liste à puces
7. QUALIFICATIONS (H2)
   - Liste avec sous-éléments en gras
8. MODALITÉS DE CANDIDATURE (H2)
   - Liste avec informations pratiques
```

### Formatage Visuel
- **Titres de section**: Grande taille + Couleur orange (#FF8C00)
- **Titre principal**: Très grande taille + Couleur bleue (#0E2F56)
- **Mots-clés importants**: Gras
- **Listes**: Utilisez des listes à puces pour la lisibilité
- **Espacement**: Laissez des espaces entre les sections

### Import de Documents
- **PDF**: Les 3 premières pages sont affichées automatiquement
- **Images**: Optimisez la taille avant import (max 2 MB recommandé)
- **Word**: Le formatage de base est préservé (gras, italique, listes)

### Fichiers Attachés
- Chaque fichier importé apparaît dans la zone "Fichiers attachés"
- Vous pouvez supprimer un fichier en cliquant sur le X
- Les fichiers sont intégrés dans la description finale

---

## 🔧 Fonctionnalités Techniques

### Gestion du Contenu
- Le contenu est sauvegardé en **HTML enrichi**
- Les images sont converties en **data URLs** (base64)
- Les PDF sont convertis en **images** pour l'affichage
- Le contenu est **responsive** et s'adapte à tous les écrans

### Compatibilité
- ✅ PDF (.pdf)
- ✅ Word (.doc, .docx)
- ✅ Images (jpg, jpeg, png, gif, webp, svg)
- ✅ Texte simple (.txt)

### Limites
- **PDF**: Maximum 3 pages affichées (optimisation performances)
- **Taille fichier**: Recommandé < 5 MB par fichier
- **Nombre de fichiers**: Illimité, mais gardez raisonnable pour les performances

---

## ❓ FAQ

**Q: Puis-je modifier un fichier PDF importé?**
R: Non, mais vous pouvez supprimer le PDF et en importer un nouveau, ou ajouter du texte autour.

**Q: Le formatage est-il préservé lors de l'import Word?**
R: Oui, le formatage de base (gras, italique, listes, titres) est préservé.

**Q: Puis-je ajouter plusieurs images?**
R: Oui, cliquez plusieurs fois sur "Importer PDF/Images" ou sélectionnez plusieurs fichiers en une fois.

**Q: Comment supprimer une image/PDF importé?**
R: Cliquez sur le X à côté du nom du fichier dans la zone "Fichiers attachés".

**Q: Le texte collé garde-t-il son formatage?**
R: Le texte est automatiquement nettoyé, mais vous pouvez réappliquer le formatage avec l'éditeur.

---

## 🚀 Raccourcis Clavier

- **Ctrl+B**: Gras
- **Ctrl+I**: Italique
- **Ctrl+U**: Souligné
- **Ctrl+V**: Coller (nettoie automatiquement le formatage)
- **Ctrl+Z**: Annuler (navigateur)
- **Ctrl+Y**: Rétablir (navigateur)

---

## 📊 Exemple de Modèle

Voici un exemple de description d'offre bien formatée:

```html
<h1 style="color: #0E2F56;">SUPERVISEUR RESSOURCES HUMAINES</h1>
<p><strong>Catégorie:</strong> Ressources Humaines | <strong>Contrat:</strong> CDI | <strong>Postes:</strong> 1</p>

<h2 style="color: #FF8C00;">PRÉSENTATION DU POSTE</h2>
<p>Nous recherchons un Superviseur RH expérimenté pour rejoindre notre équipe dynamique...</p>

<h2 style="color: #FF8C00;">MISSIONS PRINCIPALES</h2>
<ul>
  <li>Superviser l'équipe RH (5 personnes)</li>
  <li>Gérer le recrutement de A à Z</li>
  <li>Mettre en place les politiques RH</li>
</ul>

<h2 style="color: #FF8C00;">PROFIL RECHERCHÉ</h2>
<p>Professionnel rigoureux avec 5+ ans d'expérience en gestion RH...</p>

<h2 style="color: #FF8C00;">COMPÉTENCES CLÉS</h2>
<ul>
  <li>Leadership et management d'équipe</li>
  <li>Maîtrise du droit du travail guinéen</li>
  <li>Excellent communicateur</li>
</ul>
```

---

## 🎨 Personnalisation

### Couleurs Recommandées
- **Bleu principal**: #0E2F56 (titres principaux)
- **Orange**: #FF8C00 (titres de sections)
- **Gris foncé**: #374151 (texte normal)
- **Vert**: #059669 (points positifs)
- **Rouge**: #DC2626 (urgences, avertissements)

### Tailles de Police
- **H1**: Taille 6-7 (Titre principal)
- **H2**: Taille 5 (Sous-titres)
- **Texte normal**: Taille 3
- **Notes**: Taille 2

---

## ✅ Checklist Avant Publication

- [ ] Titre clair et accrocheur
- [ ] Sections bien structurées avec titres colorés
- [ ] Listes à puces pour les missions et compétences
- [ ] Informations de contact en gras
- [ ] Images/PDF bien intégrés et visibles
- [ ] Orthographe et grammaire vérifiées
- [ ] Ton professionnel et engageant
- [ ] Date limite de candidature mentionnée
- [ ] Email de contact valide

---

**Bonne rédaction! 🎯**
