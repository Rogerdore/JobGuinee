import { supabase } from '../lib/supabase';

interface LinkSuggestion {
  sourcePage: string;
  targetPage: string;
  anchorText: string;
  relevanceScore: number;
  linkType: 'contextual' | 'related' | 'navigation';
  reason: string;
}

interface LinkAnalysis {
  totalLinks: number;
  internalLinks: number;
  externalLinks: number;
  brokenLinks: number;
  orphanPages: number;
  pageRankScore: number;
}

interface PageLinkProfile {
  pagePath: string;
  inboundLinks: number;
  outboundLinks: number;
  pageAuthority: number;
  suggestedImprovements: string[];
}

class SEOInternalLinkingService {
  async generateLinkSuggestions(sourcePage: string, limit: number = 5): Promise<LinkSuggestion[]> {
    const suggestions: LinkSuggestion[] = [];

    const relatedPages = await this.findRelatedPages(sourcePage);

    for (const page of relatedPages.slice(0, limit)) {
      const anchorText = await this.generateAnchorText(sourcePage, page.path);
      const relevanceScore = this.calculateRelevance(sourcePage, page.path);

      suggestions.push({
        sourcePage,
        targetPage: page.path,
        anchorText,
        relevanceScore,
        linkType: this.determineLinkType(sourcePage, page.path),
        reason: this.generateLinkReason(sourcePage, page.path)
      });
    }

    return suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private async findRelatedPages(sourcePage: string): Promise<Array<{ path: string; title: string; type: string }>> {
    const pages: Array<{ path: string; title: string; type: string }> = [];

    const pageType = this.identifyPageType(sourcePage);

    if (pageType === 'job_detail') {
      const jobId = this.extractJobId(sourcePage);
      if (jobId) {
        const { data: job } = await supabase
          .from('jobs')
          .select('sector, location')
          .eq('id', jobId)
          .single();

        if (job) {
          pages.push({
            path: `/jobs?sector=${encodeURIComponent(job.sector)}`,
            title: `Emplois ${job.sector}`,
            type: 'sector'
          });

          pages.push({
            path: `/jobs?location=${encodeURIComponent(job.location)}`,
            title: `Emplois ${job.location}`,
            type: 'city'
          });

          const { data: relatedJobs } = await supabase
            .from('jobs')
            .select('id, title')
            .eq('sector', job.sector)
            .neq('id', jobId)
            .limit(3);

          if (relatedJobs) {
            relatedJobs.forEach(relJob => {
              pages.push({
                path: `/job-detail/${relJob.id}`,
                title: relJob.title,
                type: 'job'
              });
            });
          }
        }
      }
    } else if (pageType === 'sector') {
      const sector = this.extractSector(sourcePage);
      if (sector) {
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, title, location')
          .eq('sector', sector)
          .eq('status', 'published')
          .limit(5);

        if (jobs) {
          jobs.forEach(job => {
            pages.push({
              path: `/job-detail/${job.id}`,
              title: job.title,
              type: 'job'
            });
          });

          const cities = [...new Set(jobs.map(j => j.location))];
          cities.forEach(city => {
            pages.push({
              path: `/jobs?location=${encodeURIComponent(city)}`,
              title: `Emplois ${city}`,
              type: 'city'
            });
          });
        }
      }
    } else if (pageType === 'city') {
      const city = this.extractCity(sourcePage);
      if (city) {
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, title, sector')
          .eq('location', city)
          .eq('status', 'published')
          .limit(5);

        if (jobs) {
          jobs.forEach(job => {
            pages.push({
              path: `/job-detail/${job.id}`,
              title: job.title,
              type: 'job'
            });
          });

          const sectors = [...new Set(jobs.map(j => j.sector))];
          sectors.forEach(sector => {
            pages.push({
              path: `/jobs?sector=${encodeURIComponent(sector)}`,
              title: `Emplois ${sector}`,
              type: 'sector'
            });
          });
        }
      }
    }

    pages.push({
      path: '/jobs',
      title: 'Toutes les offres d\'emploi',
      type: 'list'
    });

    pages.push({
      path: '/formations',
      title: 'Formations professionnelles',
      type: 'formations'
    });

    return pages;
  }

  private identifyPageType(path: string): string {
    if (path.includes('/job-detail/')) return 'job_detail';
    if (path.includes('?sector=')) return 'sector';
    if (path.includes('?location=')) return 'city';
    if (path.includes('/blog/')) return 'blog';
    if (path === '/jobs') return 'jobs_list';
    if (path === '/') return 'home';
    return 'other';
  }

  private extractJobId(path: string): string | null {
    const match = path.match(/\/job-detail\/([a-z0-9-]+)/);
    return match ? match[1] : null;
  }

  private extractSector(path: string): string | null {
    const match = path.match(/sector=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  private extractCity(path: string): string | null {
    const match = path.match(/location=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  private async generateAnchorText(sourcePage: string, targetPage: string): Promise<string> {
    const targetType = this.identifyPageType(targetPage);

    const templates: Record<string, string[]> = {
      job_detail: ['Voir cette offre', 'Découvrir le poste', 'En savoir plus', 'Postuler maintenant'],
      sector: ['Emplois dans ce secteur', 'Autres offres similaires', 'Opportunités {sector}'],
      city: ['Emplois à {city}', 'Offres locales', 'Opportunités {city}'],
      jobs_list: ['Toutes les offres', 'Voir plus d\'emplois', 'Parcourir les offres'],
      blog: ['Lire l\'article', 'En savoir plus', 'Découvrir nos conseils'],
      formations: ['Nos formations', 'Se former', 'Développer vos compétences']
    };

    const options = templates[targetType] || ['En savoir plus'];
    let anchorText = options[Math.floor(Math.random() * options.length)];

    if (anchorText.includes('{sector}')) {
      const sector = this.extractSector(targetPage);
      anchorText = anchorText.replace('{sector}', sector || 'ce secteur');
    }

    if (anchorText.includes('{city}')) {
      const city = this.extractCity(targetPage);
      anchorText = anchorText.replace('{city}', city || 'cette ville');
    }

    return anchorText;
  }

  private calculateRelevance(sourcePage: string, targetPage: string): number {
    let score = 50;

    const sourceType = this.identifyPageType(sourcePage);
    const targetType = this.identifyPageType(targetPage);

    if (sourceType === 'job_detail' && targetType === 'sector') score += 30;
    if (sourceType === 'job_detail' && targetType === 'city') score += 30;
    if (sourceType === 'job_detail' && targetType === 'job_detail') score += 20;

    if (sourceType === 'sector' && targetType === 'job_detail') score += 35;
    if (sourceType === 'sector' && targetType === 'city') score += 15;

    if (sourceType === 'city' && targetType === 'job_detail') score += 35;
    if (sourceType === 'city' && targetType === 'sector') score += 15;

    const sourceSector = this.extractSector(sourcePage);
    const targetSector = this.extractSector(targetPage);
    if (sourceSector && targetSector && sourceSector === targetSector) {
      score += 25;
    }

    const sourceCity = this.extractCity(sourcePage);
    const targetCity = this.extractCity(targetPage);
    if (sourceCity && targetCity && sourceCity === targetCity) {
      score += 25;
    }

    return Math.min(100, score);
  }

  private determineLinkType(sourcePage: string, targetPage: string): 'contextual' | 'related' | 'navigation' {
    const relevance = this.calculateRelevance(sourcePage, targetPage);

    if (relevance >= 70) return 'contextual';
    if (relevance >= 50) return 'related';
    return 'navigation';
  }

  private generateLinkReason(sourcePage: string, targetPage: string): string {
    const targetType = this.identifyPageType(targetPage);

    const reasons: Record<string, string> = {
      job_detail: 'Offre d\'emploi similaire dans le même secteur/ville',
      sector: 'Page secteur pour explorer plus d\'opportunités',
      city: 'Page ville pour voir les offres locales',
      jobs_list: 'Retour à la liste complète des offres',
      blog: 'Article de blog pertinent avec des conseils',
      formations: 'Formation pour développer les compétences requises'
    };

    return reasons[targetType] || 'Page connexe recommandée';
  }

  async saveLinkSuggestion(suggestion: LinkSuggestion): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('seo_internal_links')
        .insert({
          source_page: suggestion.sourcePage,
          target_page: suggestion.targetPage,
          anchor_text: suggestion.anchorText,
          link_type: suggestion.linkType,
          relevance_score: suggestion.relevanceScore,
          is_active: true,
          is_broken: false
        });

      return !error;
    } catch (error) {
      console.error('Error saving link suggestion:', error);
      return false;
    }
  }

  async analyzeInternalLinking(): Promise<LinkAnalysis> {
    try {
      const { data: allLinks } = await supabase
        .from('seo_internal_links')
        .select('*');

      const { data: allPages } = await supabase
        .from('seo_page_meta')
        .select('page_path');

      const totalLinks = allLinks?.length || 0;
      const internalLinks = allLinks?.filter(l => l.is_active)?.length || 0;
      const brokenLinks = allLinks?.filter(l => l.is_broken)?.length || 0;

      const pagesWithLinks = new Set(allLinks?.map(l => l.source_page));
      const totalPages = allPages?.length || 0;
      const orphanPages = totalPages - pagesWithLinks.size;

      const pageRankScore = this.calculatePageRank(allLinks || [], totalPages);

      return {
        totalLinks,
        internalLinks,
        externalLinks: 0,
        brokenLinks,
        orphanPages,
        pageRankScore
      };
    } catch (error) {
      console.error('Error analyzing internal linking:', error);
      return {
        totalLinks: 0,
        internalLinks: 0,
        externalLinks: 0,
        brokenLinks: 0,
        orphanPages: 0,
        pageRankScore: 0
      };
    }
  }

  private calculatePageRank(links: any[], totalPages: number): number {
    if (totalPages === 0) return 0;

    const avgLinksPerPage = links.length / totalPages;

    if (avgLinksPerPage >= 5) return 90;
    if (avgLinksPerPage >= 3) return 70;
    if (avgLinksPerPage >= 2) return 50;
    if (avgLinksPerPage >= 1) return 30;
    return 10;
  }

  async getPageLinkProfile(pagePath: string): Promise<PageLinkProfile> {
    try {
      const { data: inbound } = await supabase
        .from('seo_internal_links')
        .select('*')
        .eq('target_page', pagePath)
        .eq('is_active', true);

      const { data: outbound } = await supabase
        .from('seo_internal_links')
        .select('*')
        .eq('source_page', pagePath)
        .eq('is_active', true);

      const inboundLinks = inbound?.length || 0;
      const outboundLinks = outbound?.length || 0;

      const pageAuthority = this.calculatePageAuthority(inboundLinks, outboundLinks);
      const suggestedImprovements = this.generateImprovementSuggestions(
        inboundLinks,
        outboundLinks
      );

      return {
        pagePath,
        inboundLinks,
        outboundLinks,
        pageAuthority,
        suggestedImprovements
      };
    } catch (error) {
      console.error('Error getting page link profile:', error);
      return {
        pagePath,
        inboundLinks: 0,
        outboundLinks: 0,
        pageAuthority: 0,
        suggestedImprovements: []
      };
    }
  }

  private calculatePageAuthority(inboundLinks: number, outboundLinks: number): number {
    let authority = 0;

    authority += Math.min(inboundLinks * 10, 50);

    authority += Math.min(outboundLinks * 5, 30);

    if (inboundLinks > outboundLinks) {
      authority += 10;
    }

    if (outboundLinks >= 3 && outboundLinks <= 7) {
      authority += 10;
    }

    return Math.min(100, authority);
  }

  private generateImprovementSuggestions(inboundLinks: number, outboundLinks: number): string[] {
    const suggestions: string[] = [];

    if (inboundLinks < 3) {
      suggestions.push('Augmenter les liens entrants depuis d\'autres pages pertinentes');
    }

    if (outboundLinks < 3) {
      suggestions.push('Ajouter 3-5 liens sortants vers des pages connexes');
    }

    if (outboundLinks > 10) {
      suggestions.push('Réduire le nombre de liens sortants pour éviter la dilution');
    }

    if (inboundLinks === 0) {
      suggestions.push('CRITIQUE: Page orpheline - Aucun lien entrant détecté');
    }

    if (outboundLinks === 0) {
      suggestions.push('Ajouter des liens vers des pages complémentaires');
    }

    return suggestions;
  }

  async autoGenerateLinks(sourcePage: string): Promise<number> {
    const suggestions = await this.generateLinkSuggestions(sourcePage, 5);
    let count = 0;

    for (const suggestion of suggestions) {
      if (suggestion.relevanceScore >= 60) {
        const saved = await this.saveLinkSuggestion(suggestion);
        if (saved) count++;
      }
    }

    return count;
  }

  async buildLinkNetwork(): Promise<{
    linksCreated: number;
    pagesProcessed: number;
    errors: string[];
  }> {
    const result = {
      linksCreated: 0,
      pagesProcessed: 0,
      errors: [] as string[]
    };

    try {
      const { data: pages } = await supabase
        .from('seo_page_meta')
        .select('page_path')
        .eq('is_active', true)
        .limit(100);

      if (!pages) {
        result.errors.push('Aucune page à traiter');
        return result;
      }

      for (const page of pages) {
        try {
          const count = await this.autoGenerateLinks(page.page_path);
          result.linksCreated += count;
          result.pagesProcessed++;
        } catch (error: any) {
          result.errors.push(`Erreur pour ${page.page_path}: ${error.message}`);
        }
      }
    } catch (error: any) {
      result.errors.push(`Erreur globale: ${error.message}`);
    }

    return result;
  }
}

export const seoInternalLinkingService = new SEOInternalLinkingService();
