# Guide d'implémentation des fonctionnalités IA

## Introduction

Ce guide explique comment utiliser le système d'agrégation de données pour implémenter les fonctionnalités IA :
- 🧠 Résumé automatique d'offre
- 🎯 Matching candidats ↔ offres
- 📧 Génération d'emails personnalisés

## Architecture des données

### Service d'agrégation

Le service `jobDataAggregatorService.ts` est le **point d'entrée unique** pour toutes les données d'une offre d'emploi.

```typescript
import {
  aggregateJobData,
  generateJobSummary,
  validateJobDataForAI,
  type AggregatedJobData
} from './services/jobDataAggregatorService';
```

### Structure des données agrégées

```typescript
interface AggregatedJobData {
  // Données brutes du formulaire
  formData: JobFormData;

  // Blocs de contenu avec métadonnées
  descriptionBlocks: JobContentBlock[];

  // Texte consolidé (prêt pour l'IA)
  fullTextContent: string;

  // Fichiers attachés
  attachedFiles: {
    pdfs: Array<{ name: string; size: number; blockId: string }>;
    images: Array<{ name: string; size: number; blockId: string }>;
  };

  // Données structurées optimisées pour l'IA
  aiReadyData: {
    jobTitle: string;
    category: string;
    location: string;
    contractType: string;
    experienceLevel: string;
    educationLevel: string;
    skills: string[];
    languages: string[];
    salary: { range: string; type: string };
    description: string;
    responsibilities: string;
    profile: string;
    company: {
      name: string;
      sector: string;
      description: string;
      website?: string;
    };
    benefits: string[];
    fullContent: string;
    hasAttachments: boolean;
    attachmentCount: number;
  };
}
```

## 1. IA de résumé automatique

### Cas d'usage

- Générer un résumé court pour l'affichage en liste
- Créer une description SEO optimisée
- Produire un tweet/post LinkedIn automatique

### Implémentation

#### Option A : Résumé simple (sans IA externe)

```typescript
import { aggregateJobData, generateJobSummary } from './services/jobDataAggregatorService';

async function generateSimpleSummary(jobId: string): Promise<string> {
  // 1. Récupérer l'offre
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (!job) throw new Error('Job not found');

  // 2. Agréger les données
  const aggregated = aggregateJobData(job);

  // 3. Générer le résumé (max 500 caractères)
  const summary = generateJobSummary(aggregated);

  return summary;
  // → "Ingénieur DevOps (CDI) à Conakry chez TechCorp - 5-10 ans d'expérience - Compétences: Kubernetes, AWS, Terraform"
}
```

#### Option B : Résumé avancé (avec IA externe)

```typescript
import { aggregateJobData } from './services/jobDataAggregatorService';
import OpenAI from 'openai'; // ou autre provider IA

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateAISummary(jobId: string, targetLength: 'short' | 'medium' | 'long' = 'medium'): Promise<string> {
  // 1. Récupérer et agréger
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  const aggregated = aggregateJobData(job);

  // 2. Définir la longueur cible
  const lengthMap = {
    short: '2-3 phrases (max 150 mots)',
    medium: '1 paragraphe (max 250 mots)',
    long: '2-3 paragraphes (max 400 mots)'
  };

  // 3. Appeler l'IA
  const prompt = `
Génère un résumé professionnel et attractif de cette offre d'emploi.
Format : ${lengthMap[targetLength]}
Ton : Professionnel mais engageant
Public cible : Candidats qualifiés

Données de l'offre :
${aggregated.fullTextContent}

Le résumé doit :
- Mettre en avant les points clés du poste
- Mentionner l'entreprise et le secteur
- Inclure les compétences principales requises
- Être attractif pour les bons candidats
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
    temperature: 0.7,
  });

  const summary = completion.choices[0].message.content || '';

  // 4. Sauvegarder le résumé généré (optionnel)
  await supabase
    .from('jobs')
    .update({ ai_summary: summary })
    .eq('id', jobId);

  return summary;
}
```

#### Option C : Résumé multilingue

```typescript
async function generateMultilingualSummary(jobId: string): Promise<{
  fr: string;
  en: string;
}> {
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  const aggregated = aggregateJobData(job);

  // Résumé français
  const frPrompt = `Résume cette offre d'emploi en français (max 250 mots) :\n${aggregated.fullTextContent}`;

  // Résumé anglais
  const enPrompt = `Summarize this job offer in English (max 250 words) :\n${aggregated.fullTextContent}`;

  const [frCompletion, enCompletion] = await Promise.all([
    openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: frPrompt }],
    }),
    openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: enPrompt }],
    }),
  ]);

  return {
    fr: frCompletion.choices[0].message.content || '',
    en: enCompletion.choices[0].message.content || '',
  };
}
```

## 2. Matching candidats ↔ offres

### Cas d'usage

- Suggérer des candidats pertinents pour une offre
- Notifier les candidats des offres matchées
- Calculer un score de compatibilité

### Implémentation

#### Algorithme de matching basique

```typescript
import { aggregateJobData } from './services/jobDataAggregatorService';

