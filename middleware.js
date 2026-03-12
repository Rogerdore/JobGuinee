/**
 * Vercel Edge Middleware - SEO & Social Crawler Support
 * 
 * 1. Intercepte les crawlers sociaux sur /offres/* → Supabase social-gateway
 * 2. Injecte les meta tags SEO pour Googlebot/Bingbot sur les pages statiques
 * 3. Sert le robots.txt et sitemaps X-Robots-Tag
 */

const SUPABASE_FUNCTION_URL = 'https://hhhjzgeidjqctuveopso.supabase.co/functions/v1/social-gateway';
const SITE_URL = 'https://jobguinee-pro.com';

const SOCIAL_CRAWLER_PATTERNS = [
  'facebookexternalhit',
  'facebot',
  'linkedinbot',
  'twitterbot',
  'whatsapp',
  'slackbot',
  'telegrambot',
  'discordbot',
  'pinterestbot',
  'vkshare',
  'viber',
  'snapchat',
];

const SEARCH_BOT_PATTERNS = [
  'googlebot',
  'bingbot',
  'yandexbot',
  'duckduckbot',
  'baiduspider',
  'sogou',
  'ia_archiver',
];

function isSocialCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return SOCIAL_CRAWLER_PATTERNS.some(pattern => ua.includes(pattern));
}

function isSearchBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return SEARCH_BOT_PATTERNS.some(pattern => ua.includes(pattern));
}

// SEO metadata for static pages served to search bots
const PAGE_META = {
  '/': {
    title: 'JobGuinée - Plateforme N°1 de l\'emploi et du recrutement en Guinée',
    description: 'Trouvez votre emploi en Guinée sur JobGuinée, la première plateforme de recrutement digital. Offres d\'emploi à Conakry, opportunités dans les mines, ONG, secteur privé. Postulez en ligne.',
    keywords: 'emploi en guinée, offres d\'emploi en guinée, recrutement en guinée, emploi à conakry, site d\'emploi en guinée, plateforme de recrutement en guinée, recherche d\'emploi en guinée, trouver un emploi en guinée',
  },
  '/jobs': {
    title: 'Offres d\'emploi en Guinée - Toutes les annonces | JobGuinée',
    description: 'Consultez toutes les offres d\'emploi disponibles en Guinée. Emplois à Conakry, mines, ONG, secteur privé, entreprises minières. Postulez en ligne sur le meilleur site d\'emploi en Guinée.',
    keywords: 'offres d\'emploi en guinée, annonces emploi guinée, emplois disponibles en guinée, marché de l\'emploi en guinée, emploi secteur privé guinée, emploi ONG guinée',
  },
  '/formations': {
    title: 'Formations professionnelles en Guinée | JobGuinée',
    description: 'Découvrez les formations professionnelles en Guinée. Formations certifiantes, centres de formation à Conakry, programmes d\'apprentissage. Développez vos compétences avec JobGuinée.',
    keywords: 'formations en guinée, formations professionnelles guinée, centre de formation conakry, formation emploi guinée, formations certifiantes guinée',
  },
  '/blog': {
    title: 'Actualités emploi et marché du travail en Guinée | Blog JobGuinée',
    description: 'Suivez les actualités de l\'emploi en Guinée. Conseils carrière, statistiques du marché du travail guinéen, tendances recrutement, informations emploi Guinée.',
    keywords: 'actualité emploi guinée, marché du travail guinéen, informations emploi guinée, statistiques emploi guinée',
  },
  '/privacy-policy': {
    title: 'Politique de confidentialité | JobGuinée',
    description: 'Politique de confidentialité de JobGuinée. Protection des données personnelles, sécurité et droits des utilisateurs de la plateforme d\'emploi en Guinée.',
    keywords: 'politique de confidentialité jobguinée, protection données',
  },
  '/terms-of-service': {
    title: 'Conditions d\'utilisation | JobGuinée',
    description: 'Conditions générales d\'utilisation de la plateforme JobGuinée. Règles d\'inscription, droits et obligations des utilisateurs.',
    keywords: 'conditions utilisation jobguinée, CGU',
  },
  '/b2b-solutions': {
    title: 'Solutions RH pour entreprises en Guinée | JobGuinée B2B',
    description: 'Solutions de recrutement pour entreprises en Guinée. Site pour recruter en Guinée, publier des offres d\'emploi, gérer les candidatures. Service B2B pour PME, mines, ONG.',
    keywords: 'site pour recruter en guinée, site pour publier des offres d\'emploi en guinée, recrutement entreprise guinée',
  },
};

