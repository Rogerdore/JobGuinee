import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface JobData {
  id: string;
  title: string;
  company: string;
  location: string;
  contract_type: string;
  salary_range?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { job_id } = await req.json();

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'job_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, company, location, contract_type, salary_range')
      .eq('id', job_id)
      .maybeSingle();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const imageUrl = await generateShareImage(job as JobData);

    return new Response(
      JSON.stringify({
        success: true,
        image_url: imageUrl,
        job_id: job_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating share image:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function generateShareImage(job: JobData): Promise<string> {
  const width = 1200;
  const height = 630;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0E2F56;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1E4976;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <rect width="${width}" height="${height}" fill="url(#gradient)" />
      
      <text x="60" y="80" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#FFFFFF">
        JobGuinée
      </text>
      
      <text x="${width / 2}" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#FFFFFF">
        ${escapeXml(truncateText(job.title, 50))}
      </text>
      
      <text x="${width / 2}" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#E0E0E0">
        ${escapeXml(job.company)}
      </text>
      
      <text x="${width / 2}" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#B0B0B0">
        📍 ${escapeXml(job.location)} • 💼 ${escapeXml(job.contract_type)}
      </text>
      
      ${job.salary_range ? `
      <text x="${width / 2}" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#90EE90">
        💰 ${escapeXml(job.salary_range)}
      </text>
      ` : ''}
      
      <rect x="${(width - 400) / 2}" y="500" width="400" height="60" rx="30" fill="#FFA500" />
      
      <text x="${width / 2}" y="540" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#FFFFFF">
        Postuler sur JobGuinée
      </text>
    </svg>
  `;

  const base64Image = btoa(svg);
  const dataUrl = `data:image/svg+xml;base64,${base64Image}`;

  return dataUrl;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}