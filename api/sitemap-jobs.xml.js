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
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  try {
    const supabase = getSupabase();
    let jobUrls = [];

    if (supabase) {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id, title, location, sector, created_at, updated_at, companies(name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(5000);

      if (!error && jobs) {
        jobUrls = jobs.map(job => {
          const lastmod = (job.updated_at || job.created_at || '').split('T')[0];
          const loc = `${SITE_URL}/offres/${job.id}`;
          return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
        });
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${jobUrls.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Jobs sitemap error:', error);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}
