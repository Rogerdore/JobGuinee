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
    // First try direct fetch
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";

    // If format is supported by resvg (png, jpeg, gif), use directly
    if (contentType.includes("png") || contentType.includes("jpeg") || contentType.includes("gif")) {
      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      return `data:${contentType};base64,${btoa(binary)}`;
    }

    // Unsupported format (webp, avif, svg) — convert via wsrv.nl image proxy
    console.log(`Unsupported format ${contentType}, converting via wsrv.nl: ${url}`);
    const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=png&w=200`;
    const proxyRes = await fetch(proxyUrl);
    if (!proxyRes.ok) {
      console.warn(`wsrv.nl conversion failed: ${proxyRes.status}`);
      return null;
    }
    const proxyType = proxyRes.headers.get("content-type") || "image/png";
    const buf = await proxyRes.arrayBuffer();
    if (buf.byteLength < 100) return null;
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    console.log(`wsrv.nl conversion OK: ${proxyType}, ${buf.byteLength}B`);
    return `data:${proxyType};base64,${btoa(binary)}`;
  } catch (e) {
    console.error(`fetchImageAsBase64 error: ${e}`);
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

  // ═══ OPTIMIZED LANDSCAPE 1200×630 — all content visible, no duplication ═══
  const W = 1200, H = 630, F = "Inter, sans-serif";
  const LP = 440; // Left panel width
  const RP_X = LP, RP_W = W - LP; // Right panel
  const PAD = 32; // Padding inside panels
  const LPW = LP - PAD * 2; // Usable left width = 376px

  // Prepare all data
  const companyShort = escapeXml(truncate(company, 30));
  const titleText = escapeXml(truncate(title, 60));
  // At font ~30px, each char ≈ 17px. Usable width 376px → ~22 chars/line, 3 lines max
  const titleLines = wrapText(titleText, 20, 3);
  const locationVal = escapeXml(truncate(location, 18));
  const contractVal = escapeXml(truncate(contractType, 16));
  const sectorVal = escapeXml(truncate(sector, 22));
  const expVal = escapeXml(truncate(experienceLevel, 16));
  const eduVal = escapeXml(truncate(educationLevel, 20));
  const salaryVal = escapeXml(truncate(salaryRange, 20));
  const postsStr = positionCount > 1 ? `${positionCount} postes` : "1 poste";
  const levelVal = escapeXml(truncate(positionLevel, 18));
  const fmtDate = (s: string) => { try { return escapeXml(new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })); } catch { return ""; } };
  const publishedStr = createdAt ? fmtDate(createdAt) : "";
  const deadlineStr = deadline ? fmtDate(deadline) : "";

  const ctaText = escapeXml(tpl.cta_text);
  const footerUrl = escapeXml(tpl.footer_url);

  // ═══ LEFT PANEL — Auto-calculate spacing, company+title 1cm higher ═══
  // Blocks: 1) Site logo (56px), 2) Banner (30px), 3) Company (60px), 4) Title (variable), 5) URL (18px)
  const siteLogoH = 56;
  const bannerH = 30;
  const cLogoSize = 60;
  const tfs = titleLines.length <= 1 ? 36 : titleLines.length <= 2 ? 32 : 28;
  const tlh = tfs + 10;
  const titleH = titleLines.length * tlh;
  const urlH = 18;
  const topPad = 20, botPad = 20;
  const totalContent = siteLogoH + bannerH + cLogoSize + titleH + urlH;
  const availableSpace = H - topPad - botPad - totalContent;
  const VGAP = Math.floor(availableSpace / 4);
  // Shift company + title up by ~1cm: reduce gap2 & gap3, give remainder to gap4 (before URL)
  const gap1 = VGAP;                     // logo → banner
  const gap2 = Math.max(VGAP - 19, 20);  // banner → company (-19px)
  const gap3 = Math.max(VGAP - 19, 20);  // company → title (-19px)
  const gap4 = VGAP + 38;                // title → URL (absorb the 38px)

  // Position each block with equal gap
  const logoY = topPad;
  let siteLogoSvg: string;
  if (siteLogoBase64) {
    const glow = tpl.logo_glow_enabled ? ' filter="url(#logoGlow)"' : '';
    siteLogoSvg = `<image href="${siteLogoBase64}" x="${PAD}" y="${logoY}" width="240" height="${siteLogoH}" preserveAspectRatio="xMinYMid meet"${glow} />`;
  } else {
    siteLogoSvg = `<text x="${PAD}" y="${logoY + 36}" font-family="${F}" font-size="32" font-weight="bold" fill="white">JobGuin&#233;e</text>`;
  }

  const bannerY = logoY + siteLogoH + gap1;

  const companyY = bannerY + bannerH + gap2;
  let companyLogoSvg: string;
  if (companyLogoBase64) {
    companyLogoSvg = `<rect x="${PAD - 2}" y="${companyY - 2}" width="${cLogoSize + 4}" height="${cLogoSize + 4}" rx="14" fill="rgba(255,255,255,0.15)" />
       <image href="${companyLogoBase64}" x="${PAD}" y="${companyY}" width="${cLogoSize}" height="${cLogoSize}" preserveAspectRatio="xMidYMid meet" />`;
  } else {
    const initial = company ? company.charAt(0).toUpperCase() : "?";
    companyLogoSvg = `<circle cx="${PAD + cLogoSize / 2}" cy="${companyY + cLogoSize / 2}" r="${cLogoSize / 2}" fill="${tpl.accent_color}" />
       <text x="${PAD + cLogoSize / 2}" y="${companyY + cLogoSize / 2 + 12}" font-family="${F}" font-size="30" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(initial)}</text>`;
  }
  const cNameX = PAD + cLogoSize + 14;
  const cNameMaxW = LP - cNameX - PAD;

  const titleY = companyY + cLogoSize + gap3;
  let titleSvg = "";
  titleLines.forEach((line, i) => {
    titleSvg += `<text x="${PAD}" y="${titleY + i * tlh}" font-family="${F}" font-size="${tfs}" font-weight="bold" fill="white">${line}</text>`;
  });

  // Badges below title
  const afterTitleY = titleY + titleLines.length * tlh + 20;
  let badgesSvg = "";
  let badgeX = PAD;
  if (isUrgent) {
    badgesSvg += `<rect x="${badgeX}" y="${afterTitleY}" width="110" height="30" rx="15" fill="#ef4444" /><text x="${badgeX + 55}" y="${afterTitleY + 20}" font-family="${F}" font-size="15" font-weight="bold" fill="white" text-anchor="middle">URGENT</text>`;
    badgeX += 120;
  }
  if (isFeatured) {
    badgesSvg += `<rect x="${badgeX}" y="${afterTitleY}" width="130" height="30" rx="15" fill="${tpl.accent_color}" /><text x="${badgeX + 65}" y="${afterTitleY + 20}" font-family="${F}" font-size="15" font-weight="bold" fill="white" text-anchor="middle">EN VEDETTE</text>`;
  }

  // URL at bottom of left panel
  const urlY = titleY + titleH + gap4;

  // Background
  let backgroundSvg = "";
  if (backgroundImageBase64) {
    backgroundSvg = `<image href="${backgroundImageBase64}" x="0" y="0" width="${LP}" height="${H}" preserveAspectRatio="xMidYMid slice" filter="url(#bgBlur)" />
    <rect width="${LP}" height="${H}" fill="${tpl.header_gradient_start}" opacity="${tpl.background_overlay_opacity}" />`;
  }

  // ═══ RIGHT PANEL — All info cards in 2-column grid ═══
  type InfoCard = { label: string; value: string; color: string; highlight?: boolean };
  const allCards: InfoCard[] = [];
  if (contractVal) allCards.push({ label: "Contrat", value: contractVal, color: tpl.header_gradient_end });
  if (locationVal) allCards.push({ label: "Lieu", value: locationVal, color: "#0891b2" });
  if (expVal) allCards.push({ label: "Exp&#233;rience", value: expVal, color: "#059669" });
  if (eduVal) allCards.push({ label: "Formation", value: eduVal, color: "#7c3aed" });
  if (sectorVal) allCards.push({ label: "Secteur", value: sectorVal, color: "#4338ca" });
  if (salaryVal) allCards.push({ label: "Salaire", value: salaryVal, color: "#16a34a" });
  if (postsStr) allCards.push({ label: "Postes", value: postsStr, color: "#d97706" });
  if (levelVal) allCards.push({ label: "Niveau", value: levelVal, color: "#ea580c" });
  if (publishedStr) allCards.push({ label: "Publi&#233;", value: publishedStr, color: "#2563eb" });
  if (deadlineStr) allCards.push({ label: "Date limite", value: deadlineStr, color: "#dc2626", highlight: true });

  // Grid layout: 2 columns — 3D luminous cards
  const cols = 2;
  const gridPad = 30;
  const gapX = 14, gapY = 10;
  const cardW = Math.floor((RP_W - gridPad * 2 - gapX) / cols);
  const cardH = 64;
  const gridStartX = RP_X + gridPad;
  const gridStartY = 24;

  // If there's a deadline, show it as a prominent header card first
  let rightSvg = "";
  let cardsGridY = gridStartY;

  if (deadlineStr) {
    const dlW = RP_W - gridPad * 2;
    rightSvg += `<rect x="${gridStartX}" y="${cardsGridY}" width="${dlW}" height="70" rx="14" fill="#fef2f2" stroke="#fecaca" stroke-width="2" filter="url(#card3d)"/>`;
    rightSvg += `<text x="${gridStartX + 16}" y="${cardsGridY + 28}" font-family="${F}" font-size="18" fill="#dc2626" font-weight="600">Date limite de candidature</text>`;
    rightSvg += `<text x="${gridStartX + 16}" y="${cardsGridY + 54}" font-family="${F}" font-size="24" fill="#dc2626" font-weight="bold">${deadlineStr}</text>`;
    cardsGridY += 84;
  }

  // Render info cards in 2 columns (exclude deadline from grid since it's shown above)
  const gridCards = allCards.filter(c => !c.highlight);
  const displayCards = gridCards.slice(0, 8);

  displayCards.forEach((card, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = gridStartX + col * (cardW + gapX);
    const y = cardsGridY + row * (cardH + gapY);
    // 3D luminous card: white fill, colored left accent, drop shadow
    rightSvg += `<rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="12" fill="white" filter="url(#card3d)"/>`;
    rightSvg += `<rect x="${x}" y="${y + 8}" width="4" height="${cardH - 16}" rx="2" fill="${card.color}" opacity="0.7"/>`;
    rightSvg += `<text x="${x + 16}" y="${y + 24}" font-family="${F}" font-size="15" fill="#94a3b8">${card.label}</text>`;
    rightSvg += `<text x="${x + 16}" y="${y + 50}" font-family="${F}" font-size="22" font-weight="bold" fill="${card.color}">${card.value}</text>`;
  });

  // CTA on right panel at bottom
  const ctaRY = H - 100;
  const ctaRW = RP_W - gridPad * 2;
  rightSvg += `<rect x="${gridStartX}" y="${ctaRY}" width="${ctaRW}" height="50" rx="25" fill="url(#cta)" filter="url(#bs)"/>`;
  rightSvg += `<text x="${gridStartX + ctaRW / 2}" y="${ctaRY + 33}" font-family="${F}" font-size="20" font-weight="bold" fill="white" text-anchor="middle">${ctaText}</text>`;

  // URL on right
  rightSvg += `<text x="${gridStartX + ctaRW / 2}" y="${H - 30}" font-family="${F}" font-size="18" fill="${tpl.header_gradient_end}" text-anchor="middle" font-weight="600">${footerUrl}</text>`;

  // Soft color orbs for right panel background (no filters to avoid WORKER_LIMIT)
  const rpCx = RP_X + RP_W / 2;
  const rpCy = H / 2;
  let rightBgSvg = `<circle cx="${rpCx + 60}" cy="${rpCy - 40}" r="260" fill="${tpl.accent_color}" opacity="0.04"/>`;
  rightBgSvg += `<circle cx="${rpCx - 140}" cy="${rpCy + 120}" r="180" fill="${tpl.header_gradient_end}" opacity="0.035"/>`;
  rightBgSvg += `<circle cx="${rpCx + 180}" cy="${rpCy + 180}" r="120" fill="#7c3aed" opacity="0.03"/>`;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hdr" x1="0" y1="0" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${tpl.header_gradient_start}"/><stop offset="100%" stop-color="${tpl.header_gradient_end}"/>
    </linearGradient>
    <linearGradient id="cta" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${tpl.cta_gradient_start}"/><stop offset="100%" stop-color="${tpl.cta_gradient_end}"/>
    </linearGradient>
    <filter id="bs" x="-4%" y="-10%" width="108%" height="130%">
      <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="${tpl.cta_gradient_end}" flood-opacity="0.3"/>
    </filter>
    <filter id="bgBlur" x="-5%" y="-5%" width="110%" height="110%">
      <feGaussianBlur stdDeviation="${tpl.background_blur}" />
    </filter>
    <filter id="card3d" x="-3%" y="-3%" width="108%" height="115%">
      <feOffset in="SourceAlpha" dx="0" dy="2" result="off"/>
      <feColorMatrix in="off" type="matrix" values="0 0 0 0 0.12 0 0 0 0 0.23 0 0 0 0 0.37 0 0 0 0.18 0" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="logoGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feFlood flood-color="${tpl.logo_glow_color}" result="glowColor"/>
      <feComposite in="glowColor" in2="SourceAlpha" operator="in" result="coloredGlow"/>
      <feGaussianBlur in="coloredGlow" stdDeviation="${tpl.logo_glow_intensity}" result="blurredGlow"/>
      <feMerge><feMergeNode in="blurredGlow"/><feMergeNode in="blurredGlow"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- LEFT PANEL -->
  <rect x="0" y="0" width="${LP}" height="${H}" fill="url(#hdr)"/>
  ${backgroundSvg}

  <!-- RIGHT PANEL -->
  <rect x="${RP_X}" y="0" width="${RP_W}" height="${H}" fill="#f0f4f8"/>
  ${rightBgSvg}

  <!-- Accent divider -->
  <rect x="${LP - 2}" y="0" width="4" height="${H}" fill="${tpl.accent_color}"/>

  <!-- Site logo -->
  ${siteLogoSvg}

  <!-- AVIS DE RECRUTEMENT -->
  <rect x="${PAD}" y="${bannerY - 4}" width="${LPW}" height="30" rx="6" fill="rgba(255,255,255,0.12)"/>
  <text x="${PAD + LPW / 2}" y="${bannerY + 17}" font-family="${F}" font-size="16" font-weight="700" fill="${tpl.accent_color}" text-anchor="middle" letter-spacing="3">AVIS DE RECRUTEMENT</text>

  <!-- Company -->
  ${companyLogoSvg}
  <text x="${cNameX}" y="${companyY + 24}" font-family="${F}" font-size="26" fill="white" font-weight="bold">${companyShort}</text>
  <text x="${cNameX}" y="${companyY + 48}" font-family="${F}" font-size="20" fill="rgba(255,255,255,0.65)">recherche un(e)</text>

  <!-- Job title -->
  ${titleSvg}

  <!-- Badges -->
  ${badgesSvg}

  <!-- URL -->
  <text x="${PAD + LPW / 2}" y="${urlY}" font-family="${F}" font-size="18" fill="rgba(255,255,255,0.7)" text-anchor="middle" font-weight="600">${footerUrl}</text>

  <!-- RIGHT: Info cards -->
  ${rightSvg}

  <!-- Top/Bottom accent lines -->
  <rect x="0" y="0" width="${W}" height="4" fill="${tpl.accent_color}"/>
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

    // Always try to get logo from companies table if company_id exists
    if (job.company_id) {
      const { data: company } = await supabase
        .from("companies")
        .select("name, logo_url")
        .eq("id", job.company_id)
        .maybeSingle();
      if (company) {
        if (!companyName) companyName = company.name || "";
        companyLogoUrl = company.logo_url || null;
      }
    }

    // Fallback to job-level logo fields
    if (!companyLogoUrl) {
      companyLogoUrl = job.company_logo_url || job.partner_logo_url || null;
    }

    console.log(`Company logo URL: ${companyLogoUrl}`);

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

    // Render at 2x resolution (2400x1260) for crisp text on high-DPI displays
    // Facebook/LinkedIn will scale down to display size, keeping text sharp
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 2400 },
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
