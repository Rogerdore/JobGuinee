import { supabase } from '../lib/supabase';
import { schemaService } from './schemaService';

export interface MarketplacePage {
  id?: string;
  page_type: 'metier' | 'secteur' | 'ville' | 'niveau' | 'combination';
  slug: string;
  title: string;
  description: string;
  keywords?: string[];
  h1: string;
  intro_text?: string;
  job_count?: number;
  metier?: string;
  secteur?: string;
  ville?: string;
  niveau?: string;
  schema_json?: any;
  canonical_url?: string;
  has_pagination?: boolean;
  total_pages?: number;
  is_active?: boolean;
}

class SeoMarketplaceService {
  /**
   * Générer automatiquement les pages marketplace SEO
   */
  async generateMarketplacePages(): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    try {
      // 1. Générer pages par métier
      const metiers = await this.getTopMetiers();
      for (const metier of metiers) {
        const page = await this.generateMetierPage(metier.title, metier.count);
        const exists = await this.pageExists(page.slug);

        if (exists) {
          await this.updatePage(page);
          updated++;
        } else {
          await this.createPage(page);
          created++;
        }
      }

      // 2. Générer pages par secteur
      const secteurs = await this.getTopSecteurs();
      for (const secteur of secteurs) {
        const page = await this.generateSecteurPage(secteur.sector, secteur.count);
        const exists = await this.pageExists(page.slug);

        if (exists) {
          await this.updatePage(page);
          updated++;
        } else {
          await this.createPage(page);
          created++;
        }
      }

      // 3. Générer pages par ville
      const villes = await this.getTopVilles();
      for (const ville of villes) {
        const page = await this.generateVillePage(ville.location, ville.count);
        const exists = await this.pageExists(page.slug);

        if (exists) {
          await this.updatePage(page);
          updated++;
        } else {
          await this.createPage(page);
          created++;
        }
      }

      // 4. Générer pages par niveau
      const niveaux = [
        { niveau: 'junior', label: 'Junior', count: await this.countJobsByNiveau('junior') },
        { niveau: 'intermediaire', label: 'Intermédiaire', count: await this.countJobsByNiveau('intermediaire') },
        { niveau: 'senior', label: 'Senior', count: await this.countJobsByNiveau('senior') }
      ];

      for (const niveau of niveaux) {
        if (niveau.count > 0) {
          const page = await this.generateNiveauPage(niveau.niveau, niveau.label, niveau.count);
          const exists = await this.pageExists(page.slug);

          if (exists) {
            await this.updatePage(page);
            updated++;
          } else {
            await this.createPage(page);
            created++;
          }
        }
      }

      return { created, updated };
    } catch (error) {
      console.error('Error generating marketplace pages:', error);
      return { created, updated };
    }
  }

  private async getTopMetiers(limit: number = 20): Promise<any[]> {
    const { data } = await supabase
      .from('jobs')
      .select('title')
      .eq('status', 'published')
      .limit(1000);

    const counts: Record<string, number> = {};
    data?.forEach(job => {
      const title = job.title.trim();
      counts[title] = (counts[title] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private async getTopSecteurs(limit: number = 15): Promise<any[]> {
    const { data } = await supabase
      .from('jobs')
      .select('sector')
      .eq('status', 'published')
      .not('sector', 'is', null);

    const counts: Record<string, number> = {};
    data?.forEach(job => {
      if (job.sector) {
        counts[job.sector] = (counts[job.sector] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private async getTopVilles(limit: number = 10): Promise<any[]> {
    const { data } = await supabase
      .from('jobs')
      .select('location')
      .eq('status', 'published')
      .not('location', 'is', null);

    const counts: Record<string, number> = {};
    data?.forEach(job => {
      if (job.location) {
        counts[job.location] = (counts[job.location] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private async countJobsByNiveau(niveau: string): Promise<number> {
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .eq('experience_level', niveau);

    return count || 0;
  }

  private generateMetierPage(metier: string, jobCount: number): MarketplacePage {
    const slug = this.slugify(metier);

    return {
      page_type: 'metier',
      slug: `emplois-${slug}`,
      title: `Emplois ${metier} en Guinée - ${jobCount} Offres | JobGuinée`,
      description: `Découvrez ${jobCount} offres d'emploi ${metier} en Guinée. Trouvez votre prochain emploi dans le métier ${metier} sur JobGuinée, la plateforme N°1 de l'emploi en Guinée.`,
      keywords: [
        `emploi ${metier.toLowerCase()} guinée`,
        `job ${metier.toLowerCase()}`,
        `recrutement ${metier.toLowerCase()}`,
        metier.toLowerCase(),
        'emploi guinée'
      ],
      h1: `Emplois ${metier} en Guinée`,
      intro_text: `Explorez ${jobCount} opportunités d'emploi dans le métier ${metier} en Guinée. Postulez directement en ligne et trouvez votre prochain défi professionnel.`,
      job_count: jobCount,
      metier,
      canonical_url: `/emplois/${slug}`,
      is_active: true
    };
  }

  private generateSecteurPage(secteur: string, jobCount: number): MarketplacePage {
    const slug = this.slugify(secteur);

    return {
      page_type: 'secteur',
      slug: `emplois-secteur-${slug}`,
      title: `Emplois ${secteur} en Guinée - ${jobCount} Offres | JobGuinée`,
      description: `${jobCount} offres d'emploi dans le secteur ${secteur} en Guinée. Consultez les opportunités et postulez facilement sur JobGuinée.`,
      keywords: [
        `emploi ${secteur.toLowerCase()} guinée`,
        `secteur ${secteur.toLowerCase()}`,
        `recrutement ${secteur.toLowerCase()}`,
        'emploi guinée'
      ],
      h1: `Emplois dans le secteur ${secteur}`,
      intro_text: `Découvrez ${jobCount} opportunités d'emploi dans le secteur ${secteur} en Guinée. Des postes adaptés à tous les niveaux d'expérience.`,
      job_count: jobCount,
      secteur,
      canonical_url: `/emplois/secteur/${slug}`,
      is_active: true
    };
  }

  private generateVillePage(ville: string, jobCount: number): MarketplacePage {
    const slug = this.slugify(ville);

    return {
      page_type: 'ville',
      slug: `emplois-${slug}`,
      title: `Emplois à ${ville} - ${jobCount} Offres | JobGuinée`,
      description: `${jobCount} offres d'emploi disponibles à ${ville}, Guinée. Trouvez votre prochain emploi à ${ville} sur JobGuinée.`,
      keywords: [
        `emploi ${ville.toLowerCase()}`,
        `job ${ville.toLowerCase()}`,
        `travail ${ville.toLowerCase()}`,
        'emploi guinée'
      ],
      h1: `Emplois à ${ville}`,
      intro_text: `Parcourez ${jobCount} offres d'emploi disponibles à ${ville}. Postulez aux meilleures opportunités professionnelles de la région.`,
      job_count: jobCount,
      ville,
      canonical_url: `/emplois/ville/${slug}`,
      is_active: true
    };
  }

  private generateNiveauPage(niveau: string, label: string, jobCount: number): MarketplacePage {
    return {
      page_type: 'niveau',
      slug: `emplois-niveau-${niveau}`,
      title: `Emplois Niveau ${label} en Guinée - ${jobCount} Offres | JobGuinée`,
      description: `${jobCount} offres d'emploi pour profils ${label.toLowerCase()} en Guinée. Trouvez des opportunités adaptées à votre niveau d'expérience.`,
      keywords: [
        `emploi ${niveau} guinée`,
        `job ${niveau}`,
        `poste ${niveau}`,
        'emploi guinée'
      ],
      h1: `Emplois Niveau ${label}`,
      intro_text: `Découvrez ${jobCount} offres d'emploi pour profils ${label.toLowerCase()} en Guinée. Des opportunités adaptées à votre expérience professionnelle.`,
      job_count: jobCount,
      niveau,
      canonical_url: `/emplois/niveau/${niveau}`,
      is_active: true
    };
  }

  private async pageExists(slug: string): Promise<boolean> {
    const { data } = await supabase
      .from('seo_marketplace_pages')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    return !!data;
  }

  private async createPage(page: MarketplacePage): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('seo_marketplace_pages')
        .insert([page]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating marketplace page:', error);
      return false;
    }
  }

  private async updatePage(page: MarketplacePage): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('seo_marketplace_pages')
        .update({
          ...page,
          updated_at: new Date().toISOString()
        })
        .eq('slug', page.slug);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating marketplace page:', error);
      return false;
    }
  }

  async getPage(slug: string): Promise<MarketplacePage | null> {
    try {
      const { data, error } = await supabase
        .from('seo_marketplace_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching marketplace page:', error);
      return null;
    }
  }

  async incrementViewCount(slug: string): Promise<void> {
    try {
      await supabase.rpc('increment', {
        row_id: slug,
        table_name: 'seo_marketplace_pages',
        column_name: 'view_count'
      });
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}

export const seoMarketplaceService = new SeoMarketplaceService();
