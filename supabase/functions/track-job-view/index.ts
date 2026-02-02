import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface TrackJobViewRequest {
  job_id: string;
  session_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Récupérer le token de l'utilisateur depuis le header Authorization
    const authHeader = req.headers.get('Authorization');
    const userToken = authHeader?.replace('Bearer ', '') || '';

    // Créer un client avec le token utilisateur pour auth.uid()
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: {
          Authorization: authHeader || ''
        }
      }
    });

    const { job_id, session_id } = await req.json() as TrackJobViewRequest;

    if (!job_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'job_id requis' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extraire les métadonnées de la requête
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    
    // Hasher l'IP pour RGPD
    const encoder = new TextEncoder();
    const ipData = encoder.encode(clientIp);
    const hashBuffer = await crypto.subtle.digest('SHA-256', ipData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const ipHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Appeler la fonction RPC sécurisée
    const { data, error } = await supabase.rpc('track_job_view_secure', {
      p_job_id: job_id,
      p_session_id: session_id || null,
      p_ip_hash: ipHash,
      p_user_agent: userAgent,
    });

    if (error) {
      console.error('Erreur RPC track_job_view_secure:', error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erreur Edge Function track-job-view:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
