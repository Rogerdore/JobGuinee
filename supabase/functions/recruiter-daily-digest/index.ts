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
  cv_url: string | null;
  candidate: {
    full_name: string;
    email: string;
    profile_completion_percentage: number | null;
    cv_url: string | null;
    cover_letter_url: string | null;
    certificates_url: string | null;
  };
  job: { title: string; location: string; application_email: string | null; };
}

// Phrases d'accroche modernes aléatoires
const GREETING_PHRASES = [
  'Voici ce qui s\'est passé côté candidatures aujourd\'hui.',
  'De nouveaux talents ont frappé à votre porte — découvrez-les.',
  'Tour d\'horizon de vos candidatures fraîchement reçues.',
  'Bonne nouvelle : des profils intéressants vous attendent.',
  'Votre récap quotidien est prêt. Voyons qui a postulé !',
];

const ZERO_APP_PHRASES = [
  'Journée calme côté candidatures — c\'est le moment idéal pour optimiser vos offres.',
  'Aucune nouvelle candidature aujourd\'hui, mais vos offres travaillent pour vous.',
  'Rien de nouveau pour le moment. Pensez à booster la visibilité de vos annonces !',
];

const CTA_PHRASES = [
  'Connectez-vous à votre espace recruteur pour consulter les profils complets, télécharger les CV et gérer vos candidatures.',
  'Tous les détails vous attendent dans votre espace : profils, CV, documents et coordonnées des candidats.',
  'Retrouvez chaque candidature dans votre espace recruteur — profils détaillés, CV téléchargeables et bien plus.',
];

const SIGNUP_PHRASES = [
  'Créez votre espace recruteur gratuitement et accédez à des outils puissants pour gérer vos recrutements.',
  'Rejoignez des centaines de recruteurs qui simplifient déjà leur processus de recrutement avec JobGuinée.',
  'Passez à la vitesse supérieure : créez votre compte et centralisez toutes vos candidatures en un seul endroit.',
];

