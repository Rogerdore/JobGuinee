# 🎯 Module de Profil Candidat Intelligent avec IA

## 📋 Vue d'ensemble

Ce document décrit le système complet de profil candidat intelligent développé pour JobGuinée, incluant:
- Téléversement et parsing automatique de CV (PDF, DOCX, Images)
- OCR pour documents scannés
- Auto-remplissage intelligent des champs
- Suggestions IA en temps réel
- Auto-complétion avancée
- Design moderne et extensible

---

## ✅ Ce qui a été implémenté

### 1. Base de données étendue

**Migration**: `extend_candidate_profiles_for_ai_parsing.sql`

Nouveaux champs ajoutés à `candidate_profiles`:
- `desired_salary_min` / `desired_salary_max` - Fourchette salariale souhaitée
- `desired_position` - Poste recherché
- `desired_sectors` - Secteurs d'activité (array)
- `mobility` - Zones géographiques de mobilité (array)
- `availability` - Disponibilité (immediate, 1_month, 3_months, negotiable)
- `education_level` - Niveau d'études
- `languages` - Langues avec niveaux (jsonb)
- `driving_license` - Permis de conduire (array)
- `linkedin_url`, `portfolio_url`, `github_url` - Liens professionnels
- `other_urls` - Autres liens (jsonb)
- `cv_parsed_at` - Date du dernier parsing
- `cv_parsed_data` - Données brutes extraites du CV (jsonb)
- `profile_completion_percentage` - Pourcentage de complétion (calculé automatiquement)
- `ai_generated_summary` - Résumé généré par IA
- `nationality` - Nationalité

**Trigger automatique**: `calculate_profile_completion()`
- Calcule automatiquement le pourcentage de complétion du profil
- Se déclenche à chaque INSERT ou UPDATE

### 2. Service IA de Parsing CV

**Service Code**: `ai_cv_parser`
**Catégorie**: `document_processing`
**Coût**: 10 crédits

**Configuration IA**:
- Model: GPT-4
- Temperature: 0.3 (précision maximale)
- Max tokens: 3000

**Input**: Texte brut extrait du CV
**Output**: Structure JSON complète avec toutes les informations du candidat

### 3. Service CVUploadParserService

**Fichier**: `src/services/cvUploadParserService.ts`

#### Fonctionnalités principales:

**a) Extraction multi-format**:
- **PDF**: Extraction directe via pdf.js avec fallback OCR si scanné
- **DOCX**: Extraction via mammoth.js
- **Images** (JPG, PNG): OCR via Tesseract.js

**b) Pipeline de traitement**:
1. Détection automatique du type de fichier
2. Extraction de texte appropriée
3. Nettoyage et normalisation du texte
4. Envoi à l'IA pour structuration
5. Validation et mapping des données

**c) OCR intelligent**:
- Langue: Français (configurable)
- Détection automatique de PDF scannés (peu de texte)
- Conversion PDF → Image pour OCR si nécessaire

**d) Méthodes utilitaires**:
- `parseCV(file)`: Point d'entrée principal
- `generateSummary()`: Génération de résumé professionnel IA
- `suggestSkills()`: Suggestions de compétences basées sur le poste
- `validateAndCleanParsedData()`: Validation et nettoyage des données

---

## 📦 Dépendances installées

```json
{
  "tesseract.js": "^5.x",      // OCR
  "pdfjs-dist": "^5.4.449",    // Parsing PDF
  "mammoth": "^1.11.0",        // Parsing DOCX
  "docx": "^9.5.1",            // Génération DOCX
  "file-saver": "^2.0.5"       // Téléchargement fichiers
}
```

---

## 🔨 Ce qu'il reste à implémenter

### 1. Composant CVUploadWithParser

**Fichier à créer**: `src/components/profile/CVUploadWithParser.tsx`

```typescript
interface CVUploadWithParserProps {
  onParsed: (data: ParsedCVData) => void;
  onError: (error: string) => void;
}
```

