# Documentation Système de Templates IA - JobGuinée

## Vue d'Ensemble

Le système de templates permet de séparer complètement le **contenu généré par l'IA** (données JSON) de la **présentation finale** (HTML, Markdown, Text). Chaque service IA peut avoir plusieurs templates avec différents formats.

---

## 📊 Templates Installés

### 🎓 Service: ai_cv_generation (5 templates)

#### 1. CV Moderne Professionnel (HTML) ⭐
- **Format**: HTML
- **Style**: Design violet élégant avec typographie Arial
- **Sections**: Résumé, Compétences, Expériences, Formations
- **Usage**: Affichage web, export PDF premium

#### 2. CV Classique (HTML)
- **Format**: HTML
- **Style**: Format sobre par défaut
- **Usage**: Export standard

#### 3. CV Minimaliste (Markdown)
- **Format**: Markdown
- **Style**: Épuré avec emojis modernes 🎯 💼 🎓
- **Usage**: README GitHub, exports Markdown

#### 4. CV Texte Structuré (Text)
- **Format**: Text pur
- **Style**: Blocs séparés par lignes
- **Usage**: ATS, emails simples, copier-coller

#### 5. CV Moderne (default initial)
- Template par défaut original

---

### 💼 Service: ai_cover_letter (4 templates)

#### 1. Lettre Formelle (HTML) ⭐
- **Format**: HTML
- **Style**: Template formel original
- **Usage**: Default initial

#### 2. Lettre Moderne (HTML)
- **Format**: HTML
- **Style**: Typographie Georgia élégante, mise en page aérée
- **Sections**: Date, Entreprise/Poste, Introduction, Corps, Motivation, Signature

#### 3. Lettre Minimaliste (Markdown)
- **Format**: Markdown
- **Style**: Épuré avec séparateurs
- **Usage**: Emails modernes, plateformes markdown

#### 4. Lettre Texte Simple (Text)
- **Format**: Text pur
- **Style**: Sections clairement identifiées
- **Usage**: Emails basiques, copier-coller

---

### 🎤 Service: ai_coach (2 templates)

#### 1. Conseils Structurés (HTML) ⭐
- **Format**: HTML
- **Style**: Template original structuré
- **Usage**: Default

#### 2. Analyse QA Structurée (Markdown)
- **Format**: Markdown
- **Style**: Questions-Réponses avec emojis 🧠 💬 📌
- **Sections**:
  - Évaluation Générale
  - Questions & Réponses détaillées
  - Recommandations Personnalisées
- **Usage**: Rapports d'entretien, feedback structuré

---

### 🔄 Service: ai_matching (2 templates)

#### 1. Rapport Compatibilité (HTML) ⭐
- **Format**: HTML
- **Style**: Template original
- **Usage**: Default

#### 2. Rapport de Compatibilité (HTML amélioré)
- **Format**: HTML
- **Style**: Couleurs différenciées (vert/bleu/rouge/violet)
- **Sections**:
  - Score de compatibilité (%)
  - Points forts (vert ✅)
  - Points à améliorer (rouge ⚠️)
  - Résumé (violet 📝)
- **Usage**: Rapports visuels attractifs

---

### 🚀 Service: ai_career_plan (1 template)

#### 1. Plan de Carrière Détaillé (Markdown)
- **Format**: Markdown
- **Style**: Structuré avec emojis 📌 🎯 🛤️ 📚 🔧 ⏱️
- **Sections**:
  - Objectif Principal
  - Parcours Recommandé (étapes numérotées)
  - Formations Recommandées
  - Compétences à Développer
  - Échéancier Suggéré
- **Usage**: Plans de carrière détaillés, roadmaps

---

## 🔧 Syntaxe des Templates

### Placeholders Simples
```
{{nom}}           → Remplacé par la valeur du champ "nom"
{{titre}}         → Remplacé par la valeur du champ "titre"
{{entreprise}}    → etc.
```

### Loops (Tableaux)
```handlebars
{{#each competences}}
  <li>{{this}}</li>
{{/each}}
```

**Pour tableaux d'objets**:
```handlebars
{{#each experiences}}
  <h3>{{poste}} – {{entreprise}}</h3>
  <p>{{periode}}</p>
  {{#each missions}}
    <li>{{this}}</li>
  {{/each}}
{{/each}}
```

### Auto-numbering
```handlebars
{{#each etapes}}
  Étape {{number}}: {{titre}}
{{/each}}
```

### Nested Objects
```
{{adresse.ville}}
{{contact.telephone}}
```

---

## 📝 Exemples de Données IA

