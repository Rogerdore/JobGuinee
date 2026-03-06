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
  ai_matching_score: number;
  applied_at: string;
  candidate: { full_name: string; email: string; };
  job: { title: string; location: string; };
}

function generateDigestHtml(
  recruiterName: string,
  applications: Application[],
  settings: RecruiterSettings,
  digestDate: string,
  siteUrl: string
): { subject: string; htmlBody: string; textBody: string } {
  const subject = `Rapport quotidien – ${applications.length} candidature(s) – ${digestDate}`;

  const appRows = applications.map((app, i) => {
    const scoreHtml = settings.include_candidate_scores && app.ai_matching_score
      ? `<span style="background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600">${Math.round(app.ai_matching_score)}/100</span>`
      : '';
    const linkHtml = settings.include_direct_links
      ? `<a href="${siteUrl}/recruiter-dashboard?tab=pipeline&application=${app.id}" style="color:#2563eb;font-size:12px">Voir dans le pipeline →</a>`
      : '';
    return `
      <tr style="border-bottom:1px solid #f3f4f6">
        <td style="padding:12px 8px;color:#374151;font-size:14px">${i + 1}</td>
        <td style="padding:12px 8px">
          <div style="font-weight:600;color:#111827;font-size:14px">${app.candidate?.full_name || 'Candidat'}</div>
          <div style="color:#6b7280;font-size:12px">${app.candidate?.email || ''}</div>
        </td>
        <td style="padding:12px 8px">
          <div style="color:#374151;font-size:14px">${app.job?.title || ''}</div>
          <div style="color:#6b7280;font-size:12px">${app.job?.location || ''}</div>
        </td>
        <td style="padding:12px 8px">${scoreHtml}</td>
        <td style="padding:12px 8px">${linkHtml}</td>
      </tr>`;
  }).join('');

  const summaryByJob = new Map<string, number>();
  applications.forEach(app => {
    const t = app.job?.title || 'Poste';
    summaryByJob.set(t, (summaryByJob.get(t) || 0) + 1);
  });
  const summaryRows = Array.from(summaryByJob.entries()).map(([title, count]) =>
    `<tr><td style="padding:8px 12px;color:#374151;font-size:14px">${title}</td><td style="padding:8px 12px;color:#2563eb;font-weight:600;font-size:14px">${count}</td></tr>`
  ).join('');

  const contentSection = applications.length === 0
    ? `<div style="text-align:center;padding:40px 20px;color:#6b7280">
        <p style="font-size:16px">Aucune nouvelle candidature aujourd'hui.</p>
        <p style="font-size:14px">Consultez votre espace recruteur pour gérer vos offres en cours.</p>
       </div>`
    : settings.digest_format === 'detailed'
      ? `<table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f9fafb">
            <th style="padding:10px 8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600">#</th>
            <th style="padding:10px 8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600">CANDIDAT</th>
            <th style="padding:10px 8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600">POSTE</th>
            <th style="padding:10px 8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600">SCORE IA</th>
            <th style="padding:10px 8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600">ACTION</th>
          </tr></thead>
          <tbody>${appRows}</tbody>
        </table>`
      : `<table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f9fafb">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600">OFFRE</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600">CANDIDATURES</th>
          </tr></thead>
          <tbody>${summaryRows}</tbody>
        </table>`;

  const pipelineLink = `${siteUrl}/recruiter-dashboard?tab=pipeline`;

  const htmlBody = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">

    <div style="background:linear-gradient(135deg,#1e40af,#2563eb);padding:32px 40px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700">Rapport Quotidien</h1>
      <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px">${digestDate}</p>
    </div>

    <div style="padding:32px 40px">
      <p style="color:#374151;font-size:16px;margin:0 0 24px">Bonjour <strong>${recruiterName}</strong>,</p>

      <div style="display:flex;gap:16px;margin-bottom:28px">
        <div style="flex:1;background:#eff6ff;border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:32px;font-weight:700;color:#1d4ed8">${applications.length}</div>
          <div style="font-size:12px;color:#3b82f6;font-weight:500;margin-top:4px">NOUVELLE(S) CANDIDATURE(S)</div>
        </div>
      </div>

      ${applications.length > 0 ? `
      <h3 style="color:#111827;font-size:15px;font-weight:600;margin:0 0 12px;border-bottom:1px solid #e5e7eb;padding-bottom:8px">
        ${settings.digest_format === 'detailed' ? 'Détail des candidatures' : 'Résumé par offre'}
      </h3>` : ''}

      ${contentSection}

      ${applications.length > 0 ? `
      <div style="text-align:center;margin-top:28px">
        <a href="${pipelineLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Voir dans le pipeline →
        </a>
      </div>` : ''}
    </div>

    <div style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center">
      <p style="margin:0;font-size:12px;color:#9ca3af">
        JobGuinée – Plateforme emploi &amp; RH en Guinée<br>
        Vous recevez cet email car vous avez activé le rapport quotidien.
      </p>
    </div>
  </div>
</body>
</html>`;

  const textBody = `Rapport quotidien – ${digestDate}\n\nBonjour ${recruiterName},\n\n${applications.length} nouvelle(s) candidature(s) reçue(s) aujourd'hui.\n\n${applications.map((a, i) => `${i + 1}. ${a.candidate?.full_name || ''} – ${a.job?.title || ''}`).join('\n')}\n\nVoir dans le pipeline : ${pipelineLink}\n\nJobGuinée`;

  return { subject, htmlBody, textBody };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const siteUrl = Deno.env.get('SITE_URL') || 'https://jobguinee.com';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getUTCHours();

    console.log(`[DIGEST] Running at ${now.toISOString()}, hour=${currentHour}`);

    // Vérifier que le digest est activé dans email_event_settings
    const { data: eventSetting } = await supabase
      .from('email_event_settings')
      .select('is_enabled')
      .eq('event_key', 'recruiter_daily_digest')
      .maybeSingle();

    if (eventSetting && !eventSetting.is_enabled) {
      return new Response(
        JSON.stringify({ message: 'Daily digest disabled in event settings', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: settings, error: settingsError } = await supabase
      .from('recruiter_notification_settings')
      .select('*')
      .eq('daily_digest_enabled', true)
      .eq('daily_digest_hour', currentHour);

    if (settingsError) throw settingsError;

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
        // Vérifier si déjà envoyé aujourd'hui
        const { data: existingDigest } = await supabase
          .from('daily_digest_log')
          .select('id')
          .eq('recruiter_id', setting.recruiter_id)
          .eq('digest_date', today)
          .maybeSingle();

        if (existingDigest) {
          console.log(`[SKIP] Already sent for recruiter ${setting.recruiter_id}`);
          continue;
        }

        const { data: recruiter } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', setting.recruiter_id)
          .single();

        if (!recruiter?.email) {
          console.error(`[ERROR] No email for recruiter ${setting.recruiter_id}`);
          failed++;
          continue;
        }

        const { data: recruiterJobs } = await supabase
          .from('jobs')
          .select('id')
          .eq('user_id', setting.recruiter_id);

        if (!recruiterJobs || recruiterJobs.length === 0) {
          console.log(`[SKIP] No jobs for recruiter ${setting.recruiter_id}`);
          continue;
        }

        const jobIds = recruiterJobs.map(j => j.id);
        const startOfDay = `${today}T00:00:00Z`;
        const endOfDay = `${today}T23:59:59Z`;

        const { data: applications } = await supabase
          .from('applications')
          .select(`
            id, application_reference, candidate_id, job_id,
            ai_matching_score, applied_at,
            candidate:profiles!applications_candidate_id_fkey(full_name, email),
            job:jobs(title, location)
          `)
          .in('job_id', jobIds)
          .gte('applied_at', startOfDay)
          .lte('applied_at', endOfDay);

        const appCount = applications?.length || 0;

        if (appCount === 0 && !setting.include_zero_applications) {
          console.log(`[SKIP] No applications for recruiter ${setting.recruiter_id}`);
          continue;
        }

        const digestDate = new Date(today).toLocaleDateString('fr-FR', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const { subject, htmlBody, textBody } = generateDigestHtml(
          (recruiter as RecruiterProfile).full_name || 'Recruteur',
          (applications || []) as Application[],
          setting,
          digestDate,
          siteUrl
        );

        // Envoyer réellement l'email via send-email
        const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            to: (recruiter as RecruiterProfile).email,
            toName: (recruiter as RecruiterProfile).full_name,
            subject,
            htmlBody,
            textBody,
          }),
        });

        const sendResult = await sendResponse.json();
        const sendSuccess = sendResponse.ok;

        if (!sendSuccess) {
          console.error(`[ERROR] Failed to send digest to ${(recruiter as RecruiterProfile).email}:`, sendResult);
        }

        // Logger l'envoi
        const { data: emailLog } = await supabase
          .from('email_logs')
          .insert({
            recipient_id: setting.recruiter_id,
            recipient_email: (recruiter as RecruiterProfile).email,
            email_type: 'recruiter_daily_digest',
            template_code: 'daily_digest',
            subject,
            body_text: textBody,
            body_html: htmlBody,
            provider: 'hostinger',
            status: sendSuccess ? 'delivered' : 'failed',
            sent_at: now.toISOString(),
            provider_message_id: sendResult?.messageId,
          })
          .select('id')
          .single();

        // Marquer dans le digest log
        await supabase.from('daily_digest_log').insert({
          recruiter_id: setting.recruiter_id,
          digest_date: today,
          applications_count: appCount,
          applications_ids: (applications || []).map(a => a.id),
          status: sendSuccess ? 'sent' : 'failed',
          email_log_id: emailLog?.id,
          sent_at: now.toISOString(),
        });

        if (sendSuccess) {
          console.log(`[SUCCESS] Digest sent to ${(recruiter as RecruiterProfile).email}`);
          processed++;
        } else {
          failed++;
        }

      } catch (err) {
        console.error(`[ERROR] Recruiter ${setting.recruiter_id}:`, err);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ message: 'Daily digest processing completed', processed, failed, total: settings.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[FATAL]', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
