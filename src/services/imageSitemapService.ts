import { supabase } from '../lib/supabase';
import { ImageOptimizationService, ImageSitemapEntry } from './imageOptimizationService';

/**
 * Service de Génération de Sitemap Images
 *
 * Génère et maintient un sitemap XML pour toutes les images importantes
 * du site, pour améliorer l'indexation par Google Images.
 */

export interface ImageForSitemap {
  pageUrl: string;
  imageUrl: string;
  title: string;
  caption?: string;
  geoLocation?: string;
  license?: string;
}

export class ImageSitemapService {

  /**
   * Génère le sitemap complet des images du site
   */
  static async generateFullImageSitemap(): Promise<string> {
    const entries: ImageSitemapEntry[] = [];

    // 1. Images de la page d'accueil
    entries.push(await this.getHomePageImages());

    // 2. Images des offres d'emploi
    const jobImages = await this.getJobImages();
    entries.push(...jobImages);

    // 3. Images des profils candidats (CVthèque)
    const profileImages = await this.getProfileImages();
    entries.push(...profileImages);

    // 4. Images des formations
    const formationImages = await this.getFormationImages();
    entries.push(...formationImages);

    // 5. Images du blog
    const blogImages = await this.getBlogImages();
    entries.push(...blogImages);

    // 6. Images B2B / Solutions
    entries.push(await this.getB2BImages());

    // Générer le XML
    return ImageOptimizationService.generateImageSitemap(entries);
  }

  /**
   * Images de la page d'accueil
   */
  private static async getHomePageImages(): Promise<ImageSitemapEntry> {
    const baseUrl = this.getBaseUrl();

    return {
      loc: `${baseUrl}/`,
      images: [
        {
          image_loc: `${baseUrl}/assets/hero/jobguinee-hero-recherche-emploi-guinee-1920w.webp`,
          title: 'Trouvez votre emploi en Guinée - JobGuinée',
          caption: 'Plateforme n°1 de recrutement digital en Guinée',
          geo_location: 'Conakry, Guinée'
        },
        {
          image_loc: `${baseUrl}/logo_jobguinee.svg`,
          title: 'Logo JobGuinée - Plateforme emploi Guinée',
          caption: 'JobGuinée, la référence du recrutement en Guinée'
        },
        {
          image_loc: `${baseUrl}/avatars/jobguinee-chatbot-alpha-assistant.svg`,
          title: 'Alpha - Assistant virtuel JobGuinée',
          caption: 'Chatbot IA pour vous aider dans votre recherche d\'emploi'
        }
      ]
    };
  }

  /**
   * Images des offres d'emploi
   */
  private static async getJobImages(): Promise<ImageSitemapEntry[]> {
    try {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title, company_name, location, featured_image')
        .eq('status', 'published')
        .not('featured_image', 'is', null)
        .limit(100);

      if (!jobs) return [];

      const baseUrl = this.getBaseUrl();

      return jobs.map(job => ({
        loc: `${baseUrl}/jobs/${job.id}`,
        images: [
          {
            image_loc: job.featured_image!,
            title: `${job.title} - ${job.company_name}`,
            caption: `Offre d'emploi ${job.title} à ${job.location}`,
            geo_location: job.location
          }
        ]
      }));
    } catch (error) {
      console.error('Error fetching job images:', error);
      return [];
    }
  }

  /**
   * Images des profils candidats (CVthèque)
   */
  private static async getProfileImages(): Promise<ImageSitemapEntry[]> {
    try {
      // Note: Seulement les profils publics avec photo
      const { data: profiles } = await supabase
        .from('candidate_profiles')
        .select('id, full_name, profile_headline, location, photo_url')
        .eq('is_profile_public', true)
        .not('photo_url', 'is', null)
        .limit(50);

      if (!profiles) return [];

      const baseUrl = this.getBaseUrl();

      return profiles.map(profile => ({
        loc: `${baseUrl}/cvtheque?profile=${profile.id}`,
        images: [
          {
            image_loc: profile.photo_url!,
            title: `${profile.full_name} - Profil professionnel`,
            caption: profile.profile_headline || `Profil ${profile.full_name}`,
            geo_location: profile.location || 'Guinée'
          }
        ]
      }));
    } catch (error) {
      console.error('Error fetching profile images:', error);
      return [];
    }
  }

  /**
   * Images des formations
   */
  private static async getFormationImages(): Promise<ImageSitemapEntry[]> {
    try {
      const { data: formations } = await supabase
        .from('formations')
        .select('id, title, description, location, featured_image')
        .eq('status', 'published')
        .not('featured_image', 'is', null)
        .limit(50);

      if (!formations) return [];

      const baseUrl = this.getBaseUrl();

      return formations.map(formation => ({
        loc: `${baseUrl}/formations?id=${formation.id}`,
        images: [
          {
            image_loc: formation.featured_image!,
            title: `Formation ${formation.title}`,
            caption: formation.description?.substring(0, 100) || formation.title,
            geo_location: formation.location || 'Guinée'
          }
        ]
      }));
    } catch (error) {
      console.error('Error fetching formation images:', error);
      return [];
    }
  }

  /**
   * Images des articles de blog
   */
  private static async getBlogImages(): Promise<ImageSitemapEntry[]> {
    try {
      const { data: articles } = await supabase
        .from('blog_posts')
        .select('id, title, excerpt, featured_image')
        .eq('published', true)
        .not('featured_image', 'is', null)
        .limit(50);

      if (!articles) return [];

      const baseUrl = this.getBaseUrl();

      return articles.map(article => ({
        loc: `${baseUrl}/blog/${article.id}`,
        images: [
          {
            image_loc: article.featured_image!,
            title: article.title,
            caption: article.excerpt || article.title,
            geo_location: 'Guinée'
          }
        ]
      }));
    } catch (error) {
      console.error('Error fetching blog images:', error);
      return [];
    }
  }

