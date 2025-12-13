import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@^2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RecruiterSettings {
  id: string;
  recruiter_id: string;
  daily_digest_enabled: boolean;
  daily_digest_hour: number;
  daily_digest_timezone: string;
  include_zero_applications: boolean;
  digest_format: 'summary' | 'detailed';
  include_candidate_scores: boolean;
  include_direct_links: boolean;
}

interface RecruiterProfile {
  id: string;
  full_name: string;
  email: string;
}

interface Application {
  id: string;
  application_reference: string;
  candidate_id: string;
  job_id: string;
  ai_match_score: number;
  applied_at: string;
  candidate: {
    full_name: string;
    email: string;
  };
  job: {
    title: string;
    location: string;
  };
}

function generateDigestEmail(
  recruiterName: string,
  applications: Application[],
  settings: RecruiterSettings,
  digestDate: string
): { subject: string; body: string } {
  const subject = `Rapport quotidien – ${applications.length} candidature(s) reçue(s) – ${digestDate}`;

  let body = `Bonjour ${recruiterName},

Voici le récapitulatif de vos candidatures reçues aujourd'hui (${digestDate}).

`;

  if (applications.length === 0) {
    body += `📭 Aucune nouvelle candidature aujourd'hui.

Consultez votre espace recruteur pour gérer vos offres en cours.

`;
  } else {
    body += `📊 RÉSUMÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📬 ${applications.length} nouvelle(s) candidature(s)

`;

    if (settings.digest_format === 'detailed') {
      body += `📋 CANDIDATURES DÉTAILLÉES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

      applications.forEach((app, index) => {
        body += `${index + 1}. ${app.candidate.full_name}
`;
        body += `   📧 ${app.candidate.email}\n`;
        body += `   💼 Poste : ${app.job.title}\n`;
        body += `   📍 ${app.job.location || 'Non spécifié'}\n`;
        body += `   🔖 Réf : ${app.application_reference}\n`;

        if (settings.include_candidate_scores) {
          body += `   🎯 Score IA : ${app.ai_match_score}/100\n`;
        }

        if (settings.include_direct_links) {
          const pipelineLink = `${Deno.env.get('SITE_URL') || 'https://jobguinee.com'}/recruiter-dashboard?tab=pipeline&application=${app.id}`;
          body += `   👉 Voir dans le pipeline : ${pipelineLink}\n`;
        }

        body += `\n`;
      });
    } else {
      const jobsMap = new Map<string, number>();
      applications.forEach(app => {
        const count = jobsMap.get(app.job.title) || 0;
        jobsMap.set(app.job.title, count + 1);
      });

      body += `📋 PAR OFFRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
      jobsMap.forEach((count, jobTitle) => {
        body += `• ${jobTitle} : ${count} candidature(s)\n`;
      });
      body += `\n`;
    }

    body += `🔗 ACTION REQUISE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Consultez vos candidatures dans votre pipeline :
👉 ${Deno.env.get('SITE_URL') || 'https://jobguinee.com'}/recruiter-dashboard?tab=pipeline

`;
  }

  body += `Cordialement,
JobGuinée

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Vous recevez cet email car vous avez activé le rapport quotidien.
Pour modifier vos préférences, rendez-vous dans les paramètres de votre compte.
`;

  return { subject, body };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();

    console.log(`[CRON] Running daily digest processor at ${now.toISOString()}`);
    console.log(`[CRON] Current hour: ${currentHour}, Today: ${today}`);

    const { data: settings, error: settingsError } = await supabase
      .from('recruiter_notification_settings')
      .select('*')
      .eq('daily_digest_enabled', true)
      .eq('daily_digest_hour', currentHour);

    if (settingsError) {
      console.error('[ERROR] Failed to fetch settings:', settingsError);
      throw settingsError;
    }

    console.log(`[INFO] Found ${settings?.length || 0} recruiters to process`);

    if (!settings || settings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No recruiters to process at this hour', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let processed = 0;
    let failed = 0;

    for (const setting of settings as RecruiterSettings[]) {
      try {
        const { data: existingDigest } = await supabase
          .from('daily_digest_log')
          .select('id')
          .eq('recruiter_id', setting.recruiter_id)
          .eq('digest_date', today)
          .maybeSingle();

        if (existingDigest) {
          console.log(`[SKIP] Digest already sent for recruiter ${setting.recruiter_id}`);
          continue;
        }

        const { data: recruiter, error: recruiterError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', setting.recruiter_id)
          .single();

        if (recruiterError || !recruiter) {
          console.error(`[ERROR] Recruiter not found: ${setting.recruiter_id}`);
          failed++;
          continue;
        }

        const startOfDay = `${today}T00:00:00Z`;
        const endOfDay = `${today}T23:59:59Z`;

        const { data: applications, error: appsError } = await supabase
          .from('applications')
          .select(`
            id,
            application_reference,
            candidate_id,
            job_id,
            ai_match_score,
            applied_at,
            candidate:profiles!applications_candidate_id_fkey(
              full_name,
              email
            ),
            job:jobs(
              title,
              location
            )
          `)
          .eq('job.user_id', setting.recruiter_id)
          .gte('applied_at', startOfDay)
          .lte('applied_at', endOfDay);

        if (appsError) {
          console.error(`[ERROR] Failed to fetch applications:`, appsError);
          failed++;
          continue;
        }

        const applicationsCount = applications?.length || 0;

        if (applicationsCount === 0 && !setting.include_zero_applications) {
          console.log(`[SKIP] No applications for recruiter ${setting.recruiter_id}`);
          continue;
        }

        const digestDate = new Date(today).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const { subject, body } = generateDigestEmail(
          (recruiter as RecruiterProfile).full_name || 'Recruteur',
          (applications || []) as Application[],
          setting,
          digestDate
        );

        const { data: emailLog, error: emailError } = await supabase
          .from('email_logs')
          .insert({
            recipient_id: setting.recruiter_id,
            recipient_email: (recruiter as RecruiterProfile).email,
            email_type: 'recruiter_daily_digest',
            template_code: 'daily_digest',
            subject,
            body_text: body,
            status: 'sent',
            sent_at: now.toISOString()
          })
          .select('id')
          .single();

        if (emailError) {
          console.error(`[ERROR] Failed to log email:`, emailError);
          failed++;
          continue;
        }

        const applicationIds = (applications || []).map((app: Application) => app.id);

        await supabase
          .from('daily_digest_log')
          .insert({
            recruiter_id: setting.recruiter_id,
            digest_date: today,
            applications_count: applicationsCount,
            applications_ids: applicationIds,
            status: 'sent',
            email_log_id: emailLog?.id,
            sent_at: now.toISOString()
          });

        console.log(`[SUCCESS] Digest sent to ${(recruiter as RecruiterProfile).email} (${applicationsCount} applications)`);
        console.log(`[EMAIL] Subject: ${subject}`);
        processed++;

      } catch (error) {
        console.error(`[ERROR] Failed to process recruiter ${setting.recruiter_id}:`, error);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Daily digest processing completed',
        processed,
        failed,
        total: settings.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[FATAL ERROR]', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
