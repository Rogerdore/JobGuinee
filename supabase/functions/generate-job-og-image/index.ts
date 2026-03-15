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
  createdAt: string;
  publicationDuration: string;
  positionCount: number;
  positionLevel: string;
  language: string;
  isUrgent: boolean;
  isFeatured: boolean;
  companyLogoBase64: string | null;
  siteLogoBase64: string | null;
}): string {
  const {
    title, company, location, contractType, sector,
    experienceLevel, educationLevel, salaryRange, deadline,
    createdAt, publicationDuration, positionCount, positionLevel, language,
    isUrgent, isFeatured, companyLogoBase64, siteLogoBase64,
  } = params;

  const W = 1080, H = 1080, CX = W / 2, F = "Inter, sans-serif";

  const companyShort = escapeXml(truncate(company, 36));
  const titleText = escapeXml(truncate(title, 65));
  const titleLines = wrapText(titleText, 32, 3);
  const locationShort = escapeXml(truncate(location, 22));
  const contractShort = escapeXml(truncate(contractType, 18));
  const sectorShort = escapeXml(truncate(sector, 24));
  const expShort = escapeXml(truncate(experienceLevel, 18));
  const eduShort = escapeXml(truncate(educationLevel, 20));
  const salaryShort = escapeXml(truncate(salaryRange, 22));
  const durationShort = escapeXml(truncate(publicationDuration || "30 jours", 15));
  const langShort = escapeXml(truncate(language || "Fran\u00e7ais", 15));
  const levelShort = escapeXml(truncate(positionLevel, 20));
  const postsStr = positionCount > 1 ? `${positionCount} postes` : "";

  // Format dates
  const fmtDate = (s: string) => {
    try { return escapeXml(new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })); }
    catch { return ""; }
  };
  const publishedStr = createdAt ? fmtDate(createdAt) : "";
  const deadlineStr = deadline ? fmtDate(deadline) : "";

  // ═══ HEADER (0-130): dark blue bar with JG logo (large) ═══
  const headerH = 130;
  const siteLogoSvg = siteLogoBase64
    ? `<image href="${siteLogoBase64}" x="${CX - 150}" y="8" width="300" height="72" preserveAspectRatio="xMidYMid meet" />`
    : `<text x="${CX}" y="52" font-family="${F}" font-size="36" font-weight="bold" fill="white" text-anchor="middle">JobGuin&#233;e</text>`;

  // ═══ BADGES (top-right, just below header) ═══
  let badgesSvg = "";
  let bX = W - 70;
  if (isFeatured) {
    const bw = 146;
    bX -= bw;
    badgesSvg += `<rect x="${bX}" y="${headerH + 8}" width="${bw}" height="30" rx="15" fill="#f97316" /><text x="${bX + bw/2}" y="${headerH + 28}" font-family="${F}" font-size="12" font-weight="bold" fill="white" text-anchor="middle">EN VEDETTE</text>`;
    bX -= 8;
  }
  if (isUrgent) {
    const bw = 116;
    bX -= bw;
    badgesSvg += `<rect x="${bX}" y="${headerH + 8}" width="${bw}" height="30" rx="15" fill="#ef4444" /><text x="${bX + bw/2}" y="${headerH + 28}" font-family="${F}" font-size="12" font-weight="bold" fill="white" text-anchor="middle">URGENT</text>`;
  }

  // ═══ COMPANY SECTION (150-210) — logo + name side by side, centered ═══
  const companyY = 160;
  const cLogoSize = 52;
  const nameW = Math.min(companyShort.length * 13, 420);
  const groupW = companyLogoBase64 ? cLogoSize + 14 + nameW : nameW;
  const groupX = CX - groupW / 2;

  const companyLogoSvg = companyLogoBase64
    ? `<rect x="${groupX - 2}" y="${companyY - 2}" width="${cLogoSize + 4}" height="${cLogoSize + 4}" rx="14" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1"/>
       <image href="${companyLogoBase64}" x="${groupX}" y="${companyY}" width="${cLogoSize}" height="${cLogoSize}" preserveAspectRatio="xMidYMid meet" />`
    : "";
  const cNameX = companyLogoBase64 ? groupX + cLogoSize + 14 : CX;
  const cNameAnchor = companyLogoBase64 ? "start" : "middle";
  const cNameY = companyY + 33;

  // ═══ "recherche un(e)" ═══
  const rechercheY = 232;

  // ═══ TITLE CARD (blue gradient, 3D soft, centered title) ═══
  const tcY = 252;
  const tcW = 920;
  const tcX = (W - tcW) / 2;
  const tfs = titleLines.length <= 1 && titleText.length <= 20 ? 38
    : titleLines.length <= 1 ? 34
    : titleLines.length <= 2 ? 32 : 27;
  const tlh = tfs + 12;
  const tcH = Math.max(titleLines.length * tlh + 48, 95);
  // Vertical centering of title text inside card
  const tbh = titleLines.length * tlh;
  const tsY = tcY + (tcH - tbh) / 2 + tfs - 2;
  let titleSvg = "";
  titleLines.forEach((line, i) => {
    titleSvg += `<text x="${CX}" y="${tsY + i * tlh}" font-family="${F}" font-size="${tfs}" font-weight="bold" fill="white" text-anchor="middle">${line}</text>`;
  });

  // ═══ LOCATION / LEVEL / POSTS bar ═══
  const barY = tcY + tcH + 16;
  const barItems: { text: string; bg: string; fg: string }[] = [];
  if (locationShort) barItems.push({ text: locationShort, bg: "#dbeafe", fg: "#1e40af" });
  if (levelShort) barItems.push({ text: `Niveau: ${levelShort}`, bg: "#e0e7ff", fg: "#3730a3" });
  if (postsStr) barItems.push({ text: postsStr, bg: "#fef3c7", fg: "#d97706" });

  let barSvg = "";
  if (barItems.length > 0) {
    const pillPadH = 20;
    const pillH = 32;
    const pillWidths = barItems.map(t => t.text.length * 8.5 + pillPadH * 2);
    const totalBarW = pillWidths.reduce((a, b) => a + b, 0) + (barItems.length - 1) * 10;
    let px = CX - totalBarW / 2;
    barItems.forEach((item, i) => {
      const pw = pillWidths[i];
      barSvg += `<rect x="${px}" y="${barY}" width="${pw}" height="${pillH}" rx="16" fill="${item.bg}" />`;
      barSvg += `<text x="${px + pw / 2}" y="${barY + 22}" font-family="${F}" font-size="13" font-weight="600" fill="${item.fg}" text-anchor="middle">${item.text}</text>`;
      px += pw + 10;
    });
  }

  // ═══ INFO CARDS GRID (3 cols x N rows) ═══
  const gridY = barY + (barItems.length > 0 ? 50 : 18);
  const cardW = 300, cardH = 88, gapX = 30, gapY = 14;
  const gx1 = 60, gx2 = gx1 + cardW + gapX, gx3 = gx2 + cardW + gapX;

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

  let infoSvg = "";
  cards.forEach((c, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = col === 0 ? gx1 : col === 1 ? gx2 : gx3;
    const y = gridY + row * (cardH + gapY);
    const bg = c.hl ? "#fef2f2" : "white";
    const border = c.hl ? "#fecaca" : "#e2e8f0";
    infoSvg += `<rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="16" fill="${bg}" />`;
    infoSvg += `<rect x="${x}" y="${y}" width="${cardW}" height="${cardH}" rx="16" fill="none" stroke="${border}" stroke-width="1.5" />`;
    // Icon circle
    infoSvg += `<circle cx="${x + 34}" cy="${y + cardH / 2}" r="20" fill="${c.color}" opacity="0.12" />`;
    infoSvg += `<text x="${x + 34}" y="${y + cardH / 2 + 5}" font-family="${F}" font-size="13" font-weight="bold" fill="${c.color}" text-anchor="middle">${c.abbr}</text>`;
    // Label
    infoSvg += `<text x="${x + 64}" y="${y + 33}" font-family="${F}" font-size="12" fill="#64748b">${c.label}</text>`;
    // Value
    infoSvg += `<text x="${x + 64}" y="${y + 58}" font-family="${F}" font-size="15" font-weight="bold" fill="${c.hl ? "#dc2626" : "#0f172a"}">${c.value}</text>`;
  });

  const infoRows = Math.ceil(cards.length / 3);
  const afterInfoY = gridY + infoRows * (cardH + gapY);

  // ═══ CTA + FOOTER ═══
  const ctaY = Math.max(afterInfoY + 35, 940);
  const urlY = ctaY + 66;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="hdr" x1="0" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0f172a"/><stop offset="100%" stop-color="#1e3a5f"/>
    </linearGradient>
    <linearGradient id="tc" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a5f"/><stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
    <linearGradient id="cta" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f97316"/><stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
    <filter id="ts" x="-3%" y="-5%" width="106%" height="115%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#1e3a5f" flood-opacity="0.22"/>
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.06"/>
    </filter>
    <filter id="cs" x="-2%" y="-3%" width="104%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#000" flood-opacity="0.06"/>
    </filter>
    <filter id="bs" x="-4%" y="-10%" width="108%" height="130%">
      <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#ea580c" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Light background -->
  <rect width="${W}" height="${H}" fill="#f1f5f9"/>

  <!-- Blue header bar -->
  <rect width="${W}" height="${headerH}" fill="url(#hdr)"/>
  <!-- Orange accent line at header bottom -->
  <rect x="0" y="${headerH - 4}" width="${W}" height="4" fill="#f97316"/>

  <!-- JobGuin&#233;e logo (large, centered in header) -->
  ${siteLogoSvg}
  <!-- AVIS DE RECRUTEMENT -->
  <text x="${CX}" y="${headerH - 14}" font-family="${F}" font-size="14" font-weight="600" fill="rgba(255,255,255,0.75)" text-anchor="middle" letter-spacing="3">AVIS DE RECRUTEMENT</text>

  ${badgesSvg}

  <!-- Company logo + name (centered) -->
  ${companyLogoSvg}
  <text x="${cNameX}" y="${cNameY}" font-family="${F}" font-size="24" fill="#0f172a" font-weight="bold" text-anchor="${cNameAnchor}">${companyShort}</text>

  <!-- "recherche un(e)" -->
  <text x="${CX}" y="${rechercheY}" font-family="${F}" font-size="17" fill="#64748b" text-anchor="middle">recherche un(e)</text>

  <!-- Title card (blue gradient, 3D, rounded) -->
  <rect x="${tcX}" y="${tcY}" width="${tcW}" height="${tcH}" rx="22" fill="url(#tc)" filter="url(#ts)"/>
  <rect x="${tcX + 2}" y="${tcY + 2}" width="${tcW - 4}" height="${Math.floor(tcH * 0.4)}" rx="20" fill="white" opacity="0.06"/>
  ${titleSvg}

  <!-- Location / Level / Posts pills -->
  ${barSvg}

  <!-- Info cards grid -->
  <g filter="url(#cs)">
    ${infoSvg}
  </g>

  <!-- CTA button (orange) -->
  <rect x="${CX - 260}" y="${ctaY}" width="520" height="54" rx="27" fill="url(#cta)" filter="url(#bs)"/>
  <text x="${CX}" y="${ctaY + 35}" font-family="${F}" font-size="19" font-weight="bold" fill="white" text-anchor="middle">Postulez directement via JobGuin&#233;e</text>

  <!-- Site URL -->
  <text x="${CX}" y="${urlY}" font-family="${F}" font-size="15" fill="#1e3a5f" text-anchor="middle" font-weight="600">www.jobguinee-pro.com</text>

  <!-- Bottom orange accent -->
  <rect x="0" y="${H - 6}" width="${W}" height="6" fill="#f97316"/>
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
      createdAt: (job as any).created_at || "",
      publicationDuration: (job as any).publication_duration || "30 jours",
      positionCount: (job as any).position_count || 1,
      positionLevel: (job as any).position_level || "",
      language: (job as any).announcement_language || "",
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
