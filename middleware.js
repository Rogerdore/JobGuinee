/**
 * Vercel Edge Middleware - Proxy OG Tags pour crawlers sociaux
 * 
 * Intercepte les crawlers Facebook/LinkedIn/Twitter sur /offres/*
 * et proxy vers Supabase Edge Function social-gateway.
 * Les utilisateurs normaux voient le site normalement.
 */

const SUPABASE_FUNCTION_URL = 'https://hhhjzgeidjqctuveopso.supabase.co/functions/v1/social-gateway';

const CRAWLER_PATTERNS = [
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

function isSocialCrawler(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_PATTERNS.some(pattern => ua.includes(pattern));
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const userAgent = request.headers.get('User-Agent') || '';

  // Seulement intercepter /offres/* pour les crawlers sociaux
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
        // En cas d'erreur, continuer vers le site normal
        console.error('Middleware proxy error:', error);
      }
    }
  }

  // Tout le reste : servir le site normalement
  return undefined;
}

export const config = {
  matcher: '/offres/:path*',
};
