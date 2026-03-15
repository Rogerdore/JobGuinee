import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Dynamic resvg-wasm loading to avoid BOOT_ERROR
let Resvg: any;
let wasmInitialized = false;
let fontBuffers: Uint8Array[] = [];

async function ensureWasm() {
  if (wasmInitialized) return;
  const resvgModule = await import("https://esm.sh/@resvg/resvg-wasm@2.6.2");
  Resvg = resvgModule.Resvg;
  const wasmUrl = "https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm";
  const wasmResp = await fetch(wasmUrl);
  const wasmBytes = await wasmResp.arrayBuffer();
  await resvgModule.initWasm(wasmBytes);

  // Load Inter font (Regular + Bold) in TTF format for resvg text rendering
  const [regularResp, boldResp] = await Promise.all([
    fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf"),
    fetch("https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf"),
  ]);
  const [regularBuf, boldBuf] = await Promise.all([
    regularResp.arrayBuffer(),
    boldResp.arrayBuffer(),
  ]);
  fontBuffers = [new Uint8Array(regularBuf), new Uint8Array(boldBuf)];

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
  experienceLevel: string;
  educationLevel: string;
  salaryRange: string;
  deadline: string;
  isUrgent: boolean;
  isFeatured: boolean;
  companyLogoBase64: string | null;
  siteLogoBase64: string | null;
}): string {
  const {
    title, company, location, contractType, sector,
    experienceLevel, educationLevel, salaryRange, deadline,
    isUrgent, isFeatured, companyLogoBase64, siteLogoBase64,
  } = params;

  const F = "Inter, sans-serif";
  const titleUpper = escapeXml(truncate(title.toUpperCase(), 60));
  const titleLines = wrapText(titleUpper, 30);
  const titleLine1 = titleLines[0] || "";
  const titleLine2 = titleLines[1] || "";
  const companyShort = escapeXml(truncate(company, 35));
  const locationShort = escapeXml(truncate(location, 25));
  const contractShort = escapeXml(truncate(contractType, 18));
  const sectorShort = escapeXml(truncate(sector, 25));
  const expShort = escapeXml(truncate(experienceLevel, 18));
  const eduShort = escapeXml(truncate(educationLevel, 20));
  const salaryShort = escapeXml(truncate(salaryRange, 25));

  // Format deadline
  let deadlineStr = "";
  if (deadline) {
    try {
      const d = new Date(deadline);
      deadlineStr = escapeXml(`Avant le ${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`);
    } catch { /* ignore */ }
  }

  // Dynamic title sizing
  const titleFontSize = titleUpper.length <= 22 ? 46 : titleUpper.length <= 35 ? 40 : 34;
  const hasLine2 = !!titleLine2;

  // Layout constants
  const headerH = 80;
  const titleStartY = 180;
  const titleY1 = titleStartY;
  const titleY2 = titleY1 + titleFontSize + 8;
  const afterTitleY = hasLine2 ? titleY2 + 16 : titleY1 + 16;

  // Company row Y (logo + name)
  const companyRowY = afterTitleY + 10;
  const companyLogoSize = 44;
  const companyTextX = companyLogoBase64 ? 140 : 90;

  // Info cards row
  const cardsY = companyRowY + companyLogoSize + 20;

  // Build info pills
  const pills: { icon: string; text: string; color: string; bg: string }[] = [];
  if (locationShort) pills.push({ icon: "\uD83D\uDCCD", text: locationShort, color: "#0891b2", bg: "#ecfeff" });
  if (contractShort) pills.push({ icon: "\uD83D\uDCBC", text: contractShort, color: "#2563eb", bg: "#eff6ff" });
  if (expShort) pills.push({ icon: "\u2B50", text: expShort, color: "#7c3aed", bg: "#f5f3ff" });
  if (eduShort) pills.push({ icon: "\uD83C\uDF93", text: eduShort, color: "#4f46e5", bg: "#eef2ff" });
  if (sectorShort) pills.push({ icon: "\uD83C\uDFE2", text: sectorShort, color: "#059669", bg: "#ecfdf5" });

  // Render pills as claymorphism mini-cards (2 rows if needed)
  let pillsSvg = "";
  let pX = 90;
  let pY = cardsY;
  const pillH = 40;
  const pillGap = 12;
  const maxRowWidth = 1020;

  for (const pill of pills) {
    const textW = pill.text.length * 9.5 + 44;
    const pw = Math.max(textW, 80);
    if (pX + pw > maxRowWidth + 90) {
      pX = 90;
      pY += pillH + pillGap;
    }
    pillsSvg += `
      <rect x="${pX}" y="${pY}" width="${pw}" height="${pillH}" rx="12" fill="${pill.bg}" />
      <rect x="${pX}" y="${pY}" width="${pw}" height="${pillH}" rx="12" fill="white" opacity="0.5" />
      <text x="${pX + pw / 2}" y="${pY + 26}" font-family="${F}" font-size="15" font-weight="600" fill="${pill.color}" text-anchor="middle">${pill.text}</text>`;
    pX += pw + pillGap;
  }

  // Salary section
  const salaryY = pY + pillH + 28;
  let salarySvg = "";
  if (salaryShort) {
    salarySvg = `
      <rect x="90" y="${salaryY}" width="${salaryShort.length * 11 + 60}" height="44" rx="14" fill="#FFF7ED" />
      <rect x="90" y="${salaryY}" width="${salaryShort.length * 11 + 60}" height="44" rx="14" fill="white" opacity="0.4" />
      <text x="120" y="${salaryY + 29}" font-family="${F}" font-size="18" font-weight="bold" fill="#ea580c">${salaryShort}</text>`;
  }

  // Deadline
  const deadlineY = salaryY + (salaryShort ? 56 : 0);
  let deadlineSvg = "";
  if (deadlineStr) {
    deadlineSvg = `
      <text x="90" y="${deadlineY + 20}" font-family="${F}" font-size="15" fill="#dc2626" font-weight="600">${deadlineStr}</text>`;
  }

  // Badges (URGENT / EN VEDETTE)
  let badgesSvg = "";
  let bX = 850;
  if (isUrgent) {
    badgesSvg += `
      <rect x="${bX}" y="145" width="130" height="36" rx="18" fill="#ef4444" />
      <text x="${bX + 65}" y="169" font-family="${F}" font-size="14" font-weight="bold" fill="white" text-anchor="middle">URGENT</text>`;
    bX += 142;
  }
  if (isFeatured) {
    badgesSvg += `
      <rect x="${bX}" y="145" width="150" height="36" rx="18" fill="#f59e0b" />
      <text x="${bX + 75}" y="169" font-family="${F}" font-size="14" font-weight="bold" fill="white" text-anchor="middle">EN VEDETTE</text>`;
  }

  // Site logo
  const siteLogoSvg = siteLogoBase64
    ? `<image href="${siteLogoBase64}" x="60" y="24" width="180" height="50" preserveAspectRatio="xMinYMid meet" />`
    : `<text x="60" y="60" font-family="${F}" font-size="26" font-weight="bold" fill="#1e1b4b">JobGuin&#233;e</text>`;

  // Company logo next to name
  const companyLogoSvg = companyLogoBase64
    ? `<rect x="86" y="${companyRowY - 2}" width="${companyLogoSize + 4}" height="${companyLogoSize + 4}" rx="12" fill="white" />
       <image href="${companyLogoBase64}" x="88" y="${companyRowY}" width="${companyLogoSize}" height="${companyLogoSize}" preserveAspectRatio="xMidYMid meet" clip-path="inset(0 round 10px)" />`
    : "";

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ddd6fe"/>
      <stop offset="35%" stop-color="#c4b5fd"/>
      <stop offset="65%" stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="white" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="white" stop-opacity="0.6"/>
    </linearGradient>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
    <linearGradient id="ctaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
    <filter id="cardShadow" x="-4%" y="-4%" width="108%" height="112%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#7c3aed" flood-opacity="0.18"/>
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.06"/>
    </filter>
    <filter id="pillShadow" x="-8%" y="-15%" width="116%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#7c3aed" flood-opacity="0.12"/>
    </filter>
    <filter id="topShadow" x="-2%" y="-5%" width="104%" height="115%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Background gradient -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Decorative blobs (soft 3D feel) -->
  <circle cx="1050" cy="100" r="200" fill="#c084fc" opacity="0.3"/>
  <circle cx="150" cy="550" r="250" fill="#818cf8" opacity="0.2"/>
  <circle cx="600" cy="650" r="180" fill="#a78bfa" opacity="0.15"/>
  <ellipse cx="1100" cy="500" rx="120" ry="80" fill="#f0abfc" opacity="0.2"/>

  <!-- Main card (claymorphism: white, rounded, soft shadow) -->
  <rect x="40" y="14" width="1120" height="602" rx="32" fill="url(#shine)" filter="url(#cardShadow)" />
  <rect x="40" y="14" width="1120" height="602" rx="32" fill="white" opacity="0.88" />

  <!-- TOP BAR: purple header strip -->
  <rect x="40" y="14" width="1120" height="${headerH}" rx="32" fill="url(#headerGrad)"/>
  <rect x="40" y="54" width="1120" height="40" fill="url(#headerGrad)"/>

  <!-- Site logo (JobGuinee) in header -->
  ${siteLogoSvg}

  <!-- "AVIS DE RECRUTEMENT" header text -->
  <text x="1120" y="62" font-family="${F}" font-size="18" font-weight="bold" fill="rgba(255,255,255,0.9)" text-anchor="end" letter-spacing="3">AVIS DE RECRUTEMENT</text>

  <!-- Badges -->
  ${badgesSvg}

  <!-- ============ CONTENT AREA ============ -->

  <!-- Job Title -->
  <text x="90" y="${titleY1}" font-family="${F}" font-size="${titleFontSize}" font-weight="bold" fill="#1e1b4b">${titleLine1}</text>
  ${hasLine2 ? `<text x="90" y="${titleY2}" font-family="${F}" font-size="${titleFontSize}" font-weight="bold" fill="#1e1b4b">${titleLine2}</text>` : ""}

  <!-- Company row: logo + name -->
  ${companyLogoSvg}
  <text x="${companyTextX}" y="${companyRowY + 30}" font-family="${F}" font-size="24" fill="#4b5563" font-weight="600">${companyShort}</text>

  <!-- Info pills (claymorphism mini cards) -->
  <g filter="url(#pillShadow)">
    ${pillsSvg}
  </g>

  <!-- Salary -->
  ${salarySvg}

  <!-- Deadline -->
  ${deadlineSvg}

  <!-- ============ BOTTOM BAR ============ -->
  <!-- CTA button -->
  <rect x="90" y="545" width="340" height="52" rx="26" fill="url(#ctaGrad)" filter="url(#topShadow)" />
  <text x="260" y="578" font-family="${F}" font-size="20" font-weight="bold" fill="white" text-anchor="middle">Postulez via JobGuin&#233;e!</text>

  <!-- URL -->
  <text x="1120" y="578" font-family="${F}" font-size="17" fill="#6b7280" text-anchor="end">jobguinee-pro.com</text>

  <!-- Bottom accent line -->
  <rect x="40" y="608" width="1120" height="8" rx="4" fill="url(#ctaGrad)" opacity="0.7"/>
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
      .select("id, title, location, contract_type, sector, experience_level, education_level, salary_range, deadline, is_urgent, is_featured, company_logo_url, partner_logo_url, use_profile_logo, company_id, company_name")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let companyName = (job as any).company_name || "";
    let companyLogoUrl: string | null = null;

    if (!companyName && job.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("name, logo_url")
        .eq("id", job.company_id)
        .maybeSingle();
      if (company) {
        companyName = company.name || "";
        companyLogoUrl = company.logo_url || null;
      }
    }

    if (!companyLogoUrl) {
      companyLogoUrl = job.company_logo_url || job.partner_logo_url || null;
    }

    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["site_name", "site_url", "site_logo_url"]);

    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((s: { key: string; value: string }) => {
      settingsMap[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
    });

    const siteUrl = settingsMap["site_url"] || "jobguinee.com";
    const siteLogoPath = settingsMap["site_logo_url"] || null;
    const appOrigin = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;

    // Resolve site logo URL
    let siteLogoUrl: string | null = null;
    if (siteLogoPath) {
      siteLogoUrl = siteLogoPath.startsWith("http") ? siteLogoPath : `${appOrigin}${siteLogoPath}`;
    }

    // Fetch both logos in parallel
    const [companyLogoBase64, siteLogoBase64] = await Promise.all([
      companyLogoUrl ? fetchImageAsBase64(companyLogoUrl) : Promise.resolve(null),
      siteLogoUrl ? fetchImageAsBase64(siteLogoUrl) : Promise.resolve(null),
    ]);

    const svg = generateSvg({
      title: job.title || "Offre d'emploi",
      company: companyName,
      location: job.location || "",
      contractType: job.contract_type || "",
      sector: job.sector || "",
      experienceLevel: (job as any).experience_level || "",
      educationLevel: (job as any).education_level || "",
      salaryRange: (job as any).salary_range || "",
      deadline: (job as any).deadline || "",
      isUrgent: job.is_urgent || false,
      isFeatured: job.is_featured || false,
      companyLogoBase64,
      siteLogoBase64,
    });

    await ensureWasm();
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
      font: {
        fontBuffers,
        defaultFontFamily: "Inter",
      },
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
