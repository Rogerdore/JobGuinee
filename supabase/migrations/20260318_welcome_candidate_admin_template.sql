-- Migration: Insert "Bienvenue Candidat" template into admin_communication_templates
-- This is a rich HTML email sent to candidates after account creation.
-- Uses variables: {{prenom}}, {{nom_complet}}, {{email}}

INSERT INTO admin_communication_templates (
  name, description, channel, subject, content, variables, is_active, category
)
VALUES (
  'Bienvenue Candidat — Compte créé',
  'Email de bienvenue moderne pour candidat avec CTA vers création de profil, services IA et offres d''emploi. Envoyé automatiquement ou manuellement après création de compte.',
  'email',
  '🎉 Bienvenue {{prenom}} — Votre aventure professionnelle commence ici !',
  '<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting"><title>Bienvenue sur JobGuin&eacute;e</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;-webkit-text-size-adjust:100%">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6">
<tr><td align="center" style="padding:32px 12px">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">

  <!-- ====== HEADER ====== -->
  <tr>
    <td style="background:linear-gradient(135deg,#0E2F56 0%,#1a4a80 60%,#0d3d6e 100%);padding:32px 40px;text-align:center">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
        <td><img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JobGuin&eacute;e" width="48" height="48" style="display:block;border-radius:12px;border:0" /></td>
        <td style="padding-left:12px">
          <span style="color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px">Job</span><span style="color:#F59E0B;font-size:24px;font-weight:800;letter-spacing:-0.5px">Guin&eacute;e</span>
        </td>
      </tr></table>
      <p style="color:rgba(255,255,255,0.55);font-size:11px;margin:10px 0 0;letter-spacing:0.8px;text-transform:uppercase">Plateforme Emploi &amp; RH N&deg;1 en Guin&eacute;e</p>
    </td>
  </tr>

  <!-- ====== HERO SECTION ====== -->
  <tr>
    <td style="padding:40px 40px 0 40px;text-align:center">
      <div style="font-size:48px;line-height:1;margin-bottom:16px">&#127881;</div>
      <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0E2F56;line-height:1.2">Bienvenue, {{prenom}} !</h1>
      <p style="margin:0 0 4px;font-size:15px;color:#64748b;line-height:1.6">Votre compte a &eacute;t&eacute; cr&eacute;&eacute; avec succ&egrave;s.</p>
      <p style="margin:0;font-size:13px;color:#94a3b8">Connect&eacute; en tant que <strong style="color:#374151">{{email}}</strong></p>
    </td>
  </tr>

  <!-- ====== DIVIDER ====== -->
  <tr><td style="padding:24px 40px 0 40px"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0" /></td></tr>

  <!-- ====== MESSAGE PRINCIPAL ====== -->
  <tr>
    <td style="padding:24px 40px 0 40px">
      <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7">
        Vous venez de rejoindre <strong>la communaut&eacute; de milliers de professionnels</strong> qui font confiance &agrave; JobGuin&eacute;e pour acc&eacute;l&eacute;rer leur carri&egrave;re.
      </p>
      <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7">
        Pour que les recruteurs vous trouvent et que notre <strong>Intelligence Artificielle</strong> vous propose les offres les plus pertinentes, une seule chose &agrave; faire&nbsp;:
      </p>
    </td>
  </tr>

  <!-- ====== CTA PRINCIPAL — COMPLÉTER LE PROFIL ====== -->
  <tr>
    <td style="padding:0 40px" align="center">
      <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto">
        <tr><td style="background:linear-gradient(135deg,#F59E0B,#D97706);border-radius:12px;box-shadow:0 6px 20px rgba(245,158,11,0.4)">
          <a href="https://jobguinee-pro.com/candidate/profile" style="display:block;padding:16px 48px;color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;text-align:center;letter-spacing:0.3px">
            Compl&eacute;ter mon profil maintenant &rarr;
          </a>
        </td></tr>
      </table>
      <p style="margin:8px 0 0;font-size:11px;color:#94a3b8">&#9201; Cela prend moins de 5 minutes</p>
    </td>
  </tr>

  <!-- ====== BÉNÉFICES PROFIL COMPLET ====== -->
  <tr>
    <td style="padding:28px 40px 0 40px">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:12px;overflow:hidden">
        <tr><td style="padding:20px 24px">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.5px">&#128161; Pourquoi compl&eacute;ter votre profil ?</p>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#1e3a5f;line-height:1.5" valign="top" width="24">&#10004;</td>
              <td style="padding:6px 0;font-size:14px;color:#1e3a5f;line-height:1.5"><strong>5x plus de visibilit&eacute;</strong> aupr&egrave;s des recruteurs</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#1e3a5f;line-height:1.5" valign="top" width="24">&#10004;</td>
              <td style="padding:6px 0;font-size:14px;color:#1e3a5f;line-height:1.5">Recevez des <strong>offres personnalis&eacute;es</strong> par notre IA</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#1e3a5f;line-height:1.5" valign="top" width="24">&#10004;</td>
              <td style="padding:6px 0;font-size:14px;color:#1e3a5f;line-height:1.5">Postulez en <strong>1 clic</strong> sans retaper vos infos</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:14px;color:#1e3a5f;line-height:1.5" valign="top" width="24">&#10004;</td>
              <td style="padding:6px 0;font-size:14px;color:#1e3a5f;line-height:1.5">Apparaissez dans la <strong>CVth&egrave;que</strong> consult&eacute;e par +200 entreprises</td>
            </tr>
          </table>
        </td></tr>
      </table>
    </td>
  </tr>

  <!-- ====== 3 SERVICES PHARES ====== -->
  <tr>
    <td style="padding:28px 40px 0 40px">
      <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#0E2F56;text-transform:uppercase;letter-spacing:0.5px">&#128640; Ce que JobGuin&eacute;e fait pour vous</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="33%" style="padding:0 6px 0 0;vertical-align:top">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden">
              <tr><td style="padding:20px 14px;text-align:center">
                <div style="font-size:32px;line-height:1;margin-bottom:10px">&#129302;</div>
                <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0E2F56">CV par IA</p>
                <p style="margin:0;font-size:11px;color:#64748b;line-height:1.4">G&eacute;n&eacute;rez un CV pro en 2&nbsp;min gr&acirc;ce &agrave; l''intelligence artificielle</p>
              </td></tr>
            </table>
          </td>
          <td width="33%" style="padding:0 3px;vertical-align:top">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden">
              <tr><td style="padding:20px 14px;text-align:center">
                <div style="font-size:32px;line-height:1;margin-bottom:10px">&#127919;</div>
                <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0E2F56">Matching IA</p>
                <p style="margin:0;font-size:11px;color:#64748b;line-height:1.4">Des offres calibr&eacute;es sur vos comp&eacute;tences et vos ambitions</p>
              </td></tr>
            </table>
          </td>
          <td width="33%" style="padding:0 0 0 6px;vertical-align:top">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden">
              <tr><td style="padding:20px 14px;text-align:center">
                <div style="font-size:32px;line-height:1;margin-bottom:10px">&#128202;</div>
                <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0E2F56">Suivi en direct</p>
                <p style="margin:0;font-size:11px;color:#64748b;line-height:1.4">Tableau de bord pour suivre toutes vos candidatures</p>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ====== CADEAU CRÉDITS IA ====== -->
  <tr>
    <td style="padding:28px 40px 0 40px">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:linear-gradient(135deg,#FEF3C7,#FDE68A);border:2px solid #F59E0B;border-radius:12px;overflow:hidden">
        <tr><td style="padding:20px 24px;text-align:center">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px">&#127873; Cadeau de bienvenue</p>
          <p style="margin:0 0 2px;font-size:28px;font-weight:900;color:#0E2F56;line-height:1.2">100 Cr&eacute;dits IA offerts</p>
          <p style="margin:0;font-size:12px;color:#78350f;line-height:1.5">G&eacute;n&eacute;rez votre CV, simulez un entretien ou optimisez votre profil — c''est offert.</p>
        </td></tr>
      </table>
    </td>
  </tr>

  <!-- ====== CTAS SECONDAIRES ====== -->
  <tr>
    <td style="padding:28px 40px 0 40px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="50%" style="padding-right:6px">
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:10px;text-align:center">
              <a href="https://jobguinee-pro.com/jobs" style="display:block;padding:14px 12px;color:#1d4ed8;font-size:13px;font-weight:700;text-decoration:none">
                &#128188; Voir les offres
              </a>
            </td></tr></table>
          </td>
          <td width="50%" style="padding-left:6px">
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;text-align:center">
              <a href="https://jobguinee-pro.com/candidate/dashboard" style="display:block;padding:14px 12px;color:#15803d;font-size:13px;font-weight:700;text-decoration:none">
                &#128200; Mon tableau de bord
              </a>
            </td></tr></table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ====== TÉMOIGNAGE / SOCIAL PROOF ====== -->
  <tr>
    <td style="padding:28px 40px 0 40px">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
        <tr><td style="padding:20px 24px">
          <p style="margin:0 0 8px;font-size:22px;line-height:1">&#11088;&#11088;&#11088;&#11088;&#11088;</p>
          <p style="margin:0 0 8px;font-size:14px;color:#374151;line-height:1.6;font-style:italic">
            &laquo;&nbsp;J''ai trouv&eacute; mon emploi en 3 semaines gr&acirc;ce &agrave; JobGuin&eacute;e. Le matching IA m''a propos&eacute; exactement ce que je cherchais.&nbsp;&raquo;
          </p>
          <p style="margin:0;font-size:12px;color:#64748b;font-weight:600">— Mamadou S., D&eacute;veloppeur &agrave; Conakry</p>
        </td></tr>
      </table>
    </td>
  </tr>

  <!-- ====== CHECKLIST RAPIDE ====== -->
  <tr>
    <td style="padding:28px 40px 0 40px">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0E2F56;text-transform:uppercase;letter-spacing:0.5px">&#9989; Vos prochaines &eacute;tapes</p>
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9" valign="top" width="28">
            <div style="width:22px;height:22px;border-radius:50%;background:#F59E0B;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:22px">1</div>
          </td>
          <td style="padding:8px 0 8px 10px;border-bottom:1px solid #f1f5f9">
            <span style="font-size:14px;color:#111827;font-weight:600">Compl&eacute;tez votre profil</span>
            <span style="font-size:12px;color:#6b7280"> — Ajoutez vos exp&eacute;riences, comp&eacute;tences et CV</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f1f5f9" valign="top" width="28">
            <div style="width:22px;height:22px;border-radius:50%;background:#2563eb;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:22px">2</div>
          </td>
          <td style="padding:8px 0 8px 10px;border-bottom:1px solid #f1f5f9">
            <span style="font-size:14px;color:#111827;font-weight:600">Parcourez les offres</span>
            <span style="font-size:12px;color:#6b7280"> — Filtrez par secteur, ville ou type de contrat</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0" valign="top" width="28">
            <div style="width:22px;height:22px;border-radius:50%;background:#16a34a;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:22px">3</div>
          </td>
          <td style="padding:8px 0 8px 10px">
            <span style="font-size:14px;color:#111827;font-weight:600">Postulez en 1 clic</span>
            <span style="font-size:12px;color:#6b7280"> — Votre profil fait office de candidature</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ====== RAPPEL CTA PROFIL ====== -->
  <tr>
    <td style="padding:32px 40px 0 40px" align="center">
      <p style="margin:0 0 14px;font-size:15px;color:#374151;font-weight:600;line-height:1.5">Ne laissez pas les recruteurs passer &agrave; c&ocirc;t&eacute; de votre talent&nbsp;!</p>
      <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto">
        <tr><td style="background:linear-gradient(135deg,#0E2F56,#1a4a80);border-radius:12px;box-shadow:0 6px 20px rgba(14,47,86,0.35)">
          <a href="https://jobguinee-pro.com/candidate/profile" style="display:block;padding:16px 44px;color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;text-align:center">
            &#128640; Cr&eacute;er mon profil complet
          </a>
        </td></tr>
      </table>
    </td>
  </tr>

  <!-- ====== SPACER ====== -->
  <tr><td style="padding:16px 0"></td></tr>

  <!-- ====== FOOTER ====== -->
  <tr>
    <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:24px 40px;text-align:center">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 10px auto"><tr>
        <td><img src="https://jobguinee-pro.com/logo_jobguinee.png" alt="JG" width="20" height="20" style="display:block;border-radius:4px;border:0" /></td>
        <td style="padding-left:8px"><span style="color:#0E2F56;font-size:13px;font-weight:800">Job</span><span style="color:#F59E0B;font-size:13px;font-weight:800">Guin&eacute;e</span></td>
      </tr></table>
      <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;line-height:1.5">Plateforme emploi &amp; RH en Guin&eacute;e &middot; Conakry, R&eacute;publique de Guin&eacute;e</p>
      <p style="margin:0;font-size:11px;color:#cbd5e1">
        <a href="mailto:contact@jobguinee-pro.com" style="color:#94a3b8;text-decoration:none">contact@jobguinee-pro.com</a>
        &nbsp;&middot;&nbsp;
        <a href="https://jobguinee-pro.com" style="color:#94a3b8;text-decoration:none">jobguinee-pro.com</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>',
  '["prenom", "nom_complet", "email"]',
  true,
  'onboarding'
)
ON CONFLICT DO NOTHING;