**Fonctionnalités**:
- Zone de drag & drop moderne
- Prévisualisation du fichier uploadé
- Indicateur de progression du parsing
- Affichage des données extraites
- Bouton "Appliquer au formulaire"
- Support PDF, DOCX, JPG, PNG
- Limite de taille: 10 MB

**Design**:
- Card moderne avec gradient
- Icônes lucide-react (Upload, FileText, Image, CheckCircle)
- Animation de chargement pendant le parsing
- Toast notifications pour succès/erreur

### 2. Composant SmartProfileForm (v2)

**Fichier à transformer**: `src/components/forms/CandidateProfileForm.tsx`

**Structure en 11 sections**:

#### Section 1: Upload de CV (NOUVEAU)
- Composant CVUploadWithParser intégré
- Message: "Gagnez du temps! Importez votre CV et nous remplirons automatiquement les champs"
- Bouton alternatif: "Remplir manuellement"

#### Section 2: Identité & Contact
- Nom, prénom (pré-remplis depuis auth)
- Email (readonly depuis auth)
- Téléphone (avec validation format guinéen)
- Date de naissance
- Nationalité (auto-complétion)
- Photo de profil

#### Section 3: Localisation & Mobilité
- Adresse actuelle (auto-complétion Google Maps API ou liste statique)
- Ville/Région (auto-complétion villes de Guinée)
- Mobilité géographique (multi-select):
  - Conakry, Boké, Kamsar, Kindia, Kankan, Labé, Nzérékoré, Siguiri, Fria, etc.

#### Section 4: Résumé Professionnel
- Textarea riche (Quill ou TipTap)
- Boutons IA:
  - "Générer avec IA" (si vide)
  - "Améliorer avec IA" (si existant)
  - "Adapter à un poste" (modal avec nom de poste)
- Compteur de caractères (recommandé: 150-300)

#### Section 5: Poste & Objectifs
- Poste recherché (auto-complétion postes courants)
- Secteurs d'activité (multi-select avec suggestions IA)
- Disponibilité (select: Immédiate, 1 mois, 3 mois, Négociable)
- Type de contrat souhaité (CDI, CDD, Stage, Freelance)

#### Section 6: Expériences Professionnelles
- Repeater avec + / -
- Champs par expérience:
  - Poste occupé (auto-complétion)
  - Entreprise
  - Dates (début/fin avec checkbox "Poste actuel")
  - Missions (textarea ou liste à puces)
  - Secteur d'activité
- Bouton "Ajouter une expérience" avec icône
- Suggestion IA: "Améliorer la description de cette expérience"

#### Section 7: Formations & Diplômes
- Repeater
- Champs:
  - Diplôme (auto-complétion: BAC, Licence, Master, Doctorat, etc.)
  - Domaine d'études
  - Établissement
  - Année d'obtention
  - Mention (Très bien, Bien, Assez bien)
- Bouton IA: "Suggestions de formations complémentaires"

#### Section 8: Compétences & Expertise
- TagInput avec auto-complétion intelligente
- Suggestions basées sur:
  - Poste recherché
  - Expériences renseignées
  - Secteur d'activité
- Niveau par compétence (Débutant, Intermédiaire, Avancé, Expert)
- Catégories:
  - Compétences techniques
  - Soft skills
  - Outils maîtrisés

#### Section 9: Langues
- Repeater ou liste de checkboxes
- Langues courantes en Guinée: Français, Anglais, Soussou, Malinké, Peul, Arabe, Chinois
- Niveaux: Notions, Intermédiaire, Courant, Bilingue, Langue maternelle
- Certifications (TOEFL, DELF, etc.) optionnel

#### Section 10: Rémunération & Conditions
- Salaire minimum souhaité (GNF)
- Salaire maximum souhaité (GNF)
- Suggestions IA basées sur:
  - Poste
  - Années d'expérience
  - Secteur
  - Localisation

