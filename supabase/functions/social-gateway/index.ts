import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CRAWLER_AGENTS = [
  "facebookexternalhit",
  "facebot",
  "linkedinbot",
  "twitterbot",
  "whatsapp",
  "telegrambot",
  "slackbot",
  "discordbot",
  "googlebot",
  "bingbot",
  "applebot",
  "pinterest",
  "vkshare",
  "w3c_validator",
  "redditbot",
  "ia_archiver",
  "embedly",
  "quora link preview",
  "showyoubot",
  "outbrain",
  "rogerbot",
  "bufferbot",
  "bitlybot",
];

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return CRAWLER_AGENTS.some((bot) => ua.includes(bot));
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function generateJobCardDescription(job: Record<string, any>, companyName: string): string {
  const title = job.title || "Offre d'emploi";
  const location = job.location || "";
  const domain = job.sector || "le domaine concerné";

  const expLevel: string = job.experience_level || "";
  const experienceMatch = expLevel ? expLevel.match(/(\d+)/) : null;
  const experienceYears = experienceMatch ? experienceMatch[1] : null;

  const allSkills: string[] = Array.isArray(job.keywords) ? job.keywords : [];
  const topSkills = allSkills.slice(0, 5);

  const parts: string[] = [];
  if (location) {
    parts.push(`Nous recrutons un(e) ${title} à ${location}.`);
  } else {
    parts.push(`Nous recrutons un(e) ${title}.`);
  }
  if (experienceYears) {
    parts.push(`Profil recherché : minimum ${experienceYears} ans d'expérience en ${domain}.`);
  }
  if (topSkills.length > 0) {
    parts.push(`Compétences clés : ${topSkills.join(", ")}.`);
  }
  parts.push("Consultez l'offre sur JobGuinee.");

  const full = parts.join(" ");
  return full.length > 200 ? full.substring(0, 197) + "..." : full;
}

async function ensureOgImage(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  supabaseUrl: string
): Promise<string | null> {
  const { data: job } = await supabase
    .from("jobs")
    .select("og_image_url, featured_image_url, company_logo_url")
    .eq("id", jobId)
    .maybeSingle();

  if (job?.og_image_url) {
    try {
      const check = await fetch(job.og_image_url, { method: "HEAD" });
      if (check.ok) return job.og_image_url;
    } catch {
      // fall through
    }
  }

  if (job?.featured_image_url) {
    try {
      const check = await fetch(job.featured_image_url, { method: "HEAD" });
      if (check.ok) return job.featured_image_url;
    } catch {
      // fall through
    }
  }

  if (job?.company_logo_url) {
    try {
      const check = await fetch(job.company_logo_url, { method: "HEAD" });
      if (check.ok) return job.company_logo_url;
    } catch {
      // fall through
    }
  }

  const { data: files } = await supabase.storage
    .from("og-images")
    .list("jobs", { search: `${jobId}.png` });

  const exists = files && files.some((f: { name: string }) => f.name === `${jobId}.png`);

  if (!exists) {
    try {
      const genUrl = `${supabaseUrl}/functions/v1/generate-job-og-image?job_id=${jobId}`;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const res = await fetch(genUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const body = await res.json();
        return body.url || null;
      }
    } catch {
      return null;
    }
  }

  const { data: publicUrl } = supabase.storage
    .from("og-images")
    .getPublicUrl(`jobs/${jobId}.png`);

  await supabase
    .from("jobs")
    .update({ og_image_url: publicUrl.publicUrl })
    .eq("id", jobId);

  return publicUrl.publicUrl;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const lastPathSegment = pathParts[pathParts.length - 1];
    const jobId = url.searchParams.get("job_id") || (lastPathSegment !== "social-gateway" ? lastPathSegment : null);
    const userAgent = req.headers.get("user-agent") || "";

    if (!jobId) {
      return new Response(JSON.stringify({ error: "job_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: job } = await supabase
      .from("jobs")
      .select("id, title, location, contract_type, sector, description, experience_level, keywords, company_id, company_name, og_image_url, featured_image_url, company_logo_url, is_urgent, is_featured")
      .eq("id", jobId)
      .maybeSingle();

    if (!job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let companyName = (job as any).company_name || "";
    if (!companyName && job.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("id", job.company_id)
        .maybeSingle();
      companyName = company?.name || "";
    }

    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["site_name", "site_url", "site_description"]);

    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((s: { key: string; value: string }) => {
      settingsMap[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
    });

    const siteName = settingsMap["site_name"] || "JobGuinée";
    const rawSiteUrl = settingsMap["site_url"] || "https://jobguinee.com";
    const siteUrl = rawSiteUrl.startsWith("http") ? rawSiteUrl : `https://${rawSiteUrl}`;
    const jobUrl = `${siteUrl}/jobs/${jobId}`;
    const shareUrl = `${siteUrl}/share/${jobId}`;

    const jobTitle = job.title || "Offre d'emploi";
    const titleWithCompany = companyName ? `${jobTitle} – ${companyName}` : jobTitle;

    const description = generateJobCardDescription(job, companyName);

    if (!isCrawler(userAgent)) {
      return new Response(
        JSON.stringify({ redirect: jobUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ogImageUrl = await ensureOgImage(supabase, jobId, supabaseUrl);
    const fallbackImage = `${siteUrl}/logo_jobguinee.png`;
    const finalImage = ogImageUrl || fallbackImage;

    const titleEscaped = escapeHtml(titleWithCompany);
    const descEscaped = escapeHtml(description);
    const siteNameEscaped = escapeHtml(siteName);
    const imageEscaped = escapeHtml(finalImage);
    const jobUrlEscaped = escapeHtml(jobUrl);

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0;url=${jobUrlEscaped}" />
  <title>${titleEscaped} — ${siteNameEscaped}</title>

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${jobUrlEscaped}" />
  <meta property="og:title" content="${titleEscaped}" />
  <meta property="og:description" content="${descEscaped}" />
  <meta property="og:site_name" content="${siteNameEscaped}" />
  <meta property="og:locale" content="fr_GN" />
  <meta property="og:image" content="${imageEscaped}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:alt" content="${titleEscaped}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${titleEscaped}" />
  <meta name="twitter:description" content="${descEscaped}" />
  <meta name="twitter:image" content="${imageEscaped}" />
  <meta name="twitter:image:alt" content="${titleEscaped}" />

  <meta name="description" content="${descEscaped}" />
  <link rel="canonical" href="${jobUrlEscaped}" />
</head>
<body>
  <p>Redirection en cours vers <a href="${jobUrlEscaped}">${titleEscaped}</a>...</p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Vary": "User-Agent",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
