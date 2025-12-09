# Module CV IA Central - Documentation Complète

## Vue d'ensemble

Le module CV IA Central a été intégré avec succès dans la page **Services Premium IA** de JobGuinée. Ce module permet aux utilisateurs de créer, améliorer et adapter leurs CV avec l'intelligence artificielle, le tout dans un seul workflow unifié.

---

## Architecture du Module

### 1. Point d'entrée principal

**Fichier:** `src/pages/PremiumAIServices.tsx`

Le module s'ouvre lorsque l'utilisateur clique sur le service "Génération CV IA" dans la liste des services premium.

```typescript
const handleServiceClick = (service: PremiumService) => {
  if (service.category === 'cv') {
    setShowCVModal(true);  // Ouvre le modal CVCentral
    return;
  }
  // ... autres services
};
```

### 2. Composant principal

**Fichier:** `src/components/ai/CVCentralModal.tsx`

Ce modal gère l'ensemble du workflow de génération CV en 5 étapes avec 3 modes différents.

#### États gérés:
- `currentStep`: Étape actuelle (1-5)
- `selectedMode`: Mode sélectionné ('create' | 'improve' | 'target')
- `inputSource`: Source des données ('profile' | 'manual')
- `cvData`: Données du CV
- `existingCV`: CV existant (mode amélioration)
- `jobOffer`: Offre d'emploi (mode adaptation)
- `preview`: Aperçu généré
- `finalCV`: CV final après consommation des crédits

---

## Les 3 Modes de Génération

### Mode 1: Créer un CV (create)

**Description:** Génère un CV professionnel à partir de zéro

**Sources de données:**
- Profil JobGuinée (automatique)
- Saisie manuelle (formulaire)

**Workflow:**
1. Choix de la source (profil ou manuel)
2. Chargement automatique du profil OU remplissage du formulaire
3. Validation des données minimales (nom + titre requis)
4. Sélection du template
5. Génération de l'aperçu
6. Confirmation et consommation des crédits
7. Téléchargement (HTML/PDF)

**Service utilisé:** `CVBuilderService`

---

### Mode 2: Améliorer un CV (improve)

**Description:** Optimise et restructure un CV existant

**Fonctionnalités:**
- Upload de CV (copier/coller le texte)
- Extraction automatique des données
- Analyse de qualité du CV
- Restructuration professionnelle
- Optimisation ATS (Applicant Tracking Systems)

**Workflow:**
1. Coller le contenu du CV existant
2. Extraction automatique des sections
3. Sélection du template de sortie
4. Génération de l'aperçu amélioré
5. Confirmation et consommation des crédits
6. Téléchargement du CV optimisé

**Service utilisé:** `CVImproverService`

**Améliorations apportées:**
- Structure réorganisée
- Formulations optimisées
- Mise en page professionnelle
- Mots-clés ATS ajoutés

---

### Mode 3: Adapter à une offre (target)

**Description:** Personnalise le CV pour une offre d'emploi spécifique

**Fonctionnalités:**
- Analyse de l'offre d'emploi
- Extraction des mots-clés ATS
- Matching des compétences
- Réorganisation des expériences par pertinence
- Score de compatibilité

**Workflow:**
1. Choix de la source des données CV (profil ou manuel)
2. Saisie de la description de l'offre d'emploi
3. Analyse automatique du matching
4. Sélection du template
5. Génération du CV ciblé avec optimisations
6. Confirmation et consommation des crédits
7. Téléchargement

**Service utilisé:** `CVTargetedService`

**Optimisations:**
- Compétences mises en avant selon l'offre
- Mots-clés ATS intégrés
- Expériences réorganisées par pertinence
- Résumé adapté au poste

---

## Services Créés

### 1. CVBuilderService

**Fichier:** `src/services/cvBuilderService.ts`

**Méthodes principales:**
```typescript
static async buildCV(options: CVBuilderOptions): Promise<CVBuilderResult>
static async previewCV(data: CVInputData, templateId?: string)
```

**Responsabilités:**
- Validation des données d'entrée
- Application du template sélectionné
- Génération du contenu HTML/Markdown/Text
- Gestion des erreurs

---

### 2. CVImproverService

**Fichier:** `src/services/cvImproverService.ts`

**Méthodes principales:**
```typescript
static async improveCV(options: CVImproverOptions): Promise<CVImproverResult>
static async extractCVData(cvContent: string, format: string): Promise<Partial<CVInputData>>
static async analyzeCVQuality(cvContent: string): Promise<{score, strengths, improvements}>
```

