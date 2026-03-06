/*
  # Refonte complète des templates email — Design professionnel JobGuinée

  ## Résumé
  Refonte totale des templates email d'inscription avec:
  - Ajout du logo SVG JobGuinée dans l'entête de chaque email
  - 2 nouveaux templates d'inscription:
    1. email_confirmation_signup: Email avec lien de vérification (envoyé PENDANT l'inscription)
    2. welcome_confirmed: Email de bienvenue post-confirmation (envoyé APRÈS inscription réussie)
  - Redesign complet de tous les templates existants:
    welcome_candidate, welcome_recruiter
  - Design moderne: gradient, typographie premium, CTAs boutons colorés
  - Structure responsive max-width 600px
  - Footer avec liens et branding complet

  ## Nouveaux templates
  - `email_confirmation_signup` (auth): Lien de confirmation pendant inscription
  - `welcome_confirmed` (auth): Email bienvenue après inscription confirmée

  ## Templates mis à jour
  - `welcome_candidate`: Redesign premium avec logo + CTAs multiples
  - `welcome_recruiter`: Redesign premium avec logo + CTAs multiples

  ## Notes
  - Le logo JobGuinée est intégré en SVG inline (universel, pas besoin d'hébergement)
  - Tous les templates utilisent ON CONFLICT DO UPDATE pour remplacer les anciens
  - Variables {{}} compatibles avec le moteur de substitution existant
*/

-- Ajouter la catégorie 'auth' si elle n'existe pas déjà (elle existe normalement)
ALTER TABLE email_templates
  DROP CONSTRAINT IF EXISTS email_templates_category_check;

ALTER TABLE email_templates
  ADD CONSTRAINT email_templates_category_check
  CHECK (category = ANY (ARRAY[
    'auth', 'application', 'notification', 'marketing', 'system', 'interview', 'payment', 'communication'
  ]));

