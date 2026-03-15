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

function wrapText(text: string, maxChars: number, maxLines = 2): string[] {
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
    if (lines.length >= maxLines) break;
  }
  if (current && lines.length < maxLines) lines.push(current.trim());
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

  const W = 1080;
  const H = 1080;
  const CX = W / 2; // center X = 540
  const F = "Inter, sans-serif";

  const companyShort = escapeXml(truncate(company, 38));
  const titleText = escapeXml(truncate(title, 70));
  const titleLines = wrapText(titleText, 26, 3);
  const locationShort = escapeXml(truncate(location, 25));
  const contractShort = escapeXml(truncate(contractType, 20));
  const sectorShort = escapeXml(truncate(sector, 28));
  const expShort = escapeXml(truncate(experienceLevel, 20));
  const eduShort = escapeXml(truncate(educationLevel, 22));
  const salaryShort = escapeXml(truncate(salaryRange, 28));

  let deadlineStr = "";
  if (deadline) {
    try {
      const d = new Date(deadline);
      deadlineStr = escapeXml(`Date limite : ${d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}`);
    } catch { /* ignore */ }
  }

  // === SECTION 1: Top — "Avis de recrutement" (Y ~60-90) ===
  const avisY = 72;

  // === SECTION 2: Company logo + name (Y ~120-190) ===
  const companyY = 145;
  const logoSize = 56;
  const companyLogoSvg = companyLogoBase64
    ? `<rect x="${CX - 160}" y="${companyY - 4}" width="${logoSize + 8}" height="${logoSize + 8}" rx="16" fill="white" />
       <image href="${companyLogoBase64}" x="${CX - 156}" y="${companyY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" />`
    : "";
  const companyNameX = companyLogoBase64 ? CX - 160 + logoSize + 20 : CX;
  const companyNameAnchor = companyLogoBase64 ? "start" : "middle";
  const companyNameY = companyLogoBase64 ? companyY + 37 : companyY + 30;

  // === SECTION 3: "recherche un(e)" (Y ~210) ===
  const rechercheY = 222;

  // === SECTION 4: Title card 3D (Y ~250-430) ===
  const titleCardY = 255;
  const titleFontSize = titleLines.length <= 1 && titleText.length <= 20 ? 42
    : titleLines.length <= 1 ? 36
    : titleLines.length <= 2 ? 34
    : 30;
  const lineH = titleFontSize + 10;
  const titleCardH = Math.max(titleLines.length * lineH + 40, 90);
  const titleCardW = 900;
  const titleCardX = (W - titleCardW) / 2;

  let titleSvg = "";
  titleLines.forEach((line, i) => {
    const ty = titleCardY + 45 + i * lineH;
    titleSvg += `<text x="${CX}" y="${ty}" font-family="${F}" font-size="${titleFontSize}" font-weight="bold" fill="white" text-anchor="middle">${line}</text>`;
  });

  // === SECTION 5: Info items (Y after title card, ~460+) ===
  const infoStartY = titleCardY + titleCardH + 30;
  const infos: { label: string; value: string }[] = [];
  if (locationShort) infos.push({ label: "Lieu", value: locationShort });
  if (contractShort) infos.push({ label: "Contrat", value: contractShort });
  if (expShort) infos.push({ label: "Exp&#233;rience", value: expShort });
  if (eduShort) infos.push({ label: "Niveau", value: eduShort });
  if (sectorShort) infos.push({ label: "Secteur", value: sectorShort });
  if (salaryShort) infos.push({ label: "Salaire", value: salaryShort });

  // Render info as 2-column grid, centered
  const colW = 420;
  const rowH = 52;
  const gridX1 = CX - colW - 10;
  const gridX2 = CX + 10;
  let infoSvg = "";
  infos.forEach((info, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? gridX1 : gridX2;
    const y = infoStartY + row * rowH;
    const cardW = colW;
    infoSvg += `
      <rect x="${x}" y="${y}" width="${cardW}" height="42" rx="12" fill="white" opacity="0.7" />
      <text x="${x + 16}" y="${y + 27}" font-family="${F}" font-size="14" fill="#6b7280" font-weight="600">${info.label}</text>
      <text x="${x + cardW - 16}" y="${y + 27}" font-family="${F}" font-size="15" fill="#1e1b4b" font-weight="bold" text-anchor="end">${info.value}</text>`;
  });

  const infoRows = Math.ceil(infos.length / 2);
  const afterInfoY = infoStartY + infoRows * rowH + 10;

  // Deadline
  let deadlineSvg = "";
  if (deadlineStr) {
    deadlineSvg = `<text x="${CX}" y="${afterInfoY + 16}" font-family="${F}" font-size="15" fill="#dc2626" font-weight="600" text-anchor="middle">${deadlineStr}</text>`;
  }

  // Badges URGENT / EN VEDETTE (top-right area)
  let badgesSvg = "";
  let bX = W - 80;
  if (isFeatured) {
    const bw = 150;
    bX -= bw;
    badgesSvg += `
      <rect x="${bX}" y="52" width="${bw}" height="34" rx="17" fill="#f59e0b" />
      <text x="${bX + bw / 2}" y="74" font-family="${F}" font-size="13" font-weight="bold" fill="white" text-anchor="middle">EN VEDETTE</text>`;
    bX -= 8;
  }
  if (isUrgent) {
    const bw = 120;
    bX -= bw;
    badgesSvg += `
      <rect x="${bX}" y="52" width="${bw}" height="34" rx="17" fill="#ef4444" />
      <text x="${bX + bw / 2}" y="74" font-family="${F}" font-size="13" font-weight="bold" fill="white" text-anchor="middle">URGENT</text>`;
  }

  // Site logo
  const siteLogoSvg = siteLogoBase64
    ? `<image href="${siteLogoBase64}" x="${CX - 80}" y="10" width="160" height="42" preserveAspectRatio="xMidYMid meet" />`
    : "";

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ede9fe"/>
      <stop offset="30%" stop-color="#ddd6fe"/>
      <stop offset="60%" stop-color="#c4b5fd"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#6d28d9"/>
    </linearGradient>
    <linearGradient id="ctaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
    <filter id="card3d" x="-5%" y="-5%" width="110%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#7c3aed" flood-opacity="0.25"/>
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.08"/>
    </filter>
    <filter id="softShadow" x="-3%" y="-5%" width="106%" height="115%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#7c3aed" flood-opacity="0.15"/>
    </filter>
    <filter id="btnShadow" x="-5%" y="-10%" width="110%" height="130%">
      <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#7c3aed" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Decorative blobs -->
  <circle cx="900" cy="120" r="180" fill="#c4b5fd" opacity="0.35"/>
  <circle cx="180" cy="950" r="200" fill="#a78bfa" opacity="0.25"/>
  <circle cx="540" cy="1100" r="120" fill="#ddd6fe" opacity="0.3"/>
  <ellipse cx="950" cy="800" rx="100" ry="70" fill="#e9d5ff" opacity="0.3"/>

  <!-- Main white card -->
  <rect x="40" y="40" width="1000" height="1000" rx="36" fill="white" opacity="0.92" filter="url(#softShadow)" />

  <!-- Site logo centered at very top -->
  ${siteLogoSvg}

  <!-- "Avis de recrutement" centered, lowercase -->
  <text x="${CX}" y="${avisY}" font-family="${F}" font-size="22" fill="#6b7280" text-anchor="middle" letter-spacing="1">Avis de recrutement</text>

  <!-- Thin separator -->
  <rect x="${CX - 60}" y="${avisY + 12}" width="120" height="2" rx="1" fill="#c4b5fd" />

  ${badgesSvg}

  <!-- Company logo + name -->
  ${companyLogoSvg}
  <text x="${companyNameX}" y="${companyNameY}" font-family="${F}" font-size="26" fill="#1e1b4b" font-weight="bold" text-anchor="${companyNameAnchor}">${companyShort}</text>

  <!-- "recherche un(e)" -->
  <text x="${CX}" y="${rechercheY}" font-family="${F}" font-size="20" fill="#6b7280" text-anchor="middle" font-weight="400">recherche un(e)</text>

  <!-- Title Card (3D soft, rounded) -->
  <rect x="${titleCardX}" y="${titleCardY}" width="${titleCardW}" height="${titleCardH}" rx="24" fill="url(#titleGrad)" filter="url(#card3d)" />
  <!-- Inner highlight for 3D effect -->
  <rect x="${titleCardX + 2}" y="${titleCardY + 2}" width="${titleCardW - 4}" height="${Math.floor(titleCardH / 2)}" rx="22" fill="white" opacity="0.08" />
  ${titleSvg}

  <!-- Info grid -->
  <g filter="url(#softShadow)">
    ${infoSvg}
  </g>

  <!-- Deadline -->
  ${deadlineSvg}

  <!-- ===== BOTTOM SECTION ===== -->
  <!-- CTA button -->
  <rect x="${CX - 230}" y="940" width="460" height="54" rx="27" fill="url(#ctaGrad)" filter="url(#btnShadow)" />
  <text x="${CX}" y="974" font-family="${F}" font-size="19" font-weight="bold" fill="white" text-anchor="middle">Postulez directement via JobGuin&#233;e</text>

  <!-- Site URL -->
  <text x="${CX}" y="1020" font-family="${F}" font-size="16" fill="#7c3aed" text-anchor="middle" font-weight="600">www.jobguinee-pro.com</text>

  <!-- Bottom accent -->
  <rect x="40" y="1046" width="1000" height="6" rx="3" fill="#a78bfa" opacity="0.5"/>
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
      fitTo: { mode: "width", value: 1080 },
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
