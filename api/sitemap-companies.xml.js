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
    let companyUrls = [];

    if (supabase) {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('id, name, created_at')
        .limit(1000);

      if (!error && companies) {
        companyUrls = companies.map(c => {
          const lastmod = (c.created_at || '').split('T')[0];
          const loc = `${SITE_URL}/company/${c.id}`;
          return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
        });
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${companyUrls.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Companies sitemap error:', error);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}
