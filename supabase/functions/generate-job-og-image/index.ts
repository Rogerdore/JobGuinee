import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Resvg, initWasm } from "https://esm.sh/@resvg/resvg-wasm@2.6.2";
import * as resvgWasm from "https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

let wasmInitialized = false;

async function ensureWasm() {
  if (!wasmInitialized) {
    await initWasm(resvgWasm);
    wasmInitialized = true;
  }
}

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

  const titleLines = wrapText(truncate(title, 60), 30);
  const titleLine1 = titleLines[0] || "";
  const titleLine2 = titleLines[1] || "";
  const companyShort = truncate(company, 40);
  const locationShort = truncate(location, 35);
  const contractShort = truncate(contractType, 20);
  const sectorShort = truncate(sector, 30);

  const logoEl = logoBase64
    ? `<image href="${logoBase64}" x="900" y="40" width="260" height="100" preserveAspectRatio="xMidYMid meet" />`
    : `<text x="1030" y="105" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#1a56db" text-anchor="middle">${siteName}</text>`;

  const urgentBadge = isUrgent
    ? `<rect x="40" y="40" width="120" height="36" rx="18" fill="#ef4444"/>
       <text x="100" y="64" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">URGENT</text>`
    : "";

  const featuredBadge = isFeatured
    ? `<rect x="${isUrgent ? "175" : "40"}" y="40" width="130" height="36" rx="18" fill="#f59e0b"/>
       <text x="${isUrgent ? "240" : "105"}" y="64" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">★ VEDETTE</text>`
    : "";

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e3a5f;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#1a56db;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:1" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bgGrad)"/>

  <rect x="0" y="0" width="6" height="630" fill="url(#accentGrad)"/>
  <rect x="0" y="590" width="1200" height="6" fill="url(#accentGrad)"/>

  <rect x="40" y="130" width="1120" height="3" fill="#1a56db" opacity="0.4"/>

  ${urgentBadge}
  ${featuredBadge}
  ${logoEl}

  <text x="60" y="${titleLine2 ? "240" : "260"}" font-family="Arial, sans-serif" font-size="62" font-weight="bold" fill="white">${titleLine1}</text>
  ${titleLine2 ? `<text x="60" y="315" font-family="Arial, sans-serif" font-size="62" font-weight="bold" fill="white">${titleLine2}</text>` : ""}

  <text x="60" y="${titleLine2 ? "370" : "330"}" font-family="Arial, sans-serif" font-size="36" fill="#93c5fd" font-weight="600">${companyShort}</text>

  <rect x="60" y="${titleLine2 ? "400" : "360"}" width="1080" height="2" fill="#1e40af" opacity="0.5"/>

  <text x="60" y="${titleLine2 ? "450" : "410"}" font-family="Arial, sans-serif" font-size="28" fill="#cbd5e1">📍 ${locationShort}</text>
  <text x="420" y="${titleLine2 ? "450" : "410"}" font-family="Arial, sans-serif" font-size="28" fill="#cbd5e1">💼 ${contractShort}</text>
  ${sectorShort ? `<text x="760" y="${titleLine2 ? "450" : "410"}" font-family="Arial, sans-serif" font-size="28" fill="#cbd5e1">🏢 ${sectorShort}</text>` : ""}

  <text x="60" y="570" font-family="Arial, sans-serif" font-size="22" fill="#64748b">${siteUrl}</text>
  <text x="1140" y="570" font-family="Arial, sans-serif" font-size="22" fill="#1a56db" text-anchor="end" font-weight="bold">${siteName}</text>
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
      .select("id, title, location, contract_type, sector, is_urgent, is_featured, company_logo_url, partner_logo_url, use_profile_logo, company_id")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let companyName = "";
    let logoUrl: string | null = null;

    if (job.company_id) {
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
