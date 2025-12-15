import { supabase } from '../lib/supabase';

interface ContentSuggestion {
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  h2Suggestions: string[];
  contentOutline: string[];
  score: number;
}

interface KeywordAnalysis {
  keyword: string;
  volume: number;
  difficulty: number;
  relevance: number;
  suggestions: string[];
}

class SEOSemanticAIService {
  async generateOptimizedContent(
    topic: string,
    contentType: 'job' | 'sector' | 'city' | 'blog' | 'formation',
    context?: any
  ): Promise<ContentSuggestion> {
    const baseKeywords = this.extractKeywords(topic, contentType);
    const semanticKeywords = this.generateSemanticKeywords(baseKeywords, contentType);

    const title = this.generateOptimizedTitle(topic, contentType, context);
    const description = this.generateOptimizedDescription(topic, contentType, context);
    const h1 = this.generateH1(topic, contentType);
    const h2Suggestions = this.generateH2Suggestions(topic, contentType, context);
    const contentOutline = this.generateContentOutline(topic, contentType, context);

    const score = this.calculateContentScore(title, description, baseKeywords);

    return {
      title,
      description,
      keywords: [...baseKeywords, ...semanticKeywords],
      h1,
      h2Suggestions,
      contentOutline,
      score
    };
  }

  private extractKeywords(topic: string, contentType: string): string[] {
    const keywords: string[] = [];
    const topicLower = topic.toLowerCase();

    keywords.push(topicLower);
    keywords.push(`${topicLower} guinée`);

    switch (contentType) {
      case 'job':
        keywords.push('emploi', 'offre emploi', 'recrutement');
        break;
      case 'sector':
        keywords.push('secteur', 'emplois', 'carrière');
        break;
      case 'city':
        keywords.push('emploi local', 'travail', 'opportunités');
        break;
      case 'blog':
        keywords.push('conseils', 'guide', 'astuces');
        break;
      case 'formation':
        keywords.push('formation', 'cours', 'apprentissage');
        break;
    }

    return keywords;
  }

  private generateSemanticKeywords(baseKeywords: string[], contentType: string): string[] {
    const semanticMap: Record<string, string[]> = {
      'emploi': ['opportunité professionnelle', 'poste vacant', 'offre travail'],
      'recrutement': ['recherche candidat', 'embauche', 'sélection'],
      'formation': ['développement compétences', 'perfectionnement', 'qualification'],
      'carrière': ['évolution professionnelle', 'parcours', 'développement'],
      'secteur': ['domaine activité', 'industrie', 'branche professionnelle']
    };

    const semanticKeywords: string[] = [];
    baseKeywords.forEach(keyword => {
      const variants = semanticMap[keyword];
      if (variants) {
        semanticKeywords.push(...variants.slice(0, 2));
      }
    });

    return semanticKeywords;
  }

