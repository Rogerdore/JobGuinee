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

## ✅ Frontend Complet Implémenté

### 1. Composant CVUploadWithParser ✅

**Fichier créé**: `src/components/profile/CVUploadWithParser.tsx`

**Fonctionnalités implémentées**:
- ✅ Zone de drag & drop moderne avec animations
- ✅ Prévisualisation du fichier uploadé avec détails (nom, taille, type)
- ✅ Indicateur de progression du parsing (0-100%)
- ✅ Affichage des données extraites avec résumé visuel
- ✅ Support complet: PDF, DOCX, JPG, PNG
- ✅ Validation taille (max 10 MB)
- ✅ Gestion des états: idle, uploading, parsing, success, error
- ✅ Messages d'erreur détaillés et contextuels
- ✅ Intégration avec le système de crédits (vérification automatique)

**Design**:
- Card avec gradient bleu moderne
- Icônes lucide-react (Upload, FileText, Image, CheckCircle2, AlertCircle, Sparkles)
- Animations: pulse pour loading, fade-in pour résultats
- Responsive et accessible

### 2. Composant CandidateProfileForm Complètement Refactoré ✅

**Fichier transformé**: `src/components/forms/CandidateProfileForm.tsx`

**Structure en 11 sections implémentées**:

#### Section 1: Upload de CV ✅
- Composant CVUploadWithParser intégré
- Message d'aide IA visible
- Bouton "Remplir manuellement" fonctionnel
- Auto-remplissage complet après parsing

#### Section 2: Identité & Contact ✅
- Nom complet (pré-rempli depuis auth)
- Email (pré-rempli depuis auth)
- Téléphone avec validation
- Date de naissance (DatePicker)
- Genre (Select)
- Nationalité (AutoCompleteInput avec suggestions)

#### Section 3: Résumé Professionnel ✅
- Textarea pour bio professionnelle
- Badge "Détecté depuis CV" si parsé
- Compteur de caractères recommandé
- Aide contextuelle

#### Section 4: Poste & Objectifs ✅
- Poste recherché (AutoCompleteInput avec liste de postes courants)
- Secteurs d'activité (MultiSelect avec 15+ secteurs)
- Types de contrat (MultiSelect: CDI, CDD, Stage, Freelance, Alternance)
- Disponibilité (Select)

#### Section 5: Expériences Professionnelles ✅
- Repeater dynamique (add/remove)
- Champs: Poste, Entreprise, Période, Missions
- Badge indiquant le nombre d'expériences parsées
- Auto-remplissage depuis CV

#### Section 6: Formations & Diplômes ✅
- Repeater dynamique
- Champs: Diplôme, Établissement, Année
- Auto-remplissage depuis CV

#### Section 7: Compétences & Langues ✅
- **SkillsAutoComplete** avec:
  - Tags dynamiques avec catégories
  - Suggestions par domaine (Développement, RH, Finance, etc.)
  - Suggestions IA depuis le CV parsé
  - Limite de 30 compétences
  - Support clavier complet
- Langues (MultiSelect: Français, Anglais, Soussou, Malinké, Peul, etc.)

#### Section 8: Localisation & Mobilité ✅
- Adresse actuelle
- Ville (AutoCompleteInput avec villes de Guinée)
- Zones de mobilité (MultiSelect)
- Checkbox relocalisation

#### Section 9: Rémunération Souhaitée ✅
- Salaire min/max en GNF
- Type number avec validation
- Aide contextuelle (montant mensuel brut)

#### Section 10: Liens & Documents ✅
- LinkedIn, Portfolio, GitHub (inputs avec validation URL)
- Permis de conduire (MultiSelect)
- Upload CV principal
- Upload certificats
- Checkboxes: Visibilité CVThèque, Alertes emploi

#### Section 11: Validation ✅
- Checkbox conditions générales (required)
- Checkbox certification exactitude (required)
- Bouton "Enregistrer mon profil"
- Bouton "Réinitialiser"

**Features transversales implémentées**:
- ✅ Auto-sauvegarde toutes les 2 secondes (localStorage)
- ✅ Indicateur de sauvegarde avec timestamp
- ✅ Barre de progression globale (0-100%) avec calcul pondéré
- ✅ Couleur de progression dynamique (rouge < 40%, jaune 40-70%, vert > 70%)
- ✅ Validations en temps réel
- ✅ Messages d'aide contextuels
- ✅ Design responsive (grid 2 colonnes desktop, 1 colonne mobile)
- ✅ Sauvegarde en base de données Supabase
- ✅ Gestion des profils existants (update) et nouveaux (insert)

### 3. Composants d'auto-complétion Créés ✅

