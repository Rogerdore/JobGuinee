import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface JobData {
  id: string;
  title: string;
  company_name?: string;
  location?: string;
  contract_type?: string;
  salary_min?: number;
  salary_max?: number;
  featured_image_url?: string;
  company_logo_url?: string;
  companies?: {
    name: string;
    logo_url?: string;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get("job_id");
    const network = url.searchParams.get("network") || "default";

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "job_id parameter is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if image already exists in storage
    const imagePath = `jobs/${jobId}/${network}.png`;
    const { data: existingImage } = await supabase.storage
      .from("og-images")
      .list(`jobs/${jobId}`, {
        search: `${network}.png`,
      });

    if (existingImage && existingImage.length > 0) {
      // Image exists, return URL
      const imageUrl = `${supabaseUrl}/storage/v1/object/public/og-images/${imagePath}`;
      return new Response(
        JSON.stringify({
          success: true,
          image_url: imageUrl,
          cached: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch job data
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        *,
        companies (
          name,
          logo_url
        )
      `)
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate SVG image
    const svgContent = generateOGImageSVG(job as JobData);

    // For now, return the SVG directly
    // In production, you would convert SVG to PNG using a service
    // and upload to storage

    // Save SVG as PNG placeholder (in real implementation, use PNG conversion service)
    const svgBlob = new Blob([svgContent], { type: "image/svg+xml" });

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("og-images")
      .upload(imagePath, svgBlob, {
        contentType: "image/svg+xml",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
    }

    const imageUrl = `${supabaseUrl}/storage/v1/object/public/og-images/${imagePath}`;

    return new Response(
      JSON.stringify({
        success: true,
        image_url: imageUrl,
        cached: false,
        note: "SVG format - consider using PNG conversion service for production"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateOGImageSVG(job: JobData): string {
  const company = job.companies?.name || job.company_name || "Entreprise";
  const title = truncateText(job.title || "Offre d'emploi", 60);
  const location = job.location || "Guinée";
  const contractType = job.contract_type || "";

  let salary = "";
  if (job.salary_min && job.salary_max) {
    salary = `${formatSalary(job.salary_min)} - ${formatSalary(job.salary_max)} GNF`;
  }

  // Get logo URL
  let logoUrl = "";
  if (job.featured_image_url && job.featured_image_url.startsWith("http")) {
    logoUrl = job.featured_image_url;
  } else if (job.company_logo_url) {
    logoUrl = job.company_logo_url;
  } else if (job.companies?.logo_url) {
    logoUrl = job.companies.logo_url;
  }

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0E2F56;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a4a7e;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>

  <!-- Pattern overlay -->
  <g opacity="0.05">
    <circle cx="100" cy="100" r="200" fill="#ffffff"/>
    <circle cx="1100" cy="530" r="250" fill="#ffffff"/>
  </g>

  <!-- Main content card -->
  <rect x="60" y="80" width="1080" height="470" rx="20" fill="white" filter="url(#shadow)"/>

  <!-- Logo area -->
  ${logoUrl ? `
  <image x="100" y="120" width="120" height="120" href="${escapeXml(logoUrl)}"
         preserveAspectRatio="xMidYMid meet" clip-path="inset(0 round 12px)"/>
  ` : `
  <rect x="100" y="120" width="120" height="120" rx="12" fill="#f0f9ff"/>
  <text x="160" y="195" font-family="Arial, sans-serif" font-size="48" font-weight="bold"
        fill="#0E2F56" text-anchor="middle">JG</text>
  `}

  <!-- Job title -->
  <text x="250" y="165" font-family="Arial, sans-serif" font-size="42" font-weight="bold"
        fill="#0E2F56" style="max-width: 850px;">
    ${escapeXml(title)}
  </text>

  <!-- Company name -->
  <text x="250" y="210" font-family="Arial, sans-serif" font-size="28" font-weight="600"
        fill="#1a4a7e">
    ${escapeXml(company)}
  </text>

  <!-- Info badges -->
  <g transform="translate(100, 280)">
    ${location ? `
    <rect x="0" y="0" width="${getTextWidth(location, 20) + 40}" height="44" rx="22" fill="#f0f9ff"/>
    <text x="20" y="28" font-family="Arial, sans-serif" font-size="20" fill="#0E2F56">
      📍 ${escapeXml(location)}
    </text>
    ` : ''}

    ${contractType ? `
    <rect x="${location ? getTextWidth(location, 20) + 60 : 0}" y="0"
          width="${getTextWidth(contractType, 20) + 40}" height="44" rx="22" fill="#f0f9ff"/>
    <text x="${location ? getTextWidth(location, 20) + 80 : 20}" y="28"
          font-family="Arial, sans-serif" font-size="20" fill="#0E2F56">
      💼 ${escapeXml(contractType)}
    </text>
    ` : ''}
  </g>

  ${salary ? `
  <g transform="translate(100, 350)">
    <rect x="0" y="0" width="${getTextWidth(salary, 24) + 40}" height="50" rx="25" fill="#e6f7ff"/>
    <text x="20" y="32" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="#0E2F56">
      💰 ${escapeXml(salary)}
    </text>
  </g>
  ` : ''}

  <!-- JobGuinée badge -->
  <g transform="translate(100, 450)">
    <rect x="0" y="0" width="220" height="60" rx="12" fill="#0E2F56"/>
    <text x="110" y="40" font-family="Arial, sans-serif" font-size="28" font-weight="bold"
          fill="white" text-anchor="middle">
      JobGuinée
    </text>
  </g>

  <!-- CTA -->
  <text x="1040" y="495" font-family="Arial, sans-serif" font-size="22"
        fill="#666" text-anchor="end">
    Postulez maintenant →
  </text>
</svg>`;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

function formatSalary(amount: number): string {
  return new Intl.NumberFormat("fr-GN").format(amount);
}

function escapeXml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getTextWidth(text: string, fontSize: number): number {
  // Rough estimation: average character width is ~0.5-0.6 of font size
  return text.length * fontSize * 0.55;
}
