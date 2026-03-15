import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface JobData {
  id: string;
  title: string;
  company_name?: string;
  company?: string;
  location?: string;
  contract_type?: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  salary_range?: string;
  salary_type?: string;
  featured_image_url?: string;
  company_logo_url?: string;
  slug?: string;
  experience_level?: string;
  education_level?: string;
  sector?: string;
  companies?: {
    name?: string;
    logo_url?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Detect if request comes from a social media crawler
    const userAgent = req.headers.get('user-agent') || '';
    const isCrawler = /facebookexternalhit|Facebot|LinkedInBot|Twitterbot|WhatsApp|TelegramBot|Discordbot|Slackbot|Pinterest|SkypeUriPreview|vkShare|tumblr|flipboard|nuzzel|redditbot|Embedly|quora|outbrain|ia_archiver/i.test(userAgent);
    
    // Extract job_id from path: /social-gateway/{job_id}
    const jobIdMatch = pathname.match(/\/social-gateway\/([^/?]+)/);
    const jobId = jobIdMatch ? jobIdMatch[1] : null;

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "job_id is required in path" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch job with company details and all profile fields
    // Try by ID first, then by slug as fallback
    let job = null;
    let jobError = null;
    
    const { data: jobById, error: errById } = await supabase
      .from("jobs")
      .select("*, companies(name, logo_url)")
      .eq("id", jobId)
      .maybeSingle();
    
    if (jobById) {
      job = jobById;
    } else {
      // Fallback: try lookup by slug
      const { data: jobBySlug, error: errBySlug } = await supabase
        .from("jobs")
        .select("*, companies(name, logo_url)")
        .eq("slug", jobId)
        .maybeSingle();
      job = jobBySlug;
      jobError = !jobBySlug ? (errById || errBySlug) : null;
    }

    if (jobError || !job) {
      console.error("Job fetch error:", jobError, "jobId:", jobId, "job:", job);
      return new Response(generateErrorHTML("404 - Offre introuvable"), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    const html = generateShareHTML(job as JobData, isCrawler);

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "text/html; charset=utf-8");
    responseHeaders.set("Cache-Control", "public, max-age=1800");
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");

    return new Response(html, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(generateErrorHTML("500 - Erreur serveur"), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }
});

function buildSalaryText(job: JobData): string {
  if (job.salary_range && job.salary_range.trim()) return job.salary_range;
  if (job.salary_min && job.salary_max) {
    const fmt = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n);
    return `${fmt(job.salary_min)} – ${fmt(job.salary_max)} GNF${job.salary_type ? `/${job.salary_type}` : ''}`;
  }
  if (job.salary_min) return `À partir de ${job.salary_min.toLocaleString()} GNF`;
  if (job.salary_max) return `Jusqu'à ${job.salary_max.toLocaleString()} GNF`;
  return '';
}

function cleanDescription(desc: string | null | undefined): string {
  if (!desc) return "";
  
  return desc
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    // Remove PDF/file content artifacts
    .replace(/📎[^📎]*\.(pdf|doc|docx|xls|xlsx)[^•]*(•[^•]*page\(s\))?/gi, "")
    .replace(/Page\s+\d+\/\d+/g, "")
    .replace(/\d+(\.\d+)?\s*KB\s*•/g, "")
    .replace(/📄[^•]*•/g, "")
    .replace(/♻️[^.]*\./g, "")
    .replace(/Document PDF intégré/g, "")
    .replace(/Exploitable par IA/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function generateShareHTML(job: JobData, isCrawler: boolean = false): string {
  const baseUrl = "https://jobguinee-pro.com";

  const jobTitle = (job.title || "Offre d'emploi").toUpperCase();
  const companyLabel = job.company_name || job.company || "JobGuinée";
  const title = `📢 Avis de recrutement d'un(e) ${jobTitle} - ${companyLabel} - Postulez sur JobGuinée`;

  // Build a rich, structured og:description with job profile details
  const companyName = job.company_name || job.company || job.companies?.name || '';
  const descParts: string[] = [];

  // Start with a short, natural sentence about the job
  if (companyName) {
    descParts.push(`${companyName} recrute : ${job.title || "un(e) professionnel(le)"}`);
  } else {
    descParts.push(`Recrutement : ${job.title || "un(e) professionnel(le)"}`);
  }

  // Location
  if (job.location) descParts.push(`Lieu: ${job.location}`);

  // Contract type
  if (job.contract_type) descParts.push(`Contrat: ${job.contract_type}`);

  // Experience
  if (job.experience_level) descParts.push(`Exp: ${job.experience_level}`);

  // Education
  if (job.education_level) descParts.push(`Niveau: ${job.education_level}`);

  // Sector
  if (job.sector) descParts.push(`Secteur: ${job.sector}`);

  // Salary
  const salaryText = buildSalaryText(job);
  if (salaryText) descParts.push(`Salaire: ${salaryText}`);

  // Add a short excerpt from the job description if available
  if (job.description) {
    const cleanDesc = cleanDescription(job.description);
    if (cleanDesc.length > 0) {
      // Trim to fit within overall limit
      const remaining = 220 - descParts.join(' | ').length;
      if (remaining > 30) {
        const excerpt = cleanDesc.length > remaining ? cleanDesc.substring(0, remaining - 3) + '...' : cleanDesc;
        descParts.push(excerpt);
      }
    }
  }

  // CTA
  descParts.push('Postulez sur JobGuinée !');

  let description = descParts.join(' | ');
  // Facebook og:description max ~300 chars, keep it under 250 for safety
  if (description.length > 250) {
    description = description.substring(0, 247) + '...';
  }

  // OG Image Cascade
  // Priority: featured_image_url (via Supabase transform → JPEG 1200x630) → logo PNG fallback
  // Company logos are excluded: they are typically small icons (<200x200) 
  // and Facebook requires at least 200x200px for og:image
  const fallbackImage = `${baseUrl}/logo_jobguinee.png`;
  let ogImage = fallbackImage;
  let imageType = 'image/png';
  let imageWidth = '1200';
  let imageHeight = '630';
  
  const isValidImageUrl = (url: string | undefined | null): boolean => {
    if (!url || typeof url !== 'string') return false;
    if (!url.startsWith('http')) return false;
    if (url.toLowerCase().endsWith('.svg')) return false;
    return true;
  };

  // Use Supabase Image Transformations to serve JPEG at optimal OG dimensions
  // Converts WebP/PNG to JPEG and resizes to 1200x630 (Facebook recommended)
  const supabaseStorageBase = Deno.env.get("SUPABASE_URL") + '/storage/v1';
  
  if (isValidImageUrl(job.featured_image_url)) {
    const rawUrl = job.featured_image_url!;
    // Check if image is hosted on our Supabase Storage
    const objectPrefix = supabaseStorageBase + '/object/public/';
    if (rawUrl.startsWith(objectPrefix)) {
      // Extract the bucket/path part and use render endpoint for JPEG conversion
      const storagePath = rawUrl.substring(objectPrefix.length);
      ogImage = `${supabaseStorageBase}/render/image/public/${storagePath}?width=1200&height=630&resize=cover`;
      imageType = 'image/jpeg';
    } else {
      // External image URL — use as-is
      ogImage = rawUrl;
      const lowerImage = rawUrl.toLowerCase();
      imageType = lowerImage.endsWith('.jpg') || lowerImage.endsWith('.jpeg')
        ? 'image/jpeg'
        : lowerImage.endsWith('.webp')
        ? 'image/webp'
        : lowerImage.endsWith('.gif')
        ? 'image/gif'
        : 'image/png';
    }
  }

  // Check if job-specific image exists (would need server-side validation in production)
  // For now, we use the featured_image_url if available, otherwise fallback

  // og:url must be the canonical jobguinee-pro.com URL (this controls the domain shown on Facebook)
  const shareUrl = `${baseUrl}/offres/${job.slug || job.id}`;
  const redirectUrl = `${baseUrl}/offres/${job.slug || job.id}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHTML(title)}</title>
  
  <!-- Core Meta Tags -->
  <meta name="description" content="${escapeHTML(description)}" />
  <meta name="robots" content="index, follow" />
  <meta name="language" content="fr" />
  <meta name="author" content="JobGuinée" />
  
  <!-- Open Graph Tags (Facebook, LinkedIn, Pinterest) -->
  ${Deno.env.get("FB_APP_ID") ? `<meta property="fb:app_id" content="${Deno.env.get("FB_APP_ID")}" />` : ''}
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="JobGuinée" />
  <meta property="og:locale" content="fr_FR" />
  <meta property="og:title" content="${escapeHTML(title)}" />
  <meta property="og:description" content="${escapeHTML(description)}" />
  <meta property="og:image" content="${escapeUrlForHtml(ogImage)}" />
  <meta property="og:image:width" content="${imageWidth}" />
  <meta property="og:image:height" content="${imageHeight}" />
  <meta property="og:image:type" content="${imageType}" />
  <meta property="og:image:alt" content="${escapeHTML(title)}" />
  <meta property="og:url" content="${escapeUrlForHtml(shareUrl)}" />
  <meta property="article:section" content="Emploi" />
  <meta property="article:tag" content="${escapeHTML(job.contract_type || 'Emploi')}" />
  <meta property="article:tag" content="${escapeHTML(job.location || 'Guinée')}" />
  <meta property="article:publisher" content="https://www.facebook.com/JobGuinee" />
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHTML(title)}" />
  <meta name="twitter:description" content="${escapeHTML(description)}" />
  <meta name="twitter:image" content="${escapeUrlForHtml(ogImage)}" />
  <meta name="twitter:url" content="${escapeUrlForHtml(shareUrl)}" />
  <meta name="twitter:site" content="@JobGuinee" />
  
  <!-- LinkedIn Tags -->
  <meta property="linkedin:title" content="${escapeHTML(title)}" />
  <meta property="linkedin:description" content="${escapeHTML(description)}" />
  <meta property="linkedin:image" content="${escapeUrlForHtml(ogImage)}" />
  
  <!-- Redirect for human users only (crawlers stay to read OG tags) -->
  ${isCrawler ? '' : `<meta http-equiv="refresh" content="2;url=${escapeUrlForHtml(redirectUrl)}" />`}
  <link rel="canonical" href="${escapeUrlForHtml(redirectUrl)}" />
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 20px;
    }
    h1 { font-size: 24px; margin-bottom: 10px; }
    p { font-size: 16px; margin: 5px 0; opacity: 0.9; }
    a {
      display: inline-block;
      margin-top: 20px;
      padding: 12px 24px;
      background: white;
      color: #667eea;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: transform 0.2s;
    }
    a:hover { transform: scale(1.05); }
  </style>
</head>
<body>
  <div class="container">
    <h1>Redirection en cours...</h1>
    <p>${escapeHTML(title)}</p>
    <p>Vous allez être redirigé dans quelques secondes.</p>
    <a href="${redirectUrl}">Cliquez ici si la redirection n'a pas fonctionné</a>
  </div>
  
  <script>
    // Redirect human users to the actual job page (crawlers don't execute JS)
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '${redirectUrl}';
      }, 2000);
    }
  </script>
</body>
</html>`;
}

function generateErrorHTML(message: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Erreur - JobGuinée</title>
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="JobGuinée" />
  <meta property="og:title" content="Erreur - JobGuinée" />
  <meta property="og:url" content="https://jobguinee-pro.com" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 40px 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 { color: #d32f2f; margin-bottom: 10px; }
    p { color: #666; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${message}</h1>
    <p><a href="https://jobguinee-pro.com">Retour à l'accueil</a></p>
  </div>
</body>
</html>`;
}

function escapeHTML(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Escape only & for URLs in HTML attributes (don't escape quotes/angle brackets)
function escapeUrlForHtml(url: string): string {
  if (!url) return "";
  return url.replace(/&/g, "&amp;");
}