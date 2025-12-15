import { supabase } from '../lib/supabase';
import { SEOPageMeta } from './seoService';

interface SEOScore {
  overall: number;
  technical: number;
  content: number;
  onPage: number;
  offPage: number;
  details: ScoreDetails;
}

interface ScoreDetails {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  actionItems: ActionItem[];
}

interface ActionItem {
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: number;
  effort: number;
}

interface PageAudit {
  pagePath: string;
  score: SEOScore;
  issues: Issue[];
  recommendations: string[];
  lastAudited: string;
}

interface Issue {
  type: 'error' | 'warning' | 'info';
  category: 'technical' | 'content' | 'performance' | 'security';
  message: string;
  fix: string;
}

class SEOScoringService {
  async auditPage(pagePath: string): Promise<PageAudit> {
    const { data: pageMeta } = await supabase
      .from('seo_page_meta')
      .select('*')
      .eq('page_path', pagePath)
      .single();

    if (!pageMeta) {
      throw new Error('Page not found');
    }

    const score = await this.calculatePageScore(pageMeta);
    const issues = this.identifyIssues(pageMeta);
    const recommendations = this.generateRecommendations(score, issues);

    return {
      pagePath,
      score,
      issues,
      recommendations,
      lastAudited: new Date().toISOString()
    };
  }

  private async calculatePageScore(page: SEOPageMeta): Promise<SEOScore> {
    const technical = this.scoreTechnical(page);
    const content = this.scoreContent(page);
    const onPage = this.scoreOnPage(page);
    const offPage = await this.scoreOffPage(page);

    const overall = Math.round((technical + content + onPage + offPage) / 4);

    const details = this.generateScoreDetails(
      { technical, content, onPage, offPage },
      page
    );

    return {
      overall,
      technical,
      content,
      onPage,
      offPage,
      details
    };
  }

  private scoreTechnical(page: SEOPageMeta): number {
    let score = 0;

    if (page.title && page.title.length >= 30 && page.title.length <= 60) {
      score += 25;
    } else if (page.title) {
      score += 15;
    }

    if (page.description && page.description.length >= 120 && page.description.length <= 160) {
      score += 25;
    } else if (page.description) {
      score += 15;
    }

    if (page.canonical_url) score += 15;

    if (page.keywords && page.keywords.length > 0) {
      score += 10;
    }

    if (page.og_title && page.og_description && page.og_image) {
      score += 15;
    }

    if (page.is_active) score += 10;

    return Math.min(100, score);
  }

