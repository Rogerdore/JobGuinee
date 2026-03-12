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
    let blogUrls = [];

    if (supabase) {
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select('id, slug, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

      if (!error && posts) {
        blogUrls = posts.map(post => {
          const lastmod = (post.created_at || '').split('T')[0];
          const loc = `${SITE_URL}/blog/${post.slug || post.id}`;
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
${blogUrls.join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Blog sitemap error:', error);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
}
