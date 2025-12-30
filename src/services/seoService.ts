import { supabase } from '../lib/supabase';

export interface SEOConfig {
  id: string;
  site_name: string;
  site_tagline: string;
  default_title: string;
  default_description: string;
  default_keywords: string[];
  site_url: string;
  logo_url?: string;
  og_image?: string;
  twitter_handle?: string;
  facebook_page?: string;
  linkedin_page?: string;
  enable_indexation: boolean;
  robots_txt: string;
  google_analytics_id?: string;
  google_site_verification?: string;
}

export interface SEOPageMeta {
  id: string;
  page_path: string;
  page_type: string;
  title: string;
  description: string;
  keywords: string[];
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_type?: string;
  canonical_url?: string;
  robots?: string;
  priority?: number;
  change_freq?: string;
  entity_type?: string;
  entity_id?: string;
  is_active: boolean;
}

export interface SEOPageMetaI18n {
  id: string;
  seo_page_meta_id: string;
  language_code: 'fr' | 'en';
  title: string;
  description?: string;
  keywords?: string[];
  og_title?: string;
  og_description?: string;
  og_image?: string;
  canonical_url?: string;
  is_active: boolean;
}

export interface SEOConfigI18n {
  id: string;
  language_code: 'fr' | 'en';
  site_name: string;
  site_tagline?: string;
  default_title: string;
  default_description: string;
  keywords?: string[];
  og_image?: string;
  twitter_site?: string;
  is_active: boolean;
}

export interface HreflangAlternate {
  language_code: 'fr' | 'en';
  alternate_url: string;
  is_default: boolean;
}

class SEOService {
  async getConfig(): Promise<SEOConfig | null> {
    try {
      const { data, error } = await supabase
        .from('seo_config')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching SEO config:', error);
      return null;
    }
  }

  async getConfigI18n(languageCode: 'fr' | 'en' = 'fr'): Promise<SEOConfigI18n | null> {
    try {
      const { data, error } = await supabase
        .from('seo_config_i18n')
        .select('*')
        .eq('language_code', languageCode)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching i18n SEO config:', error);
      return null;
    }
  }

  async updateConfigI18n(languageCode: 'fr' | 'en', updates: Partial<SEOConfigI18n>): Promise<boolean> {
    try {
      const { data: existing } = await supabase
        .from('seo_config_i18n')
        .select('id')
        .eq('language_code', languageCode)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('seo_config_i18n')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('seo_config_i18n')
          .insert([{ ...updates, language_code: languageCode }]);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating i18n SEO config:', error);
      return false;
    }
  }

  async updateConfig(updates: Partial<SEOConfig>): Promise<boolean> {
    try {
      const { data: existing } = await supabase
        .from('seo_config')
        .select('id')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('seo_config')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('seo_config')
          .insert([updates]);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating SEO config:', error);
      return false;
    }
  }

  async getPageMeta(pagePath: string): Promise<SEOPageMeta | null> {
    try {
      const { data, error } = await supabase
        .from('seo_page_meta')
        .select('*')
        .eq('page_path', pagePath)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching page meta:', error);
      return null;
    }
  }

