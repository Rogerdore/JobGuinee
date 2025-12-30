import { supabase } from '../lib/supabase';

export interface SEOLandingPage {
  id?: string;
  page_type: 'job_by_profession' | 'job_by_sector' | 'job_by_city' | 'job_by_level';
  slug: string;
  title: string;
  meta_description: string;
  keywords: string;
  h1: string;
  introduction?: string;
  profession_name?: string;
  sector_name?: string;
  city_name?: string;
  level_name?: string;
  schema_org?: any;
  canonical_url?: string;
  og_image_url?: string;
  content_blocks?: any[];
  faq_items?: any[];
  stats?: any;
  primary_cta?: string;
  secondary_cta?: string;
  cta_tracking_params?: any;
  is_active?: boolean;
  views_count?: number;
  conversions_count?: number;
  conversion_rate?: number;
  created_at?: string;
  updated_at?: string;
  seo_score?: number;
}

export interface ConversionTracking {
  session_id: string;
  user_id?: string;
  landing_page_id?: string;
  landing_page_slug: string;
  entry_url: string;
  pages_visited?: string[];
  time_on_site?: number;
  converted?: boolean;
  conversion_type?: string;
  conversion_value?: number;
  lead_id?: string;
  pipeline_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  city?: string;
  country?: string;
}

