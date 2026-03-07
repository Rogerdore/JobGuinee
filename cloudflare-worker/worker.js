const SUPABASE_URL = 'https://hhhjzgeidjqctuveopso.supabase.co/functions/v1/social-gateway';
const CRAWLERS = ['facebookexternalhit','facebot','linkedinbot','twitterbot','whatsapp','slackbot','telegrambot','discordbot'];
function isCrawler(ua) { if (!ua) return false; const l = ua.toLowerCase(); return CRAWLERS.some(c => l.includes(c)); }
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const ua = request.headers.get('User-Agent') || '';
    if (!url.pathname.startsWith('/offres/') || !isCrawler(ua)) { return fetch(request); }
    const jobId = url.pathname.replace('/offres/', '').split('?')[0];
    if (!jobId) return fetch(request);
    const target = SUPABASE_URL + '/' + jobId + '?t=' + Date.now();
    try {
      const r = await fetch(target, { headers: { 'User-Agent': ua, 'Accept': 'text/html' } });
      const html = await r.text();
      return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Worker': 'v3' } });
    } catch (e) { return new Response('Worker error: ' + e.message, { status: 500 }); }
  },
};