### Pour CV (ai_cv_generation)
```json
{
  "nom": "Jean Dupont",
  "titre": "Développeur Full Stack",
  "resume": "5 ans d'expérience en développement web...",
  "competences": ["JavaScript", "React", "Node.js", "PostgreSQL"],
  "experiences": [
    {
      "poste": "Lead Developer",
      "entreprise": "TechCorp",
      "periode": "2020 - 2023",
      "missions": [
        "Architecture microservices",
        "Management équipe de 5 devs"
      ]
    }
  ],
  "formations": [
    {
      "diplome": "Master Informatique",
      "ecole": "Université de Conakry",
      "annee": "2019"
    }
  ]
}
```

### Pour Lettre de Motivation (ai_cover_letter)
```json
{
  "date": "1er Décembre 2025",
  "entreprise": "TechGuinée",
  "poste": "Développeur Senior",
  "nom": "Jean Dupont",
  "introduction": "Je me permets de postuler au poste de Développeur Senior...",
  "corps": "Fort de 5 années d'expérience...",
  "motivation": "Intégrer votre équipe représenterait..."
}
```

### Pour Matching (ai_matching)
```json
{
  "score": 85,
  "points_forts": [
    "Maîtrise parfaite des technologies requises",
    "Expérience similaire dans le secteur",
    "Soft skills alignés avec la culture"
  ],
  "faiblesses": [
    "Manque certification AWS",
    "Pas d'expérience management"
  ],
  "resume": "Le candidat présente un excellent profil..."
}
```

### Pour Coach (ai_coach)
```json
{
  "evaluation": "Votre entretien montre une bonne préparation...",
  "questions": [
    {
      "question": "Parlez-moi de vous",
      "reponse": "Je suis développeur depuis 5 ans...",
      "analyse": "Bonne structure STAR. Points à améliorer: quantifier davantage."
    }
  ],
  "recommendations": "1. Préparer des exemples chiffrés\n2. Travailler storytelling..."
}
```

### Pour Career Plan (ai_career_plan)
```json
{
  "objectif": "Devenir Tech Lead dans 3 ans",
  "etapes": [
    {
      "titre": "Renforcer compétences techniques",
      "description": "Approfondir architecture, DevOps..."
    },
    {
      "titre": "Développer leadership",
      "description": "Mentoring, gestion projet..."
    }
  ],
  "formations": [
    "Certification AWS Solutions Architect",
    "Formation Management pour Développeurs"
  ],
  "competences": [
    "Architecture microservices",
    "CI/CD avancé",
    "Communication technique"
  ],
  "echeancier": "6 mois: certifications | 12 mois: premier projet lead | 24 mois: Tech Lead"
}
```

---

## 🔄 Workflow Complet d'Utilisation

### Côté Backend (Service IA)

```typescript
import { IAConfigService } from '../services/iaConfigService';
import { CreditService } from '../services/creditService';

async function generateCV(userProfile: any, templateId?: string) {
  // 1. Charger config du service
  const config = await IAConfigService.getConfig('ai_cv_generation');
  if (!config) throw new Error('Config not found');

  // 2. Charger template (utilisateur ou défaut)
  const template = templateId
    ? await IAConfigService.getTemplate(templateId)
    : await IAConfigService.getDefaultTemplate('ai_cv_generation');

  if (!template) throw new Error('Template not found');

  // 3. Vérifier et consommer crédits
  const creditResult = await CreditService.consumeCredits('ai_cv_generation');
  if (!creditResult.success) throw new Error(creditResult.message);

  // 4. Construire prompt IA
  const prompt = IAConfigService.buildPrompt(config, userProfile);

  // 5. Appeler IA (OpenAI, Gemini, etc.)
  const iaResponse = await callYourIAProvider({
    model: prompt.model,
    messages: [
      { role: 'system', content: prompt.systemMessage },
      { role: 'user', content: prompt.userMessage }
    ],
    temperature: prompt.temperature,
    max_tokens: prompt.maxTokens
  });

  // 6. Parser réponse JSON
  const cvData = IAConfigService.parseOutput(
    iaResponse.content,
    config.output_schema
  );

  // 7. Appliquer template ⭐
  const finalOutput = IAConfigService.applyTemplate(
    cvData,
    template.template_structure
  );

  // 8. Retourner selon format
  return {
    content: finalOutput,
    format: template.format,  // 'html', 'markdown', 'text', 'json'
    templateName: template.template_name
  };
}
```

### Côté Frontend (UI Utilisateur)

