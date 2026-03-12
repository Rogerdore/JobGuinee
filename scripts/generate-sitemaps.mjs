/**
 * Build-time Sitemap Generator
 * 
 * Generates static XML sitemap files into dist/ after Vite build.
 * This ensures /sitemap.xml is served as a real static file, 
 * not intercepted by the SPA catch-all rewrite.
 * 
 * Runs as: node scripts/generate-sitemaps.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');

const SITE_URL = 'https://jobguinee-pro.com';

// ─── Load environment variables ────────────────────────────
function loadEnv() {
  const envFiles = ['.env.production', '.env'];
  for (const file of envFiles) {
    const envPath = resolve(ROOT, file);
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://hhhjzgeidjqctuveopso.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

function getSupabase() {
  if (!supabaseKey) {
    console.warn('[Sitemap] No VITE_SUPABASE_ANON_KEY found. Generating static-only sitemaps.');
    return null;
  }
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

function buildUrlEntry(url) {
  let entry = `  <url>\n    <loc>${escapeXml(SITE_URL + url.loc)}</loc>`;
  if (url.lastmod) entry += `\n    <lastmod>${url.lastmod}</lastmod>`;
  if (url.changefreq) entry += `\n    <changefreq>${url.changefreq}</changefreq>`;
  if (url.priority) entry += `\n    <priority>${url.priority}</priority>`;
  entry += '\n  </url>';
  return entry;
}

function wrapUrlset(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

// ─── Data fetchers ─────────────────────────────────────────
async function fetchJobs(supabase) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, location, sector, created_at, updated_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(5000);
    if (error) throw error;
    return (data || []).map(job => ({
      loc: `/offres/${job.id}`,
      lastmod: (job.updated_at || job.created_at || '').split('T')[0],
      changefreq: 'daily',
      priority: '0.9',
    }));
  } catch (e) {
    console.error('[Sitemap] Error fetching jobs:', e.message);
    return [];
  }
}

async function fetchSectors(supabase) {
  // Start with well-known Guinea job sectors as fallback
  const knownSectors = [
    'Informatique', 'Marketing & Communication digital',
    'Mines et Ressources Minérales', 'Comptabilité & Finance',
    'Ressources Humaines', 'BTP & Construction',
    'Santé & Médecine', 'Éducation & Formation',
    'Transport & Logistique', 'Agriculture & Agroalimentaire',
    'Banque & Assurance', 'Commerce & Vente',
    'Hôtellerie & Restauration', 'ONG & Organisations internationales',
    'Télécommunications', 'Juridique & Droit',
  ];
  const sectorSet = new Set(knownSectors);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('sector')
        .eq('status', 'published')
        .not('sector', 'is', null);
      if (!error && data) {
        data.forEach(j => { if (j.sector) sectorSet.add(j.sector); });
      }
    } catch (e) {
      console.error('[Sitemap] Error fetching sectors:', e.message);
    }
  }

  return [...sectorSet].map(sector => ({
    loc: `/jobs?sector=${encodeURIComponent(sector)}`,
    lastmod: today(),
    changefreq: 'weekly',
    priority: '0.8',
  }));
}

async function fetchCities(supabase) {
  // Start with major Guinea cities as fallback
  const knownCities = [
    'Conakry', 'Kindia', 'Labé', 'Boké', 'Nzérékoré',
    'Kankan', 'Mamou', 'Faranah', 'Siguiri', 'Kamsar',
    'Kissidougou', 'Guéckédou', 'Dabola',
  ];
  const citySet = new Set(knownCities);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('location')
        .eq('status', 'published')
        .not('location', 'is', null);
      if (!error && data) {
        data.forEach(j => { if (j.location) citySet.add(j.location); });
      }
    } catch (e) {
      console.error('[Sitemap] Error fetching cities:', e.message);
    }
  }

  return [...citySet].map(city => ({
    loc: `/jobs?location=${encodeURIComponent(city)}`,
    lastmod: today(),
    changefreq: 'weekly',
    priority: '0.8',
  }));
}

async function fetchBlogPosts(supabase) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, slug, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data || []).map(post => ({
      loc: `/blog/${post.slug || post.id}`,
      lastmod: (post.created_at || '').split('T')[0],
      changefreq: 'weekly',
      priority: '0.7',
    }));
  } catch (e) {
    console.error('[Sitemap] Error fetching blog posts:', e.message);
    return [];
  }
}

async function fetchFormations(supabase) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('formations')
      .select('id, created_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data || []).map(f => ({
      loc: `/formations/${f.id}`,
      lastmod: (f.created_at || '').split('T')[0],
      changefreq: 'weekly',
      priority: '0.7',
    }));
  } catch (e) {
    console.error('[Sitemap] Error fetching formations:', e.message);
    return [];
  }
}

async function fetchCompanies(supabase) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, created_at')
      .limit(1000);
    if (error) throw error;
    return (data || []).map(c => ({
      loc: `/company/${c.id}`,
      lastmod: (c.created_at || '').split('T')[0],
      changefreq: 'weekly',
      priority: '0.7',
    }));
  } catch (e) {
    console.error('[Sitemap] Error fetching companies:', e.message);
    return [];
  }
}

// ─── Static pages ──────────────────────────────────────────
const STATIC_PAGES = [
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

// ─── Main generator ────────────────────────────────────────
async function generateSitemaps() {
  console.log('[Sitemap] Generating static sitemap files into dist/...');

  if (!existsSync(DIST)) {
    console.error('[Sitemap] dist/ directory not found. Run "vite build" first.');
    process.exit(1);
  }

  const supabase = getSupabase();

  // Fetch all data in parallel
  const [jobs, sectors, cities, blogPosts, formations, companies] = await Promise.all([
    fetchJobs(supabase),
    fetchSectors(supabase),
    fetchCities(supabase),
    fetchBlogPosts(supabase),
    fetchFormations(supabase),
    fetchCompanies(supabase),
  ]);

  const dateNow = today();

  // 1. Main sitemap.xml (static pages + all dynamic content)
  const allUrls = [
    ...STATIC_PAGES.map(p => ({ ...p, lastmod: dateNow })),
    ...jobs,
    ...sectors,
    ...cities,
    ...blogPosts,
    ...formations,
    ...companies,
  ];
  const mainXml = wrapUrlset(allUrls.map(buildUrlEntry).join('\n'));
  writeFileSync(resolve(DIST, 'sitemap.xml'), mainXml, 'utf-8');
  console.log(`[Sitemap] sitemap.xml: ${allUrls.length} URLs total`);
  console.log(`  → ${STATIC_PAGES.length} pages statiques`);
  console.log(`  → ${jobs.length} offres d'emploi`);
  console.log(`  → ${sectors.length} catégories métiers`);
  console.log(`  → ${cities.length} villes`);
  console.log(`  → ${blogPosts.length} articles blog`);
  console.log(`  → ${formations.length} formations`);
  console.log(`  → ${companies.length} entreprises`);

  // 2. sitemap-jobs.xml
  const jobsXml = wrapUrlset(jobs.map(buildUrlEntry).join('\n'));
  writeFileSync(resolve(DIST, 'sitemap-jobs.xml'), jobsXml, 'utf-8');
  console.log(`[Sitemap] sitemap-jobs.xml: ${jobs.length} URLs`);

  // 3. sitemap-companies.xml
  const companiesXml = wrapUrlset(companies.map(buildUrlEntry).join('\n'));
  writeFileSync(resolve(DIST, 'sitemap-companies.xml'), companiesXml, 'utf-8');
  console.log(`[Sitemap] sitemap-companies.xml: ${companies.length} URLs`);

  // 4. sitemap-blog.xml
  const blogXml = wrapUrlset(blogPosts.map(buildUrlEntry).join('\n'));
  writeFileSync(resolve(DIST, 'sitemap-blog.xml'), blogXml, 'utf-8');
  console.log(`[Sitemap] sitemap-blog.xml: ${blogPosts.length} URLs`);

  // 5. sitemap-formations.xml
  const formationsXml = wrapUrlset(formations.map(buildUrlEntry).join('\n'));
  writeFileSync(resolve(DIST, 'sitemap-formations.xml'), formationsXml, 'utf-8');
  console.log(`[Sitemap] sitemap-formations.xml: ${formations.length} URLs`);

  // 6. sitemap-index.xml (index of all sitemaps)
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap.xml</loc>
    <lastmod>${dateNow}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-jobs.xml</loc>
    <lastmod>${dateNow}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-companies.xml</loc>
    <lastmod>${dateNow}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-blog.xml</loc>
    <lastmod>${dateNow}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-formations.xml</loc>
    <lastmod>${dateNow}</lastmod>
  </sitemap>
</sitemapindex>`;
  writeFileSync(resolve(DIST, 'sitemap-index.xml'), sitemapIndex, 'utf-8');
  console.log(`[Sitemap] sitemap-index.xml generated`);

  console.log('[Sitemap] All sitemaps generated successfully!');
}

generateSitemaps().catch(err => {
  console.error('[Sitemap] Fatal error:', err);
  // Don't fail the build — write minimal fallback sitemaps
  const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><priority>1.0</priority><changefreq>daily</changefreq></url>
  <url><loc>${SITE_URL}/jobs</loc><priority>0.9</priority><changefreq>hourly</changefreq></url>
  <url><loc>${SITE_URL}/formations</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>
  <url><loc>${SITE_URL}/blog</loc><priority>0.7</priority><changefreq>daily</changefreq></url>
  <url><loc>${SITE_URL}/b2b-solutions</loc><priority>0.7</priority><changefreq>weekly</changefreq></url>
</urlset>`;
  try {
    writeFileSync(resolve(DIST, 'sitemap.xml'), fallbackXml, 'utf-8');
    console.log('[Sitemap] Fallback sitemap.xml written.');
  } catch (writeErr) {
    console.error('[Sitemap] Could not write fallback:', writeErr.message);
  }
});