#### Section 11: Liens & Documents
- LinkedIn, Portfolio, GitHub, Autre
- Upload documents complémentaires:
  - Diplômes
  - Certificats
  - Attestations de travail
  - Permis de conduire
- Visibilité profil CVThèque (checkbox)
- Recevoir alertes emploi (checkbox)

**Features transversales**:
- Auto-sauvegarde toutes les 3 secondes (localStorage + DB)
- Indicateur de sauvegarde "Dernière sauvegarde: il y a X minutes"
- Barre de progression globale (%)
- Validations en temps réel
- Messages d'aide contextuels
- Design responsive (mobile-first)

### 3. Composants d'auto-complétion

**Fichiers à créer**:

#### `src/components/profile/AutoCompleteInput.tsx`
- Input avec dropdown de suggestions
- Recherche asynchrone
- Support clavier (↑↓ Enter Esc)
- Affichage des correspondances en gras
- Cache des suggestions

#### `src/components/profile/SkillsAutoComplete.tsx`
- TagInput spécialisé pour compétences
- Suggestions dynamiques via IA
- Niveau de compétence par tag
- Catégorisation automatique

#### `src/components/profile/LocationAutoComplete.tsx`
- Liste des villes de Guinée
- Recherche fuzzy
- Affichage avec icône de localisation

### 4. Services IA complémentaires

**Fichier à créer**: `src/services/profileAIService.ts`

```typescript
export class ProfileAIService {
  // Générer résumé professionnel optimisé
  async generateSummary(profileData: any): Promise<string>

  // Suggérer postes correspondants
  async suggestPositions(skills: string[], experience: any[]): Promise<string[]>

  // Suggérer compétences manquantes
  async suggestMissingSkills(position: string, currentSkills: string[]): Promise<string[]>

  // Suggérer fourchette salariale
  async suggestSalaryRange(position: string, experience: number, location: string): Promise<{min: number, max: number}>

  // Améliorer description d'expérience
  async improveExperienceDescription(experience: any): Promise<string>

  // Classifier secteur d'activité
  async classifySector(companyName: string, position: string): Promise<string>
}
```

### 5. Page Admin - Configuration Profil

**Fichier à créer**: `src/pages/AdminProfileFormSettings.tsx`

**Fonctionnalités**:
- Activer/désactiver sections du formulaire
- Rendre champs obligatoires ou optionnels
- Modifier ordre des sections (drag & drop)
- Activer/désactiver parsing CV
- Activer/désactiver suggestions IA
- Configurer messages d'aide
- Prévisualisation en temps réel

**Structure**:
```typescript
interface FormSectionConfig {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
  fields: FormFieldConfig[];
}

interface FormFieldConfig {
  id: string;
  label: string;
  type: string;
  required: boolean;
  enabled: boolean;
  helpText: string;
  aiSuggestionsEnabled: boolean;
}
```

**Stockage**: Table `profile_form_settings` (à créer)

### 6. Hook useCVParsing

**Fichier à créer**: `src/hooks/useCVParsing.ts`

```typescript
export function useCVParsing() {
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CVParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseCV = async (file: File) => {
    // Logique de parsing avec gestion d'état
  };

  const applyToForm = (formData: any, parsedData: ParsedCVData) => {
    // Mapping intelligent données parsées → champs formulaire
  };

  return { parsing, progress, result, error, parseCV, applyToForm };
}
```

---

## 🧪 Scénarios de test

### Test 1: Upload CV PDF classique
1. Uploader un CV PDF standard (non scanné)
2. Vérifier extraction texte correcte
3. Vérifier parsing IA
4. Vérifier mapping des champs
5. Vérifier auto-remplissage formulaire

### Test 2: Upload CV scanné (Image)
1. Uploader une image JPG de CV
2. Vérifier activation OCR
3. Vérifier qualité extraction
4. Vérifier parsing correct

### Test 3: Upload DOCX
1. Uploader CV au format DOCX
2. Vérifier extraction texte
3. Vérifier parsing

