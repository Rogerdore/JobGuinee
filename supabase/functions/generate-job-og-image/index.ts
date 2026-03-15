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

  // ═══ BOLD LANDSCAPE 1200×630 — optimized for Facebook small display (~500px) ═══
  // All text ≥24px at SVG coords so it stays readable when Facebook shrinks it
  const W = 1200, H = 630, F = "Inter, sans-serif";

  const companyShort = escapeXml(truncate(company, 35));
  const titleText = escapeXml(truncate(title, 50));
  const titleLines = wrapText(titleText, 28, 2);
  const locationShort = escapeXml(truncate(location, 20));
  const contractShort = escapeXml(truncate(contractType, 18));
  const sectorShort = escapeXml(truncate(sector, 25));
  const deadlineStr = deadline ? (() => { try { return escapeXml(new Date(deadline).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })); } catch { return ""; } })() : "";
  const expShort = escapeXml(truncate(experienceLevel, 18));

  // ═══ LEFT PANEL (dark blue) — 480px wide ═══
  const LP = 480;

  // Site logo in top-left
  let siteLogoSvg: string;
  if (siteLogoBase64) {
    const glowFilter = tpl.logo_glow_enabled ? ' filter="url(#logoGlow)"' : '';
    siteLogoSvg = `<image href="${siteLogoBase64}" x="30" y="18" width="200" height="48" preserveAspectRatio="xMinYMid meet"${glowFilter} />`;
  } else {
    siteLogoSvg = `<text x="40" y="52" font-family="${F}" font-size="32" font-weight="bold" fill="white">JobGuin&#233;e</text>`;
  }

  // Company logo + name
  const cLogoSize = 56;
  const companyStartY = 90;
  const companyLogoSvg = companyLogoBase64
    ? `<rect x="38" y="${companyStartY - 2}" width="${cLogoSize + 4}" height="${cLogoSize + 4}" rx="14" fill="rgba(255,255,255,0.15)" />
       <image href="${companyLogoBase64}" x="40" y="${companyStartY}" width="${cLogoSize}" height="${cLogoSize}" preserveAspectRatio="xMidYMid meet" />`
    : "";
  const cNameX = companyLogoBase64 ? 40 + cLogoSize + 16 : 40;
  const cNameY = companyStartY + 35;

  // Title — large bold text
  const titleStartY = companyStartY + cLogoSize + 30;
  const tfs = titleLines.length <= 1 ? 44 : 38;
  const tlh = tfs + 10;
  let titleSvg = "";
  titleLines.forEach((line, i) => {
    titleSvg += `<text x="40" y="${titleStartY + i * tlh}" font-family="${F}" font-size="${tfs}" font-weight="bold" fill="white">${line}</text>`;
  });

  // Details under title (large readable text)
  const detailsY = titleStartY + titleLines.length * tlh + 20;
  let detailsSvg = "";
  let dy = detailsY;
  const detailItems: string[] = [];
  if (locationShort) detailItems.push(locationShort);
  if (contractShort) detailItems.push(contractShort);
  if (expShort) detailItems.push(expShort);
  if (sectorShort) detailItems.push(sectorShort);

  detailItems.slice(0, 4).forEach((item) => {
    detailsSvg += `<circle cx="54" cy="${dy - 8}" r="4" fill="${tpl.accent_color}"/>`;
    detailsSvg += `<text x="68" y="${dy}" font-family="${F}" font-size="24" fill="rgba(255,255,255,0.9)">${item}</text>`;
    dy += 36;
  });

  // CTA button at bottom-left
  const ctaY = H - 110;
  const ctaText = escapeXml(tpl.cta_text);
  const footerUrl = escapeXml(tpl.footer_url);

  // Badges
  let badgesSvg = "";
  if (isUrgent) {
    badgesSvg += `<rect x="40" y="${H - 60}" width="130" height="36" rx="18" fill="#ef4444" /><text x="105" y="${H - 36}" font-family="${F}" font-size="18" font-weight="bold" fill="white" text-anchor="middle">URGENT</text>`;
  }
  if (isFeatured) {
    const bx = isUrgent ? 185 : 40;
    badgesSvg += `<rect x="${bx}" y="${H - 60}" width="160" height="36" rx="18" fill="${tpl.accent_color}" /><text x="${bx + 80}" y="${H - 36}" font-family="${F}" font-size="18" font-weight="bold" fill="white" text-anchor="middle">EN VEDETTE</text>`;
  }

  // ═══ RIGHT PANEL (light) — 720px wide ═══
  const RP_X = LP;
  const RP_W = W - LP;

  // Right panel content: deadline + big CTA
  let rightContent = "";

  // Deadline card if exists
  if (deadlineStr) {
    rightContent += `
      <rect x="${RP_X + 50}" y="60" width="${RP_W - 100}" height="100" rx="20" fill="#fef2f2" stroke="#fecaca" stroke-width="2"/>
      <text x="${RP_X + RP_W / 2}" y="105" font-family="${F}" font-size="24" fill="#dc2626" font-weight="600" text-anchor="middle">Date limite de candidature</text>
      <text x="${RP_X + RP_W / 2}" y="142" font-family="${F}" font-size="30" fill="#dc2626" font-weight="bold" text-anchor="middle">${deadlineStr}</text>`;
  }

  // Key info cards (only 3, large)
  const cardsStartY = deadlineStr ? 190 : 60;
  type SimpleCard = { label: string; value: string; color: string };
  const simpleCards: SimpleCard[] = [];
  if (contractShort) simpleCards.push({ label: "Contrat", value: contractShort, color: tpl.header_gradient_end });
  if (locationShort) simpleCards.push({ label: "Lieu", value: locationShort, color: "#0891b2" });
  if (expShort) simpleCards.push({ label: "Exp&#233;rience", value: expShort, color: "#059669" });

  simpleCards.slice(0, 3).forEach((card, i) => {
    const cy = cardsStartY + i * 90;
    rightContent += `
      <rect x="${RP_X + 50}" y="${cy}" width="${RP_W - 100}" height="76" rx="16" fill="white" stroke="#e2e8f0" stroke-width="2"/>
      <text x="${RP_X + 80}" y="${cy + 30}" font-family="${F}" font-size="20" fill="#64748b">${card.label}</text>
      <text x="${RP_X + 80}" y="${cy + 58}" font-family="${F}" font-size="28" font-weight="bold" fill="${card.color}">${card.value}</text>`;
  });

  // CTA at bottom-right
  const ctaRightY = H - 130;
  rightContent += `
    <rect x="${RP_X + 40}" y="${ctaRightY}" width="${RP_W - 80}" height="56" rx="28" fill="url(#cta)" filter="url(#bs)"/>
    <text x="${RP_X + RP_W / 2}" y="${ctaRightY + 37}" font-family="${F}" font-size="22" font-weight="bold" fill="white" text-anchor="middle">${ctaText}</text>`;

  // Footer URL
  rightContent += `
    <text x="${RP_X + RP_W / 2}" y="${H - 50}" font-family="${F}" font-size="22" fill="${tpl.header_gradient_end}" text-anchor="middle" font-weight="600">${footerUrl}</text>`;

  // Background
  let backgroundSvg: string;
  if (backgroundImageBase64) {
    backgroundSvg = `<image href="${backgroundImageBase64}" x="0" y="0" width="${LP}" height="${H}" preserveAspectRatio="xMidYMid slice" filter="url(#bgBlur)" />
    <rect width="${LP}" height="${H}" fill="${tpl.header_gradient_start}" opacity="${tpl.background_overlay_opacity}" />`;
  } else {
    backgroundSvg = "";
  }

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
    <filter id="logoGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feFlood flood-color="${tpl.logo_glow_color}" result="glowColor"/>
      <feComposite in="glowColor" in2="SourceAlpha" operator="in" result="coloredGlow"/>
      <feGaussianBlur in="coloredGlow" stdDeviation="${tpl.logo_glow_intensity}" result="blurredGlow"/>
      <feMerge>
        <feMergeNode in="blurredGlow"/><feMergeNode in="blurredGlow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- LEFT PANEL: dark gradient -->
  <rect x="0" y="0" width="${LP}" height="${H}" fill="url(#hdr)"/>
  ${backgroundSvg}

  <!-- RIGHT PANEL: light background -->
  <rect x="${RP_X}" y="0" width="${RP_W}" height="${H}" fill="#f8fafc"/>

  <!-- Accent divider line -->
  <rect x="${LP - 2}" y="0" width="4" height="${H}" fill="${tpl.accent_color}"/>

  <!-- LEFT: Site logo -->
  ${siteLogoSvg}

  <!-- LEFT: Company logo + name -->
  ${companyLogoSvg}
  <text x="${cNameX}" y="${cNameY}" font-family="${F}" font-size="28" fill="white" font-weight="bold">${companyShort}</text>
  <text x="40" y="${cNameY + 26}" font-family="${F}" font-size="22" fill="rgba(255,255,255,0.7)">recherche un(e)</text>

  <!-- LEFT: Job title (BIG) -->
  ${titleSvg}

  <!-- LEFT: Key details -->
  ${detailsSvg}

  <!-- LEFT: Badges -->
  ${badgesSvg}

  <!-- RIGHT: Cards + CTA -->
  ${rightContent}

  <!-- Top accent line -->
  <rect x="0" y="0" width="${W}" height="4" fill="${tpl.accent_color}"/>
  <!-- Bottom accent line -->
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
