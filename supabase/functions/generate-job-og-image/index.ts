import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Dynamic resvg-wasm loading to avoid BOOT_ERROR
let Resvg: any;
let wasmInitialized = false;

async function ensureWasm() {
  if (wasmInitialized) return;
  const resvgModule = await import("https://esm.sh/@resvg/resvg-wasm@2.6.2");
  Resvg = resvgModule.Resvg;
  const wasmUrl = "https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm";
  const wasmResp = await fetch(wasmUrl);
  const wasmBytes = await wasmResp.arrayBuffer();
  await resvgModule.initWasm(wasmBytes);
  wasmInitialized = true;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const contentType = res.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(text: string, max: number): string {
  if (!text) return "";
  return text.length > max ? text.substring(0, max - 3) + "..." : text;
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
    if (lines.length >= 2) break;
  }
  if (current && lines.length < 2) lines.push(current.trim());
  return lines;
}

function generateSvg(params: {
  title: string;
  company: string;
  location: string;
  contractType: string;
  sector: string;
  isUrgent: boolean;
  isFeatured: boolean;
  logoBase64: string | null;
  siteName: string;
  siteUrl: string;
}): string {
  const { title, company, location, contractType, sector, isUrgent, isFeatured, logoBase64, siteName, siteUrl } = params;

  const titleUpper = escapeXml(truncate(title.toUpperCase(), 65));
  const titleLines = wrapText(titleUpper, 28);
  const titleLine1 = titleLines[0] || "";
  const titleLine2 = titleLines[1] || "";
  const companyShort = escapeXml(truncate(company, 40));
  const locationShort = escapeXml(truncate(location, 30));
  const contractShort = escapeXml(truncate(contractType, 20));
  const sectorShort = escapeXml(truncate(sector, 30));
  const experienceLabel = sector ? sectorShort : "";

  // Dynamic title font size based on length
  const titleFontSize = titleUpper.length <= 25 ? 56 : titleUpper.length <= 40 ? 48 : 40;
  // Y positions depend on whether title wraps to 2 lines
  const hasLine2 = !!titleLine2;
  const titleY1 = hasLine2 ? 230 : 255;
  const titleY2 = titleY1 + titleFontSize + 10;
  const companyY = hasLine2 ? titleY2 + 20 : titleY1 + 55;
  const tagsY = companyY + 60;

  const logoEl = logoBase64
    ? `<image href="${logoBase64}" x="880" y="48" width="270" height="80" preserveAspectRatio="xMaxYMid meet" />`
    : "";

  const urgentBadge = isUrgent
    ? `<rect x="60" y="148" width="130" height="38" rx="19" fill="#ef4444"/>
       <text x="125" y="173" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">⚡ URGENT</text>`
    : "";

  const featuredBadge = isFeatured
    ? `<rect x="${isUrgent ? "205" : "60"}" y="148" width="140" height="38" rx="19" fill="#f59e0b"/>
       <text x="${isUrgent ? "275" : "130"}" y="173" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">★ EN VEDETTE</text>`
    : "";

  // Build detail tags
  const tags: string[] = [];
  if (locationShort) tags.push(locationShort);
  if (contractShort) tags.push(contractShort);
  if (experienceLabel) tags.push(experienceLabel);

  let tagsSvg = "";
  let tagX = 80;
  for (const tag of tags) {
    const tagWidth = tag.length * 12 + 36;
    tagsSvg += `
      <rect x="${tagX}" y="${tagsY}" width="${tagWidth}" height="42" rx="21" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
      <text x="${tagX + tagWidth / 2}" y="${tagsY + 27}" font-family="Arial, Helvetica, sans-serif" font-size="18" fill="rgba(255,255,255,0.9)" text-anchor="middle">${tag}</text>`;
    tagX += tagWidth + 16;
  }

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1a0533"/>
      <stop offset="40%" stop-color="#2d1b69"/>
      <stop offset="70%" stop-color="#4c1d95"/>
      <stop offset="100%" stop-color="#7c3aed"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="550" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="rgba(255,255,255,0.10)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.04)"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGrad)"/>

  <!-- Decorative circles -->
  <circle cx="1100" cy="80" r="250" fill="rgba(124,58,237,0.25)"/>
  <circle cx="100" cy="580" r="300" fill="rgba(139,92,246,0.15)"/>

  <!-- Inner card -->
  <rect x="40" y="35" width="1120" height="560" rx="24" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>

  <!-- Gold accent bar left -->
  <rect x="40" y="35" width="6" height="560" rx="3" fill="url(#goldGrad)"/>

  ${logoEl}
  ${urgentBadge}
  ${featuredBadge}

  <!-- Header: AVIS DE RECRUTEMENT -->
  <rect x="80" y="65" width="5" height="32" rx="2" fill="#fbbf24"/>
  <text x="100" y="92" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="bold" fill="#fbbf24" letter-spacing="2">AVIS DE RECRUTEMENT</text>

  <!-- Separator line -->
  <rect x="80" y="120" width="1040" height="1" fill="rgba(255,255,255,0.12)"/>

  <!-- Job Title (UPPERCASE, large) -->
  <text x="80" y="${titleY1}" font-family="Arial, Helvetica, sans-serif" font-size="${titleFontSize}" font-weight="bold" fill="white">${titleLine1}</text>
  ${hasLine2 ? `<text x="80" y="${titleY2}" font-family="Arial, Helvetica, sans-serif" font-size="${titleFontSize}" font-weight="bold" fill="white">${titleLine2}</text>` : ""}

  <!-- Company name -->
  <text x="80" y="${companyY}" font-family="Arial, Helvetica, sans-serif" font-size="32" fill="rgba(255,255,255,0.85)" font-weight="600">${companyShort}</text>

  <!-- Detail tags (pills) -->
  ${tagsSvg}

  <!-- Bottom separator -->
  <rect x="80" y="500" width="1040" height="1" fill="rgba(255,255,255,0.12)"/>

  <!-- CTA -->
  <text x="80" y="548" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="bold" fill="#fbbf24">Postulez via JobGuinée!</text>

  <!-- URL -->
  <text x="1120" y="548" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="rgba(255,255,255,0.4)" text-anchor="end">jobguinee-pro.com</text>

  <!-- Bottom accent bar -->
  <rect x="40" y="589" width="1120" height="6" rx="3" fill="url(#goldGrad)"/>
