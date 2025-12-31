import { JobFormData } from '../types/jobFormTypes';

export function generateJobDescription(data: JobFormData): string {
  let fullDescription = `# ${data.title}\n\n`;
  fullDescription += `**Catégorie:** ${data.category} | **Contrat:** ${data.contract_type} | **Postes:** ${data.position_count}\n\n`;

  fullDescription += `## Présentation du poste\n${data.description}\n\n`;

  if (data.responsibilities) {
    fullDescription += `## Missions principales\n${data.responsibilities}\n\n`;
  }

  if (data.profile) {
    fullDescription += `## Profil recherché\n${data.profile}\n\n`;
  }

  if (data.skills.length > 0) {
    fullDescription += `## Compétences clés\n${data.skills.join(' • ')}\n\n`;
  }

  fullDescription += `## Qualifications\n`;
  fullDescription += `- **Niveau d'études:** ${data.education_level}\n`;
  fullDescription += `- **Expérience:** ${data.experience_required}\n`;
  if (data.languages.length > 0) {
    fullDescription += `- **Langues:** ${data.languages.join(', ')}\n`;
  }
  fullDescription += `\n`;

  if (data.salary_range) {
    fullDescription += `## Rémunération\n`;
    fullDescription += `- **Salaire:** ${data.salary_range}\n`;
    fullDescription += `- **Type:** ${data.salary_type}\n`;
    if (data.benefits.length > 0) {
      fullDescription += `- **Avantages:** ${data.benefits.join(', ')}\n`;
    }
    fullDescription += `\n`;
  }

  if (data.company_description) {
    fullDescription += `## À propos de l'entreprise\n${data.company_description}\n\n`;
  }

  fullDescription += `## Modalités de candidature\n`;
  fullDescription += `- **Email:** ${data.application_email}\n`;
  fullDescription += `- **Date limite:** ${data.deadline}\n`;
  if (data.required_documents.length > 0) {
    fullDescription += `- **Documents requis:** ${data.required_documents.join(', ')}\n`;
  }
  if (data.application_instructions) {
    fullDescription += `\n${data.application_instructions}\n`;
  }
  fullDescription += `\n`;

  fullDescription += `## Conformité légale\nPoste soumis au Code du Travail Guinéen (Loi L/2014/072/CNT du 16 janvier 2014).\nNous encourageons les candidatures guinéennes dans le cadre de la politique de guinéisation.`;

  return fullDescription;
}

export function generateJobDescriptionFromSector(sector: string, data: Partial<JobFormData>): Partial<JobFormData> {
  const templates: Record<string, Partial<JobFormData>> = {
    'Mines': {
      description: `Nous recherchons un(e) professionnel(le) expérimenté(e) dans le secteur minier pour rejoindre notre équipe. Ce poste stratégique offre l'opportunité de contribuer activement au développement de nos activités minières dans un environnement professionnel stimulant et conforme aux normes internationales.`,
      responsibilities: `• Superviser les opérations minières quotidiennes sur le site
• Assurer la conformité environnementale et sécuritaire selon les standards internationaux
• Coordonner les équipes techniques et logistiques
• Optimiser les processus d'extraction et de traitement
• Garantir le respect des quotas de production
• Participer aux réunions de coordination technique`,
      skills: ['Géologie appliquée', 'Sécurité minière', 'Gestion d\'équipe', 'Conformité environnementale', 'Optimisation processus'],
      benefits: ['Logement sur site', 'Transport assuré', 'Couverture médicale complète', 'Prime de production', 'Formation continue'],
    },
    'Finance': {
      description: `Rejoignez notre équipe financière dynamique et contribuez à la gestion stratégique de nos ressources. Ce poste clé offre l'opportunité de travailler dans un environnement professionnel exigeant avec des outils modernes et des responsabilités significatives.`,
      responsibilities: `• Analyse financière et reporting mensuel
• Gestion budgétaire et contrôle des dépenses
• Supervision de la comptabilité générale et analytique
• Élaboration des états financiers consolidés
• Optimisation de la trésorerie
• Interface avec les cabinets d'audit externe`,
      skills: ['Comptabilité OHADA', 'Excel avancé', 'Analyse financière', 'Reporting', 'Audit interne', 'Gestion trésorerie'],
      benefits: ['Package salarial compétitif', 'Formations certifiantes', 'Couverture santé', 'Prime annuelle', 'Évolution de carrière'],
    },
    'IT': {
      description: `Nous recherchons un(e) expert(e) IT passionné(e) pour rejoindre notre équipe technique. Vous travaillerez sur des projets innovants avec des technologies modernes dans un environnement stimulant favorisant la créativité et l'excellence technique.`,
      responsibilities: `• Développement et maintenance des applications métier
• Architecture et optimisation des systèmes informatiques
• Support technique niveau 2/3
• Gestion de la sécurité informatique
• Administration des bases de données
• Veille technologique et propositions d'amélioration`,
      skills: ['Développement logiciel', 'Administration systèmes', 'Cybersécurité', 'Bases de données', 'Réseau', 'Support technique'],
      benefits: ['Environnement tech moderne', 'Formations continues', 'Horaires flexibles', 'Télétravail partiel', 'Matériel performant'],
    },
    'Ressources Humaines': {
      description: `Rejoignez notre département RH en tant que professionnel(le) expérimenté(e). Vous contribuerez activement à la gestion du capital humain de notre organisation et au développement de nos collaborateurs dans un environnement dynamique et bienveillant.`,
      responsibilities: `• Gestion du recrutement de A à Z
• Administration du personnel et paie
• Développement des compétences et formations
• Gestion des relations sociales
• Mise en œuvre de la politique RH
• Reporting RH et tableaux de bord sociaux`,
      skills: ['Recrutement', 'Droit du travail', 'Gestion paie', 'Relations sociales', 'Formation', 'SIRH'],
      benefits: ['Formation RH continue', 'Couverture médicale', 'Environnement collaboratif', 'Évolution professionnelle', 'Prime annuelle'],
    },
    'BTP': {
      description: `Nous recherchons un(e) professionnel(le) du BTP expérimenté(e) pour superviser nos projets de construction. Ce poste offre l'opportunité de diriger des chantiers d'envergure dans le respect des normes de qualité et de sécurité.`,
      responsibilities: `• Supervision des travaux de construction
• Coordination des corps de métier
• Contrôle qualité et respect des normes
• Gestion de la sécurité sur chantier
• Suivi budgétaire et planning
• Relation avec les clients et sous-traitants`,
      skills: ['Gestion de chantier', 'Lecture de plans', 'Sécurité BTP', 'Coordination équipes', 'Suivi budgétaire', 'Normes construction'],
      benefits: ['Véhicule de fonction', 'Équipement sécurité fourni', 'Prime de chantier', 'Couverture santé', 'Formation continue'],
    },
  };

  return templates[sector] || {};
}