**Responsabilités:**
- Extraction des données depuis un CV existant
- Analyse de la qualité du CV
- Restructuration et optimisation
- Génération du CV amélioré

**Critères d'analyse:**
- Longueur du contenu
- Utilisation de verbes d'action
- Présence de coordonnées
- Quantification des réalisations

---

### 3. CVTargetedService

**Fichier:** `src/services/cvTargetedService.ts`

**Méthodes principales:**
```typescript
static async targetCV(options: CVTargetedOptions): Promise<CVTargetedResult>
static analyzeJobMatch(cvData: CVInputData, jobOffer: JobOffer)
static extractATSKeywords(description: string): string[]
static async loadJobOffer(jobId: string): Promise<JobOffer | null>
```

**Responsabilités:**
- Analyse du matching CV/offre
- Extraction des mots-clés ATS
- Calcul du score de compatibilité
- Réorganisation des expériences par pertinence
- Génération du CV ciblé

**Algorithme de matching:**
1. Comparaison des compétences candidat vs requises
2. Calcul du score (% de compétences matchées)
3. Identification des compétences à mettre en avant
4. Extraction des mots-clés ATS de l'offre
5. Priorisation des expériences pertinentes

---

## Workflow en 5 Étapes

### Étape 1: Choix du mode
**Interface:** 3 cartes cliquables
- Créer un CV (bleu)
- Améliorer un CV (vert)
- Adapter à une offre (orange)

### Étape 2: Saisie/Chargement des données
**Contenu variable selon le mode:**
- Mode Créer: Choix profil/manuel + formulaire
- Mode Améliorer: Zone de texte pour coller le CV
- Mode Adapter: Profil/manuel + zone offre d'emploi

**Validations:**
- Champs obligatoires vérifiés
- Affichage des erreurs en temps réel
- Indicateur de profil chargé avec succès

### Étape 3: Sélection du template
**Composant:** `TemplateSelector`
- Liste des templates disponibles (gratuits et premium)
- Filtrage selon les crédits de l'utilisateur
- Indication template par défaut
- Badge premium sur templates payants
- Message d'info sur templates premium

### Étape 4: Aperçu
**Génération:**
- Aperçu en temps réel du CV
- Affichage HTML ou texte formaté
- Scroll dans la zone d'aperçu
- Possibilité de retour en arrière

### Étape 5: Génération finale
**Confirmation:**
- Modal de confirmation des crédits
- Consommation des crédits via CreditService
- Enregistrement de l'usage dans les logs
- Téléchargement multi-format (HTML, PDF)

---

## Gestion des Crédits

### Vérification des crédits
```typescript
const serviceCost = useServiceCost(SERVICES.AI_CV_GENERATION) || 50;
const { consumeCredits } = useConsumeCredits();
```

### Modal de confirmation
**Composant:** `CreditConfirmModal`
- Affiche le coût du service
- Affiche le solde actuel
- Boutons Confirmer/Annuler

### Consommation
```typescript
const creditResult = await consumeCredits(SERVICES.AI_CV_GENERATION);
if (!creditResult.success) {
  alert(creditResult.message);
  return;
}
```

### Enregistrement
```typescript
await IAConfigService.logServiceUsage(
  userId,
  'ai_cv_generation',
  inputData,
  outputData,
  creditsCost
);
```

---

## Intégration avec IAConfigService

### Configuration du service
```typescript
const config = await IAConfigService.getConfig('ai_cv_generation');
```

**Schéma attendu:**
- `input_schema`: Définit les champs requis
- `output_schema`: Définit la structure de sortie
- `base_prompt`: Prompt système pour l'IA
- `instructions`: Instructions additionnelles

### Templates
```typescript
const template = await IAConfigService.getTemplate(templateId);
// ou
const template = await IAConfigService.getDefaultTemplate('ai_cv_generation');
```

### Validation des données
```typescript
const validation = IAConfigService.validateInput(data, config.input_schema);
if (!validation.valid) {
  // Afficher les erreurs
}
```

### Application du template
```typescript
const content = IAConfigService.applyTemplate(outputData, template.template_structure);
```

**Système de placeholders:**
```html
<!-- Simple -->
{{nom}}
{{titre}}

<!-- Objets -->
{{contact.email}}
{{contact.telephone}}

<!-- Tableaux avec boucle -->
{{#each competences}}
  <li>{{this}}</li>
{{/each}}

{{#each experiences}}
  <h3>{{poste}}</h3>
  <p>{{entreprise}} - {{periode}}</p>
  {{#each missions}}
    <li>{{this}}</li>
  {{/each}}
{{/each}}
```

