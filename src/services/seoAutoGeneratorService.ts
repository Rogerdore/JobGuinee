import { supabase } from '../lib/supabase';
import { seoService } from './seoService';
import { schemaService } from './schemaService';

interface GenerationResult {
  created: number;
  updated: number;
  errors: string[];
  details: Array<{ type: string; name: string; success: boolean }>;
}

class SEOAutoGeneratorService {
  async generateAllJobPages(): Promise<GenerationResult> {
    const result: GenerationResult = {
      created: 0,
      updated: 0,
      errors: [],
      details: []
    };

    try {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*, companies(*)')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      for (const job of jobs || []) {
        try {
          const pageMeta = await seoService.generateJobMeta(job);
          const success = await seoService.setPageMeta(pageMeta);

          const jobSchema = schemaService.generateJobPostingSchema(job);
          await schemaService.setSchema({
            schema_type: 'JobPosting',
            entity_type: 'job',
            entity_id: job.id,
            schema_json: jobSchema,
            is_active: true
          });

          if (success) {
            result.created++;
            result.details.push({
              type: 'job',
              name: job.title,
              success: true
            });
          }
        } catch (err: any) {
          result.errors.push(`Erreur pour ${job.title}: ${err.message}`);
          result.details.push({
            type: 'job',
            name: job.title,
            success: false
          });
        }
      }
    } catch (error: any) {
      result.errors.push(`Erreur globale: ${error.message}`);
    }