### Test 4: PDF scanné (faible texte)
1. Uploader PDF scanné
2. Vérifier détection automatique "peu de texte"
3. Vérifier fallback vers OCR
4. Vérifier résultat

### Test 5: Fichier invalide
1. Tenter upload fichier .txt ou .xls
2. Vérifier message d'erreur approprié
3. Vérifier suggestions de formats acceptés

### Test 6: Auto-complétion
1. Taper "Développ" dans poste recherché
2. Vérifier suggestions (Développeur Web, Développeur Mobile, etc.)
3. Sélectionner une suggestion
4. Vérifier suggestions de compétences automatiques

### Test 7: Génération résumé IA
1. Remplir expériences et formations
2. Cliquer "Générer résumé avec IA"
3. Vérifier qualité du résumé généré
4. Tester "Améliorer avec IA"

### Test 8: Sauvegarde automatique
1. Remplir plusieurs champs
2. Attendre 3 secondes
3. Vérifier message "Sauvegardé"
4. Rafraîchir la page
5. Vérifier conservation des données

---

## 🏗️ Architecture technique

```
src/
├── components/
│   ├── profile/
│   │   ├── CVUploadWithParser.tsx          [À créer]
│   │   ├── AutoCompleteInput.tsx            [À créer]
│   │   ├── SkillsAutoComplete.tsx           [À créer]
│   │   ├── LocationAutoComplete.tsx         [À créer]
│   │   └── ProfileCompletionWidget.tsx      [À créer]
│   │
│   └── forms/
│       └── CandidateProfileForm.tsx         [À transformer]
│
├── services/
│   ├── cvUploadParserService.ts             [✅ Créé]
│   ├── profileAIService.ts                  [À créer]
│   ├── iaConfigService.ts                   [Existant]
│   └── creditService.ts                     [Existant]
│
├── hooks/
│   ├── useCVParsing.ts                      [À créer]
│   ├── useAutoComplete.ts                   [À créer]
│   └── useProfileCompletion.ts              [À créer]
│
└── pages/
    ├── CandidateDashboard.tsx               [Existant]
    └── AdminProfileFormSettings.tsx         [À créer]
```

---

## 💾 Structure de données

### ParsedCVData (Interface TypeScript)

```typescript
{
  full_name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  nationality?: string;
  summary: string;
  experiences: Array<{
    position: string;
    company: string;
    period: string;
    start_date?: string;
    end_date?: string;
    missions: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    field?: string;
  }>;
  skills: string[];
  languages: Array<{
    language: string;
    level: string;
  }>;
  certifications: string[];
  driving_license: string[];
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  other_urls: string[];
}
```

### Stockage en BDD (candidate_profiles)

Toutes les données parsées sont stockées dans `cv_parsed_data` (jsonb) et mappées vers les colonnes appropriées.

---

## 🎨 Design Guidelines

### Palette de couleurs
- Primaire: `#0E2F56` (Bleu marine)
- Secondaire: `#FF8C00` (Orange)
- Succès: `#10B981` (Vert)
- Erreur: `#EF4444` (Rouge)
- Neutre: Échelle de gris

### Composants UI
- Tailwind CSS pour styling
- Lucide React pour icônes
- Transitions fluides (300ms)
- Hover states sur tous les éléments interactifs
- Focus states accessibles (ring)

### Responsive
- Mobile-first design
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Formulaire en colonne simple sur mobile
- Grid 2 colonnes sur desktop

### Animations
- Fade in pour sections
- Slide up pour modales
- Pulse pour indicateurs de chargement
- Bounce pour notifications

---

## 📊 KPIs et métriques

### Métriques de performance
- Temps d'extraction CV < 5 secondes
- Temps de parsing IA < 10 secondes
- Taux de succès parsing > 95%
- Précision des données extraites > 90%

### Métriques business
- % de profils complétés après upload CV
- Temps moyen de remplissage formulaire
- Taux d'utilisation des suggestions IA
- Satisfaction utilisateur