  /**
   * Images de la section B2B
   */
  private static async getB2BImages(): Promise<ImageSitemapEntry> {
    const baseUrl = this.getBaseUrl();

    return {
      loc: `${baseUrl}/b2b-solutions`,
      images: [
        {
          image_loc: `${baseUrl}/images/jobguinee-b2b-solutions-entreprises-1200w.webp`,
          title: 'Solutions B2B JobGuinée pour entreprises',
          caption: 'Services de recrutement et ATS pour entreprises en Guinée',
          geo_location: 'Conakry, Guinée'
        },
        {
          image_loc: `${baseUrl}/images/jobguinee-ats-systeme-recrutement-1200w.webp`,
          title: 'Système ATS JobGuinée',
          caption: 'Logiciel de gestion des candidatures et du recrutement',
          geo_location: 'Guinée'
        }
      ]
    };
  }

  /**
   * Sauvegarde le sitemap dans la base de données
   */
  static async saveSitemap(xml: string): Promise<void> {
    try {
      // Créer la table si elle n'existe pas
      const { error: tableError } = await supabase.rpc('create_table_if_not_exists', {
        table_name: 'image_sitemaps',
        columns: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sitemap_xml TEXT NOT NULL,
          images_count INTEGER NOT NULL,
          last_generated TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW()
        `
      }).catch(() => ({ error: null }));

      // Insérer le nouveau sitemap
      await supabase
        .from('image_sitemaps')
        .insert({
          sitemap_xml: xml,
          images_count: (xml.match(/<image:image>/g) || []).length,
          last_generated: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving sitemap:', error);
    }
  }

  /**
   * Récupère le dernier sitemap généré
   */
  static async getLatestSitemap(): Promise<string | null> {
    try {
      const { data } = await supabase
        .from('image_sitemaps')
        .select('sitemap_xml')
        .order('last_generated', { ascending: false })
        .limit(1)
        .maybeSingle();

      return data?.sitemap_xml || null;
    } catch (error) {
      console.error('Error fetching latest sitemap:', error);
      return null;
    }
  }

  /**
   * Génère et sauvegarde le sitemap
   */
  static async generateAndSave(): Promise<string> {
    const xml = await this.generateFullImageSitemap();
    await this.saveSitemap(xml);
    return xml;
  }

  /**
   * Retourne l'URL de base du site
   */
  private static getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://jobguinee.com'; // Fallback
  }

  /**
   * Ajoute une image au sitemap dynamiquement
   */
  static async addImageToSitemap(image: ImageForSitemap): Promise<void> {
    try {
      // Récupérer le sitemap actuel
      let currentXml = await this.getLatestSitemap();

      if (!currentXml) {
        // Générer un nouveau sitemap si aucun n'existe
        currentXml = await this.generateFullImageSitemap();
      }

      // Ajouter la nouvelle image
      const newImageEntry: ImageSitemapEntry = {
        loc: image.pageUrl,
        images: [{
          image_loc: image.imageUrl,
          title: image.title,
          caption: image.caption,
          geo_location: image.geoLocation,
          license: image.license
        }]
      };

      // Régénérer et sauvegarder
      const updatedXml = this.insertImageIntoSitemap(currentXml, newImageEntry);
      await this.saveSitemap(updatedXml);
    } catch (error) {
      console.error('Error adding image to sitemap:', error);
    }
  }

  /**
   * Insère une entrée image dans le sitemap existant
   */
  private static insertImageIntoSitemap(xml: string, entry: ImageSitemapEntry): string {
    // Trouver la position avant </urlset>
    const insertPosition = xml.lastIndexOf('</urlset>');

    if (insertPosition === -1) {
      return xml; // Sitemap invalide
    }

    let newEntry = `  <url>\n`;
    newEntry += `    <loc>${entry.loc}</loc>\n`;

    entry.images.forEach(image => {
      newEntry += `    <image:image>\n`;
      newEntry += `      <image:loc>${image.image_loc}</image:loc>\n`;
      if (image.title) newEntry += `      <image:title>${image.title}</image:title>\n`;
      if (image.caption) newEntry += `      <image:caption>${image.caption}</image:caption>\n`;
      if (image.geo_location) newEntry += `      <image:geo_location>${image.geo_location}</image:geo_location>\n`;
      if (image.license) newEntry += `      <image:license>${image.license}</image:license>\n`;
      newEntry += `    </image:image>\n`;
    });

    newEntry += `  </url>\n`;

    return xml.slice(0, insertPosition) + newEntry + xml.slice(insertPosition);
  }

  /**
   * Statistiques du sitemap
   */
  static async getSitemapStats(): Promise<{
    totalImages: number;
    lastGenerated: string | null;
    pagesCovered: number;
  }> {
    try {
      const xml = await this.getLatestSitemap();

      if (!xml) {
        return { totalImages: 0, lastGenerated: null, pagesCovered: 0 };
      }

      const totalImages = (xml.match(/<image:image>/g) || []).length;
      const pagesCovered = (xml.match(/<url>/g) || []).length;

      const { data } = await supabase
        .from('image_sitemaps')
        .select('last_generated')
        .order('last_generated', { ascending: false })
        .limit(1)
        .maybeSingle();

      return {
        totalImages,
        lastGenerated: data?.last_generated || null,
        pagesCovered
      };
    } catch (error) {
      console.error('Error getting sitemap stats:', error);
      return { totalImages: 0, lastGenerated: null, pagesCovered: 0 };
    }
  }
}