#### `src/components/forms/AutoCompleteInput.tsx` ✅
**Déjà existant et optimisé**:
- Input avec dropdown de suggestions filtré
- Support clavier complet (↑↓ Enter Esc Tab)
- Affichage visuel de la sélection
- Badge de correspondance exacte
- Scroll automatique vers élément sélectionné
- Performance: memo et callbacks optimisés

#### `src/components/profile/SkillsAutoComplete.tsx` ✅
**Nouvellement créé avec fonctionnalités avancées**:
- TagInput spécialisé pour compétences
- 8 catégories prédéfinies (Développement, RH, Finance, Marketing, etc.)
- Suggestions dynamiques avec icône IA
- Badge de catégorie sur chaque compétence
- Suggestions rapides par catégorie (affichées si profil vide)
- Limite de 30 compétences avec compteur
- Support complet clavier et souris
- Suppression facile avec bouton X
- Intégration avec données CV parsées

### 4. Hook useCVParsing Créé ✅

**Fichier créé**: `src/hooks/useCVParsing.ts`

**Fonctionnalités**:
```typescript
export function useCVParsing() {
  // État complet du parsing
  const state: CVParsingState = {
    isParsing: boolean,
    progress: number (0-100),
    result: CVParseResult | null,
    error: string | null,
    parsedData: ParsedCVData | null
  }

  // Parse un CV et vérifie les crédits
  const parseCV = async (file: File): Promise<boolean>

  // Mappe les données parsées vers le format formulaire
  const mapToFormData = (parsedData: ParsedCVData, currentFormData: any) => {...}

  // Reset l'état
  const reset = () => {...}

  return { ...state, parseCV, mapToFormData, reset }
}
```

**Validations implémentées**:
- ✅ Vérification fichier null
- ✅ Validation taille (max 10 MB)
- ✅ Validation type (PDF, DOCX, JPG, PNG)
- ✅ Vérification crédits avant parsing
- ✅ Gestion erreurs complète
- ✅ Progression simulée (10% → 30% → 70% → 100%)

### 5. Page Admin - Configuration Profil ✅

**Fichier créé**: `src/pages/AdminProfileFormSettings.tsx`

**Fonctionnalités implémentées**:
- ✅ Chargement configuration depuis BDD
- ✅ Paramètres globaux:
  - Toggle parsing CV
  - Toggle suggestions IA
- ✅ Liste des 11 sections avec:
  - Badge "Requis" pour sections obligatoires
  - Badge "IA activée" pour sections avec suggestions
  - Bouton Activée/Désactivée
  - Ordre d'affichage
  - Empêche désactivation des sections requises
- ✅ Messages personnalisés (3 messages éditables)
- ✅ Sauvegarde en BDD avec tracking (updated_by, updated_at)
- ✅ Messages de succès/erreur
- ✅ Bouton Actualiser
- ✅ Design moderne avec gradients et icônes
- ✅ Responsive

### 6. Table de Configuration BDD ✅

**Migration créée**: `create_profile_form_settings.sql`

**Structure**:
```sql
CREATE TABLE profile_form_settings (
  id uuid PRIMARY KEY,
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES profiles(id),
  updated_at timestamptz,
  created_at timestamptz
)
```

**Configuration initiale insérée**:
- ✅ 11 sections configurées
- ✅ Paramètres globaux définis
- ✅ Messages par défaut
- ✅ Champs de la section Identité détaillés

**Sécurité**:
- ✅ RLS activée
- ✅ Policies: admins uniquement (read, insert, update)

---

## 📊 Calcul du Pourcentage de Complétion

Le pourcentage de complétion est calculé avec un système de pondération:

```typescript
const weights = {
  identity: 15,        // Nom, email, téléphone
  professional: 20,    // Résumé + poste recherché
  experience: 20,      // Au moins 1 expérience
  education: 15,       // Au moins 1 formation
  skills: 15,          // Au moins 3 compétences
  location: 5,         // Ville renseignée
  salary: 5,           // Fourchette salariale
  links: 5,            // LinkedIn ou Portfolio
}

Total: 100%
```

**Affichage visuel**:
- < 40%: Barre rouge/orange
- 40-70%: Barre jaune
- > 70%: Barre verte

---

## 🎨 Design System Utilisé

**Couleurs**:
- Primaire: Bleu (#0E2F56 → #3B82F6)
- Succès: Vert (#10B981)
- Avertissement: Jaune (#FBBF24)
- Erreur: Rouge (#EF4444)
- IA: Jaune (#FACC15) avec icône Sparkles

**Composants réutilisés**:
- FormSection, Input, Select, MultiSelect, Textarea
- DatePicker, Upload, Checkbox, Repeater, Button
- Tous depuis `FormComponents.tsx`

**Icônes (lucide-react)**:
- User, Briefcase, GraduationCap, Award, MapPin, DollarSign, LinkIcon
- Upload, FileText, Image, Sparkles, CheckCircle2, AlertCircle, Save

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
