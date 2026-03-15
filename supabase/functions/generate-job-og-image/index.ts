import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Dynamic resvg-wasm loading to avoid BOOT_ERROR
let Resvg: any;
let wasmInitialized = false;
let fontsLoaded = false;
let fontBuffers: Uint8Array[] = [];

async function fetchFontWithFallback(urls: string[]): Promise<ArrayBuffer> {
  for (const url of urls) {
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        if (buf.byteLength > 1000) return buf; // Valid font file
      }
    } catch { /* try next URL */ }
  }
  throw new Error("All font URLs failed: " + urls.join(", "));
}

async function ensureWasm() {
  if (!wasmInitialized) {
    const resvgModule = await import("https://esm.sh/@resvg/resvg-wasm@2.6.2");
    Resvg = resvgModule.Resvg;
    const wasmUrl = "https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm";
    const wasmResp = await fetch(wasmUrl);
    const wasmBytes = await wasmResp.arrayBuffer();
    await resvgModule.initWasm(wasmBytes);
    wasmInitialized = true;
  }

  if (!fontsLoaded) {
    const FONT_REGULAR_URLS = [
      "https://cdn.jsdelivr.net/fontsource/fonts/inter@5.1.1/latin-400-normal.ttf",
      "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf",
      "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2",
    ];
    const FONT_BOLD_URLS = [
      "https://cdn.jsdelivr.net/fontsource/fonts/inter@5.1.1/latin-700-normal.ttf",
      "https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf",
      "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuBWYAZ9hiA.woff2",
    ];

    const [regularBuf, boldBuf] = await Promise.all([
      fetchFontWithFallback(FONT_REGULAR_URLS),
      fetchFontWithFallback(FONT_BOLD_URLS),
    ]);
    fontBuffers = [new Uint8Array(regularBuf), new Uint8Array(boldBuf)];

    if (fontBuffers.length < 2 || fontBuffers[0].byteLength < 1000 || fontBuffers[1].byteLength < 1000) {
      throw new Error(`Font loading failed: regular=${fontBuffers[0]?.byteLength || 0}B, bold=${fontBuffers[1]?.byteLength || 0}B`);
    }
    console.log(`Fonts loaded: regular=${fontBuffers[0].byteLength}B, bold=${fontBuffers[1].byteLength}B`);
    fontsLoaded = true;
  }
}

// Default template config — merged with DB overrides at runtime
const DEFAULT_TEMPLATE = {
  header_gradient_start: "#0f172a",
  header_gradient_end: "#1e3a5f",
  accent_color: "#f97316",
  title_card_start: "#1e3a5f",
  title_card_end: "#2563eb",
  cta_gradient_start: "#f97316",
  cta_gradient_end: "#ea580c",
  cta_text: "Postulez directement via JobGuin\u00e9e",
  footer_url: "www.jobguinee-pro.com",
  background_image_url: "",
  background_blur: 18,
  background_overlay_opacity: 0.75,
  logo_glow_enabled: true,
  logo_glow_color: "#ffffff",
  logo_glow_intensity: 8,
  card_border_radius: 16,
  info_card_columns: 3,
};