  private generateOptimizedTitle(topic: string, contentType: string, context?: any): string {
    const templates = {
      job: [
        `${topic} - Offre d'Emploi ${context?.location || 'en Guinée'} | JobGuinée`,
        `Recrutement ${topic} ${context?.location ? 'à ' + context.location : ''} | Postulez Maintenant`,
        `${topic} - ${context?.company || 'Emploi'} | Candidature Rapide`
      ],
      sector: [
        `Emplois ${topic} en Guinée - ${context?.count || 'Nombreuses'} Offres Disponibles`,
        `Carrière ${topic} | Opportunités Professionnelles en Guinée`,
        `${topic} : ${context?.count || 'Top'} Offres d'Emploi | JobGuinée`
      ],
      city: [
        `Emplois à ${topic} - ${context?.count || 'Toutes'} les Offres | JobGuinée`,
        `Trouver un Emploi à ${topic} | ${context?.count || 'Nombreuses'} Opportunités`,
        `Offres d'Emploi ${topic} | Recrutement Local`
      ],
      blog: [
        `${topic} | Guide Complet pour Réussir | JobGuinée`,
        `${topic} : Conseils d'Experts | Blog JobGuinée`,
        `Tout Savoir sur ${topic} | Guide Pratique`
      ],
      formation: [
        `Formation ${topic} | Développez vos Compétences`,
        `Cours ${topic} en Guinée | Formation Certifiante`,
        `Apprendre ${topic} | Programme Complet de Formation`
      ]
    };

    const options = templates[contentType] || templates.job;
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateOptimizedDescription(topic: string, contentType: string, context?: any): string {
    const templates = {
      job: `Postulez dès maintenant à l'offre ${topic}${context?.location ? ' à ' + context.location : ' en Guinée'}. ${context?.company ? context.company + ' recherche' : 'Nous recherchons'} des candidats motivés. Candidature rapide et réponse garantie sous 48h.`,

      sector: `Découvrez ${context?.count || 'toutes les'} offres d'emploi dans le secteur ${topic} en Guinée. Des opportunités dans les meilleures entreprises pour développer votre carrière professionnelle. Postulez en ligne facilement.`,

      city: `Trouvez votre prochain emploi à ${topic}. ${context?.count || 'Nombreuses'} offres disponibles dans tous les secteurs. Postulez directement aux entreprises qui recrutent localement. Opportunités à temps plein et temps partiel.`,

      blog: `${topic} : découvrez notre guide complet avec des conseils pratiques, des astuces d'experts et tout ce qu'il faut savoir pour réussir votre recherche d'emploi ou votre carrière en Guinée.`,

      formation: `Formation professionnelle ${topic} en Guinée. Programme complet, certifiant, adapté aux besoins du marché. Développez vos compétences et boostez votre carrière avec nos formations de qualité.`
    };

    return templates[contentType] || templates.job;
  }

  private generateH1(topic: string, contentType: string): string {
    const templates = {
      job: `Offre d'Emploi : ${topic}`,
      sector: `Emplois dans le secteur ${topic}`,
      city: `Offres d'Emploi à ${topic}`,
      blog: topic,
      formation: `Formation ${topic}`
    };

    return templates[contentType] || topic;
  }

  private generateH2Suggestions(topic: string, contentType: string, context?: any): string[] {
    const suggestions: Record<string, string[]> = {
      job: [
        'Description du poste',
        'Profil recherché',
        'Compétences requises',
        'Avantages et rémunération',
        'Comment postuler'
      ],
      sector: [
        `Les métiers du secteur ${topic}`,
        'Compétences demandées',
        'Évolution de carrière',
        `Entreprises qui recrutent en ${topic}`,
        'Conseils pour réussir'
      ],
      city: [
        `Pourquoi travailler à ${topic}`,
        'Secteurs qui recrutent',
        'Salaires moyens',
        'Qualité de vie',
        'Offres du moment'
      ],
      blog: [
        'Introduction',
        'Les bases essentielles',
        'Conseils pratiques',
        'Erreurs à éviter',
        'Conclusion et ressources'
      ],
      formation: [
        'Objectifs de la formation',
        'Programme détaillé',
        'Débouchés professionnels',
        'Certification',
        'Inscription'
      ]
    };

    return suggestions[contentType] || suggestions.job;
  }

  private generateContentOutline(topic: string, contentType: string, context?: any): string[] {
    const outlines: Record<string, string[]> = {
      job: [
        'Introduction attractive du poste',
        'Missions principales et responsabilités',
        'Profil idéal du candidat',
        'Compétences techniques et soft skills',
        'Conditions de travail et avantages',
        'Processus de candidature détaillé'
      ],
      sector: [
        `Vue d'ensemble du secteur ${topic} en Guinée`,
        'Principales opportunités professionnelles',
        'Compétences les plus recherchées',
        'Tendances et perspectives d\'avenir',
        'Top entreprises qui recrutent',
        'Conseils pour se démarquer'
      ],
      city: [
        `Présentation de ${topic} comme pôle d'emploi`,
        'Principaux secteurs d\'activité',
        'Opportunités professionnelles actuelles',
        'Infrastructure et qualité de vie',
        'Réseautage et événements professionnels',
        'Guide pratique pour candidats'
      ],
      blog: [
        'Accroche et contexte du sujet',
        'Problématique principale',
        'Solutions et méthodologies',
        'Exemples concrets et cas pratiques',
        'Ressources complémentaires',
        'Appel à l\'action'
      ],
      formation: [
        'Présentation de la formation',
        'Public cible et prérequis',
        'Programme et modules',
        'Méthodologie pédagogique',
        'Certification et reconnaissance',
        'Modalités d\'inscription'
      ]
    };

    return outlines[contentType] || outlines.job;
  }

  private calculateContentScore(title: string, description: string, keywords: string[]): number {
    let score = 0;

    if (title.length >= 30 && title.length <= 60) score += 20;
    if (description.length >= 120 && description.length <= 160) score += 20;

    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();

    keywords.forEach(keyword => {
      if (titleLower.includes(keyword.toLowerCase())) score += 10;
      if (descLower.includes(keyword.toLowerCase())) score += 5;
    });

    if (title.includes('|')) score += 5;
    if (title.includes('Guinée') || title.includes('JobGuinée')) score += 5;

    if (description.includes('Postulez') || description.includes('Découvrez')) score += 5;

    return Math.min(score, 100);
  }

  async analyzeKeywordOpportunity(keyword: string): Promise<KeywordAnalysis> {
    const volume = this.estimateSearchVolume(keyword);
    const difficulty = this.estimateDifficulty(keyword);
    const relevance = this.calculateRelevance(keyword);
    const suggestions = this.generateKeywordVariations(keyword);

    return {
      keyword,
      volume,
      difficulty,
      relevance,
      suggestions
    };
  }

  private estimateSearchVolume(keyword: string): number {
    const highVolumeTerms = ['emploi', 'travail', 'recrutement', 'offre'];
    const mediumVolumeTerms = ['formation', 'stage', 'carrière'];

    const keywordLower = keyword.toLowerCase();

    if (highVolumeTerms.some(term => keywordLower.includes(term))) {
      return Math.floor(Math.random() * 400) + 600;
    } else if (mediumVolumeTerms.some(term => keywordLower.includes(term))) {
      return Math.floor(Math.random() * 200) + 200;
    }

    return Math.floor(Math.random() * 150) + 50;
  }

  private estimateDifficulty(keyword: string): number {
    const wordCount = keyword.split(' ').length;
    const hasLocation = keyword.toLowerCase().includes('guinée') ||
                       keyword.toLowerCase().includes('conakry');

    let difficulty = 50;

    if (wordCount > 3) difficulty -= 15;
    if (hasLocation) difficulty -= 10;
    if (keyword.length > 20) difficulty -= 10;

    return Math.max(10, Math.min(90, difficulty));
  }

  private calculateRelevance(keyword: string): number {
    const jobTerms = ['emploi', 'travail', 'recrutement', 'offre', 'poste', 'candidat'];
    const keywordLower = keyword.toLowerCase();

    let relevance = 50;
    jobTerms.forEach(term => {
      if (keywordLower.includes(term)) relevance += 10;
    });

    if (keywordLower.includes('guinée')) relevance += 15;

    return Math.min(100, relevance);
  }

  private generateKeywordVariations(keyword: string): string[] {
    const variations: string[] = [];
    const keywordLower = keyword.toLowerCase();

    variations.push(`${keyword} guinée`);
    variations.push(`${keyword} conakry`);
    variations.push(`offre ${keyword}`);
    variations.push(`recherche ${keyword}`);
    variations.push(`${keyword} 2024`);

    if (!keywordLower.includes('emploi')) {
      variations.push(`emploi ${keyword}`);
    }

    return variations.slice(0, 5);
  }

  async generateContentIdeas(sector: string, count: number = 5): Promise<string[]> {
    const ideas: string[] = [];

    const templates = [
      `Comment réussir son entretien dans le secteur ${sector}`,
      `Top 10 compétences recherchées en ${sector} en Guinée`,
      `Guide complet pour débuter une carrière en ${sector}`,
      `${sector} : tendances et perspectives d'avenir`,
      `Les erreurs à éviter lors d'une candidature en ${sector}`,
      `Salaires moyens en ${sector} en Guinée`,
      `Formation et certification en ${sector} : le guide`,
      `${sector} vs autres secteurs : comparaison`,
      `Témoignages de professionnels du ${sector}`,
      `Comment se reconvertir dans le ${sector}`
    ];

    return templates.slice(0, count);
  }

  async optimizeExistingContent(
    currentTitle: string,
    currentDescription: string,
    targetKeywords: string[]
  ): Promise<{
    optimizedTitle: string;
    optimizedDescription: string;
    improvements: string[];
    score: number;
  }> {
    const improvements: string[] = [];
    let optimizedTitle = currentTitle;
    let optimizedDescription = currentDescription;

    if (currentTitle.length < 30) {
      improvements.push('Titre trop court - Ajout de détails pertinents');
      const keyword = targetKeywords[0] || 'emploi';
      optimizedTitle = `${currentTitle} | ${keyword} en Guinée | JobGuinée`;
    } else if (currentTitle.length > 60) {
      improvements.push('Titre trop long - Réduction pour meilleure lisibilité');
      optimizedTitle = currentTitle.substring(0, 57) + '...';
    }

    if (currentDescription.length < 120) {
      improvements.push('Description trop courte - Ajout d\'informations');
      optimizedDescription = `${currentDescription} Découvrez cette opportunité sur JobGuinée et postulez en ligne facilement.`;
    } else if (currentDescription.length > 160) {
      improvements.push('Description trop longue - Condensation du message');
      optimizedDescription = currentDescription.substring(0, 157) + '...';
    }

    const titleHasKeyword = targetKeywords.some(kw =>
      optimizedTitle.toLowerCase().includes(kw.toLowerCase())
    );

    if (!titleHasKeyword && targetKeywords.length > 0) {
      improvements.push('Ajout du mot-clé principal dans le titre');
      optimizedTitle = `${targetKeywords[0]} - ${optimizedTitle}`;
    }

    const score = this.calculateContentScore(optimizedTitle, optimizedDescription, targetKeywords);

    return {
      optimizedTitle,
      optimizedDescription,
      improvements,
      score
    };
  }
}

export const seoSemanticAIService = new SEOSemanticAIService();