  private scoreContent(page: SEOPageMeta): number {
    let score = 0;

    if (page.keywords && page.keywords.length >= 3) {
      score += 25;
    } else if (page.keywords && page.keywords.length > 0) {
      score += 15;
    }

    if (page.title && page.keywords) {
      const titleLower = page.title.toLowerCase();
      const hasKeyword = page.keywords.some((kw: string) =>
        titleLower.includes(kw.toLowerCase())
      );
      if (hasKeyword) score += 20;
    }

    if (page.description && page.keywords) {
      const descLower = page.description.toLowerCase();
      const hasKeyword = page.keywords.some((kw: string) =>
        descLower.includes(kw.toLowerCase())
      );
      if (hasKeyword) score += 15;
    }

    if (page.description && (
      page.description.includes('Postulez') ||
      page.description.includes('Découvrez') ||
      page.description.includes('Trouvez')
    )) {
      score += 10;
    }

    if (page.title && page.title.includes('|')) {
      score += 10;
    }

    if (page.title && (
      page.title.includes('Guinée') ||
      page.title.includes('JobGuinée')
    )) {
      score += 10;
    }

    if (page.description && page.description.length > 100) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private scoreOnPage(page: SEOPageMeta): number {
    let score = 0;

    if (page.priority) {
      if (page.priority >= 0.8) score += 20;
      else if (page.priority >= 0.6) score += 15;
      else score += 10;
    }

    if (page.change_freq) {
      const goodFreqs = ['daily', 'weekly', 'hourly'];
      if (goodFreqs.includes(page.change_freq)) {
        score += 15;
      } else {
        score += 10;
      }
    }

    if (page.og_title && page.og_description) {
      score += 20;
    }

    if (page.og_image) {
      score += 15;
    }

    if (page.og_type) {
      score += 10;
    }

    if (page.canonical_url) {
      score += 20;
    }

    return Math.min(100, score);
  }

  private async scoreOffPage(page: SEOPageMeta): Promise<number> {
    let score = 50;

    try {
      const { data: inboundLinks } = await supabase
        .from('seo_internal_links')
        .select('*')
        .eq('target_page', page.page_path)
        .eq('is_active', true);

      const linkCount = inboundLinks?.length || 0;

      if (linkCount >= 5) score = 100;
      else if (linkCount >= 3) score = 80;
      else if (linkCount >= 1) score = 60;
      else score = 30;

      const { data: schemas } = await supabase
        .from('seo_schemas')
        .select('*')
        .eq('entity_id', page.entity_id)
        .eq('is_active', true);

      if (schemas && schemas.length > 0) {
        score = Math.min(100, score + 20);
      }
    } catch (error) {
      console.error('Error scoring off-page:', error);
    }

    return score;
  }

  private generateScoreDetails(
    scores: { technical: number; content: number; onPage: number; offPage: number },
    page: SEOPageMeta
  ): ScoreDetails {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const opportunities: string[] = [];
    const threats: string[] = [];
    const actionItems: ActionItem[] = [];

    if (scores.technical >= 80) {
      strengths.push('Excellente configuration technique');
    } else if (scores.technical < 60) {
      weaknesses.push('Configuration technique à améliorer');
      actionItems.push({
        priority: 'high',
        title: 'Optimiser les meta tags',
        description: 'Ajuster la longueur du titre et de la description',
        impact: 8,
        effort: 2
      });
    }

    if (scores.content >= 80) {
      strengths.push('Contenu bien optimisé pour le SEO');
    } else if (scores.content < 60) {
      weaknesses.push('Contenu nécessite une optimisation');
      actionItems.push({
        priority: 'high',
        title: 'Enrichir le contenu',
        description: 'Ajouter des mots-clés pertinents et améliorer la description',
        impact: 9,
        effort: 3
      });
    }

    if (scores.onPage >= 80) {
      strengths.push('Optimisation on-page excellente');
    } else {
      opportunities.push('Améliorer les balises Open Graph');
      actionItems.push({
        priority: 'medium',
        title: 'Compléter les balises sociales',
        description: 'Ajouter og:image, og:title et og:description',
        impact: 6,
        effort: 2
      });
    }

    if (scores.offPage < 50) {
      weaknesses.push('Peu de liens internes pointant vers cette page');
      actionItems.push({
        priority: 'high',
        title: 'Créer des liens internes',
        description: 'Ajouter 3-5 liens depuis des pages connexes',
        impact: 8,
        effort: 3
      });
    }

    if (!page.keywords || page.keywords.length < 3) {
      opportunities.push('Ajouter plus de mots-clés ciblés');
      actionItems.push({
        priority: 'medium',
        title: 'Recherche de mots-clés',
        description: 'Identifier 3-5 mots-clés supplémentaires pertinents',
        impact: 7,
        effort: 2
      });
    }

    if (!page.canonical_url) {
      threats.push('URL canonique manquante - Risque de contenu dupliqué');
      actionItems.push({
        priority: 'critical',
        title: 'Ajouter URL canonique',
        description: 'Définir l\'URL canonique pour éviter la duplication',
        impact: 9,
        effort: 1
      });
    }

    return {
      strengths,
      weaknesses,
      opportunities,
      threats,
      actionItems: actionItems.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
    };
  }

  private identifyIssues(page: SEOPageMeta): Issue[] {
    const issues: Issue[] = [];

    if (!page.title) {
      issues.push({
        type: 'error',
        category: 'technical',
        message: 'Titre manquant',
        fix: 'Ajouter un titre de 30-60 caractères'
      });
    } else if (page.title.length < 30) {
      issues.push({
        type: 'warning',
        category: 'technical',
        message: 'Titre trop court',
        fix: 'Allonger le titre à 30-60 caractères'
      });
    } else if (page.title.length > 60) {
      issues.push({
        type: 'warning',
        category: 'technical',
        message: 'Titre trop long',
        fix: 'Réduire le titre à maximum 60 caractères'
      });
    }

    if (!page.description) {
      issues.push({
        type: 'error',
        category: 'content',
        message: 'Description manquante',
        fix: 'Ajouter une description de 120-160 caractères'
      });
    } else if (page.description.length < 120) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: 'Description trop courte',
        fix: 'Allonger la description à 120-160 caractères'
      });
    } else if (page.description.length > 160) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: 'Description trop longue',
        fix: 'Réduire la description à maximum 160 caractères'
      });
    }

    if (!page.keywords || page.keywords.length === 0) {
      issues.push({
        type: 'warning',
        category: 'content',
        message: 'Aucun mot-clé défini',
        fix: 'Ajouter 3-5 mots-clés pertinents'
      });
    }

    if (!page.canonical_url) {
      issues.push({
        type: 'error',
        category: 'technical',
        message: 'URL canonique manquante',
        fix: 'Définir l\'URL canonique pour éviter le contenu dupliqué'
      });
    }

    if (!page.og_title || !page.og_description) {
      issues.push({
        type: 'info',
        category: 'content',
        message: 'Balises Open Graph incomplètes',
        fix: 'Compléter og:title, og:description et og:image'
      });
    }

    if (!page.is_active) {
      issues.push({
        type: 'warning',
        category: 'technical',
        message: 'Page inactive',
        fix: 'Activer la page pour l\'indexation'
      });
    }

    return issues;
  }

  private generateRecommendations(score: SEOScore, issues: Issue[]): string[] {
    const recommendations: string[] = [];

    if (score.overall < 60) {
      recommendations.push('Score global faible: Prioriser les corrections critiques');
    }

    const criticalIssues = issues.filter(i => i.type === 'error');
    if (criticalIssues.length > 0) {
      recommendations.push(`Corriger ${criticalIssues.length} erreur(s) critique(s) en priorité`);
    }

    if (score.technical < 70) {
      recommendations.push('Optimiser les meta tags (titre et description)');
    }

    if (score.content < 70) {
      recommendations.push('Enrichir le contenu avec des mots-clés pertinents');
    }

    if (score.offPage < 50) {
      recommendations.push('Créer 3-5 liens internes depuis des pages connexes');
    }

    if (score.onPage < 70) {
      recommendations.push('Compléter les balises Open Graph pour les réseaux sociaux');
    }

    score.details.actionItems.slice(0, 3).forEach(item => {
      recommendations.push(`[${item.priority.toUpperCase()}] ${item.title}`);
    });

    return recommendations;
  }

  async auditAllPages(limit: number = 50): Promise<{
    totalPages: number;
    averageScore: number;
    topPages: Array<{ path: string; score: number }>;
    bottomPages: Array<{ path: string; score: number }>;
    criticalIssues: number;
    warnings: number;
  }> {
    try {
      const { data: pages } = await supabase
        .from('seo_page_meta')
        .select('*')
        .eq('is_active', true)
        .limit(limit);

      if (!pages || pages.length === 0) {
        return {
          totalPages: 0,
          averageScore: 0,
          topPages: [],
          bottomPages: [],
          criticalIssues: 0,
          warnings: 0
        };
      }

      const scores: Array<{ path: string; score: number }> = [];
      let totalScore = 0;
      let criticalIssues = 0;
      let warnings = 0;

      for (const page of pages.slice(0, 20)) {
        const score = await this.calculatePageScore(page);
        const issues = this.identifyIssues(page);

        scores.push({ path: page.page_path, score: score.overall });
        totalScore += score.overall;

        criticalIssues += issues.filter(i => i.type === 'error').length;
        warnings += issues.filter(i => i.type === 'warning').length;
      }

      scores.sort((a, b) => b.score - a.score);

      return {
        totalPages: pages.length,
        averageScore: Math.round(totalScore / scores.length),
        topPages: scores.slice(0, 5),
        bottomPages: scores.slice(-5).reverse(),
        criticalIssues,
        warnings
      };
    } catch (error) {
      console.error('Error auditing all pages:', error);
      return {
        totalPages: 0,
        averageScore: 0,
        topPages: [],
        bottomPages: [],
        criticalIssues: 0,
        warnings: 0
      };
    }
  }

  async getQuickWins(): Promise<ActionItem[]> {
    const quickWins: ActionItem[] = [];

    try {
      const { data: pages } = await supabase
        .from('seo_page_meta')
        .select('*')
        .eq('is_active', true)
        .limit(50);

      if (!pages) return quickWins;

      for (const page of pages) {
        if (!page.title || page.title.length < 30) {
          quickWins.push({
            priority: 'high',
            title: `Optimiser le titre de ${page.page_path}`,
            description: 'Titre trop court ou manquant',
            impact: 8,
            effort: 1
          });
        }

        if (!page.canonical_url) {
          quickWins.push({
            priority: 'critical',
            title: `Ajouter URL canonique pour ${page.page_path}`,
            description: 'Éviter le contenu dupliqué',
            impact: 9,
            effort: 1
          });
        }

        if (!page.keywords || page.keywords.length === 0) {
          quickWins.push({
            priority: 'medium',
            title: `Ajouter des mots-clés à ${page.page_path}`,
            description: 'Améliorer le ciblage SEO',
            impact: 7,
            effort: 2
          });
        }
      }

      return quickWins
        .filter((item, index, self) =>
          index === self.findIndex(t => t.title === item.title)
        )
        .sort((a, b) => (b.impact / b.effort) - (a.impact / a.effort))
        .slice(0, 10);
    } catch (error) {
      console.error('Error getting quick wins:', error);
      return [];
    }
  }
}

export const seoScoringService = new SEOScoringService();
