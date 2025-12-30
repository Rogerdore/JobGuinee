import { supabase } from '../lib/supabase';
import { seoService } from './seoService';

interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: SitemapImage[];
  videos?: SitemapVideo[];
  alternates?: SitemapAlternate[];
}

interface SitemapImage {
  loc: string;
  title?: string;
  caption?: string;
}

interface SitemapVideo {
  thumbnail_loc: string;
  title: string;
  description: string;
  content_loc?: string;
  duration?: number;
  publication_date?: string;
}

interface SitemapAlternate {
  hreflang: string;
  href: string;
}

class SitemapService {
  private siteUrl = 'https://jobguinee.com';

  async generateSitemap(): Promise<string> {
    const urls: SitemapURL[] = [];

    urls.push(...await this.getStaticPages());
    urls.push(...await this.getJobPages());
    urls.push(...await this.getSectorPages());
    urls.push(...await this.getCityPages());
    urls.push(...await this.getBlogPages());
    urls.push(...await this.getFormationPages());

    return this.buildSitemapXML(urls);
  }

  private async getStaticPages(): Promise<SitemapURL[]> {
    const staticPages = [
      { path: '/', priority: 1.0, changefreq: 'daily' as const },
      { path: '/jobs', priority: 0.9, changefreq: 'hourly' as const },
      { path: '/formations', priority: 0.8, changefreq: 'weekly' as const },
      { path: '/blog', priority: 0.7, changefreq: 'daily' as const },
      { path: '/cvtheque', priority: 0.8, changefreq: 'weekly' as const },
      { path: '/premium-ai', priority: 0.7, changefreq: 'weekly' as const },
      { path: '/credit-store', priority: 0.6, changefreq: 'weekly' as const }
    ];

    return staticPages.map(page => ({
      loc: `${this.siteUrl}${page.path}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: page.changefreq,
      priority: page.priority,
      alternates: [
        { hreflang: 'fr', href: `${this.siteUrl}/fr${page.path}` },
        { hreflang: 'en', href: `${this.siteUrl}/en${page.path}` },
        { hreflang: 'x-default', href: `${this.siteUrl}${page.path}` }
      ]
    }));
  }

  private async getJobPages(): Promise<SitemapURL[]> {
    try {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id, created_at, updated_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      return (jobs || []).map(job => ({
        loc: `${this.siteUrl}/job-detail/${job.id}`,
        lastmod: (job.updated_at || job.created_at).split('T')[0],
        changefreq: 'daily' as const,
        priority: 0.8
      }));
    } catch (error) {
      console.error('Error fetching job pages:', error);
      return [];
    }
  }

  private async getSectorPages(): Promise<SitemapURL[]> {
    try {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('sector')
        .eq('status', 'published')
        .not('sector', 'is', null);

      if (error) throw error;

      const sectors = [...new Set((jobs || []).map(j => j.sector).filter(Boolean))];

      return sectors.map(sector => ({
        loc: `${this.siteUrl}/jobs?sector=${encodeURIComponent(sector)}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily' as const,
        priority: 0.7
      }));
    } catch (error) {
      console.error('Error fetching sector pages:', error);
      return [];
    }
  }

  private async getCityPages(): Promise<SitemapURL[]> {
    try {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('location')
        .eq('status', 'published')
        .not('location', 'is', null);

      if (error) throw error;

      const cities = [...new Set((jobs || []).map(j => j.location).filter(Boolean))];

      return cities.map(city => ({
        loc: `${this.siteUrl}/jobs?location=${encodeURIComponent(city)}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily' as const,
        priority: 0.7
      }));
    } catch (error) {
      console.error('Error fetching city pages:', error);
      return [];
    }
  }

  private async getBlogPages(): Promise<SitemapURL[]> {
    try {
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('id, slug, created_at, updated_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      return (posts || []).map(post => ({
        loc: `${this.siteUrl}/blog/${post.slug || post.id}`,
        lastmod: (post.updated_at || post.created_at).split('T')[0],
        changefreq: 'monthly' as const,
        priority: 0.6
      }));
    } catch (error) {
      console.error('Error fetching blog pages:', error);
      return [];
    }
  }

  private async getFormationPages(): Promise<SitemapURL[]> {
    try {
      const { data: formations, error } = await supabase
        .from('formations')
        .select('id, created_at, updated_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      return (formations || []).map(formation => ({
        loc: `${this.siteUrl}/formations#${formation.id}`,
        lastmod: (formation.updated_at || formation.created_at).split('T')[0],
        changefreq: 'weekly' as const,
        priority: 0.6
      }));
    } catch (error) {
      console.error('Error fetching formation pages:', error);
      return [];
    }
  }

  private buildSitemapXML(urls: SitemapURL[]): string {
    const urlsXML = urls
      .map(url => {
        let urlEntry = `  <url>\n    <loc>${this.escapeXML(url.loc)}</loc>`;

        if (url.lastmod) {
          urlEntry += `\n    <lastmod>${url.lastmod}</lastmod>`;
        }

        if (url.changefreq) {
          urlEntry += `\n    <changefreq>${url.changefreq}</changefreq>`;
        }

        if (url.priority !== undefined) {
          urlEntry += `\n    <priority>${url.priority.toFixed(1)}</priority>`;
        }

        if (url.alternates && url.alternates.length > 0) {
          url.alternates.forEach(alt => {
            urlEntry += `\n    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${this.escapeXML(alt.href)}" />`;
          });
        }

        if (url.images && url.images.length > 0) {
          url.images.forEach(image => {
            urlEntry += `\n    <image:image>`;
            urlEntry += `\n      <image:loc>${this.escapeXML(image.loc)}</image:loc>`;
            if (image.title) {
              urlEntry += `\n      <image:title>${this.escapeXML(image.title)}</image:title>`;
            }
            if (image.caption) {
              urlEntry += `\n      <image:caption>${this.escapeXML(image.caption)}</image:caption>`;
            }
            urlEntry += `\n    </image:image>`;
          });
        }

        if (url.videos && url.videos.length > 0) {
          url.videos.forEach(video => {
            urlEntry += `\n    <video:video>`;
            urlEntry += `\n      <video:thumbnail_loc>${this.escapeXML(video.thumbnail_loc)}</video:thumbnail_loc>`;
            urlEntry += `\n      <video:title>${this.escapeXML(video.title)}</video:title>`;
            urlEntry += `\n      <video:description>${this.escapeXML(video.description)}</video:description>`;
            if (video.content_loc) {
              urlEntry += `\n      <video:content_loc>${this.escapeXML(video.content_loc)}</video:content_loc>`;
            }
            if (video.duration) {
              urlEntry += `\n      <video:duration>${video.duration}</video:duration>`;
            }
            if (video.publication_date) {
              urlEntry += `\n      <video:publication_date>${video.publication_date}</video:publication_date>`;
            }
            urlEntry += `\n    </video:video>`;
          });
        }

        urlEntry += '\n  </url>';
        return urlEntry;
      })
      .join('\n');

    const namespaces = [
      'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
      'xmlns:xhtml="http://www.w3.org/1999/xhtml"',
      'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
      'xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"'
    ].join('\n  ');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset ${namespaces}>
${urlsXML}
</urlset>`;
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  async downloadSitemap(): Promise<void> {
    const sitemap = await this.generateSitemap();
    const blob = new Blob([sitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async getSitemapStats(): Promise<{
    totalURLs: number;
    byType: Record<string, number>;
    lastGenerated: string;
  }> {
    const urls = [
      ...await this.getStaticPages(),
      ...await this.getJobPages(),
      ...await this.getSectorPages(),
      ...await this.getCityPages(),
      ...await this.getBlogPages(),
      ...await this.getFormationPages()
    ];

    const stats: Record<string, number> = {
      'Pages statiques': (await this.getStaticPages()).length,
      'Offres emploi': (await this.getJobPages()).length,
      'Pages secteurs': (await this.getSectorPages()).length,
      'Pages villes': (await this.getCityPages()).length,
      'Articles blog': (await this.getBlogPages()).length,
      'Formations': (await this.getFormationPages()).length
    };

    return {
      totalURLs: urls.length,
      byType: stats,
      lastGenerated: new Date().toISOString()
    };
  }
}

export const sitemapService = new SitemapService();
