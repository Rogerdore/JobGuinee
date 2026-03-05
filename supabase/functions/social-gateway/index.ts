import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CRAWLER_AGENTS = [
  "facebookexternalhit",
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
];

function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return CRAWLER_AGENTS.some((bot) => ua.includes(bot));
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function ensureOgImage(supabase: ReturnType<typeof createClient>, jobId: string, supabaseUrl: string): Promise<string | null> {
  const { data: job } = await supabase
    .from("jobs")
    .select("og_image_url")
    .eq("id", jobId)
    .maybeSingle();

  if (job?.og_image_url) {
    try {
      const check = await fetch(job.og_image_url, { method: "HEAD" });
      if (check.ok) return job.og_image_url;
    } catch {
      // fall through to regenerate
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

  await supabase.from("jobs").update({ og_image_url: publicUrl.publicUrl }).eq("id", jobId);

  return publicUrl.publicUrl;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get("job_id");
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
      .select("id, title, location, contract_type, sector, description, company_id, og_image_url")
      .eq("id", jobId)
      .maybeSingle();

    if (!job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let companyName = "";
    if (job.company_id) {
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

    const titleEscaped = escapeHtml(job.title || "Offre d'emploi");
    const descRaw = `${companyName ? companyName + " • " : ""}${job.location || ""} • ${job.contract_type || ""} — ${(job.description || "").substring(0, 120)}...`;
    const descEscaped = escapeHtml(descRaw);
    const siteNameEscaped = escapeHtml(siteName);

    if (!isCrawler(userAgent)) {
      return new Response(
        JSON.stringify({ redirect: jobUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ogImageUrl = await ensureOgImage(supabase, jobId, supabaseUrl);

    const ogImageTag = ogImageUrl
      ? `<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:type" content="image/png" />
    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />`
      : "";

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(jobUrl)}" />
  <title>${titleEscaped} — ${siteNameEscaped}</title>

  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(jobUrl)}" />
  <meta property="og:title" content="${titleEscaped}" />
  <meta property="og:description" content="${descEscaped}" />
  <meta property="og:site_name" content="${siteNameEscaped}" />
  ${ogImageTag}

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${titleEscaped}" />
  <meta name="twitter:description" content="${descEscaped}" />

  <link rel="canonical" href="${escapeHtml(jobUrl)}" />
</head>
<body>
  <p>Redirection en cours vers <a href="${escapeHtml(jobUrl)}">${titleEscaped}</a>...</p>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
