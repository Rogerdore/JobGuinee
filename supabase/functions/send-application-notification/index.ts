import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    const { candidateName, candidateEmail, jobTitle, company, recruiterId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get recruiter email
    const { data: recruiterProfile } = await supabaseClient
      .from('profiles')
      .select('email:user_id(email)')
      .eq('id', recruiterId)
      .single();

    console.log('📧 Email notifications sent (simulation mode)');
    console.log('To Candidate:', candidateEmail);
    console.log('To Recruiter:', recruiterProfile?.email || 'unknown');
    console.log('Job:', jobTitle, 'at', company);

    // TODO: Integrate with Brevo API when configured
    // For now, we just log the notification

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications sent successfully',
        mode: 'simulation'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error sending notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
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