</svg>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get("job_id") || (await req.json().catch(() => ({}))).job_id;

    if (!jobId) {
      return new Response(JSON.stringify({ error: "job_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, location, contract_type, sector, is_urgent, is_featured, company_logo_url, partner_logo_url, use_profile_logo, company_id, company_name")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let companyName = (job as any).company_name || "";
    let logoUrl: string | null = null;

    if (!companyName && job.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("name, logo_url")
        .eq("id", job.company_id)
        .maybeSingle();
      if (company) {
        companyName = company.name || "";
        if (job.use_profile_logo) logoUrl = company.logo_url;
      }
    }

    if (!logoUrl) {
      logoUrl = job.company_logo_url || job.partner_logo_url || null;
    }

    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["site_name", "site_url", "site_logo_url"]);

    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((s: { key: string; value: string }) => {
      settingsMap[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
    });

    const siteName = settingsMap["site_name"] || "JobGuinée";
    const siteUrl = settingsMap["site_url"] || "jobguinee.com";
    const siteLogoPath = settingsMap["site_logo_url"] || null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const appOrigin = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;

    let resolvedLogoUrl: string | null = logoUrl;
    if (!resolvedLogoUrl && siteLogoPath) {
      resolvedLogoUrl = siteLogoPath.startsWith("http") ? siteLogoPath : `${appOrigin}${siteLogoPath}`;
    }

    const logoBase64 = resolvedLogoUrl ? await fetchImageAsBase64(resolvedLogoUrl) : null;

    const svg = generateSvg({
      title: job.title || "Offre d'emploi",
      company: companyName,
      location: job.location || "",
      contractType: job.contract_type || "",
      sector: job.sector || "",
      isUrgent: job.is_urgent || false,
      isFeatured: job.is_featured || false,
      logoBase64,
      siteName,
      siteUrl: siteUrl.replace(/^https?:\/\//, ""),
    });

    await ensureWasm();
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    const fileName = `jobs/${jobId}.png`;
    const { error: uploadError } = await supabase.storage
      .from("og-images")
      .upload(fileName, pngBuffer, {
        contentType: "image/png",
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadError) {
      return new Response(JSON.stringify({ error: "Upload failed", details: uploadError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrl } = supabase.storage
      .from("og-images")
      .getPublicUrl(fileName);

    await supabase
      .from("jobs")
      .update({ og_image_url: publicUrl.publicUrl })
      .eq("id", jobId);

    return new Response(
      JSON.stringify({ success: true, url: publicUrl.publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
