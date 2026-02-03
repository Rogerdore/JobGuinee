# Guide du système de contenu d'offres d'emploi

## Vue d'ensemble

Ce système gère l'import et la structuration des contenus d'offres d'emploi avec une approche intelligente qui prépare l'exploitation IA future.

## Architecture du système

### 1. Comportement intelligent par type de fichier

#### 📝 Fichiers Word/TXT (Extraction de texte)

**Types concernés :** `.docx`, `.txt`

**Comportement :**
- Le texte est automatiquement extrait
- Il devient éditable dans l'éditeur
- Le formatage (titres, paragraphes, listes) est préservé
- Le contenu est directement exploitable par l'IA

**Cas d'usage :**
- Import d'une description de poste existante
- Copie d'un template Word
- Réutilisation de contenus

**Stockage :**
```html
<div class="bg-green-50 ...">
  <p>📝 Texte extrait de : job-description.docx</p>
</div>
<p>Nous recherchons un développeur...</p>
<ul>
  <li>Mission 1</li>
  <li>Mission 2</li>
</ul>
```

#### 📄 Fichiers PDF (Blocs visuels)

**Types concernés :** `.pdf`

**Comportement :**
- Affiché comme bloc visuel distinct
- PAS d'extraction automatique du texte
- Manipulable (suppression, positionnement)
- Métadonnées stockées pour l'IA

**Cas d'usage :**
- Fiche de poste officielle
- Document RH détaillé
- Plaquette entreprise

**Stockage :**
```html
<div
  class="pdf-visual-block"
  data-block-type="pdf"
  data-block-id="pdf-block-1234567890"
  data-file-name="fiche-poste-rh.pdf"
  data-file-size="245678"
  data-file-type="application/pdf"
>
  [Contenu visuel du bloc PDF]
</div>
```

#### 🖼️ Fichiers Images (Blocs visuels)

**Types concernés :** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`

**Comportement :**
- Affichées comme blocs visuels
- Redimensionnables et manipulables
- Légende avec nom de fichier
- Métadonnées pour l'IA

**Cas d'usage :**
- Logo entreprise
- Photo du lieu de travail
- Schéma d'organisation
- Infographie

**Stockage :**
```html
<div class="my-4 border-2 border-blue-200 ...">
  <img
    src="data:image/png;base64,..."
    alt="bureau-conakry.jpg"
    class="w-full h-auto"
  />
  <div class="px-3 py-2 bg-gray-50">
    <p>📷 bureau-conakry.jpg</p>
  </div>
</div>
```

### 2. Système d'agrégation des données

Le service `jobDataAggregatorService.ts` collecte TOUTES les données du formulaire :

```typescript
{
  // Données structurées
  formData: {
    title: "Ingénieur Logiciel",
    category: "IT",
    location: "Conakry",
    contract_type: "CDI",
    // ... tous les champs du formulaire
  },

  // Blocs de contenu
  descriptionBlocks: [
    { type: 'text', content: '...', metadata: {...} },
    { type: 'pdf', content: '[PDF: fiche-poste.pdf]', metadata: {...} },
    { type: 'image', content: '[Image: logo.png]', metadata: {...} }
  ],

  // Texte consolidé pour l'IA
  fullTextContent: `
    Titre : Ingénieur Logiciel
    Catégorie : IT
    Localisation : Conakry
    Description : Nous recherchons...
    Compétences : Python, React, SQL
    Documents PDF joints : fiche-poste.pdf
    ...
  `,

  // Données optimisées pour l'IA
  aiReadyData: {
    jobTitle: "Ingénieur Logiciel",
    skills: ["Python", "React", "SQL"],
    fullContent: "...",
    hasAttachments: true,
    // ... toutes les données structurées
  }
}
```

### 3. Exploitation par l'IA

#### 🧠 IA de résumé d'offre

**Source de données :** `aiReadyData.fullContent`

**Contient :**
- Titre et catégorie
- Description complète
- Missions et responsabilités
- Profil recherché
- Compétences requises
- Informations entreprise
- Salaire et avantages
- Références aux fichiers attachés

**Utilisation :**
```typescript
import { aggregateJobData, generateJobSummary } from './services/jobDataAggregatorService';