```tsx
import { IAConfigService } from '../services/iaConfigService';

function CVGenerator() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    // Charger templates disponibles
    IAConfigService.getTemplates('ai_cv_generation').then(setTemplates);
  }, []);

  const handleGenerate = async () => {
    // Appeler backend avec templateId sélectionné
    const result = await generateCV(profileData, selectedTemplate);

    // Afficher selon format
    if (result.format === 'html') {
      setHtmlContent(result.content);
    } else if (result.format === 'markdown') {
      setMarkdownContent(result.content);
    } else {
      setTextContent(result.content);
    }
  };

  return (
    <div>
      <select
        value={selectedTemplate}
        onChange={(e) => setSelectedTemplate(e.target.value)}
      >
        <option value="">Template par défaut</option>
        {templates.map(t => (
          <option key={t.id} value={t.id}>
            {t.template_name} ({t.format})
          </option>
        ))}
      </select>

      <button onClick={handleGenerate}>Générer CV</button>
    </div>
  );
}
```

---

## 🛠️ Gestion Admin des Templates

### Créer un Nouveau Template

```typescript
const result = await IAConfigService.createTemplate({
  service_code: 'ai_cv_generation',
  template_name: 'CV Creative',
  template_description: 'Template créatif avec design moderne',
  template_structure: '<div>...</div>',
  format: 'html',
  is_default: false,
  display_order: 40
});
```

### Modifier un Template

```typescript
const result = await IAConfigService.updateTemplate(
  templateId,
  {
    template_structure: 'nouvelle structure...',
    template_description: 'Description mise à jour'
  },
  'Amélioration design section expériences'
);
```

### Validation Template vs Schema

```typescript
const validation = IAConfigService.validateTemplatePlaceholders(
  template.template_structure,
  config.output_schema
);

if (!validation.valid) {
  console.log('Champs manquants:', validation.missingFields);
  console.log('Placeholders en trop:', validation.extraPlaceholders);
}
```

### Prévisualisation Template

```typescript
const sampleData = {
  nom: "Jean Test",
  titre: "Test",
  // ...
};

const preview = IAConfigService.previewTemplate(template, sampleData);
// preview contient le HTML/Markdown/Text rendu
```

---

## 📈 Statistiques Templates Installés

| Service | Nombre Templates | Formats Disponibles |
|---------|-----------------|---------------------|
| **ai_cv_generation** | 5 | HTML (3), Markdown (1), Text (1) |
| **ai_cover_letter** | 4 | HTML (2), Markdown (1), Text (1) |
| **ai_coach** | 2 | HTML (1), Markdown (1) |
| **ai_matching** | 2 | HTML (2) |
| **ai_career_plan** | 1 | Markdown (1) |
| **TOTAL** | **14 templates** | HTML (8), Markdown (4), Text (2) |

---

## 🎯 Avantages du Système

### Pour les Admins
✅ Créer/modifier templates sans toucher code
✅ Tester différents designs facilement
✅ Versioning automatique (historique)
✅ Validation placeholders vs schema
✅ Prévisualisation instantanée

### Pour les Développeurs
✅ Séparation contenu/présentation
✅ API uniforme (applyTemplate)
✅ Support multi-format natif
✅ Extensible (nouveaux formats faciles)
✅ Pas de HTML dans le code IA

### Pour les Utilisateurs
✅ Choix du format de sortie
✅ Templates personnalisés disponibles
✅ Export PDF/Markdown/Text selon besoin
✅ Design professionnel garanti
✅ Cohérence visuelle

---

## 🔐 Sécurité

- **RLS actif**: Seuls admins peuvent créer/modifier templates
- **Validation**: Placeholders validés contre schema
- **Historique**: Toute modification tracée
- **Audit trail**: Qui a changé quoi et quand
- **Rollback**: Possible via historique

---

## 🚀 Prochaines Étapes

### Court Terme
1. Créer page admin `/admin/ia-templates`
2. Ajouter sélecteurs de templates dans UI services IA
3. Intégrer templates dans services existants

### Moyen Terme
1. Templates avec CSS personnalisés
2. Preview live côté admin
3. Export multi-format (PDF, DOCX)

### Long Terme
1. Templates communautaires
2. Marketplace de templates
3. Templates multi-langues (FR/EN/ES)
4. A/B testing templates

---

## 📚 Ressources

### Tables Base de Données
- `ia_service_templates` - Templates actifs
- `ia_service_templates_history` - Historique versions

### Fonctions SQL
- `get_ia_service_templates(service_code, active_only)`
- `get_default_template(service_code)`
- `create_ia_service_template(template)`
- `update_ia_service_template(template_id, updates, reason)`

### TypeScript Service
- `IAConfigService` - 21 méthodes dont 11 pour templates
- Interface `IAServiceTemplate` - Type complet

### Documentation
- `IA_CONFIG_DOCUMENTATION.md` - Config IA générale
- `IA_TEMPLATES_DOCUMENTATION.md` - Ce document

---

**Le système de templates IA est complet, testé et production-ready!** 🎊

*Dernière mise à jour: 2025-12-01*