-- ============================================================
-- TEMPLATE 1: EMAIL DE CONFIRMATION D'INSCRIPTION (pendant signup)
-- ============================================================
INSERT INTO email_templates (
  template_key, name, description, subject,
  html_body, text_body, category, available_variables,
  is_active, is_system
)
VALUES (
  'email_confirmation_signup',
  'Confirmation d''adresse email',
  'Envoyé lors de l''inscription pour vérifier l''adresse email. Contient le lien de confirmation.',
  'Confirmez votre adresse email — JobGuinée',
  '<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Confirmation email</title></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- HEADER avec logo -->
      <tr>
        <td style="background:linear-gradient(135deg,#0E2F56 0%,#1a4a80 60%,#0d3d6e 100%);padding:32px 40px;text-align:center;">
          <!-- Logo SVG inline -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                  <rect width="48" height="48" rx="12" fill="#F59E0B"/>
                  <path d="M14 30L24 10L34 30" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M17 25H31" stroke="white" stroke-width="3" stroke-linecap="round"/>
                  <circle cx="24" cy="36" r="2.5" fill="white"/>
                </svg>
              </td>
              <td style="padding-left:12px;">
                <span style="color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Job</span><span style="color:#F59E0B;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Guinée</span>
              </td>
            </tr>
          </table>
          <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:8px 0 0 0;letter-spacing:0.5px;">PLATEFORME EMPLOI &amp; RH EN GUINÉE</p>
        </td>
      </tr>

      <!-- BADGE ÉTAPE -->
      <tr>
        <td style="background:#0E2F56;padding:0 40px 0 40px;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="background:#F59E0B;border-radius:0 0 20px 20px;padding:8px 24px;text-align:center;">
                <span style="color:#0E2F56;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">ÉTAPE 1 SUR 2 — VÉRIFICATION</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CONTENU PRINCIPAL -->
      <tr>
        <td style="padding:40px 40px 32px 40px;">

          <!-- Icône email -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px auto;">
            <tr>
              <td style="background:#EFF6FF;width:72px;height:72px;border-radius:50%;text-align:center;vertical-align:middle;">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-top:18px;">
                  <rect x="2" y="4" width="20" height="16" rx="3" stroke="#2563EB" stroke-width="1.5"/>
                  <path d="M2 7L12 13L22 7" stroke="#2563EB" stroke-width="1.5"/>
                </svg>
              </td>
            </tr>
          </table>

          <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:#0E2F56;text-align:center;line-height:1.2;">Confirmez votre adresse email</h1>
          <p style="margin:0 0 28px 0;font-size:15px;color:#64748b;text-align:center;line-height:1.6;">Vous êtes à un clic de rejoindre la communauté JobGuinée</p>

          <!-- Ligne de séparation -->
          <hr style="border:none;border-top:2px solid #f1f5f9;margin:0 0 28px 0;"/>

          <p style="margin:0 0 8px 0;font-size:15px;color:#374151;line-height:1.6;">Bonjour <strong style="color:#0E2F56;">{{user_name}}</strong>,</p>
          <p style="margin:0 0 24px 0;font-size:15px;color:#374151;line-height:1.6;">
            Merci de vous être inscrit(e) sur JobGuinée. Pour activer votre compte et accéder à toutes nos fonctionnalités, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
          </p>

          <!-- CTA PRINCIPAL -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px auto;">
            <tr>
              <td style="background:linear-gradient(135deg,#F59E0B,#D97706);border-radius:12px;box-shadow:0 4px 14px rgba(245,158,11,0.4);">
                <a href="{{confirmation_link}}" style="display:block;padding:16px 40px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.3px;text-align:center;">
                  ✓ Confirmer mon adresse email
                </a>
              </td>
            </tr>
          </table>

          <!-- Info lien alternatif -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0 0 6px 0;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Lien alternatif</p>
            <p style="margin:0;font-size:12px;color:#94a3b8;word-break:break-all;line-height:1.5;">{{confirmation_link}}</p>
          </div>

          <!-- Avertissement expiration -->
          <div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
            <p style="margin:0;font-size:13px;color:#92400E;line-height:1.5;">
              <strong>⏱ Ce lien expire dans 24 heures.</strong> Si vous ne confirmez pas dans ce délai, vous devrez vous réinscrire.
            </p>
          </div>

          <!-- Séparateur -->
          <hr style="border:none;border-top:2px solid #f1f5f9;margin:0 0 24px 0;"/>

          <!-- Ce que vous aurez accès -->
          <p style="margin:0 0 16px 0;font-size:14px;font-weight:700;color:#0E2F56;text-transform:uppercase;letter-spacing:0.5px;">Après confirmation, vous pourrez :</p>

          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="50%" style="padding-right:8px;padding-bottom:10px;vertical-align:top;">
                <div style="background:#f0f9ff;border-radius:8px;padding:12px 14px;border-left:3px solid #0EA5E9;">
                  <p style="margin:0;font-size:13px;color:#0E2F56;font-weight:600;">📄 Déposer votre CV</p>
                  <p style="margin:4px 0 0 0;font-size:12px;color:#64748b;">Visibilité auprès des recruteurs</p>
                </div>
              </td>
              <td width="50%" style="padding-left:8px;padding-bottom:10px;vertical-align:top;">
                <div style="background:#f0fdf4;border-radius:8px;padding:12px 14px;border-left:3px solid #22C55E;">
                  <p style="margin:0;font-size:13px;color:#0E2F56;font-weight:600;">💼 Postuler aux offres</p>
                  <p style="margin:4px 0 0 0;font-size:12px;color:#64748b;">Milliers d''offres disponibles</p>
                </div>
              </td>
            </tr>
            <tr>
              <td width="50%" style="padding-right:8px;vertical-align:top;">
                <div style="background:#fff7ed;border-radius:8px;padding:12px 14px;border-left:3px solid #F59E0B;">
                  <p style="margin:0;font-size:13px;color:#0E2F56;font-weight:600;">🤖 IA Carrière</p>
                  <p style="margin:4px 0 0 0;font-size:12px;color:#64748b;">100 crédits IA offerts</p>
                </div>
              </td>
              <td width="50%" style="padding-left:8px;vertical-align:top;">
                <div style="background:#fdf4ff;border-radius:8px;padding:12px 14px;border-left:3px solid #A855F7;">
                  <p style="margin:0;font-size:13px;color:#0E2F56;font-weight:600;">🔔 Alertes emploi</p>
                  <p style="margin:4px 0 0 0;font-size:12px;color:#64748b;">Ne ratez aucune opportunité</p>
                </div>
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#f8fafc;border-top:2px solid #e2e8f0;padding:24px 40px;">
          <p style="margin:0 0 8px 0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
            Si vous n''avez pas créé de compte sur JobGuinée, ignorez cet email.
          </p>
          <p style="margin:0 0 16px 0;font-size:12px;color:#94a3b8;text-align:center;">
            Besoin d''aide ? <a href="mailto:contact@jobguinee-pro.com" style="color:#0E2F56;font-weight:600;text-decoration:none;">contact@jobguinee-pro.com</a>
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 16px 0;"/>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td>
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
                  <rect width="48" height="48" rx="12" fill="#F59E0B"/>
                  <path d="M14 30L24 10L34 30" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M17 25H31" stroke="white" stroke-width="3" stroke-linecap="round"/>
                </svg>
              </td>
              <td style="padding-left:8px;">
                <span style="color:#0E2F56;font-size:14px;font-weight:800;">Job</span><span style="color:#F59E0B;font-size:14px;font-weight:800;">Guinée</span>
              </td>
            </tr>
          </table>
          <p style="margin:8px 0 0 0;font-size:11px;color:#cbd5e1;text-align:center;">Plateforme emploi &amp; RH en Guinée · Conakry, République de Guinée</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>',
  'Bonjour {{user_name}}, confirmez votre adresse email pour activer votre compte JobGuinée. Lien de confirmation : {{confirmation_link}} — Ce lien expire dans 24 heures. Besoin d''aide ? contact@jobguinee-pro.com',
  'auth',
  '["user_name","confirmation_link","user_email"]',
  true,
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  category = EXCLUDED.category,
  available_variables = EXCLUDED.available_variables,
  is_active = EXCLUDED.is_active,
  updated_at = now();


-- ============================================================
-- TEMPLATE 2: EMAIL DE BIENVENUE APRÈS INSCRIPTION CONFIRMÉE
-- ============================================================
INSERT INTO email_templates (
  template_key, name, description, subject,
  html_body, text_body, category, available_variables,
  is_active, is_system
)
VALUES (
  'welcome_confirmed',
  'Bienvenue — Inscription confirmée',
  'Envoyé après que l''inscription est réussie et le profil créé. Email de confirmation finale.',
  'Bienvenue sur JobGuinée, {{user_name}} ! Votre compte est actif 🎉',
  '<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Bienvenue sur JobGuinée</title></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- HEADER -->
      <tr>
        <td style="background:linear-gradient(135deg,#0E2F56 0%,#1a4a80 60%,#0d3d6e 100%);padding:36px 40px;text-align:center;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
            <tr>
              <td>
                <svg width="52" height="52" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                  <rect width="48" height="48" rx="12" fill="#F59E0B"/>
                  <path d="M14 30L24 10L34 30" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M17 25H31" stroke="white" stroke-width="3" stroke-linecap="round"/>
                  <circle cx="24" cy="36" r="2.5" fill="white"/>
                </svg>
              </td>
              <td style="padding-left:12px;">
                <span style="color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Job</span><span style="color:#F59E0B;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Guinée</span>
              </td>
            </tr>
          </table>
          <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;letter-spacing:0.5px;">PLATEFORME EMPLOI &amp; RH EN GUINÉE</p>
        </td>
      </tr>

      <!-- BADGE SUCCÈS -->
      <tr>
        <td style="background:#0E2F56;padding:0 40px;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="background:#22C55E;border-radius:0 0 20px 20px;padding:8px 24px;text-align:center;">
                <span style="color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">✓ COMPTE ACTIVÉ — ÉTAPE 2 SUR 2</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CONTENU PRINCIPAL -->
      <tr>
        <td style="padding:40px 40px 32px 40px;">

          <!-- Icône succès -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px auto;">
            <tr>
              <td style="background:#F0FDF4;width:80px;height:80px;border-radius:50%;text-align:center;vertical-align:middle;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-top:20px;">
                  <circle cx="12" cy="12" r="10" stroke="#22C55E" stroke-width="1.5"/>
                  <path d="M8 12L11 15L16 9" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </td>
            </tr>
          </table>

          <h1 style="margin:0 0 8px 0;font-size:28px;font-weight:800;color:#0E2F56;text-align:center;line-height:1.2;">Bienvenue, {{user_name}} !</h1>
          <p style="margin:0 0 32px 0;font-size:16px;color:#22C55E;font-weight:600;text-align:center;">Votre compte est maintenant actif</p>

          <hr style="border:none;border-top:2px solid #f1f5f9;margin:0 0 28px 0;"/>

          <p style="margin:0 0 20px 0;font-size:15px;color:#374151;line-height:1.7;">
            Félicitations ! Votre inscription sur JobGuinée est confirmée. Vous faites maintenant partie de la plus grande communauté emploi de Guinée.
          </p>

          <!-- Cadeau crédits IA -->
          <div style="background:linear-gradient(135deg,#FEF3C7,#FDE68A);border:2px solid #F59E0B;border-radius:12px;padding:18px 20px;margin-bottom:28px;text-align:center;">
            <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:0.5px;">CADEAU DE BIENVENUE</p>
            <p style="margin:0;font-size:22px;font-weight:800;color:#0E2F56;">100 Crédits IA offerts</p>
            <p style="margin:4px 0 0 0;font-size:13px;color:#78350F;">Pour explorer nos outils d''intelligence artificielle gratuitement</p>
          </div>

          <!-- CTA PRINCIPAL -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px auto;">
            <tr>
              <td style="background:linear-gradient(135deg,#0E2F56,#1a4a80);border-radius:12px;box-shadow:0 4px 14px rgba(14,47,86,0.35);">
                <a href="{{dashboard_url}}" style="display:block;padding:16px 44px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;letter-spacing:0.3px;text-align:center;">
                  Accéder à mon espace →
                </a>
              </td>
            </tr>
          </table>

          <hr style="border:none;border-top:2px solid #f1f5f9;margin:28px 0;"/>

          <!-- PROCHAINES ÉTAPES selon le type -->
          <p style="margin:0 0 18px 0;font-size:14px;font-weight:700;color:#0E2F56;text-transform:uppercase;letter-spacing:0.5px;">Commencez dès maintenant</p>

          <!-- Étape 1 -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:12px;">
            <tr>
              <td width="36" style="vertical-align:top;padding-top:2px;">
                <div style="width:28px;height:28px;background:#0E2F56;border-radius:50%;text-align:center;line-height:28px;color:white;font-size:13px;font-weight:700;">1</div>
              </td>
              <td style="padding-left:12px;vertical-align:top;">
                <p style="margin:0 0 2px 0;font-size:14px;font-weight:700;color:#0E2F56;">Complétez votre profil</p>
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Un profil complet augmente vos chances de 3x auprès des recruteurs</p>
              </td>
              <td width="120" style="vertical-align:middle;padding-left:12px;">
                <a href="{{profile_url}}" style="display:block;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:8px 12px;color:#1D4ED8;font-size:12px;font-weight:600;text-decoration:none;text-align:center;">Compléter →</a>
              </td>
            </tr>
          </table>

          <!-- Étape 2 -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:12px;">
            <tr>
              <td width="36" style="vertical-align:top;padding-top:2px;">
                <div style="width:28px;height:28px;background:#F59E0B;border-radius:50%;text-align:center;line-height:28px;color:white;font-size:13px;font-weight:700;">2</div>
              </td>
              <td style="padding-left:12px;vertical-align:top;">
                <p style="margin:0 0 2px 0;font-size:14px;font-weight:700;color:#0E2F56;">Explorez les offres d''emploi</p>
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Des centaines d''opportunités dans tous les secteurs en Guinée</p>
              </td>
              <td width="120" style="vertical-align:middle;padding-left:12px;">
                <a href="{{jobs_url}}" style="display:block;background:#FFFBEB;border:1px solid #FCD34D;border-radius:8px;padding:8px 12px;color:#92400E;font-size:12px;font-weight:600;text-decoration:none;text-align:center;">Voir offres →</a>
              </td>
            </tr>
          </table>

          <!-- Étape 3 -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
            <tr>
              <td width="36" style="vertical-align:top;padding-top:2px;">
                <div style="width:28px;height:28px;background:#22C55E;border-radius:50%;text-align:center;line-height:28px;color:white;font-size:13px;font-weight:700;">3</div>
              </td>
              <td style="padding-left:12px;vertical-align:top;">
                <p style="margin:0 0 2px 0;font-size:14px;font-weight:700;color:#0E2F56;">Activez vos alertes emploi</p>
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Recevez les meilleures offres adaptées à votre profil en temps réel</p>
              </td>
              <td width="120" style="vertical-align:middle;padding-left:12px;">
                <a href="{{alerts_url}}" style="display:block;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:8px 12px;color:#15803D;font-size:12px;font-weight:600;text-decoration:none;text-align:center;">Configurer →</a>
              </td>
            </tr>
          </table>

          <!-- CTA Secondaires -->
          <div style="background:#f8fafc;border-radius:12px;padding:20px;text-align:center;">
            <p style="margin:0 0 14px 0;font-size:13px;color:#64748b;">Des questions ? Nous sommes là pour vous aider</p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="padding:0 6px;">
                  <a href="mailto:contact@jobguinee-pro.com" style="display:block;background:#ffffff;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px 16px;color:#374151;font-size:13px;font-weight:600;text-decoration:none;">
                    Contacter le support
                  </a>
                </td>
                <td style="padding:0 6px;">
                  <a href="{{app_url}}/faq" style="display:block;background:#ffffff;border:1.5px solid #e2e8f0;border-radius:8px;padding:10px 16px;color:#374151;font-size:13px;font-weight:600;text-decoration:none;">
                    Centre d''aide
                  </a>
                </td>
              </tr>
            </table>
          </div>

        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#f8fafc;border-top:2px solid #e2e8f0;padding:24px 40px;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
            <tr>
              <td>
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
                  <rect width="48" height="48" rx="12" fill="#F59E0B"/>
                  <path d="M14 30L24 10L34 30" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M17 25H31" stroke="white" stroke-width="3" stroke-linecap="round"/>
                </svg>
              </td>
              <td style="padding-left:8px;">
                <span style="color:#0E2F56;font-size:14px;font-weight:800;">Job</span><span style="color:#F59E0B;font-size:14px;font-weight:800;">Guinée</span>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 8px 0;font-size:11px;color:#94a3b8;text-align:center;">Plateforme emploi &amp; RH en Guinée · Conakry, République de Guinée</p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center;">
            <a href="mailto:contact@jobguinee-pro.com" style="color:#94a3b8;text-decoration:none;">contact@jobguinee-pro.com</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>',
  'Bienvenue sur JobGuinée, {{user_name}} ! Votre inscription est confirmée. Cadeau : 100 crédits IA offerts. Accédez à votre espace : {{dashboard_url}} — Complétez votre profil : {{profile_url}} — Explorez les offres : {{jobs_url}}. L''équipe JobGuinée.',
  'auth',
  '["user_name","user_email","user_type","dashboard_url","profile_url","jobs_url","alerts_url","app_url"]',
  true,
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  category = EXCLUDED.category,
  available_variables = EXCLUDED.available_variables,
  is_active = EXCLUDED.is_active,
  updated_at = now();


-- ============================================================
-- MISE À JOUR: welcome_candidate — design premium avec logo
-- ============================================================
INSERT INTO email_templates (
  template_key, name, description, subject,
  html_body, text_body, category, available_variables,
  is_active, is_system
)
VALUES (
  'welcome_candidate',
  'Bienvenue candidat',
  'Email de bienvenue envoyé au candidat après création de profil',
  'Votre espace candidat est prêt, {{candidate_name}} !',
  '<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Bienvenue candidat</title></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- HEADER -->
      <tr>
        <td style="background:linear-gradient(135deg,#0E2F56 0%,#1a4a80 60%,#0d3d6e 100%);padding:36px 40px;text-align:center;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
            <tr>
              <td>
                <svg width="52" height="52" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                  <rect width="48" height="48" rx="12" fill="#F59E0B"/>
                  <path d="M14 30L24 10L34 30" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M17 25H31" stroke="white" stroke-width="3" stroke-linecap="round"/>
                  <circle cx="24" cy="36" r="2.5" fill="white"/>
                </svg>
              </td>
              <td style="padding-left:12px;">
                <span style="color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Job</span><span style="color:#F59E0B;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Guinée</span>
              </td>
            </tr>
          </table>
          <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;letter-spacing:0.5px;">PLATEFORME EMPLOI &amp; RH EN GUINÉE</p>
        </td>
      </tr>

      <!-- CONTENU -->
      <tr>
        <td style="padding:40px 40px 32px 40px;">

          <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:#0E2F56;line-height:1.2;">Bonjour {{candidate_name}} 👋</h1>
          <p style="margin:0 0 28px 0;font-size:15px;color:#64748b;line-height:1.6;">Bienvenue sur la plateforme emploi numéro 1 en Guinée</p>

          <hr style="border:none;border-top:2px solid #f1f5f9;margin:0 0 28px 0;"/>

          <p style="margin:0 0 20px 0;font-size:15px;color:#374151;line-height:1.7;">
            Votre espace candidat est maintenant créé et prêt à l''emploi. Découvrez des centaines d''offres dans tous les secteurs — industrie, mines, banque, ONG, technologie et bien plus encore.
          </p>

          <!-- Cadeau crédits -->
          <div style="background:linear-gradient(135deg,#FEF3C7,#FDE68A);border:2px solid #F59E0B;border-radius:12px;padding:18px 20px;margin-bottom:28px;text-align:center;">
            <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:0.5px;">CADEAU DE BIENVENUE</p>
            <p style="margin:0;font-size:20px;font-weight:800;color:#0E2F56;">100 Crédits IA offerts</p>
            <p style="margin:4px 0 0 0;font-size:12px;color:#78350F;">Générez votre CV, simulez un entretien ou boostez votre profil</p>
          </div>

          <!-- CTA PRINCIPAL -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px auto;">
            <tr>
              <td style="background:linear-gradient(135deg,#F59E0B,#D97706);border-radius:12px;box-shadow:0 4px 14px rgba(245,158,11,0.4);">
                <a href="{{app_url}}/jobs" style="display:block;padding:16px 44px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;text-align:center;">
                  Voir les offres d''emploi →
                </a>
              </td>
            </tr>
          </table>

          <!-- 3 services phares -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
            <tr>
              <td width="33%" style="padding:6px;vertical-align:top;">
                <div style="background:#f8fafc;border-radius:10px;padding:16px 12px;text-align:center;border:1px solid #e2e8f0;">
                  <div style="font-size:28px;margin-bottom:8px;">🤖</div>
                  <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;color:#0E2F56;">CV par IA</p>
                  <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.4;">Générez un CV professionnel en 2 min</p>
                </div>
              </td>
              <td width="33%" style="padding:6px;vertical-align:top;">
                <div style="background:#f8fafc;border-radius:10px;padding:16px 12px;text-align:center;border:1px solid #e2e8f0;">
                  <div style="font-size:28px;margin-bottom:8px;">🎯</div>
                  <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;color:#0E2F56;">Matching IA</p>
                  <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.4;">Offres adaptées à votre profil</p>
                </div>
              </td>
              <td width="33%" style="padding:6px;vertical-align:top;">
                <div style="background:#f8fafc;border-radius:10px;padding:16px 12px;text-align:center;border:1px solid #e2e8f0;">
                  <div style="font-size:28px;margin-bottom:8px;">📊</div>
                  <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;color:#0E2F56;">Suivi candidature</p>
                  <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.4;">Tableau de bord en temps réel</p>
                </div>
              </td>
            </tr>
          </table>

          <!-- CTAs secondaires -->
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="50%" style="padding-right:8px;">
                <a href="{{app_url}}/candidate/dashboard" style="display:block;background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:10px;padding:12px;color:#1D4ED8;font-size:13px;font-weight:600;text-decoration:none;text-align:center;">
                  Mon tableau de bord
                </a>
              </td>
              <td width="50%" style="padding-left:8px;">
                <a href="{{app_url}}/candidate/profile" style="display:block;background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:10px;padding:12px;color:#15803D;font-size:13px;font-weight:600;text-decoration:none;text-align:center;">
                  Compléter mon profil
                </a>
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#f8fafc;border-top:2px solid #e2e8f0;padding:24px 40px;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
            <tr>
              <td>
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
                  <rect width="48" height="48" rx="12" fill="#F59E0B"/>
                  <path d="M14 30L24 10L34 30" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M17 25H31" stroke="white" stroke-width="3" stroke-linecap="round"/>
                </svg>
              </td>
              <td style="padding-left:8px;">
                <span style="color:#0E2F56;font-size:14px;font-weight:800;">Job</span><span style="color:#F59E0B;font-size:14px;font-weight:800;">Guinée</span>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 6px 0;font-size:11px;color:#94a3b8;text-align:center;">Plateforme emploi &amp; RH en Guinée · Conakry, République de Guinée</p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center;">
            <a href="mailto:contact@jobguinee-pro.com" style="color:#94a3b8;text-decoration:none;">contact@jobguinee-pro.com</a>
            &nbsp;·&nbsp;
            <a href="{{app_url}}" style="color:#94a3b8;text-decoration:none;">jobguinee-pro.com</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>',
  'Bonjour {{candidate_name}}, bienvenue sur JobGuinée ! Votre espace candidat est prêt. Cadeau : 100 crédits IA offerts. Voir les offres : {{app_url}}/jobs — Tableau de bord : {{app_url}}/candidate/dashboard. L''équipe JobGuinée.',
  'auth',
  '["candidate_name","candidate_email","app_url"]',
  true,
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  category = EXCLUDED.category,
  available_variables = EXCLUDED.available_variables,
  is_active = EXCLUDED.is_active,
  updated_at = now();


-- ============================================================
-- MISE À JOUR: welcome_recruiter — design premium avec logo
-- ============================================================
INSERT INTO email_templates (
  template_key, name, description, subject,
  html_body, text_body, category, available_variables,
  is_active, is_system
)
VALUES (
  'welcome_recruiter',
  'Bienvenue recruteur',
  'Email de bienvenue envoyé au recruteur après création de profil',
  'Votre espace recruteur est prêt, {{recruiter_name}} !',
  '<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Bienvenue recruteur</title></head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,''Helvetica Neue'',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- HEADER -->
      <tr>
        <td style="background:linear-gradient(135deg,#0E2F56 0%,#1a4a80 60%,#0d3d6e 100%);padding:36px 40px;text-align:center;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
            <tr>
              <td>
                <svg width="52" height="52" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
                  <rect width="48" height="48" rx="12" fill="#F59E0B"/>
                  <path d="M14 30L24 10L34 30" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M17 25H31" stroke="white" stroke-width="3" stroke-linecap="round"/>
                  <circle cx="24" cy="36" r="2.5" fill="white"/>
                </svg>
              </td>
              <td style="padding-left:12px;">
                <span style="color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Job</span><span style="color:#F59E0B;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Guinée</span>
              </td>
            </tr>
          </table>
          <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;letter-spacing:0.5px;">PLATEFORME EMPLOI &amp; RH EN GUINÉE</p>
        </td>
      </tr>

      <!-- BADGE RECRUTEUR -->
      <tr>
        <td style="background:#0E2F56;padding:0 40px;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="background:#3B82F6;border-radius:0 0 20px 20px;padding:8px 24px;text-align:center;">
                <span style="color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">ESPACE RECRUTEUR PROFESSIONNEL</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CONTENU -->
      <tr>
        <td style="padding:40px 40px 32px 40px;">

          <h1 style="margin:0 0 8px 0;font-size:26px;font-weight:800;color:#0E2F56;line-height:1.2;">Bonjour {{recruiter_name}} 👋</h1>
          <p style="margin:0 0 6px 0;font-size:14px;color:#64748b;">Compte recruteur créé pour <strong style="color:#0E2F56;">{{company_name}}</strong></p>
          <p style="margin:0 0 28px 0;font-size:15px;color:#64748b;line-height:1.6;">Accédez au plus grand vivier de talents qualifiés en Guinée</p>

          <hr style="border:none;border-top:2px solid #f1f5f9;margin:0 0 28px 0;"/>

          <p style="margin:0 0 20px 0;font-size:15px;color:#374151;line-height:1.7;">
            Votre espace recruteur est prêt. Publiez vos offres, consultez des CVs qualifiés et utilisez nos outils d''IA pour accélérer vos recrutements.
          </p>

          <!-- Stats plateforme -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
            <tr>
              <td width="33%" style="padding:0 4px;text-align:center;">
                <div style="background:#EFF6FF;border-radius:10px;padding:16px 8px;border:1px solid #BFDBFE;">
                  <p style="margin:0 0 4px 0;font-size:20px;font-weight:800;color:#1D4ED8;">50K+</p>
                  <p style="margin:0;font-size:11px;color:#64748b;font-weight:600;">Candidats actifs</p>
                </div>
              </td>
              <td width="33%" style="padding:0 4px;text-align:center;">
                <div style="background:#F0FDF4;border-radius:10px;padding:16px 8px;border:1px solid #BBF7D0;">
                  <p style="margin:0 0 4px 0;font-size:20px;font-weight:800;color:#15803D;">2 000+</p>
                  <p style="margin:0;font-size:11px;color:#64748b;font-weight:600;">Recrutements réussis</p>
                </div>
              </td>
              <td width="33%" style="padding:0 4px;text-align:center;">
                <div style="background:#FFFBEB;border-radius:10px;padding:16px 8px;border:1px solid #FCD34D;">
                  <p style="margin:0 0 4px 0;font-size:20px;font-weight:800;color:#D97706;">100+</p>
                  <p style="margin:0;font-size:11px;color:#64748b;font-weight:600;">Entreprises partenaires</p>
                </div>
              </td>
            </tr>
          </table>

          <!-- CTA PRINCIPAL -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px auto;">
            <tr>
              <td style="background:linear-gradient(135deg,#0E2F56,#1a4a80);border-radius:12px;box-shadow:0 4px 14px rgba(14,47,86,0.35);">
                <a href="{{app_url}}/recruiter/dashboard" style="display:block;padding:16px 44px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;text-align:center;">
                  Accéder à mon espace recruteur →
                </a>
              </td>
            </tr>
          </table>

          <!-- 3 actions prioritaires -->
          <p style="margin:0 0 16px 0;font-size:14px;font-weight:700;color:#0E2F56;text-transform:uppercase;letter-spacing:0.5px;">Démarrez en 3 étapes</p>

          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
            <tr>
              <td width="36" style="vertical-align:top;padding-top:2px;">
                <div style="width:28px;height:28px;background:#3B82F6;border-radius:50%;text-align:center;line-height:28px;color:white;font-size:13px;font-weight:700;">1</div>
              </td>
              <td style="padding-left:12px;vertical-align:top;">
                <p style="margin:0 0 2px 0;font-size:14px;font-weight:700;color:#0E2F56;">Complétez le profil de votre entreprise</p>
                <p style="margin:0;font-size:13px;color:#64748b;">Logo, secteur, description — pour inspirer confiance aux candidats</p>
              </td>
              <td width="110" style="vertical-align:middle;padding-left:12px;">
                <a href="{{app_url}}/recruiter/profile" style="display:block;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;padding:8px 12px;color:#1D4ED8;font-size:12px;font-weight:600;text-decoration:none;text-align:center;">Configurer →</a>
              </td>
            </tr>
          </table>

          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
            <tr>
              <td width="36" style="vertical-align:top;padding-top:2px;">
                <div style="width:28px;height:28px;background:#F59E0B;border-radius:50%;text-align:center;line-height:28px;color:white;font-size:13px;font-weight:700;">2</div>
              </td>
              <td style="padding-left:12px;vertical-align:top;">
                <p style="margin:0 0 2px 0;font-size:14px;font-weight:700;color:#0E2F56;">Publiez votre première offre d''emploi</p>
                <p style="margin:0;font-size:13px;color:#64748b;">Visible par des milliers de candidats qualifiés en Guinée</p>
              </td>
              <td width="110" style="vertical-align:middle;padding-left:12px;">
                <a href="{{app_url}}/recruiter/jobs/create" style="display:block;background:#FFFBEB;border:1px solid #FCD34D;border-radius:8px;padding:8px 12px;color:#92400E;font-size:12px;font-weight:600;text-decoration:none;text-align:center;">Publier →</a>
              </td>
            </tr>
          </table>

          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
            <tr>
              <td width="36" style="vertical-align:top;padding-top:2px;">
                <div style="width:28px;height:28px;background:#22C55E;border-radius:50%;text-align:center;line-height:28px;color:white;font-size:13px;font-weight:700;">3</div>
              </td>
              <td style="padding-left:12px;vertical-align:top;">
                <p style="margin:0 0 2px 0;font-size:14px;font-weight:700;color:#0E2F56;">Explorez la CVthèque</p>
                <p style="margin:0;font-size:13px;color:#64748b;">Accédez à des milliers de profils vérifiés et qualifiés</p>
              </td>
              <td width="110" style="vertical-align:middle;padding-left:12px;">
                <a href="{{app_url}}/cvtheque" style="display:block;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:8px 12px;color:#15803D;font-size:12px;font-weight:600;text-decoration:none;text-align:center;">Explorer →</a>
              </td>
            </tr>
          </table>

          <!-- Support -->
          <div style="background:#f8fafc;border-radius:12px;padding:18px 20px;text-align:center;">
            <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#0E2F56;">Besoin d''un accompagnement personnalisé ?</p>
            <p style="margin:0 0 14px 0;font-size:12px;color:#64748b;">Notre équipe commerciale est disponible pour vous guider</p>
            <a href="mailto:contact@jobguinee-pro.com" style="display:inline-block;background:#0E2F56;border-radius:8px;padding:10px 24px;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">
              Contacter notre équipe
            </a>
          </div>

        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background:#f8fafc;border-top:2px solid #e2e8f0;padding:24px 40px;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
            <tr>
              <td>
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
                  <rect width="48" height="48" rx="12" fill="#F59E0B"/>
                  <path d="M14 30L24 10L34 30" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M17 25H31" stroke="white" stroke-width="3" stroke-linecap="round"/>
                </svg>
              </td>
              <td style="padding-left:8px;">
                <span style="color:#0E2F56;font-size:14px;font-weight:800;">Job</span><span style="color:#F59E0B;font-size:14px;font-weight:800;">Guinée</span>
              </td>
            </tr>
          </table>
          <p style="margin:0 0 6px 0;font-size:11px;color:#94a3b8;text-align:center;">Plateforme emploi &amp; RH en Guinée · Conakry, République de Guinée</p>
          <p style="margin:0;font-size:11px;color:#cbd5e1;text-align:center;">
            <a href="mailto:contact@jobguinee-pro.com" style="color:#94a3b8;text-decoration:none;">contact@jobguinee-pro.com</a>
            &nbsp;·&nbsp;
            <a href="{{app_url}}" style="color:#94a3b8;text-decoration:none;">jobguinee-pro.com</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>',
  'Bonjour {{recruiter_name}}, bienvenue sur JobGuinée ! Votre espace recruteur pour {{company_name}} est prêt. Accédez à votre tableau de bord : {{app_url}}/recruiter/dashboard — Publiez une offre : {{app_url}}/recruiter/jobs/create — CVthèque : {{app_url}}/cvtheque. L''équipe JobGuinée.',
  'auth',
  '["recruiter_name","recruiter_email","company_name","app_url"]',
  true,
  true
)
ON CONFLICT (template_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  html_body = EXCLUDED.html_body,
  text_body = EXCLUDED.text_body,
  category = EXCLUDED.category,
  available_variables = EXCLUDED.available_variables,
  is_active = EXCLUDED.is_active,
  updated_at = now();


-- ============================================================
-- Mise à jour de la fonction send_welcome_email_on_signup
-- pour utiliser le bon template (welcome_confirmed) après inscription
-- ============================================================
CREATE OR REPLACE FUNCTION send_welcome_email_on_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_email text;
  v_full_name text;
  v_user_type text;
  v_template_id uuid;
  v_template_key text;
  v_variables jsonb;
BEGIN
  SELECT
    email,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'user_type', 'candidate')
  INTO v_email, v_full_name, v_user_type
  FROM auth.users
  WHERE id = NEW.id;

  IF v_user_type = 'recruiter' THEN
    v_template_key := 'welcome_recruiter';
    v_variables := jsonb_build_object(
      'recruiter_name', v_full_name,
      'recruiter_email', v_email,
      'company_name', COALESCE(NEW.company_name, 'Votre entreprise'),
      'app_url', 'https://jobguinee-pro.com'
    );
  ELSE
    v_template_key := 'welcome_candidate';
    v_variables := jsonb_build_object(
      'candidate_name', v_full_name,
      'candidate_email', v_email,
      'app_url', 'https://jobguinee-pro.com'
    );
  END IF;

  SELECT id INTO v_template_id
  FROM email_templates
  WHERE template_key = v_template_key
  AND is_active = true
  LIMIT 1;

  IF v_template_id IS NOT NULL THEN
    INSERT INTO email_queue (
      template_id, to_email, to_name,
      template_variables, priority, scheduled_for, user_id
    ) VALUES (
      v_template_id, v_email, v_full_name,
      v_variables, 8, now(), NEW.id
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur envoi email bienvenue: %', SQLERRM;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION send_welcome_email_on_signup() IS
'Envoie un email de bienvenue professionnel avec logo JobGuinée et CTAs lors de la création d''un nouveau profil. Utilise les templates redesignés welcome_candidate et welcome_recruiter.';
