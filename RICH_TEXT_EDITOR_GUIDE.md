# Guide de l'Éditeur de Texte Riche

## Vue d'ensemble

Le formulaire de publication d'offre d'emploi intègre maintenant un **éditeur de texte riche intelligent** avec support d'import/export de documents.

## 🎯 Fonctionnalités principales

### 1. Éditeur de texte riche (WYSIWYG)

Barre d'outils complète avec :
- **En-têtes** : H1 à H6
- **Police et taille** : Plusieurs options de polices et tailles
- **Formatage** : Gras, italique, souligné, barré
- **Couleurs** : Texte et arrière-plan
- **Listes** : Ordonnées et non ordonnées
- **Indentation** : Augmenter/diminuer
- **Alignement** : Gauche, centre, droite, justifié
- **Citations et code** : Blocs de citation et code
- **Médias** : Liens, images, vidéos
- **Script** : Exposant et indice

### 2. Import de fichiers

#### Formats supportés :
- **PDF** (.pdf)
- **Word** (.docx, .doc)
- **Images** (jpg, png, gif, etc.)
- **Texte** (.txt)

#### Processus d'import :
1. Cliquez sur la zone "Importer depuis PDF/DOCX/Image"
2. Sélectionnez votre fichier
3. Le contenu est automatiquement extrait et converti en HTML
4. Les fichiers PDF sont parsés page par page
5. Les fichiers Word sont convertis avec préservation du formatage
6. Les images sont converties en base64 et intégrées

### 3. Système de blocs

Chaque fichier importé devient un **bloc modifiable** :

#### Caractéristiques des blocs :
- **Affichage organisé** : Chaque import crée un bloc séparé
- **Icône distinctive** : PDF (rouge), DOCX (bleu), Image (vert)
- **Métadonnées** : Nom du fichier et date d'import
- **Aperçu** : Prévisualisation du contenu dans le bloc
- **Édition individuelle** : Chaque bloc peut être modifié séparément
- **Suppression** : Bouton pour supprimer un bloc spécifique

#### Actions sur les blocs :
- **👁️ Masquer/Afficher** : Cachez les blocs pour plus de clarté
- **✏️ Modifier** : Éditez le contenu avec l'éditeur riche
- **💾 Enregistrer** : Sauvegardez les modifications
- **🗑️ Supprimer** : Supprimez un bloc

### 4. Export de documents

#### Télécharger en PDF :
- Génération automatique d'un PDF formaté
- Préservation du texte (sans formatage HTML complexe)
- Fichier : `description-poste.pdf`

#### Télécharger en DOC :
- Export en format Microsoft Word compatible
- Préservation du formatage HTML de base
- Ouverture dans Word, LibreOffice, Google Docs
- Fichier : `description-poste.doc`

## 📋 Utilisation pratique

### Scénario 1 : Import d'une offre existante

```
1. Préparez votre offre d'emploi dans Word ou PDF
2. Cliquez sur "Importer depuis PDF/DOCX"
3. Le contenu apparaît dans un bloc
4. Cliquez sur "Modifier" pour ajuster le texte
5. Utilisez la barre d'outils pour formater
6. Cliquez sur "Enregistrer"
```

### Scénario 2 : Création depuis zéro

```
1. Tapez directement dans l'éditeur principal
2. Utilisez la barre d'outils pour formater
3. Ajoutez des images, liens, listes
4. Prévisualisez en temps réel
```

### Scénario 3 : Combinaison de plusieurs sources

```
1. Importez un PDF avec la description générale
2. Importez un DOCX avec les missions
3. Importez une image du logo
4. Modifiez chaque bloc individuellement
5. Le tout se combine automatiquement
```

### Scénario 4 : Export pour partage

```
1. Finalisez votre offre dans l'éditeur
2. Cliquez sur "PDF" ou "DOC" en haut
3. Le fichier se télécharge automatiquement
4. Partagez-le par email ou sur d'autres plateformes
```

## 🛠️ Technologies utilisées

- **React Quill** : Éditeur WYSIWYG
- **PDF.js** : Parsing de fichiers PDF
- **Mammoth.js** : Conversion DOCX vers HTML
- **jsPDF** : Génération de PDF
- **File Saver** : Téléchargement de fichiers

## ⚡ Avantages

1. **Gain de temps** : Réutilisez vos offres existantes
2. **Flexibilité** : Importez de multiples sources
3. **Formatage professionnel** : Éditeur riche complet
4. **Organisation** : Système de blocs clair
5. **Export facile** : PDF et DOC en un clic
6. **Modification granulaire** : Éditez bloc par bloc

## 🔧 Intégration dans le formulaire

L'éditeur remplace l'ancien champ "Présentation du poste" dans la **Section 2 : Description du poste** du formulaire de publication d'offre.

Tous les autres champs (missions, profil recherché, compétences) restent identiques.

## 💡 Conseils d'utilisation

- **Importez d'abord** : Si vous avez un document existant, commencez par l'importer
- **Modifiez par blocs** : Gardez les blocs organisés par source
- **Utilisez le formatage** : Profitez de la barre d'outils pour un rendu professionnel
- **Prévisualisez** : Vérifiez l'aperçu avant de publier
- **Exportez** : Gardez une copie locale en PDF/DOC

## 🎨 Interface utilisateur

- **Zone d'import** : Bordure en pointillés, hover bleu
- **Blocs** : Fond blanc, bordure grise, hover avec ombre
- **Boutons d'action** : Couleurs distinctives (rouge PDF, bleu DOC, vert enregistrer)
- **Éditeur** : Bordure arrondie, barre d'outils fixe en haut

## 📝 Notes techniques

- Les fichiers PDF sont lus page par page
- Les images sont converties en base64 (pas de stockage serveur)
- Le formatage HTML est préservé lors de l'export DOC
- Les blocs sont stockés en mémoire (pas de persistance automatique)
- Le contenu final est la combinaison de tous les blocs
