import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

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

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('[Cron] Exécution désactivation badges expirés...');

    const { data, error } = await supabase.rpc('expire_job_badges');

    if (error) {
      console.error('[Cron] Erreur:', error);
      throw error;
    }

    const result = data as { success: boolean; message: string; expired_count: number; processed_at: string };

    console.log(`[Cron] Succès: ${result.message}`);
    console.log(`[Cron] Badges expirés désactivés: ${result.expired_count}`);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[Cron] Erreur critique:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur inconnue',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