---

## 🔐 Sécurité

### Validation fichiers
- Types autorisés: PDF, DOCX, JPG, PNG
- Taille max: 10 MB
- Scan antivirus (à implémenter si production)

### Données sensibles
- Les CV ne sont PAS stockés en clair
- Seules les données structurées sont conservées
- Respect RGPD/protection données personnelles
- Option de suppression des données

### Rate limiting
- Max 10 parsings CV par heure par utilisateur
- Coût en crédits: 10 crédits par parsing
- Alertes si utilisation suspecte

---

## 🚀 Déploiement

### Checklist pré-déploiement
- [ ] Tests unitaires services
- [ ] Tests d'intégration composants
- [ ] Tests E2E scénarios complets
- [ ] Performance testing (fichiers lourds)
- [ ] Responsive testing (tous devices)
- [ ] Accessibilité (WCAG 2.1 AA)
- [ ] Build production sans erreurs
- [ ] Documentation API à jour

### Configuration production
- Activer CORS appropriés
- Configurer limites de taille fichiers serveur
- Mettre en cache suggestions fréquentes
- Monitorer usage crédits IA
- Logger les erreurs de parsing

---

## 📚 Ressources

### Documentation externe
- [Tesseract.js](https://tesseract.projectnaptha.com/)
- [PDF.js](https://mozilla.github.io/pdf.js/)
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js)
- [React Hook Form](https://react-hook-form.com/)

### Exemples de CV à tester
- CV classique PDF
- CV scanné image
- CV DOCX moderne
- CV avec photo
- CV multi-pages
- CV en anglais
- CV avec peu d'expérience

---

## ✅ Checklist d'implémentation

### Phase 1: Foundation ✅
- [x] Installer dépendances (Tesseract.js)
- [x] Étendre table candidate_profiles
- [x] Créer service IA ai_cv_parser
- [x] Créer CVUploadParserService

### Phase 2: Composants Core (À faire)
- [ ] Créer CVUploadWithParser component
- [ ] Créer AutoCompleteInput component
- [ ] Créer SkillsAutoComplete component
- [ ] Transformer CandidateProfileForm

### Phase 3: IA et suggestions (À faire)
- [ ] Créer ProfileAIService
- [ ] Intégrer suggestions temps réel
- [ ] Génération résumé IA
- [ ] Suggestions compétences

### Phase 4: Admin et configuration (À faire)
- [ ] Page AdminProfileFormSettings
- [ ] Table profile_form_settings
- [ ] Interface de configuration

### Phase 5: Tests et optimisation (À faire)
- [ ] Tests unitaires
- [ ] Tests E2E
- [ ] Optimisation performance
- [ ] Documentation utilisateur

---

## 🎯 Prochaines étapes immédiates

1. **Créer CVUploadWithParser.tsx**
   - Component d'upload avec drag & drop
   - Intégration cvUploadParserService
   - UI/UX moderne

2. **Transformer CandidateProfileForm.tsx**
   - Intégrer CVUploadWithParser en haut
   - Réorganiser en 11 sections
   - Ajouter auto-complétion basique

3. **Tester le parsing**
   - PDF simple
   - DOCX
   - Image avec OCR

4. **Créer ProfileAIService.ts**
   - Méthodes de suggestions
   - Génération résumé
   - Amélioration textes

5. **Build et déploiement**
   - npm run build
   - Tests en dev
   - Documentation finale

---

## 📞 Support et contact

Pour toute question ou problème:
- Documentation technique: ce fichier
- Code source: `src/services/cvUploadParserService.ts`
- Configuration IA: Table `ia_service_config` (service_code: `ai_cv_parser`)
- Coûts: Table `service_credit_costs`

---

**Date de création**: 10 Décembre 2025
**Version**: 1.0
**Auteur**: Équipe technique JobGuinée
**Statut**: ✅ Foundation complète | 🚧 Composants UI en cours