interface CandidateProfile {
  id: string;
  skills: string[];
  experience_years: number;
  education_level: string;
  languages: string[];
  preferred_locations: string[];
  desired_salary_min?: number;
  // ... autres champs
}

interface MatchResult {
  candidateId: string;
  score: number; // 0-100
  reasons: string[];
  mismatches: string[];
}

async function matchCandidatesForJob(jobId: string, candidatePool: CandidateProfile[]): Promise<MatchResult[]> {
  // 1. Récupérer et agréger l'offre
  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  const aggregated = aggregateJobData(job);
  const jobData = aggregated.aiReadyData;

  // 2. Calculer le score pour chaque candidat
  const results: MatchResult[] = candidatePool.map(candidate => {
    let score = 0;
    const reasons: string[] = [];
    const mismatches: string[] = [];

    // Compétences (40 points max)
    const matchedSkills = candidate.skills.filter(skill =>
      jobData.skills.some(jobSkill =>
        jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(jobSkill.toLowerCase())
      )
    );

    const skillScore = (matchedSkills.length / Math.max(jobData.skills.length, 1)) * 40;
    score += skillScore;

    if (matchedSkills.length > 0) {
      reasons.push(`Compétences matchées : ${matchedSkills.join(', ')}`);
    } else {
      mismatches.push('Aucune compétence directement matchée');
    }

    // Expérience (25 points max)
    const experienceMap: Record<string, number> = {
      'Débutant': 0,
      '1-3 ans': 2,
      '3-5 ans': 4,
      '5-10 ans': 7,
      '+10 ans': 12
    };

    const jobExperience = experienceMap[jobData.experienceLevel] || 0;
    const candidateExperience = candidate.experience_years;

    if (candidateExperience >= jobExperience) {
      const expScore = Math.min(25, (candidateExperience / Math.max(jobExperience, 1)) * 25);
      score += expScore;
      reasons.push(`Expérience suffisante : ${candidateExperience} ans`);
    } else {
      mismatches.push(`Expérience insuffisante : ${candidateExperience} ans vs ${jobData.experienceLevel} requis`);
    }

    // Éducation (15 points max)
    const educationLevels = ['BEP', 'BAC', 'BTS', 'Licence', 'Master', 'Doctorat'];
    const jobEduIndex = educationLevels.indexOf(jobData.educationLevel);
    const candidateEduIndex = educationLevels.indexOf(candidate.education_level);

    if (candidateEduIndex >= jobEduIndex) {
      score += 15;
      reasons.push(`Niveau d'études : ${candidate.education_level}`);
    } else {
      mismatches.push(`Niveau d'études insuffisant : ${candidate.education_level} vs ${jobData.educationLevel} requis`);
    }

    // Localisation (10 points max)
    if (candidate.preferred_locations.some(loc =>
      loc.toLowerCase().includes(jobData.location.toLowerCase()) ||
      jobData.location.toLowerCase().includes(loc.toLowerCase())
    )) {
      score += 10;
      reasons.push(`Localisation compatible : ${jobData.location}`);
    } else {
      mismatches.push(`Localisation non préférée : ${jobData.location}`);
    }

    // Langues (10 points max)
    const matchedLanguages = candidate.languages.filter(lang =>
      jobData.languages.some(jobLang =>
        jobLang.toLowerCase().includes(lang.toLowerCase())
      )
    );

    if (matchedLanguages.length > 0) {
      score += 10;
      reasons.push(`Langues : ${matchedLanguages.join(', ')}`);
    }

    return {
      candidateId: candidate.id,
      score: Math.round(score),
      reasons,
      mismatches
    };
  });

  // 3. Trier par score décroissant
  return results.sort((a, b) => b.score - a.score);
}
```

#### Matching avec IA externe

```typescript
async function matchCandidatesWithAI(jobId: string, candidateIds: string[]): Promise<MatchResult[]> {
  // 1. Agréger l'offre
  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single();
  const aggregated = aggregateJobData(job);

  // 2. Récupérer les profils candidats
  const { data: candidates } = await supabase
    .from('candidate_profiles')
    .select('*')
    .in('id', candidateIds);

  if (!candidates) return [];

  // 3. Pour chaque candidat, demander à l'IA de calculer un score
  const matchPromises = candidates.map(async candidate => {
    const prompt = `
Tu es un expert en recrutement. Analyse la compatibilité entre ce candidat et cette offre.

OFFRE D'EMPLOI :
${aggregated.fullTextContent}

PROFIL CANDIDAT :
Nom : ${candidate.full_name}
Compétences : ${candidate.skills?.join(', ') || 'Non spécifiées'}
Expérience : ${candidate.years_of_experience || 0} ans
Formation : ${candidate.education_level || 'Non spécifiée'}
Langues : ${candidate.languages?.join(', ') || 'Non spécifiées'}

TÂCHE :
1. Calcule un score de compatibilité de 0 à 100
2. Liste les points forts (compatibilité)
3. Liste les points faibles (incompatibilité)

FORMAT DE RÉPONSE (JSON uniquement) :
{
  "score": 85,
  "strengths": ["Compétences techniques excellentes", "Expérience suffisante"],
  "weaknesses": ["Localisation éloignée", "Manque d'expérience en management"]
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return {
      candidateId: candidate.id,
      score: result.score || 0,
      reasons: result.strengths || [],
      mismatches: result.weaknesses || []
    };
  });

  const results = await Promise.all(matchPromises);
  return results.sort((a, b) => b.score - a.score);
}
```

## 3. Génération d'emails personnalisés

### Cas d'usage

- Email de confirmation au recruteur
- Notification aux candidats matchés
- Rappels de candidature
- Notifications de clôture

### Implémentation

#### Templates d'emails

```typescript
import { aggregateJobData } from './services/jobDataAggregatorService';

interface EmailTemplate {
  subject: string;
  body: string;
}

// Template 1 : Confirmation recruteur
async function generateRecruiterConfirmationEmail(jobId: string): Promise<EmailTemplate> {
  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single();
  const aggregated = aggregateJobData(job);
  const { aiReadyData } = aggregated;

  return {
    subject: `Votre offre "${aiReadyData.jobTitle}" a été publiée`,
    body: `
Bonjour,

Votre offre d'emploi a été publiée avec succès sur JobGuinée !

📋 DÉTAILS DE L'OFFRE :
• Poste : ${aiReadyData.jobTitle}
• Type de contrat : ${aiReadyData.contractType}
• Localisation : ${aiReadyData.location}
• Date limite : ${job.deadline || 'Non spécifiée'}
• Compétences recherchées : ${aiReadyData.skills.slice(0, 5).join(', ')}

${aiReadyData.hasAttachments ? `\n📎 Documents joints : ${aiReadyData.attachmentCount} fichier(s)\n` : ''}

🎯 PROCHAINES ÉTAPES :
• Votre offre est visible par ${aiReadyData.visibility || 'tous les candidats'}
• Vous recevrez des notifications pour chaque nouvelle candidature
• Accédez à votre tableau de bord pour suivre les candidatures

Lien vers votre offre : https://jobguinee.com/jobs/${jobId}

Cordialement,
L'équipe JobGuinée
    `.trim()
  };
}

// Template 2 : Notification candidat matché
async function generateCandidateMatchEmail(jobId: string, candidateId: string, matchScore: number): Promise<EmailTemplate> {
  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single();
  const { data: candidate } = await supabase.from('candidate_profiles').select('*').eq('id', candidateId).single();

  const aggregated = aggregateJobData(job);
  const { aiReadyData } = aggregated;

  return {
    subject: `Nouvelle opportunité : ${aiReadyData.jobTitle} chez ${aiReadyData.company.name}`,
    body: `
Bonjour ${candidate.full_name},

Une nouvelle offre d'emploi correspond à votre profil !

🎯 COMPATIBILITÉ : ${matchScore}% de match

📋 L'OFFRE :
${aiReadyData.jobTitle} (${aiReadyData.contractType})
${aiReadyData.company.name} • ${aiReadyData.location}
${aiReadyData.salary.range ? `💰 ${aiReadyData.salary.range}` : ''}

🔑 COMPÉTENCES REQUISES :
${aiReadyData.skills.slice(0, 5).map(s => `• ${s}`).join('\n')}

✨ AVANTAGES :
${aiReadyData.benefits.slice(0, 3).map(b => `• ${b}`).join('\n')}

📄 À PROPOS DU POSTE :
${aiReadyData.description.substring(0, 300)}...

👉 Postulez maintenant : https://jobguinee.com/jobs/${jobId}/apply

Date limite de candidature : ${job.deadline || 'Non spécifiée'}

Bonne chance !
L'équipe JobGuinée
    `.trim()
  };
}
```

#### Génération avec IA

```typescript
async function generatePersonalizedEmailWithAI(
  jobId: string,
  candidateId: string,
  emailType: 'match' | 'reminder' | 'rejection' | 'interview'
): Promise<EmailTemplate> {
  // 1. Agréger les données
  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single();
  const { data: candidate } = await supabase.from('candidate_profiles').select('*').eq('id', candidateId).single();

  const aggregated = aggregateJobData(job);

  // 2. Préparer le prompt selon le type d'email
  const prompts = {
    match: `Génère un email professionnel et engageant pour notifier ce candidat d'une offre qui correspond à son profil.`,
    reminder: `Génère un email de rappel amical pour encourager le candidat à postuler avant la date limite.`,
    rejection: `Génère un email de refus poli et encourageant, avec des suggestions constructives.`,
    interview: `Génère un email d'invitation à un entretien avec les détails pratiques.`
  };

  const prompt = `
${prompts[emailType]}

OFFRE D'EMPLOI :
${aggregated.fullTextContent}

PROFIL CANDIDAT :
Nom : ${candidate.full_name}
Email : ${candidate.email}
Compétences : ${candidate.skills?.join(', ') || 'Non spécifiées'}
Expérience : ${candidate.years_of_experience || 0} ans

INSTRUCTIONS :
- Ton professionnel mais chaleureux
- Personnalisé avec le nom du candidat
- Mise en avant des points de compatibilité
- Appel à l'action clair
- Signature "L'équipe JobGuinée"

FORMAT DE RÉPONSE (JSON uniquement) :
{
  "subject": "Objet de l'email",
  "body": "Corps de l'email en texte brut"
}
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0].message.content || '{}');

  return {
    subject: result.subject || 'Nouvelle opportunité sur JobGuinée',
    body: result.body || ''
  };
}
```

## 4. Validation et qualité des données

### Vérifier avant traitement IA

```typescript
import { validateJobDataForAI } from './services/jobDataAggregatorService';

async function processJobWithAI(jobId: string) {
  // 1. Récupérer et agréger
  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single();
  const aggregated = aggregateJobData(job);

  // 2. Valider la qualité
  const validation = validateJobDataForAI(aggregated);

  if (!validation.isValid) {
    console.warn(`Job ${jobId} : données insuffisantes pour l'IA`);
    console.warn(`Champs manquants :`, validation.missingFields);
    console.warn(`Score : ${validation.score}/100`);

    // Option : notifier le recruteur
    if (validation.score < 50) {
      await notifyRecruiterToCompleteJob(jobId, validation.missingFields);
      return null;
    }
  }

  // 3. Procéder au traitement IA
  console.log(`Job ${jobId} : qualité suffisante (score: ${validation.score}/100)`);
  return aggregated;
}
```

## 5. Exemples complets

### Workflow complet : Publication d'offre

```typescript
async function publishJobWithAI(formData: JobFormData, recruiterId: string) {
  // 1. Sauvegarder l'offre
  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      ...formData,
      recruiter_id: recruiterId,
      status: 'pending_review'
    })
    .select()
    .single();

  if (error || !job) throw new Error('Failed to create job');

  // 2. Agréger les données
  const aggregated = aggregateJobData(job);

  // 3. Générer le résumé IA
  const summary = await generateAISummary(job.id);
  await supabase
    .from('jobs')
    .update({ ai_summary: summary })
    .eq('id', job.id);

  // 4. Identifier les candidats potentiels
  const { data: candidates } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('is_active', true)
    .limit(100);

  if (candidates) {
    const matches = await matchCandidatesForJob(job.id, candidates);

    // 5. Notifier les 10 meilleurs matchs (score >= 70)
    const topMatches = matches.filter(m => m.score >= 70).slice(0, 10);

    for (const match of topMatches) {
      const email = await generateCandidateMatchEmail(job.id, match.candidateId, match.score);

      await supabase
        .from('email_queue')
        .insert({
          to: match.candidateId,
          subject: email.subject,
          body: email.body,
          type: 'job_match',
          metadata: { jobId: job.id, matchScore: match.score }
        });
    }
  }

  // 6. Envoyer la confirmation au recruteur
  const confirmEmail = await generateRecruiterConfirmationEmail(job.id);
  await supabase
    .from('email_queue')
    .insert({
      to: recruiterId,
      subject: confirmEmail.subject,
      body: confirmEmail.body,
      type: 'job_published'
    });

  return job;
}
```

## Conclusion

Le système d'agrégation fournit une base solide pour toutes les fonctionnalités IA. Les données sont structurées, validées et prêtes à l'emploi.

**Points clés :**
1. **Toujours utiliser** `aggregateJobData()` comme source de données
2. **Valider la qualité** avec `validateJobDataForAI()` avant traitement IA
3. **Exploiter** `fullTextContent` pour les prompts IA textuels
4. **Utiliser** `aiReadyData` pour les algorithmes de matching
5. **Personnaliser** les emails avec toutes les variables disponibles

**Prochaines améliorations possibles :**
- Cache des résumés IA générés
- Score de matching sauvegardé en base
- Dashboard analytics des performances IA
- A/B testing sur les prompts
- Multi-modèles IA (GPT-4, Claude, Mistral, etc.)