function buildSEOHtml(pathname, originalHtml) {
  const meta = PAGE_META[pathname];
  if (!meta) return null;

  const ogImage = `${SITE_URL}/assets/share/default-job.png`;

  // Build enhanced head with SEO meta tags
  const seoHead = `
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}">
    <meta name="keywords" content="${meta.keywords}">
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
    <link rel="canonical" href="${SITE_URL}${pathname === '/' ? '' : pathname}">
    
    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="JobGuinée">
    <meta property="og:title" content="${meta.title}">
    <meta property="og:description" content="${meta.description}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${SITE_URL}${pathname === '/' ? '' : pathname}">
    <meta property="og:locale" content="fr_GN">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${meta.title}">
    <meta name="twitter:description" content="${meta.description}">
    <meta name="twitter:image" content="${ogImage}">
  `;

  // Inject the SEO tags into the <head> of the original HTML
  if (originalHtml && originalHtml.includes('</head>')) {
    // Replace existing meta tags and inject enhanced ones
    let enhanced = originalHtml;
    // Remove existing title
    enhanced = enhanced.replace(/<title>[^<]*<\/title>/, '');
    // Remove existing meta description
    enhanced = enhanced.replace(/<meta\s+name="description"[^>]*>/, '');
    // Remove existing meta keywords
    enhanced = enhanced.replace(/<meta\s+name="keywords"[^>]*>/, '');
    // Inject new SEO head before </head>
    enhanced = enhanced.replace('</head>', `${seoHead}\n  </head>`);
    return enhanced;
  }

  return null;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const userAgent = request.headers.get('User-Agent') || '';

  // 0. NEVER intercept sitemap or robots.txt — serve static files directly
  if (
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/sitemap-index.xml' ||
    pathname === '/sitemap-jobs.xml' ||
    pathname === '/sitemap-companies.xml' ||
    pathname === '/sitemap-blog.xml' ||
    pathname === '/sitemap-formations.xml' ||
    pathname.endsWith('.xml')
  ) {
    return undefined; // Let Vercel serve the static file
  }

  // 1. Social crawlers on /offres/* → proxy to Supabase
  if (pathname.startsWith('/offres/') && isSocialCrawler(userAgent)) {
    const jobId = pathname.replace('/offres/', '').split('?')[0];
    
    if (jobId) {
      try {
        const response = await fetch(`${SUPABASE_FUNCTION_URL}/${jobId}`, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html',
          },
        });

        const html = await response.text();
        
        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
            'X-Robots-Tag': 'index, follow',
          },
        });
      } catch (error) {
        console.error('Middleware proxy error:', error);
      }
    }
  }

  // 2. Search bots on static pages → inject proper SEO meta
  if (isSearchBot(userAgent) && PAGE_META[pathname]) {
    try {
      // Fetch the original SPA page
      const originUrl = new URL(request.url);
      const originResponse = await fetch(originUrl.toString(), {
        headers: {
          'User-Agent': 'JobGuinee-Internal',
          'Accept': 'text/html',
        },
      });

      if (originResponse.ok) {
        const originalHtml = await originResponse.text();
        const enhancedHtml = buildSEOHtml(pathname, originalHtml);

        if (enhancedHtml) {
          return new Response(enhancedHtml, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
              'X-Robots-Tag': 'index, follow',
            },
          });
        }
      }
    } catch (error) {
      console.error('SEO middleware error:', error);
    }
  }

  // 3. For all other crawler requests, add X-Robots-Tag header
  if (isSearchBot(userAgent) || isSocialCrawler(userAgent)) {
    const response = await fetch(request);
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Robots-Tag', 'index, follow');
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  }

  // 4. Normal users → serve site normally
  return undefined;
}

export const config = {
  matcher: [
    '/',
    '/jobs',
    '/formations',
    '/blog',
    '/privacy-policy',
    '/terms-of-service',
    '/b2b-solutions',
    '/offres/:path*',
    '/sitemap.xml',
    '/sitemap-index.xml',
    '/sitemap-jobs.xml',
    '/sitemap-companies.xml',
    '/sitemap-blog.xml',
    '/sitemap-formations.xml',
    '/robots.txt',
  ],
};