const MATCHING_PHRASES = [
  'Gagnez du temps : notre IA de matching analyse chaque profil et vous propose une présélection intelligente, calibrée sur vos critères ou le contenu de votre offre.',
  'Besoin d\'aide pour trier ? Notre outil de matching IA identifie les meilleurs profils en quelques secondes — basé sur vos exigences précises.',
  'Laissez notre intelligence artificielle faire le tri : présélection automatique des candidats les plus pertinents selon vos critères spécifiques.',
];

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateDigestHtml(
  recruiterName: string,
  applications: Application[],
  settings: RecruiterSettings,
  digestDate: string,
  siteUrl: string,
  hasAccount: boolean,
  tokenMap: Map<string, string>,
): { subject: string; htmlBody: string; textBody: string } {
  const logoUrl = `${siteUrl}/logo_jobguinee.png`;
  const pipelineLink = `${siteUrl}/recruiter-dashboard?tab=pipeline`;
  const signupLink = `${siteUrl}/signup-recruiter`;
  const matchingLink = `${siteUrl}/recruiter-dashboard?tab=ai-matching`;

  const subject = applications.length > 0
    ? `${applications.length} nouvelle(s) candidature(s) — ${digestDate}`
    : `Votre rapport quotidien — ${digestDate}`;

  const greetingPhrase = applications.length > 0
    ? pickRandom(GREETING_PHRASES)
    : pickRandom(ZERO_APP_PHRASES);

  const ctaPhrase = pickRandom(CTA_PHRASES);
  const signupPhrase = pickRandom(SIGNUP_PHRASES);
  const matchingPhrase = pickRandom(MATCHING_PHRASES);

  // -- Detailed rows with completion %, profile link, CV/documents --
  const MAX_DISPLAY = 20;
  const displayedApps = applications.slice(0, MAX_DISPLAY);
  const overflowCount = applications.length - displayedApps.length;
  const appRows = displayedApps.map((app, i) => {
    const token = tokenMap.get(app.candidate_id);
    const completion = app.candidate?.profile_completion_percentage ?? 0;
    const completionColor = completion >= 80 ? '#16a34a' : completion >= 50 ? '#f59e0b' : '#ef4444';
    const completionLabel = completion >= 80 ? 'Complet' : completion >= 50 ? 'Partiel' : 'Incomplet';

    // Determine best CV URL: application cv_url > profile cv_url
    const cvUrl = app.cv_url || app.candidate?.cv_url || null;
    const coverLetterUrl = app.candidate?.cover_letter_url || null;
    const certificatesUrl = app.candidate?.certificates_url || null;
    const hasDocuments = cvUrl || coverLetterUrl || certificatesUrl;

    // Profile link (public profile if available)
    const profileLinkHtml = token
      ? `<a href="${siteUrl}/profil/${token}" style="color:#2563eb;font-size:12px;font-weight:600;text-decoration:none">&#128100; Voir le profil</a>`
      : `<span style="color:#d1d5db;font-size:11px;font-style:italic">Pas de profil public</span>`;

    // Document download links
    const docLinks: string[] = [];
    if (cvUrl) docLinks.push(`<a href="${cvUrl}" style="color:#059669;font-size:11px;text-decoration:none;font-weight:500" target="_blank">&#128196; CV</a>`);
    if (coverLetterUrl) docLinks.push(`<a href="${coverLetterUrl}" style="color:#059669;font-size:11px;text-decoration:none;font-weight:500" target="_blank">&#9993; LM</a>`);
    if (certificatesUrl) docLinks.push(`<a href="${certificatesUrl}" style="color:#059669;font-size:11px;text-decoration:none;font-weight:500" target="_blank">&#127891; Certificats</a>`);
    const docsHtml = docLinks.length > 0
      ? docLinks.join(' &nbsp;&#183;&nbsp; ')
      : `<span style="color:#d1d5db;font-size:11px;font-style:italic">Aucun document</span>`;

    return `
      <tr style="border-bottom:1px solid #f0f0f0">
        <td style="padding:16px 10px;color:#6b7280;font-size:13px;vertical-align:top;width:28px">${i + 1}</td>
        <td style="padding:16px 10px;vertical-align:top">
          <div style="font-weight:600;color:#111827;font-size:14px;margin-bottom:3px">${app.candidate?.full_name || 'Candidat'}</div>
          <div style="color:#6b7280;font-size:12px;margin-bottom:6px">${app.candidate?.email || ''}</div>
          <!-- Completion bar (table-based for Outlook) -->
          <table cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>
            <td style="width:80px;padding:0"><div style="width:80px;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden"><div style="width:${completion}%;height:6px;background:${completionColor};border-radius:3px"></div></div></td>
            <td style="padding:0 0 0 6px;font-size:10px;color:${completionColor};font-weight:600;white-space:nowrap">${completion}%</td>
            <td style="padding:0 0 0 4px;font-size:10px;color:#9ca3af;white-space:nowrap">${completionLabel}</td>
          </tr></table>
        </td>
        <td style="padding:16px 10px;vertical-align:top">
          <div style="color:#374151;font-size:14px;font-weight:500;margin-bottom:2px">${app.job?.title || ''}</div>
          <div style="color:#9ca3af;font-size:12px">${app.job?.location || ''}</div>
        </td>
        <td style="padding:16px 10px;vertical-align:top;width:150px">
          <div style="margin-bottom:6px">${profileLinkHtml}</div>
          <div>${docsHtml}</div>
        </td>
      </tr>`;
  }).join('');

  // -- Summary rows --
  const summaryByJob = new Map<string, number>();
  applications.forEach(app => {
    const t = app.job?.title || 'Poste';
    summaryByJob.set(t, (summaryByJob.get(t) || 0) + 1);
  });
  const summaryRows = Array.from(summaryByJob.entries()).map(([title, count]) =>
    `<tr style="border-bottom:1px solid #f0f0f0">
      <td style="padding:10px 14px;color:#374151;font-size:14px">${title}</td>
      <td style="padding:10px 14px;color:#2563eb;font-weight:700;font-size:16px;text-align:center">${count}</td>
    </tr>`
  ).join('');

  // -- Content section --
  const contentSection = applications.length === 0
    ? `<div style="text-align:center;padding:40px 24px">
        <div style="font-size:48px;margin-bottom:12px">&#128172;</div>
        <p style="font-size:16px;color:#374151;margin:0 0 8px;font-weight:500">${greetingPhrase}</p>
        <p style="font-size:14px;color:#9ca3af;margin:0">Vos offres restent visibles — les prochaines candidatures arrivent bientôt.</p>
       </div>`
    : settings.digest_format === 'detailed'
      ? `<table style="width:100%;border-collapse:collapse;margin-top:4px">
          <thead><tr style="background:#f9fafb">
            <th style="padding:10px 10px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">#</th>
            <th style="padding:10px 10px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Candidat</th>
            <th style="padding:10px 10px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Poste</th>
            <th style="padding:10px 10px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Profil &amp; Documents</th>
          </tr></thead>
          <tbody>${appRows}</tbody>
        </table>
        ${overflowCount > 0 ? `<p style="text-align:center;color:#6b7280;font-size:13px;margin:12px 0 0;font-style:italic">… et ${overflowCount} autre${overflowCount > 1 ? 's' : ''} candidature${overflowCount > 1 ? 's' : ''}. <a href="${pipelineLink}" style="color:#2563eb;font-weight:600;text-decoration:none">Voir tout &rarr;</a></p>` : ''}`
      : `<table style="width:100%;border-collapse:collapse;margin-top:4px">
          <thead><tr style="background:#f9fafb">
            <th style="padding:10px 14px;text-align:left;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Offre</th>
            <th style="padding:10px 14px;text-align:center;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Candidatures</th>
          </tr></thead>
          <tbody>${summaryRows}</tbody>
        </table>`;

  const htmlBody = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting"><title>JobGuin&eacute;e – Rapport Quotidien</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-text-size-adjust:100%">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6">
    <tr><td align="center" style="padding:32px 12px">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">

        <!-- HEADER: Logo + titre -->
        <tr>
          <td style="background:linear-gradient(135deg,#0E2F56 0%,#1a4a80 60%,#0d3d6e 100%);padding:28px 40px;text-align:center">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
              <td><img src="${logoUrl}" alt="JobGuin&eacute;e" width="44" height="44" style="display:block;border-radius:10px;border:0" /></td>
              <td style="padding-left:12px">
                <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px">Job</span><span style="color:#F59E0B;font-size:22px;font-weight:800;letter-spacing:-0.3px">Guin&eacute;e</span>
              </td>
            </tr></table>
            <p style="color:rgba(255,255,255,0.55);font-size:12px;margin:10px 0 0;letter-spacing:0.6px;text-transform:uppercase">Rapport Quotidien &mdash; ${digestDate}</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr><td style="padding:32px 40px">

          <!-- Greeting -->
          <p style="color:#374151;font-size:16px;margin:0 0 6px;line-height:1.5">Bonjour <strong>${recruiterName}</strong>,</p>
          <p style="color:#6b7280;font-size:14px;margin:0 0 28px;line-height:1.5">${greetingPhrase}</p>

          <!-- Stats card -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px">
            <tr><td style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:10px;padding:20px;text-align:center">
              <div style="font-size:36px;font-weight:800;color:#1d4ed8;line-height:1">${applications.length}</div>
              <div style="font-size:12px;color:#3b82f6;font-weight:600;margin-top:6px;letter-spacing:0.5px;text-transform:uppercase">nouvelle${applications.length > 1 ? 's' : ''} candidature${applications.length > 1 ? 's' : ''} reçue${applications.length > 1 ? 's' : ''}</div>
            </td></tr>
          </table>

          ${applications.length > 0 ? `
          <!-- Section title -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:4px">
            <tr>
              <td style="color:#111827;font-size:15px;font-weight:600;padding-bottom:10px;border-bottom:2px solid #2563eb">
                ${settings.digest_format === 'detailed' ? 'D&eacute;tail des candidatures' : 'R&eacute;sum&eacute; par offre'}
              </td>
            </tr>
          </table>` : ''}

          ${contentSection}

          ${applications.length > 0 ? `
          <!-- Recruiter space CTA or Signup push -->
          ${hasAccount ? `
          <!-- Has account: invite to espace recruteur -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:28px">
            <tr><td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px">
              <p style="margin:0 0 12px;color:#166534;font-size:14px;line-height:1.6;font-weight:500">
                &#127919; ${ctaPhrase}
              </p>
              <table cellpadding="0" cellspacing="0"><tr><td>
                <a href="${pipelineLink}" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 2px 8px rgba(37,99,235,0.3)">
                  Acc&eacute;der &agrave; mon espace recruteur &rarr;
                </a>
              </td></tr></table>
            </td></tr>
          </table>` : `
          <!-- No account: push to create one -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:28px">
            <tr><td style="background:linear-gradient(135deg,#fefce8,#fef9c3);border:1px solid #fde68a;border-radius:10px;padding:20px 24px">
              <p style="margin:0 0 6px;color:#92400e;font-size:15px;font-weight:700;line-height:1.4">
                &#128640; Ne laissez pas ces talents vous &eacute;chapper !
              </p>
              <p style="margin:0 0 14px;color:#78350f;font-size:13px;line-height:1.6">
                ${signupPhrase}
              </p>
              <table cellpadding="0" cellspacing="0"><tr><td>
                <a href="${signupLink}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;box-shadow:0 2px 8px rgba(245,158,11,0.35)">
                  Cr&eacute;er mon espace recruteur gratuit &rarr;
                </a>
              </td></tr></table>
            </td></tr>
          </table>`}

          <!-- AI Matching promo -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:20px">
            <tr><td style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:18px 24px">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="width:36px;vertical-align:top;padding-right:14px">
                  <div style="font-size:28px;line-height:1">&#129302;</div>
                </td>
                <td style="vertical-align:top">
                  <p style="margin:0 0 4px;color:#5b21b6;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">Matching IA</p>
                  <p style="margin:0 0 10px;color:#4c1d95;font-size:13px;line-height:1.5">${matchingPhrase}</p>
                  ${hasAccount ? `
                  <a href="${matchingLink}" style="color:#7c3aed;font-size:12px;font-weight:600;text-decoration:underline">D&eacute;couvrir le matching IA &rarr;</a>` : `
                  <a href="${signupLink}" style="color:#7c3aed;font-size:12px;font-weight:600;text-decoration:underline">Essayer gratuitement &rarr;</a>`}
                </td>
              </tr></table>
            </td></tr>
          </table>` : `
          <!-- CTA when no applications -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:12px">
            <tr><td align="center">
              ${hasAccount ? `
              <a href="${siteUrl}/recruiter-dashboard" style="display:inline-block;background:#f3f4f6;color:#374151;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;border:1px solid #e5e7eb">
                G&eacute;rer mes offres
              </a>` : `
              <a href="${signupLink}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#d97706);color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;box-shadow:0 2px 8px rgba(245,158,11,0.35)">
                Cr&eacute;er mon espace recruteur &rarr;
              </a>`}
            </td></tr>
          </table>`}
        </td></tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center">
            <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;line-height:1.5">
              <strong>JobGuin&eacute;e</strong> &mdash; Plateforme emploi &amp; RH en Guin&eacute;e
            </p>
            <p style="margin:0;font-size:11px;color:#d1d5db">
              Vous recevez cet email car le rapport quotidien est activ&eacute; sur votre compte.<br>
              <a href="${siteUrl}/recruiter-dashboard?tab=settings" style="color:#9ca3af;text-decoration:underline">Modifier mes pr&eacute;f&eacute;rences</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const textBody = [
    `Rapport quotidien — ${digestDate}`,
    '',
    `Bonjour ${recruiterName},`,
    '',
    greetingPhrase,
    '',
    `${applications.length} nouvelle(s) candidature(s) reçue(s) aujourd'hui.`,
    '',
    ...applications.map((a, i) => {
      const token = tokenMap.get(a.candidate_id);
      const profileUrl = token ? `${siteUrl}/profil/${token}` : '';
      const completion = a.candidate?.profile_completion_percentage ?? 0;
      const cvUrl = a.cv_url || a.candidate?.cv_url;
      const lmUrl = a.candidate?.cover_letter_url;
      const certsUrl = a.candidate?.certificates_url;
      const docs = [
        cvUrl ? `   📄 CV : ${cvUrl}` : '',
        lmUrl ? `   ✉ Lettre de motivation : ${lmUrl}` : '',
        certsUrl ? `   🎓 Certificats : ${certsUrl}` : '',
      ].filter(Boolean);
      return `${i + 1}. ${a.candidate?.full_name || 'Candidat'} — ${a.job?.title || ''} (${a.job?.location || ''})` +
        `\n   Profil complété : ${completion}%` +
        (profileUrl ? `\n   👤 Voir le profil : ${profileUrl}` : '') +
        (docs.length > 0 ? '\n' + docs.join('\n') : '\n   Aucun document');
    }),
    '',
    hasAccount
      ? `${ctaPhrase}\nAccéder à mon espace : ${pipelineLink}`
      : `${signupPhrase}\nCréer mon espace recruteur : ${signupLink}`,
    '',
    `💡 ${matchingPhrase}`,
    '',
    'JobGuinée — Plateforme emploi & RH en Guinée',
  ].join('\n');

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

    const functionStart = Date.now();
    const MAX_RUNTIME_MS = 120_000;
    const FETCH_TIMEOUT_MS = 15_000;
    const BATCH_LIMIT = 50; // process max 50 recruiters per invocation
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
      .eq('daily_digest_hour', currentHour)
      .limit(BATCH_LIMIT);

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
      // Deadline check
      if (Date.now() - functionStart > MAX_RUNTIME_MS) {
        console.warn(`[DIGEST] Deadline reached after ${processed} processed, stopping.`);
        break;
      }

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
          .select('id, application_email')
          .eq('user_id', setting.recruiter_id);

        if (!recruiterJobs || recruiterJobs.length === 0) {
          console.log(`[SKIP] No jobs for recruiter ${setting.recruiter_id}`);
          continue;
        }

        const jobIds = recruiterJobs.map(j => j.id);
        
        // Determine destination email: use application_email if all jobs share the same one
        const uniqueAppEmails = [...new Set(
          recruiterJobs
            .map(j => (j as any).application_email?.trim())
            .filter((e: string | undefined) => e && e.length > 0)
        )];
        const digestEmail = uniqueAppEmails.length === 1
          ? uniqueAppEmails[0]
          : (recruiter as RecruiterProfile).email;

        const startOfDay = `${today}T00:00:00Z`;
        const endOfDay = `${today}T23:59:59Z`;

        const { data: applications } = await supabase
          .from('applications')
          .select(`
            id, application_reference, candidate_id, job_id,
            ai_matching_score, applied_at, cv_url,
            candidate:profiles!applications_candidate_id_fkey(full_name, email, profile_completion_percentage),
            job:jobs(title, location, application_email)
          `)
          .in('job_id', jobIds)
          .gte('applied_at', startOfDay)
          .lte('applied_at', endOfDay);

        // Fetch candidate_profiles + tokens in parallel
        const candidateIds = [...new Set((applications || []).map(a => a.candidate_id))];
        const candidateProfileMap = new Map<string, { cv_url: string | null; cover_letter_url: string | null; certificates_url: string | null }>();
        const tokenMap = new Map<string, string>();

        if (candidateIds.length > 0) {
          const [profilesResult, tokensResult] = await Promise.all([
            supabase
              .from('candidate_profiles')
              .select('profile_id, cv_url, cover_letter_url, certificates_url')
              .in('profile_id', candidateIds),
            supabase
              .from('public_profile_tokens')
              .select('candidate_id, token')
              .in('candidate_id', candidateIds)
              .eq('is_revoked', false)
              .gt('expires_at', new Date().toISOString())
              .order('created_at', { ascending: false }),
          ]);

          if (profilesResult.data) {
            for (const cp of profilesResult.data) {
              candidateProfileMap.set(cp.profile_id, {
                cv_url: cp.cv_url,
                cover_letter_url: cp.cover_letter_url,
                certificates_url: cp.certificates_url,
              });
            }
          }

          if (tokensResult.data) {
            for (const t of tokensResult.data) {
              if (!tokenMap.has(t.candidate_id)) {
                tokenMap.set(t.candidate_id, t.token);
              }
            }
          }
        }

        // Enrich applications with candidate profile document data
        const enrichedApplications = (applications || []).map(app => ({
          ...app,
          candidate: {
            ...app.candidate,
            cv_url: candidateProfileMap.get(app.candidate_id)?.cv_url || null,
            cover_letter_url: candidateProfileMap.get(app.candidate_id)?.cover_letter_url || null,
            certificates_url: candidateProfileMap.get(app.candidate_id)?.certificates_url || null,
          },
        }));

        const appCount = enrichedApplications.length;

        if (appCount === 0 && !setting.include_zero_applications) {
          console.log(`[SKIP] No applications for recruiter ${setting.recruiter_id}`);
          continue;
        }

        // Determine if the recruiter has a JobGuinée account
        // If the digest goes to their profile email, they have an account
        // If it goes to a different application_email, they may not
        const hasAccount = digestEmail === (recruiter as RecruiterProfile).email;

        const digestDate = new Date(today).toLocaleDateString('fr-FR', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const { subject, htmlBody, textBody } = generateDigestHtml(
          (recruiter as RecruiterProfile).full_name || 'Recruteur',
          enrichedApplications as Application[],
          setting,
          digestDate,
          siteUrl,
          hasAccount,
          tokenMap,
        );

        // Route through email_queue with raw email content (queue-only, no direct send)
        const eventId = `recruiter_daily_digest_${setting.recruiter_id}_${today}`;
        let sendSuccess = false;
        let sendResult: any = {};

        const { error: queueError } = await supabase
          .from('email_queue')
          .insert({
            to_email: digestEmail,
            to_name: (recruiter as RecruiterProfile).full_name,
            template_variables: {
              _raw_subject: subject,
              _raw_html_body: htmlBody,
              _raw_text_body: textBody,
              _template_key: 'recruiter_daily_digest',
            },
            priority: 5,
            scheduled_for: new Date().toISOString(),
            user_id: setting.recruiter_id,
            event_id: eventId,
            status: 'pending',
          });

        if (queueError) {
          // Fallback: send directly if queue insert fails (e.g., dedup conflict)
          console.warn(`[WARN] Queue insert failed for ${setting.recruiter_id}, trying direct send:`, queueError.message);
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
          try {
            const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                to: digestEmail,
                toName: (recruiter as RecruiterProfile).full_name,
                subject,
                htmlBody,
                textBody,
              }),
              signal: controller.signal,
            });
            sendResult = await sendResponse.json();
            sendSuccess = sendResponse.ok;
          } finally {
            clearTimeout(timer);
          }

          if (!sendSuccess) {
            console.error(`[ERROR] Direct send failed for ${digestEmail}:`, sendResult);
          }
        } else {
          // Queue insert succeeded — process-email-queue will handle the actual send
          sendSuccess = true;
        }

        // Logger l'envoi
        const { data: emailLog } = await supabase
          .from('email_logs')
          .insert({
            recipient_id: setting.recruiter_id,
            recipient_email: digestEmail,
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
          console.log(`[SUCCESS] Digest sent to ${digestEmail}`);
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
