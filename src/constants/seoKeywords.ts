/**
 * SEO Keywords Strategy for JobGuinée
 * Central keyword management for Guinea job market
 * Used by seoService, seoAutoGeneratorService, and landing pages
 */

export const SEO_SITE_NAME = 'JobGuinée';
export const SEO_SITE_URL = 'https://jobguinee-pro.com';
export const SEO_DEFAULT_LOCALE = 'fr_GN';

// ============================================
// PRIMARY KEYWORDS (highest search volume)
// ============================================
export const PRIMARY_KEYWORDS = [
  'emploi en guinée',
  'offres d\'emploi en guinée',
  'recrutement en guinée',
  'site d\'emploi en guinée',
  'emploi à conakry',
  'plateforme de recrutement en guinée',
  'annonces emploi en guinée',
  'recherche d\'emploi en guinée',
  'trouver un emploi en guinée',
];

// ============================================
// SECONDARY KEYWORDS
// ============================================
export const SECONDARY_KEYWORDS = [
  'marché de l\'emploi en guinée',
  'marché du travail en guinée',
  'opportunités d\'emploi en guinée',
  'postuler à un emploi en guinée',
  'emplois disponibles en guinée',
  'annonces offres d\'emploi',
  'emploi pour jeunes en guinée',
  'emploi diplômé guinée',
  'emploi secteur privé guinée',
  'emploi ONG guinée',
  'emploi entreprise minière guinée',
];

// ============================================
// FORMATION KEYWORDS
// ============================================
export const FORMATION_KEYWORDS = [
  'formations en guinée',
  'offres de formation en guinée',
  'annonces de formation en guinée',
  'formations professionnelles en guinée',
  'centre de formation en guinée',
  'formation emploi guinée',
  'formation professionnelle conakry',
  'apprentissage métier guinée',
  'programmes de formation en guinée',
  'formations certifiantes guinée',
];

// ============================================
// MARKET/NEWS KEYWORDS
// ============================================
export const MARKET_KEYWORDS = [
  'chômage en guinée',
  'informations emploi en guinée',
  'actualité emploi guinée',
  'statistiques emploi guinée',
  'marché du travail guinéen',
];

// ============================================
// LONG-TAIL KEYWORDS
// ============================================
export const LONG_TAIL_KEYWORDS = [
  'meilleur site d\'emploi en guinée',
  'plateforme pour trouver un emploi en guinée',
  'offres d\'emploi disponibles en guinée',
  'site pour recruter en guinée',
  'site pour publier des offres d\'emploi en guinée',
];

// ============================================
// CITY-SPECIFIC KEYWORDS
// ============================================
export const GUINEA_CITIES = [
  'Conakry',
  'Kankan',
  'Labé',
  'Nzérékoré',
  'Kindia',
  'Boké',
  'Mamou',
  'Faranah',
  'Siguiri',
  'Kamsar',
  'Fria',
  'Dubréka',
  'Coyah',
];

// ============================================
// SECTORS
// ============================================
export const GUINEA_SECTORS = [
  'Mines & Extraction',
  'BTP & Construction',
  'Banque & Finance',
  'Télécommunications',
  'ONG & Humanitaire',
  'Éducation & Formation',
  'Santé',
  'Logistique & Transport',
  'Commerce',
  'Agriculture',
  'Administration publique',
  'Informatique & Tech',
  'Hôtellerie & Restauration',
  'Énergie',
  'Industrie',
];

// ============================================
// PAGE-SPECIFIC META GENERATORS
// ============================================

export function generateHomePageMeta() {
  return {
    title: 'JobGuinée - Plateforme N°1 de l\'emploi et du recrutement en Guinée',
    description: 'Trouvez votre emploi en Guinée sur JobGuinée, la première plateforme de recrutement digital. Offres d\'emploi à Conakry et partout en Guinée. Postulez en ligne, formations professionnelles, opportunités dans les mines, ONG, secteur privé.',
    keywords: [...PRIMARY_KEYWORDS, ...LONG_TAIL_KEYWORDS.slice(0, 3)],
    h1: 'Offres d\'emploi et recrutement en Guinée',
    h2: [
      'Les dernières offres d\'emploi en Guinée',
      'Trouvez un emploi à Conakry et partout en Guinée',
      'Formations professionnelles en Guinée',
      'Entreprises qui recrutent en Guinée',
    ],
  };
}

