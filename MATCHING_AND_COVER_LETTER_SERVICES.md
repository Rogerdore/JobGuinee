# 🎯 Services IA : Matching de Profil & Génération de Lettre de Motivation

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Service de Matching Candidat-Job](#service-de-matching-candidat-job)
3. [Service de Génération de Lettre de Motivation](#service-de-génération-de-lettre-de-motivation)
4. [Intégration et Utilisation](#intégration-et-utilisation)
5. [Cas d'usage et Scénarios](#cas-dusage-et-scénarios)
6. [API et Exemples de Code](#api-et-exemples-de-code)

---

## Vue d'ensemble

JobGuinée propose deux services IA puissants pour optimiser le processus de recrutement:

### 🎯 Matching Intelligent (ai_matching)
Calcule un score de compatibilité précis entre un profil candidat et une offre d'emploi, avec analyse détaillée des correspondances et lacunes.

### ✉️ Génération de Lettre de Motivation (ai_cover_letter)
Crée automatiquement des lettres de motivation personnalisées, optimisées et professionnelles basées sur le profil du candidat et l'offre visée.

---

## Service de Matching Candidat-Job

### 🎯 Objectif

Fournir un score de compatibilité objectif et précis entre un candidat et une offre d'emploi, accompagné d'une analyse détaillée pour aider:
- **Les candidats** à identifier les offres qui leur correspondent vraiment
- **Les recruteurs** à présélectionner rapidement les meilleurs profils
- **La plateforme** à recommander intelligemment les opportunités

### 📊 Configuration du service

**Code service**: `ai_matching`
**Catégorie**: `matching`
**Coût**: Inclus (0 crédits) pour les candidats, inclus dans l'abonnement recruteur
**Modèle IA**: GPT-4
**Température**: 0.2 (pour cohérence et précision)
**Tokens max**: 2000

### 📥 Input (Données d'entrée)

```json
{
  "profil_candidat": {
    "competences": ["JavaScript", "React", "Node.js", "PostgreSQL"],
    "experience_annees": 5,
    "formations": ["Master en Informatique", "Licence en Génie Logiciel"],
    "langues": [
      {"langue": "Français", "niveau": "natif"},
      {"langue": "Anglais", "niveau": "courant"}
    ],
    "secteur_actuel": "Technologies de l'information",
    "poste_actuel": "Développeur Full-Stack Senior"
  },
  "offre_emploi": {
    "titre": "Lead Developer React/Node.js",
    "competences_requises": ["React", "Node.js", "TypeScript", "MongoDB", "Docker"],
    "competences_souhaitees": ["GraphQL", "AWS", "CI/CD"],
    "experience_requise": 4,
    "niveau_etudes": "Bac+5",
    "langues_requises": ["Français", "Anglais"],
    "secteur": "Technologies de l'information",
    "type_contrat": "CDI",
    "localisation": "Conakry"
  }
}
```

### 📤 Output (Résultat)

```json
{
  "score_global": 87,
  "niveau_correspondance": "Très forte correspondance",
  "analyse": {
    "points_forts": [
      "Maîtrise parfaite des technologies principales (React, Node.js)",
      "Expérience supérieure aux exigences (5 ans vs 4 ans requis)",
      "Niveau d'études conforme (Master = Bac+5)",
      "Maîtrise des langues requises (Français natif, Anglais courant)",
      "Secteur d'activité identique"
    ],
    "points_a_developper": [
      "TypeScript: compétence requise non listée",
      "MongoDB: à la place de PostgreSQL (bases NoSQL)",
      "Docker: compétence requise manquante"
    ],
    "competences_correspondantes": ["React", "Node.js"],
    "competences_manquantes": ["TypeScript", "MongoDB", "Docker"],
    "competences_bonus": ["PostgreSQL (équivalent MongoDB)"],
    "score_competences": 85,
    "score_experience": 95,
    "score_formation": 90,
    "score_langues": 100
  },
  "recommandations": [
    "Suivre une formation TypeScript (disponible sur JobGuinée Formations)",
    "Se familiariser avec MongoDB et les bases NoSQL",
    "Apprendre les bases de Docker et la conteneurisation"
  ],
  "verdict": "Candidature fortement recommandée",
  "probabilite_succes": "Élevée (85-95%)",
  "conseil_personnalise": "Votre profil correspond très bien à cette offre. Dans votre lettre de motivation, mettez en avant votre expertise React/Node.js et votre capacité d'apprentissage rapide pour les technologies complémentaires (TypeScript, Docker)."
}
```

### 🎯 Calcul du score

Le score global (0-100) est calculé selon cette formule pondérée:

```
Score Global = (
  Score Compétences × 0.40 +
  Score Expérience × 0.25 +
  Score Formation × 0.20 +
  Score Langues × 0.10 +
  Score Secteur × 0.05
)
```

#### Détail des sous-scores:

**1. Score Compétences (40%)**
- Compétences requises maîtrisées: +15 points par compétence
- Compétences souhaitées maîtrisées: +5 points par compétence
- Compétences équivalentes: +10 points par équivalence
- Malus si compétence clé manquante: -20 points

**2. Score Expérience (25%)**
- Expérience >= requise: 100 points
- Expérience = requise - 1 an: 80 points
- Expérience = requise - 2 ans: 60 points
- Expérience < requise - 2 ans: 40 points
- Expérience > requise + 3 ans: Bonus +10 points

**3. Score Formation (20%)**
- Niveau exact: 100 points
- Niveau supérieur: 100 points
- Niveau inférieur de 1: 70 points
- Niveau inférieur de 2+: 40 points

**4. Score Langues (10%)**
- Toutes les langues requises maîtrisées: 100 points
- 1 langue manquante: 70 points
- 2+ langues manquantes: 40 points

**5. Score Secteur (5%)**
- Secteur identique: 100 points
- Secteur proche: 70 points
- Secteur différent: 40 points

### 🎨 Niveaux de correspondance

Le score global est traduit en niveau qualitatif:

| Score | Niveau | Badge | Signification |
|-------|--------|-------|---------------|
| 90-100 | Excellent match | 🟢⭐ | Candidature idéale, profil parfait |
| 75-89 | Très forte correspondance | 🟢 | Candidature fortement recommandée |
| 60-74 | Bonne correspondance | 🟡 | Candidature possible avec formations |
| 45-59 | Correspondance moyenne | 🟠 | Candidature risquée, lacunes importantes |
| 0-44 | Faible correspondance | 🔴 | Candidature déconseillée |

### 💡 Cas d'usage

#### 1. Pour les candidats
```typescript
// Voir le score de matching avant de postuler
const matchingScore = await getJobMatchingScore(jobId, userProfile);

if (matchingScore >= 60) {
  showApplyButton();
  displayMatchingAnalysis(matchingScore.analyse);
} else {
  showSuggestedTrainings(matchingScore.recommandations);
}
```

#### 2. Pour les recruteurs
```typescript
// Trier automatiquement les candidatures par score
const applications = await getApplicationsWithScores(jobId);
const sortedApps = applications.sort((a, b) => b.score - a.score);

// Présélectionner automatiquement les meilleurs
const shortlisted = sortedApps.filter(app => app.score >= 75);
```

#### 3. Pour la plateforme
```typescript
// Recommander des offres au candidat
const recommendedJobs = await getRecommendedJobs(candidateProfile);
// Retourne les offres avec score >= 70, triées par pertinence
```

### 🔧 Configuration avancée

**Ajustement des poids** (Admin uniquement):
```sql
UPDATE ia_service_config
SET input_schema = jsonb_set(
  input_schema,
  '{poids_competences}',
  '0.45'
)
WHERE service_code = 'ai_matching';
```

**Compétences équivalentes**:
La logique IA reconnaît automatiquement certaines équivalences:
- PostgreSQL ≈ MySQL ≈ MongoDB (bases de données)
- React ≈ Vue ≈ Angular (frameworks frontend)
- Java ≈ C# (langages orientés objet)
- AWS ≈ Azure ≈ Google Cloud (cloud providers)

---

## Service de Génération de Lettre de Motivation

### ✉️ Objectif

Générer automatiquement des lettres de motivation:
- **Personnalisées** selon le profil du candidat
- **Adaptées** à l'offre d'emploi ciblée
- **Optimisées** pour maximiser l'impact
- **Professionnelles** avec structure et ton appropriés

### 📊 Configuration du service

**Code service**: `ai_cover_letter`
**Catégorie**: `document_generation`
**Coût**: 20 crédits par génération
**Modèle IA**: GPT-4
**Température**: 0.7 (créativité contrôlée)
**Tokens max**: 2500

### 📥 Input (Données d'entrée)

```json
{
  "informations_candidat": {
    "nom_complet": "Fatoumata Camara",
    "adresse": "Quartier Ratoma, Conakry",
    "telephone": "+224 620 00 00 00",
    "email": "fatou.camara@email.com",
    "profil": {
      "titre": "Responsable Ressources Humaines",
      "experience_annees": 6,
      "competences_cles": [
        "Recrutement",
        "Gestion de la paie",
        "Formation du personnel",
        "Droit du travail guinéen",
        "SIRH (Sage, SAP)"
      ],
      "realisations_marquantes": [
        "Mise en place d'un système SIRH pour 200+ employés",
        "Réduction du turnover de 30% en 2 ans",
        "Formation de 50+ managers aux entretiens de recrutement"
      ],
      "formation_principale": "Master RH et Management, Université de Conakry"
    }
  },
  "offre_ciblee": {
    "intitule_poste": "Directeur des Ressources Humaines",
    "nom_entreprise": "Winning Consortium Guinea",
    "secteur": "Industrie minière",
    "lieu": "Kamsar, Guinée",
    "description": "Nous recherchons un DRH expérimenté pour diriger notre département RH de 300+ employés dans le secteur minier. Gestion complète des RH : recrutement, formation, paie, relations sociales.",
    "competences_recherchees": [
      "Management d'équipe RH",
      "Gestion des relations sociales",
      "Connaissance du Code du Travail guinéen",
      "Expérience secteur minier (atout)"
    ],
    "date_publication": "2025-12-05"
  },
  "parametres": {
    "ton": "formel",
    "longueur": "standard",
    "mise_en_avant": [
      "experience_management",
      "connaissance_secteur_minier"
    ],
    "inclure_pretentions_salariales": false
  }
}
```

### 📤 Output (Résultat)

```json
{
  "lettre_html": "<html>...</html>",
  "lettre_text": "Madame, Monsieur,\n\nC'est avec un grand intérêt que...",
  "structure": {
    "en_tete": {
      "coordonnees_candidat": "...",
      "coordonnees_entreprise": "...",
      "date": "Conakry, le 10 décembre 2025"
    },
    "objet": "Candidature au poste de Directeur des Ressources Humaines",
    "corps": {
      "introduction": "Paragraphe d'accroche personnalisé...",
      "developpement_1": "Mise en avant de l'expérience pertinente...",
      "developpement_2": "Compétences clés et réalisations...",
      "developpement_3": "Motivation et projet professionnel...",
      "conclusion": "Formule de politesse et disponibilité..."
    }
  },
  "points_cles_inclus": [
    "6 ans d'expérience en RH dont management d'équipe",
    "Connaissance approfondie du Code du Travail guinéen",
    "Expertise SIRH et digitalisation RH",
    "Réalisations mesurables (réduction turnover 30%)",
    "Formation de niveau Master"
  ],
  "analyse_qualite": {
    "score_pertinence": 92,
    "score_personnalisation": 88,
    "score_professionnalisme": 95,
    "longueur_mots": 420,
    "temps_lecture_estime": "2 minutes"
  },
  "suggestions_amelioration": [
    "Ajouter une référence spécifique au secteur minier si vous avez de l'expérience",
    "Mentionner votre disponibilité pour un déménagement à Kamsar"
  ]
}
```

### 📝 Structure de la lettre générée

#### 1. En-tête (Header)
```
Fatoumata CAMARA
Quartier Ratoma, Conakry
+224 620 00 00 00
fatou.camara@email.com

                                        À l'attention de
                                        Direction des Ressources Humaines
                                        Winning Consortium Guinea
                                        Kamsar, Guinée

                                        Conakry, le 10 décembre 2025
```

#### 2. Objet
```
Objet : Candidature au poste de Directeur des Ressources Humaines
Réf : Annonce publiée le 05/12/2025 sur JobGuinée
```

#### 3. Corps de la lettre

**Introduction (1 paragraphe)**
- Accroche personnalisée
- Référence à l'offre
- Intérêt pour le poste et l'entreprise

**Développement 1 (1-2 paragraphes)**
- Expérience professionnelle pertinente
- Compétences techniques maîtrisées
- Lien avec les exigences du poste

**Développement 2 (1 paragraphe)**
- Réalisations concrètes et chiffrées
- Valeur ajoutée pour l'entreprise
- Qualités humaines et managériales

**Développement 3 (1 paragraphe)**
- Motivation spécifique pour ce poste
- Projet professionnel aligné
- Connaissance de l'entreprise/secteur

**Conclusion (1 paragraphe)**
- Disponibilité pour entretien
- Formule de politesse adaptée
- Coordonnées de contact

#### 4. Signature
```
Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

Fatoumata CAMARA
```

### 🎨 Tons disponibles

#### 1. Formel (par défaut)
- Vouvoiement strict
- Formules de politesse classiques
- Style soutenu et professionnel
- Adapté aux grandes entreprises, secteur public, postes de direction

**Exemple**: "C'est avec un vif intérêt que je me permets de vous présenter ma candidature..."

#### 2. Moderne
- Vouvoiement mais plus direct
- Formules courtes et efficaces
- Style dynamique et énergique
- Adapté aux startups, tech, secteur innovant

**Exemple**: "Je suis convaincu que mon profil correspond parfaitement à vos attentes pour le poste de..."

#### 3. Créatif
- Accroche originale
- Mise en récit de l'expérience
- Ton personnel mais professionnel
- Adapté aux métiers créatifs, communication, marketing

**Exemple**: "Et si votre prochain Directeur RH était quelqu'un qui a déjà transformé un département RH traditionnel en véritable levier de performance?"

### 📏 Longueurs disponibles

| Type | Mots | Paragraphes | Temps lecture | Usage |
|------|------|-------------|---------------|--------|
| Courte | 250-300 | 4-5 | 1-1.5 min | Email, candidature spontanée |
| Standard | 350-450 | 6-7 | 2-2.5 min | Réponse à offre classique |
| Détaillée | 500-600 | 8-9 | 3-3.5 min | Poste senior, candidature importante |

### 🎯 Personnalisation avancée

#### Mise en avant ciblée

```json
"parametres": {
  "mise_en_avant": [
    "experience_management",      // Insister sur le leadership
    "connaissance_secteur",        // Mettre en avant l'expertise sectorielle
    "realisations_chiffrees",     // Valoriser les résultats mesurables
    "competences_techniques",     // Focus sur le savoir-faire technique
    "soft_skills",                // Souligner les qualités humaines
    "formation_continue"          // Mettre en avant l'apprentissage
  ]
}
```

#### Adaptations contextuelles

**Candidature interne**:
```json
"contexte": "candidature_interne",
"elements_specifiques": {
  "annees_entreprise": 3,
  "poste_actuel": "Responsable RH",
  "projets_realises": ["Refonte SIRH", "Formation managers"]
}
```

**Reconversion professionnelle**:
```json
"contexte": "reconversion",
"elements_specifiques": {
  "secteur_origine": "Finance",
  "competences_transferables": ["Gestion de projet", "Management"],
  "motivation_reconversion": "Passion pour le développement des talents"
}
```

**Jeune diplômé**:
```json
"contexte": "jeune_diplome",
"elements_specifiques": {
  "stages_pertinents": [...],
  "projets_academiques": [...],
  "motivation": "..."
}
```

### 💡 Optimisations IA

#### 1. Analyse sémantique
L'IA analyse automatiquement:
- Mots-clés de l'offre → Intégration naturelle dans la lettre
- Ton de l'annonce → Adaptation du style de rédaction
- Culture d'entreprise → Ajustement du discours

#### 2. Détection des soft skills
À partir de l'offre, l'IA identifie et met en avant:
- Leadership
- Esprit d'équipe
- Capacité d'adaptation
- Sens de l'organisation
- Communication

#### 3. Formulation optimisée
- Phrases courtes et impactantes
- Évitement des répétitions
- Variété du vocabulaire
- Transition fluides entre paragraphes

### 🔧 Export et formats

#### HTML (recommandé)
```html
<div class="cover-letter">
  <header>...</header>
  <main>
    <h2>Objet : ...</h2>
    <p>...</p>
  </main>
  <footer>...</footer>
</div>
```
- Style CSS inclus
- Responsive
- Prêt à imprimer
- Téléchargeable en PDF

#### Text brut
- Format .txt
- Compatible email
- Sans mise en forme

#### DOCX (à venir)
- Format Microsoft Word
- Éditable
- Modèles professionnels

### 📊 Métriques de qualité

Chaque lettre générée est évaluée sur:

**1. Pertinence (0-100)**
- Adéquation avec l'offre
- Utilisation des mots-clés
- Cohérence avec le profil

**2. Personnalisation (0-100)**
- Références spécifiques à l'entreprise
- Exemples concrets du candidat
- Évitement des formules génériques

**3. Professionnalisme (0-100)**
- Orthographe et grammaire
- Structure claire
- Ton approprié

**Score global = (Pertinence + Personnalisation + Professionnalisme) / 3**

Objectif: Score > 85/100

---

## Intégration et Utilisation

### 🔗 Workflow complet

```
1. Candidat consulte une offre
   ↓
2. Système calcule le matching automatiquement
   ↓
3. Affichage du score + analyse
   ↓
4. Si score >= 60: Bouton "Postuler avec lettre IA"
   ↓
5. Génération automatique de la lettre personnalisée
   ↓
6. Prévisualisation et édition possible
   ↓
7. Envoi candidature complète
```

### 💻 Exemples d'intégration

#### Page détail d'une offre

```typescript
import { iaConfigService } from '@/services/iaConfigService';
import { useAuth } from '@/contexts/AuthContext';

export default function JobDetailPage({ jobId }: { jobId: string }) {
  const { profile } = useAuth();
  const [matchingScore, setMatchingScore] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function calculateMatching() {
      // Récupérer le profil candidat complet
      const candidateProfile = await getCandidateProfile(profile.id);

      // Récupérer les détails de l'offre
      const job = await getJobDetails(jobId);

      // Calculer le matching
      const result = await iaConfigService.executeService('ai_matching', {
        profil_candidat: {
          competences: candidateProfile.skills,
          experience_annees: candidateProfile.experience_years,
          formations: candidateProfile.education.map(e => e.degree),
          langues: candidateProfile.languages,
          secteur_actuel: candidateProfile.sector,
          poste_actuel: candidateProfile.title
        },
        offre_emploi: {
          titre: job.title,
          competences_requises: job.required_skills,
          competences_souhaitees: job.preferred_skills,
          experience_requise: job.min_experience,
          niveau_etudes: job.education_level,
          langues_requises: job.required_languages,
          secteur: job.sector,
          type_contrat: job.contract_type,
          localisation: job.location
        }
      });

      if (result.success) {
        setMatchingScore(result.data.score_global);
        setAnalysis(result.data.analyse);
      }
      setLoading(false);
    }

    calculateMatching();
  }, [jobId, profile.id]);

  return (
    <div className="job-detail">
      {/* En-tête de l'offre */}
      <h1>{job.title}</h1>

      {/* Card de matching */}
      <MatchingScoreCard
        score={matchingScore}
        analysis={analysis}
        onApply={() => handleApplyWithCoverLetter()}
      />

      {/* Reste de l'offre... */}
    </div>
  );
}
```

#### Composant MatchingScoreCard

```typescript
export function MatchingScoreCard({ score, analysis, onApply }) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 45) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return '🟢⭐';
    if (score >= 75) return '🟢';
    if (score >= 60) return '🟡';
    if (score >= 45) return '🟠';
    return '🔴';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-200">
      {/* Score principal */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-4xl">{getScoreBadge(score)}</span>
          <span className={`text-6xl font-bold ${getScoreColor(score)}`}>
            {score}%
          </span>
        </div>
        <p className="text-xl font-semibold text-gray-800">
          {analysis.niveau_correspondance}
        </p>
      </div>

      {/* Analyse détaillée */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Points forts
          </h3>
          <ul className="space-y-1 text-sm">
            {analysis.points_forts.map((point, i) => (
              <li key={i} className="text-green-700">• {point}</li>
            ))}
          </ul>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            À développer
          </h3>
          <ul className="space-y-1 text-sm">
            {analysis.points_a_developper.map((point, i) => (
              <li key={i} className="text-orange-700">• {point}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Conseil personnalisé */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-blue-800">
          <strong>💡 Conseil:</strong> {analysis.conseil_personnalise}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {score >= 60 ? (
          <button
            onClick={onApply}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Postuler avec Lettre IA
          </button>
        ) : (
          <button
            className="flex-1 bg-gray-200 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed"
            disabled
          >
            Score insuffisant
          </button>
        )}

        <button className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition">
          Voir formations
        </button>
      </div>
    </div>
  );
}
```

#### Génération de lettre de motivation

```typescript
async function handleApplyWithCoverLetter() {
  // 1. Récupérer les données complètes
  const candidateProfile = await getCandidateProfileComplete(profile.id);
  const job = await getJobDetails(jobId);

  // 2. Afficher modal de configuration
  const config = await showCoverLetterConfigModal({
    tons: ['formel', 'moderne', 'créatif'],
    longueurs: ['courte', 'standard', 'détaillée'],
    mises_en_avant: [
      'experience_management',
      'connaissance_secteur',
      'realisations_chiffrees'
    ]
  });

  // 3. Générer la lettre
  setGenerating(true);
  const result = await iaConfigService.executeService('ai_cover_letter', {
    informations_candidat: {
      nom_complet: candidateProfile.full_name,
      adresse: candidateProfile.location,
      telephone: candidateProfile.phone,
      email: candidateProfile.email,
      profil: {
        titre: candidateProfile.title,
        experience_annees: candidateProfile.experience_years,
        competences_cles: candidateProfile.skills,
        realisations_marquantes: extractAchievements(candidateProfile.work_experience),
        formation_principale: candidateProfile.education[0]?.degree
      }
    },
    offre_ciblee: {
      intitule_poste: job.title,
      nom_entreprise: job.company.name,
      secteur: job.sector,
      lieu: job.location,
      description: job.description,
      competences_recherchees: job.required_skills,
      date_publication: job.published_at
    },
    parametres: {
      ton: config.ton,
      longueur: config.longueur,
      mise_en_avant: config.mises_en_avant,
      inclure_pretentions_salariales: false
    }
  });

  setGenerating(false);

  if (result.success) {
    // 4. Afficher prévisualisation
    showCoverLetterPreview({
      html: result.data.lettre_html,
      text: result.data.lettre_text,
      quality: result.data.analyse_qualite,
      suggestions: result.data.suggestions_amelioration
    });
  }
}
```

#### Modal de prévisualisation

```typescript
export function CoverLetterPreviewModal({
  html,
  text,
  quality,
  suggestions,
  onConfirm,
  onEdit
}) {
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Votre lettre de motivation
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-300" />
                  Score qualité: {quality.score_global}/100
                </span>
                <span>• {text.split(' ').length} mots</span>
                <span>• {quality.temps_lecture_estime}</span>
              </div>
            </div>
            <button onClick={() => onClose()} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Quality metrics */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b">
          <QualityMetric
            label="Pertinence"
            score={quality.score_pertinence}
            icon={Target}
          />
          <QualityMetric
            label="Personnalisation"
            score={quality.score_personnalisation}
            icon={User}
          />
          <QualityMetric
            label="Professionnalisme"
            score={quality.score_professionnalisme}
            icon={Award}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'preview' ? (
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <textarea
              className="w-full h-full border rounded-lg p-4 font-serif"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="bg-yellow-50 border-t border-yellow-200 p-4">
            <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Suggestions d'amélioration
            </h3>
            <ul className="space-y-1 text-sm text-yellow-700">
              {suggestions.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="border-t p-6 flex gap-3">
          <button
            onClick={() => setMode(mode === 'preview' ? 'edit' : 'preview')}
            className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            {mode === 'preview' ? (
              <>
                <Edit className="w-5 h-5 inline mr-2" />
                Modifier
              </>
            ) : (
              <>
                <Eye className="w-5 h-5 inline mr-2" />
                Prévisualiser
              </>
            )}
          </button>

          <button
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            <Download className="w-5 h-5 inline mr-2" />
            Télécharger PDF
          </button>

          <button
            onClick={() => onConfirm(text)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition"
          >
            <Send className="w-5 h-5 inline mr-2" />
            Confirmer et postuler
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Cas d'usage et Scénarios

### 📱 Scénario 1: Candidat recherche d'emploi

**Persona**: Marie, 28 ans, développeuse web, 4 ans d'expérience

**Parcours**:
1. Marie consulte une offre "Senior React Developer"
2. Le système calcule automatiquement son score: **82/100** 🟢
3. Affichage de l'analyse:
   - ✅ Compétences React, JavaScript maîtrisées
   - ✅ 4 ans d'expérience (requis: 3-5 ans)
   - ⚠️ TypeScript manquant
   - ⚠️ Testing (Jest) à renforcer
4. Marie clique sur "Postuler avec Lettre IA"
5. Configuration rapide: Ton moderne, Longueur standard
6. Génération en 8 secondes
7. Prévisualisation de la lettre personnalisée
8. Score qualité: 91/100
9. Marie fait quelques ajustements mineurs
10. Candidature envoyée avec CV + Lettre optimisée

**Résultat**: Gain de temps de 45 minutes + lettre de qualité professionnelle

### 💼 Scénario 2: Recruteur tri de candidatures

**Persona**: Ibrahima, Responsable RH, reçoit 150 candidatures

**Parcours**:
1. Publication d'une offre "Comptable Senior"
2. Réception de 150 candidatures en 1 semaine
3. Activation du "Tri automatique par score IA"
4. Le système calcule le matching pour chaque candidat
5. Dashboard recruteur affiche:
   - 15 candidats "Excellent match" (90+)
   - 42 candidats "Très bonne correspondance" (75-89)
   - 58 candidats "Bonne correspondance" (60-74)
   - 35 candidats "En dessous du seuil"
6. Ibrahima consulte d'abord les 15 meilleurs
7. Pour chacun, il voit l'analyse détaillée:
   - Compétences correspondantes
   - Points forts spécifiques
   - Expérience pertinente
8. Présélection de 8 candidats en 30 minutes (vs 4-5 heures manuellement)

**Résultat**: Gain de temps de 75% + Objectivité accrue

### 🎯 Scénario 3: Reconversion professionnelle

**Persona**: Amadou, 35 ans, transition Finance → RH

**Parcours**:
1. Amadou voit une offre "Chargé RH Junior"
2. Score matching: **58/100** 🟠 (correspondance moyenne)
3. Analyse montre:
   - ✅ Soft skills (organisation, communication)
   - ✅ Management d'équipe
   - ❌ Peu d'expérience RH directe
   - ❌ Pas de certification RH
4. Recommandations IA:
   - Formation "Fondamentaux RH" (3 jours)
   - Certification "Assistant RH" (en ligne)
5. Amadou suit la formation recommandée
6. Mise à jour de son profil
7. Nouveau score: **67/100** 🟡
8. Génération de lettre avec focus sur:
   - Compétences transférables
   - Motivation reconversion
   - Formation récente
9. Candidature envoyée

**Résultat**: Candidature recevable malgré profil atypique

### 🌍 Scénario 4: Candidature internationale

**Persona**: Sophie, candidate guinéenne pour poste à Dubaï

**Parcours**:
1. Offre "HR Manager - Dubai Office" d'une entreprise minière
2. Score matching: **76/100** 🟢
3. Analyse spécifique:
   - ✅ Compétences RH confirmées
   - ✅ Secteur minier (expérience Guinée)
   - ✅ Anglais courant (requis)
   - ⚠️ Pas d'expérience internationale
4. Génération de lettre avec:
   - Mise en avant expérience secteur minier
   - Valorisation bilinguisme FR/EN
   - Motivation mobilité internationale
   - Connaissance des enjeux du secteur
5. Ajout manuel d'un paragraphe sur sa vision internationale

**Résultat**: Candidature qualifiée pour entretien vidéo

---

## API et Exemples de Code

### 🔌 Service Matching

```typescript
import { iaConfigService } from '@/services/iaConfigService';

/**
 * Calculer le score de matching candidat-offre
 */
async function calculateJobMatching(
  candidateId: string,
  jobId: string
): Promise<MatchingResult> {
  // Récupérer le profil candidat
  const candidate = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('profile_id', candidateId)
    .single();

  // Récupérer l'offre d'emploi
  const job = await supabase
    .from('jobs')
    .select('*, companies(*)')
    .eq('id', jobId)
    .single();

  // Préparer l'input pour l'IA
  const input = {
    profil_candidat: {
      competences: candidate.data.skills || [],
      experience_annees: candidate.data.experience_years || 0,
      formations: (candidate.data.education || []).map((e: any) => e.degree),
      langues: candidate.data.languages || [],
      secteur_actuel: candidate.data.sector || '',
      poste_actuel: candidate.data.title || ''
    },
    offre_emploi: {
      titre: job.data.title,
      competences_requises: job.data.required_skills || [],
      competences_souhaitees: job.data.preferred_skills || [],
      experience_requise: job.data.min_experience || 0,
      niveau_etudes: job.data.education_level || '',
      langues_requises: job.data.required_languages || [],
      secteur: job.data.sector || '',
      type_contrat: job.data.contract_type || '',
      localisation: job.data.location || ''
    }
  };

  // Appeler le service IA
  const result = await iaConfigService.executeService('ai_matching', input);

  if (!result.success) {
    throw new Error('Matching calculation failed');
  }

  // Sauvegarder le résultat
  await supabase.from('job_matchings').insert({
    candidate_id: candidateId,
    job_id: jobId,
    score: result.data.score_global,
    analysis: result.data.analyse,
    calculated_at: new Date().toISOString()
  });

  return result.data;
}

/**
 * Obtenir les meilleures offres pour un candidat
 */
async function getRecommendedJobs(
  candidateId: string,
  limit: number = 10
): Promise<JobRecommendation[]> {
  // Récupérer toutes les offres actives
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50);

  // Calculer le matching pour chaque offre
  const matchings = await Promise.all(
    jobs.map(async (job) => {
      const score = await calculateJobMatching(candidateId, job.id);
      return {
        job,
        score: score.score_global,
        analysis: score.analyse
      };
    })
  );

  // Trier par score décroissant
  const sorted = matchings
    .filter((m) => m.score >= 70) // Seuil minimum
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return sorted;
}

/**
 * Obtenir les meilleurs candidats pour une offre
 */
async function getTopCandidatesForJob(
  jobId: string,
  limit: number = 20
): Promise<CandidateRanking[]> {
  // Récupérer toutes les candidatures
  const { data: applications } = await supabase
    .from('applications')
    .select('*, candidate_profiles(*)')
    .eq('job_id', jobId);

  // Calculer le matching pour chaque candidat
  const rankings = await Promise.all(
    applications.map(async (app) => {
      const score = await calculateJobMatching(app.candidate_id, jobId);
      return {
        application: app,
        candidate: app.candidate_profiles,
        score: score.score_global,
        analysis: score.analyse
      };
    })
  );

  // Trier par score décroissant
  return rankings.sort((a, b) => b.score - a.score).slice(0, limit);
}
```

### 📧 Service Cover Letter

```typescript
/**
 * Générer une lettre de motivation
 */
async function generateCoverLetter(params: {
  candidateId: string;
  jobId: string;
  config?: {
    ton?: 'formel' | 'moderne' | 'créatif';
    longueur?: 'courte' | 'standard' | 'détaillée';
    mises_en_avant?: string[];
  };
}): Promise<CoverLetterResult> {
  const { candidateId, jobId, config = {} } = params;

  // Récupérer les données
  const candidate = await getCandidateProfileComplete(candidateId);
  const job = await getJobComplete(jobId);

  // Préparer l'input
  const input = {
    informations_candidat: {
      nom_complet: candidate.full_name,
      adresse: candidate.location,
      telephone: candidate.phone,
      email: candidate.email,
      profil: {
        titre: candidate.title,
        experience_annees: candidate.experience_years,
        competences_cles: candidate.skills.slice(0, 10),
        realisations_marquantes: extractTopAchievements(candidate.work_experience),
        formation_principale: candidate.education[0]?.degree || ''
      }
    },
    offre_ciblee: {
      intitule_poste: job.title,
      nom_entreprise: job.company.name,
      secteur: job.sector,
      lieu: job.location,
      description: job.description,
      competences_recherchees: job.required_skills,
      date_publication: job.published_at
    },
    parametres: {
      ton: config.ton || 'formel',
      longueur: config.longueur || 'standard',
      mise_en_avant: config.mises_en_avant || ['experience_management'],
      inclure_pretentions_salariales: false
    }
  };

  // Appeler le service IA
  const result = await iaConfigService.executeService('ai_cover_letter', input);

  if (!result.success) {
    throw new Error('Cover letter generation failed');
  }

  // Sauvegarder dans l'historique
  await supabase.from('generated_cover_letters').insert({
    candidate_id: candidateId,
    job_id: jobId,
    letter_html: result.data.lettre_html,
    letter_text: result.data.lettre_text,
    quality_score: result.data.analyse_qualite.score_global,
    config: config,
    generated_at: new Date().toISOString()
  });

  return result.data;
}

/**
 * Extraire les réalisations principales
 */
function extractTopAchievements(experiences: any[]): string[] {
  const achievements: string[] = [];

  experiences.forEach((exp) => {
    if (exp.missions && Array.isArray(exp.missions)) {
      // Filtrer les missions qui contiennent des chiffres (indicateur de réalisation mesurable)
      const measurable = exp.missions.filter((m: string) =>
        /\d+/.test(m)
      );
      achievements.push(...measurable);
    }
  });

  return achievements.slice(0, 3); // Top 3
}

/**
 * Télécharger la lettre en PDF
 */
async function downloadCoverLetterAsPDF(
  letterHtml: string,
  filename: string
): Promise<void> {
  const { jsPDF } = require('jspdf');
  const doc = new jsPDF();

  // Convertir HTML en texte formaté
  const textContent = htmlToText(letterHtml);

  // Ajouter le contenu au PDF avec mise en page
  doc.setFont('helvetica');
  doc.setFontSize(11);

  const margins = { top: 20, left: 20, right: 20 };
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxLineWidth = pageWidth - margins.left - margins.right;

  const lines = doc.splitTextToSize(textContent, maxLineWidth);
  doc.text(lines, margins.left, margins.top);

  // Télécharger
  doc.save(filename);
}
```

---

## 📊 Tableaux de données

### Table: job_matchings

```sql
CREATE TABLE job_matchings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  niveau_correspondance text,
  analysis jsonb DEFAULT '{}'::jsonb,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE(candidate_id, job_id)
);

CREATE INDEX idx_job_matchings_score ON job_matchings(score DESC);
CREATE INDEX idx_job_matchings_candidate ON job_matchings(candidate_id);
CREATE INDEX idx_job_matchings_job ON job_matchings(job_id);
```

### Table: generated_cover_letters

```sql
CREATE TABLE generated_cover_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  letter_html text NOT NULL,
  letter_text text NOT NULL,
  quality_score integer CHECK (quality_score >= 0 AND quality_score <= 100),
  config jsonb DEFAULT '{}'::jsonb,
  generated_at timestamptz DEFAULT now(),
  used_for_application boolean DEFAULT false
);

CREATE INDEX idx_cover_letters_candidate ON generated_cover_letters(candidate_id);
CREATE INDEX idx_cover_letters_job ON generated_cover_letters(job_id);
```

---

**Date de création**: 10 Décembre 2025
**Version**: 1.0
**Services**: `ai_matching` & `ai_cover_letter`
**Statut**: ✅ Opérationnels et documentés
