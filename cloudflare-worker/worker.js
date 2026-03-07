/**
 * Cloudflare Worker - Reverse Proxy pour OG Tags Social Media
 * 
 * Ce worker intercepte les requêtes des crawlers sociaux (Facebook, LinkedIn, Twitter)
 * sur les URLs /offres/* et les proxy vers la Edge Function Supabase social-gateway.
 * Les utilisateurs normaux sont servis par Bolt.new comme d'habitude.
 * 
 * Résultat : Facebook affiche "jobguinee-pro.com" comme domaine dans les partages.
 * 
 * INSTALLATION :
 * 1. Créer un compte Cloudflare (gratuit) : https://dash.cloudflare.com/sign-up
 * 2. Ajouter le domaine jobguinee-pro.com à Cloudflare
 * 3. Changer les nameservers chez Hostinger vers ceux donnés par Cloudflare
 * 4. Aller dans Workers & Pages → Create Worker
 * 5. Coller ce code
 * 6. Ajouter une Route : jobguinee-pro.com/offres/* → ce worker
 */

const SUPABASE_FUNCTION_URL = 'https://hhhjzgeidjqctuveopso.supabase.co/functions/v1/social-gateway';

// User-Agent patterns des crawlers de réseaux sociaux
const CRAWLER_PATTERNS = [
  'facebookexternalhit',
  'Facebot',
  'LinkedInBot',
  'Twitterbot',
  'WhatsApp',
  'Slackbot',
  'TelegramBot',
  'Discordbot',
  'Googlebot',
  'bingbot',
  'Pinterestbot',
  'vkShare',
  'Viber',
  'Snapchat',
];

/**
 * Détecte si la requête vient d'un crawler de réseau social
 */
function isSocialCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some(pattern => ua.includes(pattern.toLowerCase()));
}

/**
 * Extrait l'ID ou slug de l'offre depuis l'URL
 * /offres/mon-slug-id → mon-slug-id
 * /offres/06c825c4-04a2-4639-9a31-b4cfd469e86d → 06c825c4-...
 */
function extractJobId(pathname) {
  const match = pathname.match(/^\/offres\/(.+?)(?:\?|$)/);
  return match ? match[1] : null;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const userAgent = request.headers.get('User-Agent') || '';

    // Seulement intercepter les URLs /offres/*
    if (!pathname.startsWith('/offres/')) {
      // Laisser passer vers l'origin (Bolt.new)
      return fetch(request);
    }

    // Seulement intercepter les crawlers sociaux
    if (!isSocialCrawler(userAgent)) {
      // Utilisateur normal → laisser passer vers Bolt.new
      return fetch(request);
    }

    // === CRAWLER DÉTECTÉ sur /offres/* ===
    const jobId = extractJobId(pathname);
    if (!jobId) {
      return fetch(request);
    }

    // Proxy vers Supabase Edge Function
    const supabaseUrl = `${SUPABASE_FUNCTION_URL}/${jobId}`;
    
    try {
      const response = await fetch(supabaseUrl, {
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html',
        },
      });

      // Retourner la réponse HTML avec les OG tags
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
      // En cas d'erreur, laisser passer vers l'origin
      console.error('Worker proxy error:', error);
      return fetch(request);
    }
  },
};