export function generateJobsPageMeta(count: number) {
  return {
    title: `${count ? count + ' ' : ''}Offres d'emploi en Guinée - Toutes les annonces | JobGuinée`,
    description: `Consultez ${count ? count + ' ' : ''}les offres d'emploi disponibles en Guinée. Emploi à Conakry, mines, ONG, secteur privé. Postulez en ligne sur le meilleur site d'emploi en Guinée.`,
    keywords: [...PRIMARY_KEYWORDS.slice(0, 5), 'emplois disponibles en guinée', 'annonces offres d\'emploi'],
  };
}

export function generateCityPageMeta(city: string, count: number) {
  return {
    title: `Emplois à ${city} - ${count || ''} Offres d'emploi | JobGuinée`,
    description: `Trouvez votre emploi à ${city}, Guinée. ${count ? count + ' offres' : 'Offres'} d'emploi disponibles à ${city}. Postulez en ligne sur JobGuinée, le meilleur site d'emploi en Guinée.`,
    keywords: [
      `emploi à ${city.toLowerCase()}`,
      `offres d'emploi ${city.toLowerCase()}`,
      `travail à ${city.toLowerCase()}`,
      `recrutement ${city.toLowerCase()}`,
      'emploi en guinée',
    ],
    h1: `Offres d'emploi à ${city}`,
  };
}

export function generateSectorPageMeta(sector: string, count: number) {
  return {
    title: `Emplois ${sector} en Guinée - ${count || ''} Offres | JobGuinée`,
    description: `Découvrez ${count ? count + ' ' : ''}offres d'emploi dans le secteur ${sector} en Guinée. Consultez les opportunités et postulez en ligne sur JobGuinée.`,
    keywords: [
      `emploi ${sector.toLowerCase()} guinée`,
      `offres d'emploi ${sector.toLowerCase()}`,
      `recrutement ${sector.toLowerCase()} guinée`,
      `travail ${sector.toLowerCase()}`,
      'emploi en guinée',
    ],
    h1: `Emplois ${sector} en Guinée`,
  };
}

export function generateJobDetailMeta(job: { companies?: { name?: string }; company_name?: string; location?: string; title?: string; contract_type?: string; sector?: string }) {
  const company = job.companies?.name || job.company_name || 'Entreprise';
  const city = job.location || 'Guinée';
  const title = job.title || 'Offre d\'emploi';
  const contractType = job.contract_type || '';

  return {
    title: `${title} - ${company} à ${city} | JobGuinée`,
    description: `Postulez à l'offre d'emploi ${title} chez ${company} à ${city}${contractType ? ' (' + contractType + ')' : ''}. Candidatez en ligne sur JobGuinée, le meilleur site d'emploi en Guinée.`,
    keywords: [
      title.toLowerCase(),
      `emploi ${city.toLowerCase()}`,
      company.toLowerCase(),
      job.sector?.toLowerCase() || 'emploi',
      'offres d\'emploi en guinée',
      'postuler emploi guinée',
    ],
  };
}

export function generateFormationsPageMeta(count: number) {
  return {
    title: `Formations professionnelles en Guinée${count ? ' - ' + count + ' programmes' : ''} | JobGuinée`,
    description: `Découvrez les formations professionnelles en Guinée. Formations certifiantes à Conakry, programmes de développement de compétences. Boostez votre carrière avec JobGuinée.`,
    keywords: FORMATION_KEYWORDS,
  };
}

export function generateBlogPageMeta() {
  return {
    title: 'Actualités emploi et marché du travail en Guinée | Blog JobGuinée',
    description: 'Suivez l\'actualité de l\'emploi en Guinée. Conseils carrière, tendances du marché du travail guinéen, statistiques, informations recrutement.',
    keywords: MARKET_KEYWORDS,
  };
}

// ============================================
// ALL KEYWORDS COMBINED (for SEO config sync)
// ============================================
export const ALL_KEYWORDS = [
  ...PRIMARY_KEYWORDS,
  ...SECONDARY_KEYWORDS,
  ...FORMATION_KEYWORDS,
  ...MARKET_KEYWORDS,
  ...LONG_TAIL_KEYWORDS,
];
