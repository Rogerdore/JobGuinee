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
  companies?: {
    name: string;
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
    const jobId = url.searchParams.get("job_id");

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "job_id parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const metadata = generateJobMetadata(job as JobData);
    // Cascade de préférence pour l'image OG
    let ogImage = "https://jobguinee-pro.com/assets/share/default-job.png";

    // 1. Image OG générée (si elle existe)
    const generatedOGImage = `https://jobguinee-pro.com/og-images/jobs/${job.id}/facebook.png`;
    // Note: On l'utilise si elle existe (vérification côté client/Facebook)
    ogImage = generatedOGImage;

    // 2. Fallback: Image mise en avant du recruteur
    if (job.featured_image_url && typeof job.featured_image_url === 'string' && job.featured_image_url.startsWith('http')) {
      ogImage = job.featured_image_url;
    }

    const html = generateHTMLWithOGTags(metadata, ogImage, job as JobData);

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
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateJobMetadata(job: JobData) {
  const baseUrl = "https://jobguinee-pro.com";
  const jobTitle = job.title || "Offre d'emploi";
  const company = job.company_name || job.company || "Entreprise";
  const location = job.location || "Guinée";
  const contractType = job.contract_type || "CDI";

  // Nettoyer la description: enlever HTML et résumer
  let description = "Découvrez cette opportunité professionnelle sur JobGuinée";

  if (job.description) {
    // Enlever les balises HTML
    const cleanedDesc = job.description
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Couper à 220 caractères et ajouter l'appel à action
    if (cleanedDesc.length > 220) {
      description = cleanedDesc.substring(0, 217) + "... – Postulez via JobGuinée";
    } else if (cleanedDesc.length > 0) {
      description = cleanedDesc + " – Postulez via JobGuinée";
    }
  } else {
    // Fallback si pas de description
    description = `${contractType} à ${location} • Rejoins ${company} – Postulez via JobGuinée`;
  }

  return {
    title: `${jobTitle} – ${company}`,
    description,
    url: `${baseUrl}/s/${job.id}?src=facebook`,
    company,
  };
}

function generateHTMLWithOGTags(
  metadata: any,
  ogImage: string,
  job: JobData
): string {
  const baseUrl = "https://jobguinee-pro.com";
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(metadata.title)}</title>
  
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(metadata.title)}" />
  <meta property="og:description" content="${escapeHtml(metadata.description)}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:url" content="${metadata.url}" />
  <meta property="og:site_name" content="JobGuinée" />
  <meta property="og:locale" content="fr_GN" />
  
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(metadata.title)}" />
  <meta name="twitter:description" content="${escapeHtml(metadata.description)}" />
  <meta name="twitter:image" content="${ogImage}" />
  
  <meta name="description" content="${escapeHtml(metadata.description)}" />
  <link rel="canonical" href="${metadata.url}" />
  <meta http-equiv="refresh" content="0; url=${baseUrl}/s/${job.id}" />
  
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #0E2F56 0%, #1a4a7e 100%); margin: 0; padding: 20px; }
    .container { background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); padding: 40px; max-width: 600px; text-align: center; }
    h1 { color: #0E2F56; margin: 0 0 10px 0; }
    p { color: #666; margin: 10px 0; }
    .company { font-weight: 600; color: #0E2F56; font-size: 18px; }
    .cta { display: inline-block; background: #0E2F56; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(job.title)}</h1>
    <p class="company">${escapeHtml(metadata.company)}</p>
    <p>${escapeHtml(metadata.description)}</p>
    <a href="${baseUrl}/s/${job.id}" class="cta">Voir l'offre</a>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}