  async getPageMetaWithI18n(pagePath: string, languageCode: 'fr' | 'en' = 'fr'): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_page_meta_with_i18n', {
          p_page_path: pagePath,
          p_language_code: languageCode
        })
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching page meta with i18n:', error);
      return null;
    }
  }

  async setPageMetaI18n(
    pageMetaId: string,
    languageCode: 'fr' | 'en',
    translation: Partial<SEOPageMetaI18n>
  ): Promise<boolean> {
    try {
      const { data: existing } = await supabase
        .from('seo_page_meta_i18n')
        .select('id')
        .eq('seo_page_meta_id', pageMetaId)
        .eq('language_code', languageCode)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('seo_page_meta_i18n')
          .update({ ...translation, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('seo_page_meta_i18n')
          .insert([{
            ...translation,
            seo_page_meta_id: pageMetaId,
            language_code: languageCode
          }]);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error setting page meta i18n:', error);
      return false;
    }
  }

  async getHreflangAlternates(pagePath: string): Promise<HreflangAlternate[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_hreflang_alternates', {
          p_page_path: pagePath
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching hreflang alternates:', error);
      return [];
    }
  }

  async setHreflangConfig(
    pagePath: string,
    languageCode: 'fr' | 'en',
    alternateUrl: string,
    isDefault: boolean = false
  ): Promise<boolean> {
    try {
      const { data: existing } = await supabase
        .from('seo_hreflang_config')
        .select('id')
        .eq('page_path', pagePath)
        .eq('language_code', languageCode)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('seo_hreflang_config')
          .update({
            alternate_url: alternateUrl,
            is_default: isDefault,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('seo_hreflang_config')
          .insert([{
            page_path: pagePath,
            language_code: languageCode,
            alternate_url: alternateUrl,
            is_default: isDefault,
            is_active: true
          }]);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error setting hreflang config:', error);
      return false;
    }
  }

  async setPageMeta(pageMeta: Partial<SEOPageMeta>): Promise<boolean> {
    try {
      if (!pageMeta.page_path) {
        throw new Error('page_path is required');
      }

      const { data: existing } = await supabase
        .from('seo_page_meta')
        .select('id')
        .eq('page_path', pageMeta.page_path)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('seo_page_meta')
          .update({ ...pageMeta, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('seo_page_meta')
          .insert([pageMeta]);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error setting page meta:', error);
      return false;
    }
  }

  async getAllPageMeta(): Promise<SEOPageMeta[]> {
    try {
      const { data, error } = await supabase
        .from('seo_page_meta')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all page meta:', error);
      return [];
    }
  }

  async generateJobMeta(job: any): Promise<Partial<SEOPageMeta>> {
    const companyName = job.companies?.name || job.company_name || 'Entreprise';
    const city = job.location || 'Guinée';
    const jobTitle = job.title;

    return {
      page_path: `/job-detail/${job.id}`,
      page_type: 'job_detail',
      title: `${jobTitle} - ${companyName} à ${city} | JobGuinée`,
      description: `Postulez à l'offre d'emploi ${jobTitle} chez ${companyName} à ${city}. ${job.contract_type || 'CDI'}. Candidatez en ligne sur JobGuinée, la plateforme N°1 de l'emploi en Guinée.`,
      keywords: [
        jobTitle.toLowerCase(),
        `emploi ${city.toLowerCase()}`,
        companyName.toLowerCase(),
        job.sector?.toLowerCase() || 'emploi',
        'guinée'
      ],
      og_title: `${jobTitle} - ${companyName}`,
      og_description: job.description?.substring(0, 200) || '',
      og_type: 'article',
      canonical_url: `/job-detail/${job.id}`,
      robots: 'index, follow',
      priority: 0.8,
      change_freq: 'daily',
      entity_type: 'job',
      entity_id: job.id,
      is_active: true
    };
  }

  async generateSectorPageMeta(sector: string, jobCount: number): Promise<Partial<SEOPageMeta>> {
    return {
      page_path: `/jobs?sector=${encodeURIComponent(sector)}`,
      page_type: 'job_sector',
      title: `Emplois ${sector} en Guinée - ${jobCount} Offres | JobGuinée`,
      description: `Découvrez ${jobCount} offres d'emploi dans le secteur ${sector} en Guinée. Consultez les opportunités et postulez en ligne sur JobGuinée.`,
      keywords: [
        `emploi ${sector.toLowerCase()} guinée`,
        `job ${sector.toLowerCase()}`,
        `recrutement ${sector.toLowerCase()}`
      ],
      priority: 0.7,
      change_freq: 'daily',
      is_active: true
    };
  }

  async generateCityPageMeta(city: string, jobCount: number): Promise<Partial<SEOPageMeta>> {
    return {
      page_path: `/jobs?location=${encodeURIComponent(city)}`,
      page_type: 'job_city',
      title: `Emplois à ${city} - ${jobCount} Offres | JobGuinée`,
      description: `${jobCount} offres d'emploi disponibles à ${city}, Guinée. Trouvez votre prochain emploi à ${city} sur JobGuinée.`,
      keywords: [
        `emploi ${city.toLowerCase()}`,
        `job ${city.toLowerCase()}`,
        `travail ${city.toLowerCase()}`
      ],
      priority: 0.7,
      change_freq: 'daily',
      is_active: true
    };
  }

  buildMetaTags(pageMeta: SEOPageMeta | null, config: SEOConfig | null) {
    const title = pageMeta?.title || config?.default_title || 'JobGuinée';
    const description = pageMeta?.description || config?.default_description || '';
    const keywords = [...(pageMeta?.keywords || []), ...(config?.default_keywords || [])].join(', ');
    const ogImage = pageMeta?.og_image || config?.og_image || '/logo.png';
    const ogTitle = pageMeta?.og_title || title;
    const ogDescription = pageMeta?.og_description || description;
    const siteUrl = config?.site_url || 'https://jobguinee.com';
    const canonicalUrl = pageMeta?.canonical_url ? `${siteUrl}${pageMeta.canonical_url}` : undefined;

    return {
      title,
      description,
      keywords,
      ogTitle,
      ogDescription,
      ogImage,
      ogType: pageMeta?.og_type || 'website',
      canonicalUrl,
      robots: pageMeta?.robots || (config?.enable_indexation ? 'index, follow' : 'noindex, nofollow'),
      twitterHandle: config?.twitter_handle,
      googleSiteVerification: config?.google_site_verification
    };
  }

  updateDocumentHead(metaTags: ReturnType<typeof this.buildMetaTags>, hreflangAlternates?: HreflangAlternate[]) {
    document.title = metaTags.title;

    this.updateOrCreateMeta('description', metaTags.description);
    this.updateOrCreateMeta('keywords', metaTags.keywords);
    this.updateOrCreateMeta('robots', metaTags.robots);

    this.updateOrCreateMeta('og:title', metaTags.ogTitle, 'property');
    this.updateOrCreateMeta('og:description', metaTags.ogDescription, 'property');
    this.updateOrCreateMeta('og:image', metaTags.ogImage, 'property');
    this.updateOrCreateMeta('og:type', metaTags.ogType, 'property');

    this.updateOrCreateMeta('twitter:card', 'summary_large_image', 'name');
    this.updateOrCreateMeta('twitter:title', metaTags.ogTitle, 'name');
    this.updateOrCreateMeta('twitter:description', metaTags.ogDescription, 'name');
    this.updateOrCreateMeta('twitter:image', metaTags.ogImage, 'name');
    if (metaTags.twitterHandle) {
      this.updateOrCreateMeta('twitter:site', metaTags.twitterHandle, 'name');
    }

    if (metaTags.canonicalUrl) {
      this.updateOrCreateLink('canonical', metaTags.canonicalUrl);
    }

    if (metaTags.googleSiteVerification) {
      this.updateOrCreateMeta('google-site-verification', metaTags.googleSiteVerification);
    }

    if (hreflangAlternates && hreflangAlternates.length > 0) {
      this.removeExistingHreflangLinks();

      hreflangAlternates.forEach(alternate => {
        const hreflang = alternate.is_default ? 'x-default' : alternate.language_code;
        this.createHreflangLink(hreflang, alternate.alternate_url);
      });

      hreflangAlternates.forEach(alternate => {
        if (!alternate.is_default) {
          this.createHreflangLink(alternate.language_code, alternate.alternate_url);
        }
      });
    }
  }

  private removeExistingHreflangLinks() {
    const existingLinks = document.querySelectorAll('link[rel="alternate"][hreflang]');
    existingLinks.forEach(link => link.remove());
  }

  private createHreflangLink(hreflang: string, href: string) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', hreflang);
    link.setAttribute('href', href);
    document.head.appendChild(link);
  }

  private updateOrCreateMeta(name: string, content: string, attributeType: 'name' | 'property' = 'name') {
    const attribute = attributeType;
    let meta = document.querySelector(`meta[${attribute}="${name}"]`);

    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attribute, name);
      document.head.appendChild(meta);
    }

    meta.setAttribute('content', content);
  }

  private updateOrCreateLink(rel: string, href: string) {
    let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;

    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', rel);
      document.head.appendChild(link);
    }

    link.setAttribute('href', href);
  }
}

export const seoService = new SEOService();