type TemplateConfig = typeof DEFAULT_TEMPLATE;

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
  createdAt: string;
  publicationDuration: string;
  positionCount: number;
  positionLevel: string;
  language: string;
  isUrgent: boolean;
  isFeatured: boolean;
  companyLogoBase64: string | null;
  siteLogoBase64: string | null;
  backgroundImageBase64: string | null;
  tpl: TemplateConfig;
}): string {
  const {
    title, company, location, contractType, sector,
    experienceLevel, educationLevel, salaryRange, deadline,
    createdAt, publicationDuration, positionCount, positionLevel, language,
    isUrgent, isFeatured, companyLogoBase64, siteLogoBase64,
    backgroundImageBase64, tpl,
  } = params;

  // ═══ LANDSCAPE FORMAT 1200×630 (Facebook/LinkedIn recommended) ═══
  const W = 1200, H = 630, CX = W / 2, F = "Inter, sans-serif";
  const R = tpl.card_border_radius;

  const companyShort = escapeXml(truncate(company, 40));
  const titleText = escapeXml(truncate(title, 70));
  const titleLines = wrapText(titleText, 50, 2);
  const locationShort = escapeXml(truncate(location, 22));
  const contractShort = escapeXml(truncate(contractType, 18));
  const sectorShort = escapeXml(truncate(sector, 28));
  const expShort = escapeXml(truncate(experienceLevel, 18));
  const eduShort = escapeXml(truncate(educationLevel, 22));
  const salaryShort = escapeXml(truncate(salaryRange, 22));
  const durationShort = escapeXml(truncate(publicationDuration || "30 jours", 15));
  const langShort = escapeXml(truncate(language || "Fran\u00e7ais", 15));
  const levelShort = escapeXml(truncate(positionLevel, 20));
  const postsStr = positionCount > 1 ? `${positionCount} postes` : "";

  const fmtDate = (s: string) => {
    try { return escapeXml(new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })); }
    catch { return ""; }
  };
  const publishedStr = createdAt ? fmtDate(createdAt) : "";
  const deadlineStr = deadline ? fmtDate(deadline) : "";

  // ═══ HEADER (0→80) ═══
  const headerH = 80;

  let siteLogoSvg: string;
  if (siteLogoBase64) {
    const glowFilter = tpl.logo_glow_enabled ? ' filter="url(#logoGlow)"' : '';
    siteLogoSvg = `<image href="${siteLogoBase64}" x="${CX - 130}" y="5" width="260" height="50" preserveAspectRatio="xMidYMid meet"${glowFilter} />`;
  } else {
    siteLogoSvg = `<text x="${CX}" y="40" font-family="${F}" font-size="28" font-weight="bold" fill="white" text-anchor="middle">JobGuin&#233;e</text>`;
  }

  // ═══ BADGES ═══
  let badgesSvg = "";
  let bX = W - 60;
  if (isFeatured) {
    const bw = 130;
    bX -= bw;
    badgesSvg += `<rect x="${bX}" y="${headerH + 6}" width="${bw}" height="24" rx="12" fill="${tpl.accent_color}" /><text x="${bX + bw/2}" y="${headerH + 22}" font-family="${F}" font-size="11" font-weight="bold" fill="white" text-anchor="middle">EN VEDETTE</text>`;
    bX -= 8;
  }
  if (isUrgent) {
    const bw = 100;
    bX -= bw;
    badgesSvg += `<rect x="${bX}" y="${headerH + 6}" width="${bw}" height="24" rx="12" fill="#ef4444" /><text x="${bX + bw/2}" y="${headerH + 22}" font-family="${F}" font-size="11" font-weight="bold" fill="white" text-anchor="middle">URGENT</text>`;
  }

  // ═══ COMPANY SECTION ═══
  const companyY = headerH + 12;
  const cLogoSize = 36;
  const nameW = Math.min(companyShort.length * 11, 400);
  const groupW = companyLogoBase64 ? cLogoSize + 12 + nameW : nameW;
  const groupX = CX - groupW / 2;

  const companyLogoSvg = companyLogoBase64
    ? `<rect x="${groupX - 2}" y="${companyY - 2}" width="${cLogoSize + 4}" height="${cLogoSize + 4}" rx="10" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1"/>
       <image href="${companyLogoBase64}" x="${groupX}" y="${companyY}" width="${cLogoSize}" height="${cLogoSize}" preserveAspectRatio="xMidYMid meet" />`
    : "";
  const cNameX = companyLogoBase64 ? groupX + cLogoSize + 12 : CX;
  const cNameAnchor = companyLogoBase64 ? "start" : "middle";
  const cNameY = companyY + 24;

  const rechercheY = companyY + cLogoSize + 10;

  // ═══ TITLE CARD ═══
  const tcY = rechercheY + 8;
  const tcW = 1060;
  const tcX = (W - tcW) / 2;
  const tfs = titleLines.length <= 1 && titleText.length <= 20 ? 30
    : titleLines.length <= 1 ? 26
    : 22;
  const tlh = tfs + 10;
  const tcH = Math.max(titleLines.length * tlh + 24, 50);
  const tbh = titleLines.length * tlh;
  const tsY = tcY + (tcH - tbh) / 2 + tfs - 2;
  let titleSvg = "";
  titleLines.forEach((line, i) => {
    titleSvg += `<text x="${CX}" y="${tsY + i * tlh}" font-family="${F}" font-size="${tfs}" font-weight="bold" fill="white" text-anchor="middle">${line}</text>`;
  });

  // ═══ LOCATION / LEVEL / POSTS bar ═══
  const barY = tcY + tcH + 8;
  const barItems: { text: string; bg: string; fg: string }[] = [];
  if (locationShort) barItems.push({ text: locationShort, bg: "#dbeafe", fg: "#1e40af" });
  if (levelShort) barItems.push({ text: `Niveau: ${levelShort}`, bg: "#e0e7ff", fg: "#3730a3" });
  if (postsStr) barItems.push({ text: postsStr, bg: "#fef3c7", fg: "#d97706" });

  let barSvg = "";
  if (barItems.length > 0) {
    const pillPadH = 16;
    const pillH = 26;
    const pillWidths = barItems.map(t => t.text.length * 7.5 + pillPadH * 2);
    const totalBarW = pillWidths.reduce((a, b) => a + b, 0) + (barItems.length - 1) * 8;
    let px = CX - totalBarW / 2;
    barItems.forEach((item, i) => {
      const pw = pillWidths[i];
      barSvg += `<rect x="${px}" y="${barY}" width="${pw}" height="${pillH}" rx="13" fill="${item.bg}" />`;
      barSvg += `<text x="${px + pw / 2}" y="${barY + 18}" font-family="${F}" font-size="11" font-weight="600" fill="${item.fg}" text-anchor="middle">${item.text}</text>`;
      px += pw + 8;
    });
  }

  // ═══ INFO CARDS GRID (4 columns for landscape) ═══
  const cols = 4;
  const gridY = barY + (barItems.length > 0 ? 34 : 10);
  const cardW = 258, cardH = 62, gapX = 14, gapY = 8;
  const totalGridW = cols * cardW + (cols - 1) * gapX;
  const gridStartX = (W - totalGridW) / 2;

  type IC = { label: string; value: string; color: string; abbr: string; hl?: boolean };
  const cards: IC[] = [];
  if (contractShort) cards.push({ label: "Type de contrat", value: contractShort, color: "#1e3a5f", abbr: "CT" });
  if (expShort) cards.push({ label: "Exp&#233;rience requise", value: expShort, color: "#0891b2", abbr: "EX" });
  if (eduShort) cards.push({ label: "Formation requise", value: eduShort, color: "#059669", abbr: "FO" });
  if (sectorShort) cards.push({ label: "Secteur d&#39;activit&#233;", value: sectorShort, color: "#4338ca", abbr: "SE" });
  if (publishedStr) cards.push({ label: "Publi&#233; le", value: publishedStr, color: "#2563eb", abbr: "PU" });
  if (deadlineStr) cards.push({ label: "Date limite candidature", value: deadlineStr, color: "#dc2626", abbr: "DL", hl: true });
  if (durationShort) cards.push({ label: "Dur&#233;e de publication", value: durationShort, color: "#7c3aed", abbr: "DP" });
  if (langShort) cards.push({ label: "Langue", value: langShort, color: "#ea580c", abbr: "LA" });
  if (salaryShort) cards.push({ label: "Salaire", value: salaryShort, color: "#16a34a", abbr: "SA" });

  // Limit to 8 cards (2 rows) for landscape layout
  const displayCards = cards.slice(0, 8);

  let infoSvg = "";
  displayCards.forEach((c, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = gridStartX + col * (cardW + gapX);
    const y = gridY + row * (cardH + gapY);
    const bg = c.hl ? "#fef2f2" : "white";
    const border = c.hl ? "#fecaca" : "#e2e8f0";
    infoSvg += `<rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="${R}" fill="${bg}" />`;
    infoSvg += `<rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="${R}" fill="none" stroke="${border}" stroke-width="1.5" />`;
    infoSvg += `<circle cx="${x + 28}" cy="${y + cardH / 2}" r="16" fill="${c.color}" opacity="0.12" />`;
    infoSvg += `<text x="${x + 28}" y="${y + cardH / 2 + 4}" font-family="${F}" font-size="11" font-weight="bold" fill="${c.color}" text-anchor="middle">${c.abbr}</text>`;
    infoSvg += `<text x="${x + 52}" y="${y + 24}" font-family="${F}" font-size="10" fill="#64748b">${c.label}</text>`;
    infoSvg += `<text x="${x + 52}" y="${y + 44}" font-family="${F}" font-size="13" font-weight="bold" fill="${c.hl ? "#dc2626" : "#0f172a"}">${c.value}</text>`;
  });

  const infoRows = Math.ceil(displayCards.length / cols);
  const afterInfoY = gridY + infoRows * (cardH + gapY);

  // ═══ CTA + FOOTER ═══
  const ctaY = Math.min(afterInfoY + 12, H - 72);
  const urlY = ctaY + 50;
  const ctaText = escapeXml(tpl.cta_text);
  const footerUrl = escapeXml(tpl.footer_url);

  // ═══ BACKGROUND (image with blur OR solid gradient) ═══
  let backgroundSvg: string;
  if (backgroundImageBase64) {
    backgroundSvg = `<image href="${backgroundImageBase64}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice" filter="url(#bgBlur)" />
    <rect width="${W}" height="${H}" fill="#0f172a" opacity="${tpl.background_overlay_opacity}" />`;
  } else {
    backgroundSvg = `<rect width="${W}" height="${H}" fill="#f1f5f9"/>`;
  }

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hdr" x1="0" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${tpl.header_gradient_start}"/><stop offset="100%" stop-color="${tpl.header_gradient_end}"/>
    </linearGradient>
    <linearGradient id="tc" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${tpl.title_card_start}"/><stop offset="100%" stop-color="${tpl.title_card_end}"/>
    </linearGradient>
    <linearGradient id="cta" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${tpl.cta_gradient_start}"/><stop offset="100%" stop-color="${tpl.cta_gradient_end}"/>
    </linearGradient>
    <filter id="ts" x="-3%" y="-5%" width="106%" height="115%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="${tpl.title_card_start}" flood-opacity="0.22"/>
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.06"/>
    </filter>
    <filter id="cs" x="-2%" y="-3%" width="104%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.06"/>
    </filter>
    <filter id="bs" x="-4%" y="-10%" width="108%" height="130%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${tpl.cta_gradient_end}" flood-opacity="0.25"/>
    </filter>
    <filter id="bgBlur" x="-5%" y="-5%" width="110%" height="110%">
      <feGaussianBlur stdDeviation="${tpl.background_blur}" />
    </filter>
    <filter id="logoGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feFlood flood-color="${tpl.logo_glow_color}" result="glowColor"/>
      <feComposite in="glowColor" in2="SourceAlpha" operator="in" result="coloredGlow"/>
      <feGaussianBlur in="coloredGlow" stdDeviation="${tpl.logo_glow_intensity}" result="blurredGlow"/>
      <feMerge>
        <feMergeNode in="blurredGlow"/><feMergeNode in="blurredGlow"/><feMergeNode in="blurredGlow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  ${backgroundSvg}

  <!-- Blue header bar -->
  <rect width="${W}" height="${headerH}" fill="url(#hdr)"/>
  <!-- Accent line at header bottom -->
  <rect x="0" y="${headerH - 3}" width="${W}" height="3" fill="${tpl.accent_color}"/>

  <!-- JobGuin&#233;e logo -->
  ${siteLogoSvg}
  <!-- AVIS DE RECRUTEMENT -->
  <text x="${CX}" y="${headerH - 10}" font-family="${F}" font-size="12" font-weight="600" fill="rgba(255,255,255,0.75)" text-anchor="middle" letter-spacing="3">AVIS DE RECRUTEMENT</text>

  ${badgesSvg}

  <!-- Company logo + name -->
  ${companyLogoSvg}
  <text x="${cNameX}" y="${cNameY}" font-family="${F}" font-size="20" fill="${backgroundImageBase64 ? "white" : "#0f172a"}" font-weight="bold" text-anchor="${cNameAnchor}">${companyShort}</text>

  <!-- "recherche un(e)" -->
  <text x="${CX}" y="${rechercheY}" font-family="${F}" font-size="14" fill="${backgroundImageBase64 ? "rgba(255,255,255,0.8)" : "#64748b"}" text-anchor="middle">recherche un(e)</text>

  <!-- Title card -->
  <rect x="${tcX}" y="${tcY}" width="${tcW}" height="${tcH}" rx="16" fill="url(#tc)" filter="url(#ts)"/>
  <rect x="${tcX + 2}" y="${tcY + 2}" width="${tcW - 4}" height="${Math.floor(tcH * 0.4)}" rx="14" fill="white" opacity="0.06"/>
  ${titleSvg}

  <!-- Location / Level / Posts pills -->
  ${barSvg}

  <!-- Info cards grid -->
  <g filter="url(#cs)">
    ${infoSvg}
  </g>

  <!-- CTA button -->
  <rect x="${CX - 230}" y="${ctaY}" width="460" height="44" rx="22" fill="url(#cta)" filter="url(#bs)"/>
  <text x="${CX}" y="${ctaY + 29}" font-family="${F}" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${ctaText}</text>

  <!-- Site URL -->
  <text x="${CX}" y="${urlY}" font-family="${F}" font-size="13" fill="${backgroundImageBase64 ? "white" : tpl.header_gradient_end}" text-anchor="middle" font-weight="600">${footerUrl}</text>

  <!-- Bottom accent -->
  <rect x="0" y="${H - 4}" width="${W}" height="4" fill="${tpl.accent_color}"/>
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
      .select("id, title, location, contract_type, sector, experience_level, education_level, salary_range, deadline, created_at, publication_duration, position_count, position_level, announcement_language, is_urgent, is_featured, company_logo_url, partner_logo_url, use_profile_logo, company_id, company_name")
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

    // Fetch site settings + template config in one query
    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["site_name", "site_url", "site_logo_url", "og_poster_template"]);

    const settingsMap: Record<string, any> = {};
    (settings || []).forEach((s: { key: string; value: any }) => {
      settingsMap[s.key] = s.value;
    });

    // Merge template config with defaults
    const tplRaw = settingsMap["og_poster_template"];
    const tpl: TemplateConfig = { ...DEFAULT_TEMPLATE, ...(typeof tplRaw === "object" && tplRaw ? tplRaw : {}) };

    const siteUrl = String(settingsMap["site_url"] || "jobguinee.com");
    const siteLogoPath = settingsMap["site_logo_url"] ? String(settingsMap["site_logo_url"]) : null;
    const appOrigin = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;

    let siteLogoUrl: string | null = null;
    if (siteLogoPath) {
      siteLogoUrl = siteLogoPath.startsWith("http") ? siteLogoPath : `${appOrigin}${siteLogoPath}`;
    }

    // Resolve background image URL from template config
    let bgImageUrl: string | null = null;
    if (tpl.background_image_url) {
      bgImageUrl = tpl.background_image_url.startsWith("http")
        ? tpl.background_image_url
        : supabase.storage.from("og-images").getPublicUrl(tpl.background_image_url).data.publicUrl;
    }

    // Fetch logos + background in parallel
    const [companyLogoBase64, siteLogoBase64, backgroundImageBase64] = await Promise.all([
      companyLogoUrl ? fetchImageAsBase64(companyLogoUrl) : Promise.resolve(null),
      siteLogoUrl ? fetchImageAsBase64(siteLogoUrl) : Promise.resolve(null),
      bgImageUrl ? fetchImageAsBase64(bgImageUrl) : Promise.resolve(null),
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
      createdAt: (job as any).created_at || "",
      publicationDuration: (job as any).publication_duration || "30 jours",
      positionCount: (job as any).position_count || 1,
      positionLevel: (job as any).position_level || "",
      language: (job as any).announcement_language || "",
      isUrgent: job.is_urgent || false,
      isFeatured: job.is_featured || false,
      companyLogoBase64,
      siteLogoBase64,
      backgroundImageBase64,
      tpl,
    });

    await ensureWasm();

    if (fontBuffers.length < 2 || fontBuffers[0].byteLength < 1000) {
      // Reset fonts and retry
      fontsLoaded = false;
      fontBuffers = [];
      await ensureWasm();
    }

    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
      font: {
        fontBuffers,
        defaultFontFamily: "Inter",
      },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Sanity check: a proper OG image with text should be at least 30KB
    // A blank/shapes-only image is typically under 15KB
    if (pngBuffer.byteLength < 20000) {
      console.warn(`OG image too small (${pngBuffer.byteLength}B) — likely missing text. Fonts: regular=${fontBuffers[0]?.byteLength || 0}B, bold=${fontBuffers[1]?.byteLength || 0}B`);
      return new Response(
        JSON.stringify({ error: "Generated image appears blank (too small)", size: pngBuffer.byteLength }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
