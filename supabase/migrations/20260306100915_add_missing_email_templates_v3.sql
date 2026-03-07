/*
  # Ajout des templates email manquants

  ## Résumé
  Ajoute les templates email pour les entretiens, paiements et communications,
  en utilisant les catégories existantes (notification, application, system).

  ## Modifications préalables
  Étend la contrainte category pour accepter 'notification' pour les entretiens et paiements.
*/

ALTER TABLE email_templates
  DROP CONSTRAINT IF EXISTS email_templates_category_check;

ALTER TABLE email_templates
  ADD CONSTRAINT email_templates_category_check
  CHECK (category = ANY (ARRAY[
    'auth', 'application', 'notification', 'marketing', 'system', 'interview', 'payment', 'communication'
  ]));

INSERT INTO email_templates (template_key, name, description, subject, html_body, text_body, category, available_variables, is_active, is_system)
VALUES

(
  'interview_scheduled',
  'Invitation à un entretien',
  'Envoyé au candidat lors de la planification d''un entretien',
  'Entretien planifié pour {{job_title}}',
  '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937"><div style="background:#eff6ff;border-left:4px solid #2563eb;padding:16px;border-radius:8px;margin-bottom:20px"><h2 style="margin:0;color:#1e40af;font-size:20px">Invitation à un entretien</h2></div><p>Bonjour <strong>{{candidate_name}}</strong>,</p><p>Nous avons le plaisir de vous inviter à un entretien pour le poste de <strong>{{job_title}}</strong>.</p><table style="background:#f8fafc;border-radius:8px;padding:16px;width:100%;margin:16px 0;border-collapse:collapse"><tr><td style="padding:6px 0"><strong>Date :</strong></td><td>{{interview_date}}</td></tr><tr><td style="padding:6px 0"><strong>Heure :</strong></td><td>{{interview_time}}</td></tr></table><p>Merci de confirmer votre présence.</p><p>Cordialement,<br/><strong>{{company_name}}</strong></p><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/><p style="font-size:12px;color:#9ca3af">JobGuinée – Plateforme emploi &amp; RH en Guinée</p></div>',
  'Bonjour {{candidate_name}}, vous êtes invité à un entretien pour {{job_title}} le {{interview_date}} à {{interview_time}}. Cordialement, {{company_name}}',
  'interview',
  '["candidate_name","job_title","interview_date","interview_time","company_name","interview_link","interview_location"]',
  true,
  false
),
(
  'interview_reminder_24h',
  'Rappel entretien J-1',
  'Rappel envoyé 24h avant l''entretien',
  'Rappel : Entretien demain pour {{job_title}}',
  '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937"><div style="background:#fefce8;border-left:4px solid #d97706;padding:16px;border-radius:8px;margin-bottom:20px"><h2 style="margin:0;color:#92400e;font-size:20px">Rappel : Entretien demain</h2></div><p>Bonjour <strong>{{candidate_name}}</strong>,</p><p>Votre entretien pour le poste de <strong>{{job_title}}</strong> est prévu <strong>demain</strong>.</p><table style="background:#f8fafc;border-radius:8px;padding:16px;width:100%;margin:16px 0;border-collapse:collapse"><tr><td style="padding:6px 0"><strong>Date :</strong></td><td>{{interview_date}}</td></tr><tr><td style="padding:6px 0"><strong>Heure :</strong></td><td>{{interview_time}}</td></tr></table><p>À bientôt !<br/><strong>{{company_name}}</strong></p><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/><p style="font-size:12px;color:#9ca3af">JobGuinée – Plateforme emploi &amp; RH en Guinée</p></div>',
  'Bonjour {{candidate_name}}, rappel : votre entretien pour {{job_title}} est demain le {{interview_date}} à {{interview_time}}. À bientôt ! {{company_name}}',
  'interview',
  '["candidate_name","job_title","interview_date","interview_time","company_name"]',
  true,
  false
),
(
  'interview_reminder_2h',
  'Rappel entretien 2h avant',
  'Rappel envoyé 2 heures avant l''entretien',
  'Rappel : Entretien dans 2 heures — {{job_title}}',
  '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937"><div style="background:#fff7ed;border-left:4px solid #ea580c;padding:16px;border-radius:8px;margin-bottom:20px"><h2 style="margin:0;color:#c2410c;font-size:20px">Entretien dans 2 heures</h2></div><p>Bonjour <strong>{{candidate_name}}</strong>,</p><p>Votre entretien pour <strong>{{job_title}}</strong> commence dans <strong>2 heures</strong> ({{interview_time}}).</p><p>À tout de suite !<br/><strong>{{company_name}}</strong></p><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/><p style="font-size:12px;color:#9ca3af">JobGuinée – Plateforme emploi &amp; RH en Guinée</p></div>',
  'Bonjour {{candidate_name}}, votre entretien pour {{job_title}} commence dans 2 heures ({{interview_time}}). À tout de suite ! {{company_name}}',
  'interview',
  '["candidate_name","job_title","interview_time","company_name","interview_link"]',
  true,
  false
),
(
  'interview_cancelled',
  'Annulation d''entretien',
  'Envoyé au candidat lors de l''annulation d''un entretien',
  'Annulation d''entretien — {{job_title}}',
  '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937"><div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:8px;margin-bottom:20px"><h2 style="margin:0;color:#991b1b;font-size:20px">Entretien annulé</h2></div><p>Bonjour <strong>{{candidate_name}}</strong>,</p><p>Nous sommes au regret de vous informer que l''entretien prévu le <strong>{{interview_date}}</strong> à <strong>{{interview_time}}</strong> pour le poste de <strong>{{job_title}}</strong> a été annulé.</p><p>Nous vous contacterons prochainement pour reprogrammer.</p><p>Cordialement,<br/><strong>{{company_name}}</strong></p><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/><p style="font-size:12px;color:#9ca3af">JobGuinée – Plateforme emploi &amp; RH en Guinée</p></div>',
  'Bonjour {{candidate_name}}, l''entretien du {{interview_date}} à {{interview_time}} pour {{job_title}} a été annulé. Nous vous recontacterons. Cordialement, {{company_name}}',
  'interview',
  '["candidate_name","job_title","interview_date","interview_time","company_name"]',
  true,
  false
),
(
  'interview_rescheduled',
  'Entretien reprogrammé',
  'Envoyé au candidat lors de la reprogrammation d''un entretien',
  'Entretien reprogrammé — {{job_title}}',
  '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937"><div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:8px;margin-bottom:20px"><h2 style="margin:0;color:#15803d;font-size:20px">Entretien reprogrammé</h2></div><p>Bonjour <strong>{{candidate_name}}</strong>,</p><p>Votre entretien pour le poste de <strong>{{job_title}}</strong> a été reprogrammé.</p><table style="background:#f8fafc;border-radius:8px;padding:16px;width:100%;margin:16px 0;border-collapse:collapse"><tr><td style="padding:6px 0"><strong>Nouvelle date :</strong></td><td>{{interview_date}}</td></tr><tr><td style="padding:6px 0"><strong>Nouvelle heure :</strong></td><td>{{interview_time}}</td></tr></table><p>Merci de confirmer votre disponibilité.</p><p>Cordialement,<br/><strong>{{company_name}}</strong></p><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/><p style="font-size:12px;color:#9ca3af">JobGuinée – Plateforme emploi &amp; RH en Guinée</p></div>',
  'Bonjour {{candidate_name}}, votre entretien pour {{job_title}} a été reprogrammé au {{interview_date}} à {{interview_time}}. Merci de confirmer. Cordialement, {{company_name}}',
  'interview',
  '["candidate_name","job_title","interview_date","interview_time","company_name"]',
  true,
  false
),
(
  'application_status_update',
  'Mise à jour statut candidature',
  'Notification générique de mise à jour de statut de candidature',
  '{{title}}',
  '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937"><div style="background:#eff6ff;border-left:4px solid #2563eb;padding:16px;border-radius:8px;margin-bottom:20px"><h2 style="margin:0;color:#1e40af;font-size:20px">{{title}}</h2></div><div style="white-space:pre-line;line-height:1.6;color:#374151">{{message}}</div><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/><p style="font-size:12px;color:#9ca3af">JobGuinée – Plateforme emploi &amp; RH en Guinée</p></div>',
  '{{message}}',
  'application',
  '["title","message","candidate_name","job_title","company_name"]',
  true,
  false
),
(
  'message_received',
  'Nouveau message recruteur',
  'Notifie un candidat qu''il a reçu un message d''un recruteur',
  'Nouveau message de {{company_name}}',
  '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937"><div style="background:#eff6ff;border-left:4px solid #2563eb;padding:16px;border-radius:8px;margin-bottom:20px"><h2 style="margin:0;color:#1e40af;font-size:20px">Nouveau message</h2></div><p>Bonjour <strong>{{candidate_name}}</strong>,</p><p>Vous avez reçu un nouveau message de <strong>{{company_name}}</strong> concernant votre candidature pour <strong>{{job_title}}</strong>.</p><p>Connectez-vous à votre espace candidat pour le consulter.</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/><p style="font-size:12px;color:#9ca3af">JobGuinée – Plateforme emploi &amp; RH en Guinée</p></div>',
  'Bonjour {{candidate_name}}, vous avez reçu un message de {{company_name}} pour votre candidature à {{job_title}}. Connectez-vous pour le consulter.',
  'communication',
  '["candidate_name","company_name","job_title"]',
  true,
  false
),
(
  'job_closed',
  'Clôture d''offre d''emploi',
  'Informe les candidats de la clôture d''une offre',
  'Clôture de l''offre — {{job_title}}',
  '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937"><div style="background:#f9fafb;border-left:4px solid #6b7280;padding:16px;border-radius:8px;margin-bottom:20px"><h2 style="margin:0;color:#374151;font-size:20px">Offre clôturée</h2></div><p>Bonjour <strong>{{candidate_name}}</strong>,</p><p>Nous vous informons que l''offre pour le poste de <strong>{{job_title}}</strong> est désormais clôturée.</p><p>Merci de l''intérêt porté à notre entreprise.</p><p>Cordialement,<br/><strong>{{company_name}}</strong></p><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/><p style="font-size:12px;color:#9ca3af">JobGuinée – Plateforme emploi &amp; RH en Guinée</p></div>',
  'Bonjour {{candidate_name}}, l''offre {{job_title}} de {{company_name}} est désormais clôturée. Merci pour votre intérêt.',
  'notification',
  '["candidate_name","job_title","company_name"]',
  true,
  false
),
(
  'credits_validated',
  'Paiement crédits IA validé',
  'Confirmation de validation d''un achat de crédits IA',
  'Paiement validé — {{credits_amount}} crédits IA ajoutés',
  '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937"><div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:8px;margin-bottom:20px"><h2 style="margin:0;color:#15803d;font-size:20px">Paiement validé !</h2></div><p>Excellente nouvelle ! Votre paiement a été validé avec succès.</p><table style="background:#f8fafc;border-radius:8px;padding:16px;width:100%;margin:16px 0;border-collapse:collapse"><tr><td style="padding:6px 0"><strong>Référence :</strong></td><td>{{payment_reference}}</td></tr><tr><td style="padding:6px 0"><strong>Montant :</strong></td><td>{{price_amount}}</td></tr><tr><td style="padding:6px 0"><strong>Crédits ajoutés :</strong></td><td><strong>{{credits_amount}} crédits IA</strong></td></tr><tr><td style="padding:6px 0"><strong>Nouveau solde :</strong></td><td>{{new_balance}} crédits</td></tr></table><p>Vos crédits sont disponibles immédiatement.</p><p>Merci pour votre confiance !<br/><strong>L''équipe JobGuinée</strong></p><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/><p style="font-size:12px;color:#9ca3af">JobGuinée – Plateforme emploi &amp; RH en Guinée</p></div>',
  'Paiement validé ! Référence : {{payment_reference}} | Crédits ajoutés : {{credits_amount}} | Nouveau solde : {{new_balance}}. Merci ! L''équipe JobGuinée',
  'payment',
  '["payment_reference","price_amount","credits_amount","new_balance","admin_notes"]',
  true,
  false
),
(
  'credits_rejected',
  'Paiement crédits IA rejeté',
  'Notification de rejet d''un achat de crédits IA',
  'Paiement non validé — {{payment_reference}}',
  '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937"><div style="background:#fef2f2;border-left:4px solid #dc2626;padding:16px;border-radius:8px;margin-bottom:20px"><h2 style="margin:0;color:#991b1b;font-size:20px">Paiement non validé</h2></div><p>Nous avons examiné votre demande mais nous ne pouvons pas la valider.</p><table style="background:#f8fafc;border-radius:8px;padding:16px;width:100%;margin:16px 0;border-collapse:collapse"><tr><td style="padding:6px 0"><strong>Référence :</strong></td><td>{{payment_reference}}</td></tr><tr><td style="padding:6px 0"><strong>Montant :</strong></td><td>{{price_amount}}</td></tr><tr><td style="padding:6px 0"><strong>Crédits :</strong></td><td>{{credits_amount}} crédits IA</td></tr></table><p>Si vous pensez qu''il s''agit d''une erreur, contactez-nous via WhatsApp avec votre preuve de paiement.</p><p>L''équipe JobGuinée</p><hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/><p style="font-size:12px;color:#9ca3af">JobGuinée – Plateforme emploi &amp; RH en Guinée</p></div>',
  'Paiement non validé. Référence : {{payment_reference}} | Montant : {{price_amount}} | Crédits : {{credits_amount}}. Contactez-nous via WhatsApp si erreur. L''équipe JobGuinée',
  'payment',
  '["payment_reference","price_amount","credits_amount","rejection_reason"]',
  true,
  false
)

ON CONFLICT (template_key) DO NOTHING;
