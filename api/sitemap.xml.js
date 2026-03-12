import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://jobguinee-pro.com';
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hhhjzgeidjqctuveopso.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

function getSupabase() {
  if (!supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function today() {
  return new Date().toISOString().split('T')[0];
}

async function getStaticPages() {
  return [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/jobs', priority: '0.9', changefreq: 'hourly' },
    { loc: '/formations', priority: '0.8', changefreq: 'weekly' },
    { loc: '/blog', priority: '0.7', changefreq: 'daily' },
    { loc: '/cvtheque', priority: '0.8', changefreq: 'weekly' },
    { loc: '/premium-ai', priority: '0.6', changefreq: 'weekly' },
    { loc: '/credit-store', priority: '0.5', changefreq: 'weekly' },
    { loc: '/b2b-solutions', priority: '0.7', changefreq: 'weekly' },
    { loc: '/privacy-policy', priority: '0.3', changefreq: 'monthly' },
    { loc: '/terms-of-service', priority: '0.3', changefreq: 'monthly' },
    { loc: '/resources', priority: '0.6', changefreq: 'weekly' },
  ];
}

async function getJobPages(supabase) {
  if (!supabase) return [];
  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, created_at, updated_at, title, location, sector')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(5000);
    if (error) throw error;
    return (jobs || []).map(job => ({
      loc: `/offres/${job.id}`,
      lastmod: (job.updated_at || job.created_at || '').split('T')[0],
      changefreq: 'daily',
      priority: '0.8',
    }));
  } catch (e) {
    console.error('Sitemap: Error fetching jobs:', e.message);
    return [];
  }
}

async function getSectorPages(supabase) {
  if (!supabase) return [];
  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('sector')
      .eq('status', 'published')
      .not('sector', 'is', null);
    if (error) throw error;
    const sectors = [...new Set((jobs || []).map(j => j.sector).filter(Boolean))];
    return sectors.map(sector => ({
      loc: `/jobs?sector=${encodeURIComponent(sector)}`,
      lastmod: today(),
      changefreq: 'daily',
      priority: '0.7',
    }));
  } catch (e) {
    console.error('Sitemap: Error fetching sectors:', e.message);
    return [];
  }
}

async function getCityPages(supabase) {
  if (!supabase) return [];
  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('location')
      .eq('status', 'published')
      .not('location', 'is', null);
    if (error) throw error;
    const cities = [...new Set((jobs || []).map(j => j.location).filter(Boolean))];
    return cities.map(city => ({
      loc: `/jobs?location=${encodeURIComponent(city)}`,
      lastmod: today(),
      changefreq: 'daily',
      priority: '0.7',
    }));
  } catch (e) {
    console.error('Sitemap: Error fetching cities:', e.message);
    return [];
  }
}

async function getBlogPages(supabase) {
  if (!supabase) return [];
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('id, slug, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return (posts || []).map(post => ({
      loc: `/blog/${post.slug || post.id}`,
      lastmod: (post.created_at || '').split('T')[0],
      changefreq: 'weekly',
      priority: '0.6',
    }));
  } catch (e) {
    console.error('Sitemap: Error fetching blog:', e.message);
    return [];
  }
}

async function getFormationPages(supabase) {
  if (!supabase) return [];
  try {
    const { data: formations, error } = await supabase
      .from('formations')
      .select('id, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return (formations || []).map(f => ({
      loc: `/formations/${f.id}`,
      lastmod: (f.created_at || '').split('T')[0],
      changefreq: 'weekly',
      priority: '0.6',
    }));
  } catch (e) {
    console.error('Sitemap: Error fetching formations:', e.message);
    return [];
  }
}

async function getCompanyPages(supabase) {
  if (!supabase) return [];
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, created_at')
      .limit(1000);
    if (error) throw error;
    return (companies || []).map(c => ({
      loc: `/company/${c.id}`,
      lastmod: (c.created_at || '').split('T')[0],
      changefreq: 'weekly',
      priority: '0.6',
    }));
  } catch (e) {
    console.error('Sitemap: Error fetching companies:', e.message);
    return [];
  }
}

function buildUrlEntry(url) {
  let entry = `  <url>\n    <loc>${escapeXml(SITE_URL + url.loc)}</loc>`;
  if (url.lastmod) entry += `\n    <lastmod>${url.lastmod}</lastmod>`;
  if (url.changefreq) entry += `\n    <changefreq>${url.changefreq}</changefreq>`;
  if (url.priority) entry += `\n    <priority>${url.priority}</priority>`;
  entry += '\n  </url>';
  return entry;
}

export default async function handler(req, res) {
  try {
    const supabase = getSupabase();

    const [staticPages, jobPages, sectorPages, cityPages, blogPages, formationPages, companyPages] =
      await Promise.all([
        getStaticPages(),
        getJobPages(supabase),
        getSectorPages(supabase),
        getCityPages(supabase),
        getBlogPages(supabase),
        getFormationPages(supabase),
        getCompanyPages(supabase),
      ]);

    const allUrls = [
      ...staticPages.map(p => ({ ...p, lastmod: p.lastmod || today() })),
      ...jobPages,
      ...sectorPages,
      ...cityPages,
      ...blogPages,
      ...formationPages,
      ...companyPages,
    ];

    const urlEntries = allUrls.map(buildUrlEntry).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('X-Robots-Tag', 'noindex');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    // Return a minimal valid sitemap on error
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/jobs</loc><priority>0.9</priority></url>
</urlset>`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send(fallback);
  }
}