const aggregated = aggregateJobData(formData);
const summary = generateJobSummary(aggregated);
// → "Ingénieur Logiciel (CDI) à Conakry chez TechCorp - 3-5 ans d'expérience..."
```

#### 🎯 Matching avancé candidats ↔ offres

**Source de données :** `aiReadyData`

**Critères de matching :**
- Compétences (`aiReadyData.skills`)
- Expérience (`aiReadyData.experienceLevel`)
- Éducation (`aiReadyData.educationLevel`)
- Langues (`aiReadyData.languages`)
- Localisation (`aiReadyData.location`)
- Secteur (`aiReadyData.company.sector`)

**Score de qualité :**
```typescript
import { validateJobDataForAI } from './services/jobDataAggregatorService';

const validation = validateJobDataForAI(aggregated);
// → { isValid: true, missingFields: [], score: 85 }
```

#### 📧 Génération automatique d'emails

**Source de données :** `aiReadyData` + `fullTextContent`

**Templates générés :**
- Email de confirmation au recruteur
- Email aux candidats matchés
- Rappels de candidature
- Notifications de clôture

**Variables disponibles :**
```typescript
{
  jobTitle: aggregated.aiReadyData.jobTitle,
  company: aggregated.aiReadyData.company.name,
  location: aggregated.aiReadyData.location,
  deadline: formData.deadline,
  benefits: aggregated.aiReadyData.benefits.join(', '),
  // ... toutes les données structurées
}
```

## Validation du contenu

### Aucun minimum de caractères requis

Le champ description peut être :
- Vide temporairement
- Rempli uniquement par des blocs (PDF + images)
- Rempli uniquement par du texte
- Combinaison texte + blocs

La validation se fait au niveau global du formulaire, pas sur la longueur.

### Score de qualité pour l'IA

```typescript
const validation = validateJobDataForAI(aggregatedData);

if (validation.score < 50) {
  // Avertir le recruteur que l'offre manque d'informations
  // mais permettre quand même la publication
}
```

**Barème :**
- Titre : 20 points
- Description : 20 points
- Localisation : 15 points
- Compétences : 15 points
- Catégorie : 10 points
- Expérience : 10 points
- Entreprise : 10 points

**Total : 100 points**
- ≥ 80 : Excellent pour l'IA
- 50-79 : Bon pour l'IA
- < 50 : Données insuffisantes (mais publication autorisée)

## Ordre et structure

### Conservation de l'ordre défini

L'ordre texte ↔ blocs défini par le recruteur est conservé :

```html
<p>Introduction...</p>
<div class="pdf-visual-block">...</div>
<p>Suite de la description...</p>
<div class="image-block">...</div>
<p>Conclusion...</p>
```

### Métadonnées de position

Chaque bloc stocke sa position :

```typescript
{
  type: 'pdf',
  content: '[PDF: document.pdf]',
  metadata: {
    blockId: 'pdf-block-xyz',
    fileName: 'document.pdf',
    position: 2  // Bloc en 3ème position
  }
}
```

## Stockage en base de données

### Champ `description`

Stocke le HTML complet avec :
- Texte éditable
- Blocs PDF avec métadonnées
- Blocs images avec métadonnées
- Ordre préservé

### Champs complémentaires (suggéré)

```sql
-- Table jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS content_metadata JSONB;
-- Stocke les métadonnées extraites pour accès rapide

UPDATE jobs SET content_metadata = '{
  "blocks": [
    {"type": "pdf", "fileName": "doc.pdf", "blockId": "pdf-123"},
    {"type": "image", "fileName": "logo.png", "blockId": "img-456"}
  ],
  "hasAttachments": true,
  "attachmentCount": 2,
  "textWordCount": 345,
  "aiQualityScore": 85
}'::jsonb
WHERE id = 'job-id';
```

## Flux complet

### 1. Création d'offre

```
Recruteur saisit le formulaire
  ↓
Import fichiers Word/TXT → Extraction texte → Éditable
Import fichiers PDF/Images → Blocs visuels → Métadonnées
  ↓
Sauvegarde en base
  ↓
Agrégation des données (jobDataAggregatorService)
  ↓