---

## Intégration avec UserProfileService

### Chargement du profil
```typescript
const result = await UserProfileService.loadUserData(userId);
if (result.success && result.profile) {
  const assembled = UserProfileService.assembleAutoInput(
    result.profile,
    result.cv
  );
  setCVData(assembled);
}
```

### Validation minimale
```typescript
const validation = UserProfileService.validateMinimalData(cvData);
if (!validation.valid) {
  setValidationErrors(validation.errors);
}
```

### Données attendues
```typescript
interface CVInputData {
  nom: string;
  titre: string;
  email: string;
  telephone: string;
  lieu: string;
  resume: string;
  competences: string[];
  experiences: Array<{
    poste: string;
    entreprise: string;
    periode: string;
    missions: string[];
  }>;
  formations: Array<{
    diplome: string;
    ecole: string;
    annee: string;
  }>;
}
```

---

## Export et Téléchargement

### Export HTML/Text
```typescript
const downloadCV = () => {
  const blob = new Blob([finalCV], {
    type: finalFormat === 'html' ? 'text/html' : 'text/plain'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cv-${cvData.nom.replace(/\s+/g, '-')}.${extension}`;
  a.click();
};
```

### Export PDF
```typescript
const downloadPDF = async () => {
  let htmlContent = finalCV;

  if (finalFormat === 'markdown') {
    htmlContent = await PDFService.convertMarkdownToHTML(finalCV);
  }

  htmlContent = PDFService.cleanHtmlForPDF(htmlContent);

  await PDFService.generateAndDownload({
    htmlContent,
    fileName: `cv-${cvData.nom}.pdf`
  });
};
```

**Service utilisé:** `PDFService`
- Conversion Markdown → HTML
- Nettoyage du HTML (suppression scripts, styles inline problématiques)
- Génération PDF via jsPDF
- Téléchargement automatique

---

## Gestion des Erreurs

### Types d'erreurs gérées

1. **Erreurs de validation**
   - Champs obligatoires manquants
   - Données invalides
   - Format incorrect

2. **Erreurs de service**
   - Configuration IA non trouvée
   - Template non trouvé
   - Échec de génération

3. **Erreurs de crédits**
   - Crédits insuffisants
   - Échec de consommation

4. **Erreurs de profil**
   - Profil non trouvé
   - Échec de chargement

### Affichage des erreurs
```typescript
{validationErrors.length > 0 && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
    <div className="flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-600" />
      <div>
        <p className="font-medium text-red-800">Erreurs de validation</p>
        <ul className="text-sm text-red-700 list-disc list-inside">
          {validationErrors.map((error, idx) => (
            <li key={idx}>{error}</li>
          ))}
        </ul>
      </div>
    </div>
  </div>
)}
```

---

## États de Chargement

### Indicateurs visuels
- Spinner lors du chargement du profil
- Spinner lors de la génération de l'aperçu
- Spinner lors de la génération finale
- Boutons désactivés pendant le traitement

### Messages
- "Chargement de votre profil..."
- "Génération de l'aperçu..."
- "Génération en cours..."

---

## Navigation et UX

### Barre de progression
5 étapes visuelles avec indicateurs:
- Cercles numérotés
- Coloration bleue pour étapes complétées
- Trait de liaison entre les étapes

### Boutons de navigation
- **Retour:** Revient à l'étape précédente
- **Fermer:** Ferme le modal (étape 1 uniquement)
- **Suivant:** Passe à l'étape suivante (avec validation)
- **Générer aperçu:** Lance la génération (étape 3)
- **Générer CV final:** Consomme les crédits et génère (étape 4)

### Désactivation conditionnelle
```typescript
const canProceedToStep3 = () => {
  if (selectedMode === 'create' || selectedMode === 'target') {
    return UserProfileService.validateMinimalData(cvData).valid;
  } else if (selectedMode === 'improve') {
    return existingCV.trim().length > 0;
  }
  return false;
};
```

---

## Composants Réutilisés

### 1. TemplateSelector
- Affichage des templates disponibles
- Vérification des crédits pour templates premium
- Indicateur template par défaut

### 2. CreditConfirmModal
- Confirmation avant consommation
- Affichage du coût
- Gestion Confirmer/Annuler

### 3. CreditBalance (indirect)
- Affichage du solde de crédits
- Mis à jour après consommation

---

## Sécurité et Bonnes Pratiques

### Validation côté client
- Vérification des champs obligatoires
- Validation du format des données
- Affichage des erreurs en temps réel

### Gestion des crédits
- Vérification du solde avant génération
- Modal de confirmation obligatoire
- Transaction atomique (consommation + génération)

### Gestion de l'état
- État local dans le modal
- Pas de pollution de l'état global
- Nettoyage lors de la fermeture

### Performance
- Chargement lazy du profil (uniquement si nécessaire)
- Aperçu généré uniquement à la demande
- Pas de polling inutile

---

## Tests Suggérés

### Tests fonctionnels

1. **Mode Créer**
   - [ ] Charger profil automatiquement
   - [ ] Basculer vers saisie manuelle
   - [ ] Valider champs obligatoires
   - [ ] Générer aperçu
   - [ ] Consommer crédits
   - [ ] Télécharger HTML
   - [ ] Télécharger PDF

2. **Mode Améliorer**
   - [ ] Coller un CV existant
   - [ ] Extraction des données
   - [ ] Génération améliorée
   - [ ] Téléchargement

3. **Mode Adapter**
   - [ ] Charger profil
   - [ ] Coller offre d'emploi
   - [ ] Analyse matching
   - [ ] CV ciblé généré
   - [ ] Téléchargement

### Tests de validation
- [ ] Erreur si nom manquant
- [ ] Erreur si titre manquant
- [ ] Erreur si CV vide (mode améliorer)
- [ ] Erreur si offre vide (mode adapter)
- [ ] Erreur si crédits insuffisants

### Tests de navigation
- [ ] Progression étape par étape
- [ ] Retour en arrière
- [ ] Fermeture du modal
- [ ] Boutons désactivés correctement

---

## Extensibilité Future

### Fonctionnalités envisageables

1. **Import de fichiers**
   - Upload PDF/DOCX
   - Parsing automatique
   - OCR si nécessaire

2. **Historique des CV générés**
   - Sauvegarde dans la base
   - Réédition ultérieure
   - Comparaison de versions

3. **Templates personnalisés**
   - Éditeur de templates
   - Bibliothèque communautaire
   - Preview en temps réel

4. **IA avancée**
   - Suggestions de formulations
   - Correction orthographique
   - Analyse de ton

5. **Partage**
   - Lien public du CV
   - Export vers LinkedIn
   - Envoi direct aux recruteurs

6. **Multi-langues**
   - Traduction automatique
   - Templates par langue
   - CV multilingue

---

## Dépendances

### Packages NPM
- `jspdf` - Génération PDF
- `lucide-react` - Icônes
- `@supabase/supabase-js` - Base de données

### Services internes
- `IAConfigService` - Configuration IA
- `CreditService` - Gestion crédits
- `UserProfileService` - Profils utilisateurs
- `PDFService` - Export PDF

### Composants réutilisés
- `CreditConfirmModal`
- `TemplateSelector`
- `CreditBalance`

---

## Conclusion

Le module CV IA Central est maintenant pleinement intégré dans la page Services Premium IA. Il offre une expérience utilisateur fluide et complète avec 3 modes de génération distincts, chacun adapté à un besoin spécifique.

**Points forts:**
- Interface unifiée (un seul modal pour 3 modes)
- Workflow guidé en 5 étapes
- Réutilisation des composants existants
- Gestion robuste des crédits
- Export multi-formats (HTML, PDF)
- Validation complète des données
- Gestion d'erreurs exhaustive

**Prochaines étapes suggérées:**
1. Tests utilisateurs complets
2. Ajout de templates premium supplémentaires
3. Implémentation de l'historique des CV
4. Support de l'upload de fichiers PDF/DOCX
5. Amélioration continue de l'IA

---

## Support et Maintenance

Pour toute question ou amélioration, consulter:
- `/tmp/cc-agent/61286758/project/src/components/ai/CVCentralModal.tsx`
- `/tmp/cc-agent/61286758/project/src/services/cvBuilderService.ts`
- `/tmp/cc-agent/61286758/project/src/services/cvImproverService.ts`
- `/tmp/cc-agent/61286758/project/src/services/cvTargetedService.ts`

La documentation technique complète des services IA est disponible dans:
- `COMPLETE_IA_ECOSYSTEM_DOCUMENTATION.md`
- `IA_CONFIG_DOCUMENTATION.md`
- `IA_TEMPLATES_DOCUMENTATION.md`