    return result;
  }

  async generateSectorPages(): Promise<GenerationResult> {
    const result: GenerationResult = {
      created: 0,
      updated: 0,
      errors: [],
      details: []
    };

    try {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('sector')
        .eq('status', 'published')
        .not('sector', 'is', null);

      if (error) throw error;

      const sectorCounts = new Map<string, number>();
      (jobs || []).forEach(job => {
        if (job.sector) {
          sectorCounts.set(job.sector, (sectorCounts.get(job.sector) || 0) + 1);
        }
      });

      for (const [sector, count] of sectorCounts.entries()) {
        try {
          const pageMeta = await seoService.generateSectorPageMeta(sector, count);
          const success = await seoService.setPageMeta(pageMeta);

          const breadcrumbs = [
            { name: 'Accueil', url: 'https://jobguinee.com/' },
            { name: 'Emplois', url: 'https://jobguinee.com/jobs' },
            { name: `Emplois ${sector}`, url: `https://jobguinee.com/jobs?sector=${encodeURIComponent(sector)}` }
          ];

          const breadcrumbSchema = schemaService.generateBreadcrumbSchema(breadcrumbs);
          await schemaService.setSchema({
            schema_type: 'BreadcrumbList',
            entity_type: 'sector_page',
            entity_id: sector,
            schema_json: breadcrumbSchema,
            is_active: true
          });

          if (success) {
            result.created++;
            result.details.push({
              type: 'sector',
              name: `${sector} (${count} offres)`,
              success: true
            });
          }
        } catch (err: any) {
          result.errors.push(`Erreur pour secteur ${sector}: ${err.message}`);
          result.details.push({
            type: 'sector',
            name: sector,
            success: false
          });
        }
      }
    } catch (error: any) {
      result.errors.push(`Erreur globale: ${error.message}`);
    }

    return result;
  }

  async generateCityPages(): Promise<GenerationResult> {
    const result: GenerationResult = {
      created: 0,
      updated: 0,
      errors: [],
      details: []
    };

    try {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('location')
        .eq('status', 'published')
        .not('location', 'is', null);

      if (error) throw error;

      const cityCounts = new Map<string, number>();
      (jobs || []).forEach(job => {
        if (job.location) {
          cityCounts.set(job.location, (cityCounts.get(job.location) || 0) + 1);
        }
      });

      for (const [city, count] of cityCounts.entries()) {
        try {
          const pageMeta = await seoService.generateCityPageMeta(city, count);
          const success = await seoService.setPageMeta(pageMeta);

          const breadcrumbs = [
            { name: 'Accueil', url: 'https://jobguinee.com/' },
            { name: 'Emplois', url: 'https://jobguinee.com/jobs' },
            { name: `Emplois ${city}`, url: `https://jobguinee.com/jobs?location=${encodeURIComponent(city)}` }
          ];

          const breadcrumbSchema = schemaService.generateBreadcrumbSchema(breadcrumbs);
          await schemaService.setSchema({
            schema_type: 'BreadcrumbList',
            entity_type: 'city_page',
            entity_id: city,
            schema_json: breadcrumbSchema,
            is_active: true
          });

          if (success) {
            result.created++;
            result.details.push({
              type: 'city',
              name: `${city} (${count} offres)`,
              success: true
            });
          }
        } catch (err: any) {
          result.errors.push(`Erreur pour ville ${city}: ${err.message}`);
          result.details.push({
            type: 'city',
            name: city,
            success: false
          });
        }
      }
    } catch (error: any) {
      result.errors.push(`Erreur globale: ${error.message}`);
    }

    return result;
  }

  async generateBlogPages(): Promise<GenerationResult> {
    const result: GenerationResult = {
      created: 0,
      updated: 0,
      errors: [],
      details: []
    };

    try {
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      for (const post of posts || []) {
        try {
          const pageMeta = {
            page_path: `/blog/${post.slug || post.id}`,
            page_type: 'blog_post',
            title: `${post.title} | Blog JobGuinée`,
            description: post.excerpt || post.content?.substring(0, 160) || post.title,
            keywords: post.tags || [],
            og_title: post.title,
            og_description: post.excerpt,
            og_image: post.image_url,
            og_type: 'article',
            canonical_url: `/blog/${post.slug || post.id}`,
            priority: 0.6,
            change_freq: 'monthly',
            entity_type: 'blog_post',
            entity_id: post.id,
            is_active: true
          };

          const success = await seoService.setPageMeta(pageMeta);

          const articleSchema = schemaService.generateArticleSchema(post);
          await schemaService.setSchema({
            schema_type: 'Article',
            entity_type: 'blog_post',
            entity_id: post.id,
            schema_json: articleSchema,
            is_active: true
          });

          if (success) {
            result.created++;
            result.details.push({
              type: 'blog',
              name: post.title,
              success: true
            });
          }
        } catch (err: any) {
          result.errors.push(`Erreur pour ${post.title}: ${err.message}`);
          result.details.push({
            type: 'blog',
            name: post.title,
            success: false
          });
        }
      }
    } catch (error: any) {
      result.errors.push(`Erreur globale: ${error.message}`);
    }

    return result;
  }

  async generateFormationPages(): Promise<GenerationResult> {
    const result: GenerationResult = {
      created: 0,
      updated: 0,
      errors: [],
      details: []
    };

    try {
      const { data: formations, error } = await supabase
        .from('formations')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      for (const formation of formations || []) {
        try {
          const pageMeta = {
            page_path: `/formations#${formation.id}`,
            page_type: 'formations',
            title: `${formation.title} - Formation | JobGuinée`,
            description: formation.description?.substring(0, 160) || `Formation ${formation.title} disponible sur JobGuinée`,
            keywords: [formation.title.toLowerCase(), 'formation guinée', formation.level || 'formation'],
            og_title: formation.title,
            og_description: formation.description?.substring(0, 200),
            og_image: formation.image_url,
            priority: 0.6,
            change_freq: 'weekly',
            entity_type: 'formation',
            entity_id: formation.id,
            is_active: true
          };

          const success = await seoService.setPageMeta(pageMeta);

          const courseSchema = schemaService.generateCourseSchema(formation);
          await schemaService.setSchema({
            schema_type: 'Course',
            entity_type: 'formation',
            entity_id: formation.id,
            schema_json: courseSchema,
            is_active: true
          });

          if (success) {
            result.created++;
            result.details.push({
              type: 'formation',
              name: formation.title,
              success: true
            });
          }
        } catch (err: any) {
          result.errors.push(`Erreur pour ${formation.title}: ${err.message}`);
          result.details.push({
            type: 'formation',
            name: formation.title,
            success: false
          });
        }
      }
    } catch (error: any) {
      result.errors.push(`Erreur globale: ${error.message}`);
    }

    return result;
  }

  async generateAll(): Promise<{
    jobs: GenerationResult;
    sectors: GenerationResult;
    cities: GenerationResult;
    blog: GenerationResult;
    formations: GenerationResult;
    total: number;
  }> {
    const [jobs, sectors, cities, blog, formations] = await Promise.all([
      this.generateAllJobPages(),
      this.generateSectorPages(),
      this.generateCityPages(),
      this.generateBlogPages(),
      this.generateFormationPages()
    ]);

    const total =
      jobs.created +
      sectors.created +
      cities.created +
      blog.created +
      formations.created;

    return { jobs, sectors, cities, blog, formations, total };
  }
}

export const seoAutoGeneratorService = new SEOAutoGeneratorService();