Validation qualité IA (score calculé)
```

### 2. Exploitation IA

```
Offre publiée
  ↓
IA Résumé: aggregateJobData(formData).fullTextContent
  ↓
IA Matching: aggregateJobData(formData).aiReadyData
  ↓
IA Emails: aggregateJobData(formData).aiReadyData + templates
```

### 3. Affichage candidat

```
Candidat consulte l'offre
  ↓
Affichage HTML avec blocs
  ↓
Texte éditable rendu normalement
Blocs PDF affichés visuellement
Blocs images affichés redimensionnés
  ↓
Ordre et structure préservés
```

## Sécurité

### Validation des fichiers

- **Taille max PDF :** 15 MB
- **Taille max images :** 5 MB
- **Types autorisés :** `.pdf`, `.docx`, `.jpg`, `.png`, `.gif`, `.webp`, `.svg`, `.txt`
- **Sanitization HTML :** Appliquée avant sauvegarde

### Protection des données

- Blocs stockés avec ID unique
- Métadonnées nettoyées
- Pas d'exécution de code dans les blocs
- Validation côté serveur avant insertion

## Migration progressive

### Phase 1 : Import amélioré ✅

- Comportement différencié Word/PDF/Images
- Blocs visuels pour PDF/Images
- Métadonnées dans les blocs

### Phase 2 : Agrégation données ✅

- Service `jobDataAggregatorService`
- Extraction métadonnées
- Validation qualité IA

### Phase 3 : Exploitation IA (À venir)

- IA de résumé automatique
- Matching candidats avancé
- Génération emails personnalisés

## Exemples d'utilisation

### Exemple 1 : Recruteur importe Word + PDF

```typescript
// 1. Import fichier Word
handleFileImport(wordFile);
// → Texte extrait, éditable
// → Header vert : "📝 Texte extrait de : job-description.docx"

// 2. Import fichier PDF
handleFileImport(pdfFile);
// → Bloc visuel créé
// → Métadonnées : { type: 'pdf', fileName: 'conditions.pdf', ... }

// 3. Sauvegarde formulaire
const aggregated = aggregateJobData(formData);
// → fullTextContent contient le texte + référence au PDF
// → aiReadyData structure toutes les données
```

### Exemple 2 : IA génère un résumé

```typescript
import { aggregateJobData, generateJobSummary } from './services/jobDataAggregatorService';

const aggregated = aggregateJobData(formData);
const summary = generateJobSummary(aggregated);

console.log(summary);
// → "Ingénieur DevOps (CDI) à Conakry chez TechAfrica - 5-10 ans d'expérience - Compétences: Kubernetes, AWS, Terraform"
```

### Exemple 3 : Matching candidat

```typescript
const aggregated = aggregateJobData(formData);
const validation = validateJobDataForAI(aggregated);

if (validation.score >= 70) {
  // Matching IA activé
  const matchingResults = await matchCandidates(aggregated.aiReadyData);
}
```

## Support et évolutivité

### Ajout de nouveaux types de fichiers

Pour ajouter un nouveau type :

1. Ajouter le type dans `accept` de l'input
2. Créer la fonction d'extraction/création de bloc
3. Ajouter le type dans `JobContentBlock`
4. Mettre à jour `extractContentBlocks`

### Amélioration du scoring IA

Modifier `validateJobDataForAI` :

```typescript
// Ajouter un nouveau critère
if (aggregatedData.aiReadyData.benefits.length > 0) score += 5;
```

### Nouveaux cas d'usage IA

Utiliser `aggregateJobData` comme source unique :

```typescript
// Nouvelle fonctionnalité : traduction automatique
const aggregated = aggregateJobData(formData);
const translated = await translateJob(aggregated.fullTextContent, 'en');
```

## Conclusion

Ce système offre :

✅ Flexibilité maximale pour le recruteur
✅ Import intelligent selon le type de fichier
✅ Données structurées pour l'IA
✅ Validation sans contrainte de longueur
✅ Évolutivité et extensibilité
✅ Conservation de l'ordre et de la structure
✅ Exploitation complète des données du formulaire

**Rien n'est cassé, tout est amélioré progressivement.**
