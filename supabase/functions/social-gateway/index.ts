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
  featured_image_url?: string;
  slug?: string;
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

    // Fetch job with company details
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) {
      return new Response(generateErrorHTML("404 - Offre introuvable"), {
        status: 404,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    const html = generateShareHTML(job as JobData);

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
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

function cleanDescription(desc: string | null | undefined): string {
  if (!desc) return "";
  
  return desc
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function generateShareHTML(job: JobData): string {
  const baseUrl = "https://jobguinee-pro.com";
  
  const title = `${job.title || "Offre d'emploi"} – ${job.company_name || job.company || "JobGuinée"}`;
  
  const rawDescription = cleanDescription(job.description);
  const description = rawDescription.length > 220
    ? rawDescription.substring(0, 217) + "..."
    : rawDescription || `Découvrez cette opportunité professionnelle sur JobGuinée`;

  // Use generated OG image or fallback
  const ogImage = job.featured_image_url && typeof job.featured_image_url === 'string' && job.featured_image_url.startsWith('http')
    ? job.featured_image_url
    : `${baseUrl}/assets/share/default-job.svg`;

  const shareUrl = `${baseUrl}/share/${job.id}`;
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
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="JobGuinée" />
  <meta property="og:title" content="${escapeHTML(title)}" />
  <meta property="og:description" content="${escapeHTML(description)}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:alt" content="${escapeHTML(title)}" />
  <meta property="og:url" content="${shareUrl}" />
  
  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHTML(title)}" />
  <meta name="twitter:description" content="${escapeHTML(description)}" />
  <meta name="twitter:image" content="${ogImage}" />
  <meta name="twitter:url" content="${shareUrl}" />
  <meta name="twitter:site" content="@JobGuinee" />
  
  <!-- LinkedIn Tags -->
  <meta property="linkedin:title" content="${escapeHTML(title)}" />
  <meta property="linkedin:description" content="${escapeHTML(description)}" />
  <meta property="linkedin:image" content="${ogImage}" />
  
  <!-- Redirect after crawlers finish (300ms delay) -->
  <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
  <link rel="canonical" href="${redirectUrl}" />
  
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
    // Fallback redirect in case meta refresh doesn't work
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.href = '${redirectUrl}';
      }, 100);
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
  const div = new DOMParser().parseFromString(str, 'text/html');
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}