export const seoLandingPagesService = {
  // Get landing page by slug
  async getBySlug(slug: string): Promise<{ success: boolean; data?: SEOLandingPage; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('seo_landing_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      // Increment views
      if (data) {
        await supabase
          .from('seo_landing_pages')
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq('id', data.id);
      }

      return { success: true, data: data || undefined };
    } catch (error: any) {
      console.error('Error fetching landing page:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all landing pages (admin)
  async getAll(): Promise<{ success: boolean; data?: SEOLandingPage[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('seo_landing_pages')
        .select('*')
        .order('page_type', { ascending: true })
        .order('slug', { ascending: true });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching landing pages:', error);
      return { success: false, error: error.message };
    }
  },

  // Get landing pages by type
  async getByType(type: SEOLandingPage['page_type']): Promise<{ success: boolean; data?: SEOLandingPage[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('seo_landing_pages')
        .select('*')
        .eq('page_type', type)
        .eq('is_active', true)
        .order('slug', { ascending: true });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Error fetching landing pages by type:', error);
      return { success: false, error: error.message };
    }
  },

  // Create or update landing page
  async upsert(page: SEOLandingPage): Promise<{ success: boolean; data?: SEOLandingPage; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('seo_landing_pages')
        .upsert(page, { onConflict: 'slug' })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error upserting landing page:', error);
      return { success: false, error: error.message };
    }
  },

  // Toggle active status
  async toggleActive(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('seo_landing_pages')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error toggling landing page:', error);
      return { success: false, error: error.message };
    }
  },

  // Delete landing page
  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('seo_landing_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting landing page:', error);
      return { success: false, error: error.message };
    }
  },

  // Track conversion
  async trackConversion(tracking: ConversionTracking): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('seo_conversion_tracking')
        .insert(tracking);

      if (error) throw error;

      // Update conversion count on landing page
      if (tracking.landing_page_id && tracking.converted) {
        const { data: page } = await supabase
          .from('seo_landing_pages')
          .select('conversions_count, views_count')
          .eq('id', tracking.landing_page_id)
          .single();

        if (page) {
          const newCount = (page.conversions_count || 0) + 1;
          const rate = page.views_count > 0 ? (newCount / page.views_count) * 100 : 0;

          await supabase
            .from('seo_landing_pages')
            .update({
              conversions_count: newCount,
              conversion_rate: rate
            })
            .eq('id', tracking.landing_page_id);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error tracking conversion:', error);
      return { success: false, error: error.message };
    }
  },

  // Get conversion statistics
  async getConversionStats(landingPageId?: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      let query = supabase
        .from('seo_conversion_tracking')
        .select('*');

      if (landingPageId) {
        query = query.eq('landing_page_id', landingPageId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total_sessions: data?.length || 0,
        total_conversions: data?.filter(d => d.converted).length || 0,
        conversion_rate: 0,
        by_type: {} as Record<string, number>,
        by_device: {} as Record<string, number>,
        total_value: 0
      };

      if (stats.total_sessions > 0) {
        stats.conversion_rate = (stats.total_conversions / stats.total_sessions) * 100;
      }

      data?.forEach(d => {
        if (d.conversion_type) {
          stats.by_type[d.conversion_type] = (stats.by_type[d.conversion_type] || 0) + 1;
        }
        if (d.device_type) {
          stats.by_device[d.device_type] = (stats.by_device[d.device_type] || 0) + 1;
        }
        if (d.conversion_value) {
          stats.total_value += parseFloat(d.conversion_value);
        }
      });

      return { success: true, data: stats };
    } catch (error: any) {
      console.error('Error getting conversion stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Batch create landing pages
  async batchCreate(pages: Omit<SEOLandingPage, 'id' | 'created_at' | 'updated_at'>[]): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('seo_landing_pages')
        .upsert(pages, { onConflict: 'slug' })
        .select();

      if (error) throw error;
      return { success: true, count: data?.length || 0 };
    } catch (error: any) {
      console.error('Error batch creating landing pages:', error);
      return { success: false, error: error.message };
    }
  },

  // Generate default landing pages for Guinea
  getDefaultGuineaPages(): Omit<SEOLandingPage, 'id' | 'created_at' | 'updated_at'>[] {
    const pages: Omit<SEOLandingPage, 'id' | 'created_at' | 'updated_at'>[] = [];

    // A1. Emplois par métier (10)
    const professions = [
      { name: 'Développeur Informatique', slug: 'developpeur-informatique' },
      { name: 'Comptable', slug: 'comptable' },
      { name: 'Ingénieur Mines', slug: 'ingenieur-mines' },
      { name: 'Agent Administratif', slug: 'agent-administratif' },
      { name: 'Chargé Ressources Humaines', slug: 'charge-ressources-humaines' },
      { name: 'Chauffeur', slug: 'chauffeur' },
      { name: 'Électricien', slug: 'electricien' },
      { name: 'Technicien Réseau', slug: 'technicien-reseau' },
      { name: 'Agent Commercial', slug: 'agent-commercial' },
      { name: 'Assistant Direction', slug: 'assistant-direction' }
    ];

    professions.forEach(prof => {
      pages.push({
        page_type: 'job_by_profession',
        slug: `emplois/${prof.slug}-guinee`,
        title: `Emplois ${prof.name} en Guinée | Offres Recrutement ${prof.name} Conakry`,
        meta_description: `Trouvez des offres d'emploi ${prof.name} en Guinée. Postulez aux meilleures opportunités ${prof.name} à Conakry et dans toute la Guinée. JobGuinée, leader du recrutement.`,
        keywords: `emploi ${prof.slug} guinée, recrutement ${prof.slug} conakry, offre ${prof.slug}, job ${prof.slug} guinée`,
        h1: `Emplois ${prof.name} en Guinée`,
        introduction: `Découvrez toutes les offres d'emploi pour ${prof.name} en Guinée. JobGuinée vous connecte aux meilleures opportunités professionnelles dans le secteur.`,
        profession_name: prof.name,
        primary_cta: 'Confier un recrutement ' + prof.name,
        secondary_cta: 'Voir les offres ' + prof.name,
        is_active: true
      });
    });

    // A2. Emplois par secteur (8)
    const sectors = [
      { name: 'Mines', slug: 'mines' },
      { name: 'BTP', slug: 'btp' },
      { name: 'Banque & Finance', slug: 'banque-finance' },
      { name: 'Télécoms', slug: 'telecoms' },
      { name: 'ONG', slug: 'ong' },
      { name: 'Éducation', slug: 'education' },
      { name: 'Santé', slug: 'sante' },
      { name: 'Logistique', slug: 'logistique' }
    ];

    sectors.forEach(sector => {
      pages.push({
        page_type: 'job_by_sector',
        slug: `emplois/secteur/${sector.slug}-guinee`,
        title: `Emplois ${sector.name} en Guinée | Recrutement Secteur ${sector.name} Conakry`,
        meta_description: `Offres d'emploi dans le secteur ${sector.name} en Guinée. Recrutement ${sector.name} à Conakry et dans toute la Guinée. Postulez maintenant sur JobGuinée.`,
        keywords: `emploi ${sector.slug} guinée, recrutement ${sector.slug}, job ${sector.slug} conakry, carrière ${sector.slug}`,
        h1: `Emplois Secteur ${sector.name} en Guinée`,
        introduction: `Explorez les opportunités d'emploi dans le secteur ${sector.name} en Guinée. Trouvez votre prochain job dans une entreprise leader du secteur.`,
        sector_name: sector.name,
        primary_cta: 'Externaliser recrutement ' + sector.name,
        secondary_cta: 'Voir offres ' + sector.name,
        is_active: true
      });
    });

    // A3. Emplois par ville (6)
    const cities = [
      { name: 'Conakry', slug: 'conakry', intro: 'capitale économique' },
      { name: 'Kankan', slug: 'kankan', intro: 'deuxième ville' },
      { name: 'Labé', slug: 'labe', intro: 'ville du Fouta' },
      { name: 'Nzérékoré', slug: 'nzerekore', intro: 'ville forestière' },
      { name: 'Boké', slug: 'boke', intro: 'capitale minière' },
      { name: 'Kindia', slug: 'kindia', intro: 'carrefour commercial' }
    ];

    cities.forEach(city => {
      pages.push({
        page_type: 'job_by_city',
        slug: `emplois/${city.slug}`,
        title: `Emplois à ${city.name} Guinée | Offres Recrutement ${city.name}`,
        meta_description: `Trouvez un emploi à ${city.name}, ${city.intro} de Guinée. Offres d'emploi actualisées quotidiennement. Recrutement local ${city.name}.`,
        keywords: `emploi ${city.slug}, recrutement ${city.slug}, job ${city.slug} guinée, offre ${city.slug}`,
        h1: `Emplois à ${city.name}, Guinée`,
        introduction: `Découvrez les opportunités d'emploi à ${city.name}, ${city.intro} de Guinée. JobGuinée facilite votre recherche d'emploi local.`,
        city_name: city.name,
        primary_cta: 'Recruter à ' + city.name,
        secondary_cta: 'Voir offres ' + city.name,
        is_active: true
      });
    });

    // A4. Emplois par niveau (6)
    const levels = [
      { name: 'Junior', slug: 'junior', desc: '0-3 ans d\'expérience' },
      { name: 'Intermédiaire', slug: 'intermediaire', desc: '3-7 ans d\'expérience' },
      { name: 'Senior', slug: 'senior', desc: '7+ ans d\'expérience' },
      { name: 'Cadre', slug: 'cadre', desc: 'Postes de direction' },
      { name: 'Stage', slug: 'stage', desc: 'Opportunités de stage' },
      { name: 'Apprentissage', slug: 'apprentissage', desc: 'Contrats d\'apprentissage' }
    ];

    levels.forEach(level => {
      pages.push({
        page_type: 'job_by_level',
        slug: `emplois/${level.slug}-guinee`,
        title: `Emplois ${level.name} en Guinée | Offres ${level.desc}`,
        meta_description: `Offres d'emploi niveau ${level.name} en Guinée. ${level.desc}. Trouvez votre opportunité professionnelle adaptée à votre niveau d'expérience.`,
        keywords: `emploi ${level.slug} guinée, recrutement ${level.slug}, job ${level.slug}, offre ${level.slug} conakry`,
        h1: `Emplois Niveau ${level.name} en Guinée`,
        introduction: `Parcourez les offres d'emploi pour profils ${level.name} en Guinée. ${level.desc}. Postulez aux opportunités correspondant à votre expérience.`,
        level_name: level.name,
        primary_cta: 'Recruter profil ' + level.name,
        secondary_cta: 'Voir offres ' + level.name,
        is_active: true
      });
    });

    return pages;
  }
};
