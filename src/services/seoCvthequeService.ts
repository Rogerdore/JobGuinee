import { supabase } from '../lib/supabase';
import { schemaService } from './schemaService';

export interface CvthequeTeaserPage {
  id?: string;
  page_type: 'metier' | 'secteur' | 'ville';
  slug: string;
  title: string;
  description: string;
  keywords?: string[];
  h1: string;
  intro_text?: string;
  sample_profiles?: Array<{
    title: string;
    experience_years: number;
    skills: string[];
    sector: string;
  }>;
  profile_count?: number;
  metier?: string;
  secteur?: string;
  ville?: string;
  schema_json?: any;
  canonical_url?: string;
  is_active?: boolean;
}

class SeoCvthequeService {
  async generateCvthequePages(): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    try {
      const metiers = await this.getTopMetiers();
      for (const metier of metiers) {
        const profiles = await this.getAnonymizedProfiles('metier', metier.title);
        const page = this.generateMetierPage(metier.title, metier.count, profiles);
        const exists = await this.pageExists(page.slug);

        if (exists) {
          await this.updatePage(page);
          updated++;
        } else {
          await this.createPage(page);
          created++;
        }
      }

      const secteurs = await this.getTopSecteurs();
      for (const secteur of secteurs) {
        const profiles = await this.getAnonymizedProfiles('secteur', secteur.sector);
        const page = this.generateSecteurPage(secteur.sector, secteur.count, profiles);
        const exists = await this.pageExists(page.slug);

        if (exists) {
          await this.updatePage(page);
          updated++;
        } else {
          await this.createPage(page);
          created++;
        }
      }

      const villes = await this.getTopVilles();
      for (const ville of villes) {
        const profiles = await this.getAnonymizedProfiles('ville', ville.location);
        const page = this.generateVillePage(ville.location, ville.count, profiles);
        const exists = await this.pageExists(page.slug);

        if (exists) {
          await this.updatePage(page);
          updated++;
        } else {
          await this.createPage(page);
          created++;
        }
      }

      return { created, updated };
    } catch (error) {
      console.error('Error generating cvtheque pages:', error);
      return { created, updated };
    }
  }

  private async getTopMetiers(limit: number = 15): Promise<any[]> {
    const { data } = await supabase
      .from('candidate_profiles')
      .select('current_position')
      .eq('is_visible', true)
      .not('current_position', 'is', null)
      .limit(1000);

    const counts: Record<string, number> = {};
    data?.forEach(profile => {
      if (profile.current_position) {
        const title = profile.current_position.trim();
        counts[title] = (counts[title] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private async getTopSecteurs(limit: number = 10): Promise<any[]> {
    const { data } = await supabase
      .from('candidate_profiles')
      .select('sector')
      .eq('is_visible', true)
      .not('sector', 'is', null);

    const counts: Record<string, number> = {};
    data?.forEach(profile => {
      if (profile.sector) {
        counts[profile.sector] = (counts[profile.sector] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private async getTopVilles(limit: number = 8): Promise<any[]> {
    const { data } = await supabase
      .from('candidate_profiles')
      .select('location')
      .eq('is_visible', true)
      .not('location', 'is', null);

    const counts: Record<string, number> = {};
    data?.forEach(profile => {
      if (profile.location) {
        counts[profile.location] = (counts[profile.location] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private async getAnonymizedProfiles(type: string, value: string, limit: number = 5): Promise<any[]> {
    let query = supabase
      .from('candidate_profiles')
      .select('current_position, years_of_experience, skills, sector')
      .eq('is_visible', true)
      .not('current_position', 'is', null);

    if (type === 'metier') {
      query = query.ilike('current_position', `%${value}%`);
    } else if (type === 'secteur') {
      query = query.eq('sector', value);
    } else if (type === 'ville') {
      query = query.eq('location', value);
    }

    const { data } = await query.limit(limit);

    return (data || []).map(profile => ({
      title: profile.current_position,
      experience_years: profile.years_of_experience || 0,
      skills: profile.skills || [],
      sector: profile.sector || ''
    }));
  }

  private generateMetierPage(metier: string, count: number, profiles: any[]): CvthequeTeaserPage {
    const slug = this.slugify(metier);

    return {
      page_type: 'metier',
      slug: `cvtheque-${slug}`,
      title: `CV ${metier} en Guinée - ${count} Profils | JobGuinée CVthèque`,
      description: `Consultez ${count} CV de professionnels ${metier} en Guinée. Recrutez les meilleurs talents sur JobGuinée CVthèque.`,
      keywords: [
        `cv ${metier.toLowerCase()} guinée`,
        `profil ${metier.toLowerCase()}`,
        `recrutement ${metier.toLowerCase()}`,
        'cvtheque guinée'
      ],
      h1: `CV ${metier} - ${count} Profils Disponibles`,
      intro_text: `Découvrez ${count} profils de professionnels ${metier} en Guinée. Accédez aux CV complets en vous abonnant à notre CVthèque premium.`,
      sample_profiles: profiles,
      profile_count: count,
      metier,
      canonical_url: `/cvtheque/${slug}`,
      is_active: true
    };
  }

  private generateSecteurPage(secteur: string, count: number, profiles: any[]): CvthequeTeaserPage {
    const slug = this.slugify(secteur);

    return {
      page_type: 'secteur',
      slug: `cvtheque-secteur-${slug}`,
      title: `CV ${secteur} en Guinée - ${count} Profils | JobGuinée CVthèque`,
      description: `${count} CV de professionnels du secteur ${secteur} en Guinée. Trouvez les meilleurs talents pour votre entreprise.`,
      keywords: [
        `cv ${secteur.toLowerCase()} guinée`,
        `profil ${secteur.toLowerCase()}`,
        'cvtheque guinée'
      ],
      h1: `CV Secteur ${secteur} - ${count} Profils`,
      intro_text: `Parcourez ${count} profils de professionnels du secteur ${secteur}. Obtenez l'accès complet à notre CVthèque pour recruter les meilleurs talents.`,
      sample_profiles: profiles,
      profile_count: count,
      secteur,
      canonical_url: `/cvtheque/secteur/${slug}`,
      is_active: true
    };
  }

  private generateVillePage(ville: string, count: number, profiles: any[]): CvthequeTeaserPage {
    const slug = this.slugify(ville);

    return {
      page_type: 'ville',
      slug: `cvtheque-${slug}`,
      title: `CV à ${ville} - ${count} Profils | JobGuinée CVthèque`,
      description: `${count} CV de professionnels basés à ${ville}, Guinée. Recrutez localement avec JobGuinée CVthèque.`,
      keywords: [
        `cv ${ville.toLowerCase()}`,
        `profil ${ville.toLowerCase()}`,
        'cvtheque guinée'
      ],
      h1: `CV ${ville} - ${count} Profils Disponibles`,
      intro_text: `Explorez ${count} profils de professionnels à ${ville}. Accédez à notre CVthèque premium pour voir les informations de contact complètes.`,
      sample_profiles: profiles,
      profile_count: count,
      ville,
      canonical_url: `/cvtheque/ville/${slug}`,
      is_active: true
    };
  }

  private async pageExists(slug: string): Promise<boolean> {
    const { data } = await supabase
      .from('seo_cvtheque_teaser_pages')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    return !!data;
  }

  private async createPage(page: CvthequeTeaserPage): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('seo_cvtheque_teaser_pages')
        .insert([page]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating cvtheque page:', error);
      return false;
    }
  }

  private async updatePage(page: CvthequeTeaserPage): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('seo_cvtheque_teaser_pages')
        .update({
          ...page,
          updated_at: new Date().toISOString()
        })
        .eq('slug', page.slug);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating cvtheque page:', error);
      return false;
    }
  }

  async getPage(slug: string): Promise<CvthequeTeaserPage | null> {
    try {
      const { data, error } = await supabase
        .from('seo_cvtheque_teaser_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching cvtheque page:', error);
      return null;
    }
  }

  async incrementViewCount(slug: string): Promise<void> {
    try {
      const { data: page } = await supabase
        .from('seo_cvtheque_teaser_pages')
        .select('view_count')
        .eq('slug', slug)
        .maybeSingle();

      if (page) {
        await supabase
          .from('seo_cvtheque_teaser_pages')
          .update({ view_count: (page.view_count || 0) + 1 })
          .eq('slug', slug);
      }
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

export const seoCvthequeService = new SeoCvthequeService();
