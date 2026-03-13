-- =====================================================
-- MIGRATION: Seed admin_communication_templates
-- Ready-to-use templates for admin communications
-- =====================================================

-- =====================================================
-- EMAIL TEMPLATES
-- =====================================================

-- 1. Compléter son profil (pédagogique et persuasif)
INSERT INTO admin_communication_templates (name, description, channel, subject, content, variables, is_active, category)
VALUES (
  'Complétez votre profil',
  'Email pédagogique persuasif pour inciter les utilisateurs à créer/compléter leur profil',
  'email',
  'Votre profil est incomplet — voici ce que vous ratez !',
  '<h2 style="color:#1e293b;margin:0 0 16px 0;font-size:22px;">Bonjour {{prenom}},</h2>

<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
  Nous avons remarqué que votre profil sur <strong>JobGuinée</strong> est encore incomplet. 
  Saviez-vous qu''un profil complet multiplie par <strong style="color:#F59E0B;">5</strong> vos chances d''être contacté par un recruteur ?
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#fffbeb;border-radius:8px;border:1px solid #fde68a;">
  <tr><td style="padding:20px;">
    <p style="margin:0 0 12px 0;font-size:16px;font-weight:bold;color:#92400e;">🎯 Pourquoi compléter votre profil ?</p>
    <table cellpadding="0" cellspacing="0">
      <tr><td style="padding:4px 0;font-size:14px;color:#78350f;">✅ Apparaissez en priorité dans les recherches des recruteurs</td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#78350f;">✅ Recevez des offres personnalisées correspondant à votre profil</td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#78350f;">✅ Accédez aux fonctionnalités IA (matching, suggestions, analyse CV)</td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#78350f;">✅ Postulez en un clic avec votre profil pré-rempli</td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#78350f;">✅ Obtenez vos <strong>100 crédits IA gratuits</strong> de bienvenue</td></tr>
    </table>
  </td></tr>
</table>

<p style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:#334155;">
  En seulement <strong>5 minutes</strong>, complétez votre profil et débloquez toutes les opportunités 
  que la Guinée a à offrir. Des centaines d''entreprises recherchent activement des talents comme vous.
</p>

<table cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr>
    <td style="background:#F59E0B;border-radius:8px;">
      <a href="{{lien_profil}}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">
        Compléter mon profil maintenant →
      </a>
    </td>
  </tr>
</table>

<p style="margin:24px 0 0 0;font-size:13px;color:#94a3b8;text-align:center;">
  Plus de 10 000 professionnels guinéens nous font déjà confiance.
</p>',
  '["prenom", "nom", "email", "lien_profil"]'::jsonb,
  true,
  'operational'
) ON CONFLICT DO NOTHING;

-- 2. Nouvelle offre d''emploi (marketing)
INSERT INTO admin_communication_templates (name, description, channel, subject, content, variables, is_active, category)
VALUES (
  'Nouvelles opportunités d''emploi',
  'Email marketing pour annoncer de nouvelles offres d''emploi sur la plateforme',
  'email',
  '🔥 De nouvelles offres vous attendent sur JobGuinée !',
  '<h2 style="color:#1e293b;margin:0 0 16px 0;font-size:22px;">Bonjour {{prenom}},</h2>

<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
  De nouvelles opportunités professionnelles viennent d''être publiées sur <strong>JobGuinée</strong> ! 
  Ne manquez pas ces offres qui pourraient correspondre à votre profil.
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#f0f9ff;border-radius:8px;border:1px solid #bae6fd;">
  <tr><td style="padding:20px;">
    <p style="margin:0 0 8px 0;font-size:16px;font-weight:bold;color:#0c4a6e;">📋 Ce qui vous attend :</p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#0369a1;">
      Des dizaines de postes dans tous les secteurs — administration, finance, technologie, 
      commerce, santé, éducation et plus encore. De Conakry à l''intérieur du pays, 
      trouvez l''emploi qui vous correspond.
    </p>
  </td></tr>
</table>

<table cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr>
    <td style="background:#2563eb;border-radius:8px;">
      <a href="{{lien_site}}/jobs" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">
        Voir les offres →
      </a>
    </td>
  </tr>
</table>

<p style="margin:20px 0 0 0;font-size:14px;color:#64748b;">
  Astuce : activez les alertes emploi pour être notifié dès qu''une offre correspond à votre profil.
</p>',
  '["prenom", "nom", "lien_site"]'::jsonb,
  true,
  'marketing'
) ON CONFLICT DO NOTHING;

-- 3. Annonce importante / communication institutionnelle
INSERT INTO admin_communication_templates (name, description, channel, subject, content, variables, is_active, category)
VALUES (
  'Annonce importante',
  'Template pour les communications officielles et annonces importantes de la plateforme',
  'email',
  'Information importante de JobGuinée',
  '<h2 style="color:#1e293b;margin:0 0 16px 0;font-size:22px;">Bonjour {{prenom}},</h2>

<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
  Nous souhaitons vous informer d''une mise à jour importante concernant la plateforme JobGuinée.
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#fef3c7;border-radius:8px;border:1px solid #fde68a;">
  <tr><td style="padding:20px;">
    <p style="margin:0 0 8px 0;font-size:16px;font-weight:bold;color:#92400e;">📢 Ce qui change :</p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#78350f;">
      [Insérez ici le contenu de votre annonce. Décrivez les changements, les nouvelles fonctionnalités 
      ou les informations importantes que vous souhaitez communiquer.]
    </p>
  </td></tr>
</table>

<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
  Si vous avez des questions, n''hésitez pas à nous contacter via la plateforme ou par email.
</p>

<p style="margin:0;font-size:14px;color:#64748b;">
  L''équipe JobGuinée
</p>',
  '["prenom", "nom"]'::jsonb,
  true,
  'system'
) ON CONFLICT DO NOTHING;

-- 4. Bienvenue recruteur
INSERT INTO admin_communication_templates (name, description, channel, subject, content, variables, is_active, category)
VALUES (
  'Bienvenue Recruteur',
  'Email de bienvenue pour les recruteurs qui rejoignent la plateforme',
  'email',
  'Bienvenue sur JobGuinée — Trouvez les meilleurs talents de Guinée !',
  '<h2 style="color:#1e293b;margin:0 0 16px 0;font-size:22px;">Bienvenue {{prenom}} !</h2>

<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
  Merci d''avoir rejoint <strong>JobGuinée</strong> en tant que recruteur. 
  Vous avez désormais accès à la plus grande base de talents professionnels de Guinée.
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#ecfdf5;border-radius:8px;border:1px solid #a7f3d0;">
  <tr><td style="padding:20px;">
    <p style="margin:0 0 12px 0;font-size:16px;font-weight:bold;color:#065f46;">🚀 Pour bien démarrer :</p>
    <table cellpadding="0" cellspacing="0">
      <tr><td style="padding:4px 0;font-size:14px;color:#047857;">1️⃣ Complétez votre profil entreprise</td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#047857;">2️⃣ Publiez votre première offre d''emploi</td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#047857;">3️⃣ Explorez la CVthèque pour trouver les bons candidats</td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#047857;">4️⃣ Utilisez le matching IA pour des recommandations intelligentes</td></tr>
    </table>
  </td></tr>
</table>

<table cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr>
    <td style="background:#059669;border-radius:8px;">
      <a href="{{lien_site}}/recruiter/dashboard" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">
        Accéder à mon tableau de bord →
      </a>
    </td>
  </tr>
</table>',
  '["prenom", "nom", "lien_site"]'::jsonb,
  true,
  'operational'
) ON CONFLICT DO NOTHING;

-- 5. Relance candidature en cours
INSERT INTO admin_communication_templates (name, description, channel, subject, content, variables, is_active, category)
VALUES (
  'Relance candidature',
  'Email de relance pour les candidats ayant des candidatures en attente',
  'email',
  'Suivez l''avancement de vos candidatures sur JobGuinée',
  '<h2 style="color:#1e293b;margin:0 0 16px 0;font-size:22px;">Bonjour {{prenom}},</h2>

<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
  Vous avez des candidatures en cours sur JobGuinée. Restez actif pour maximiser vos chances !
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#faf5ff;border-radius:8px;border:1px solid #e9d5ff;">
  <tr><td style="padding:20px;">
    <p style="margin:0 0 8px 0;font-size:16px;font-weight:bold;color:#6b21a8;">💡 Conseils pour augmenter vos chances :</p>
    <table cellpadding="0" cellspacing="0">
      <tr><td style="padding:4px 0;font-size:14px;color:#7c3aed;">• Mettez votre CV à jour régulièrement</td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#7c3aed;">• Ajoutez une photo professionnelle à votre profil</td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#7c3aed;">• Postulez à de nouvelles offres chaque semaine</td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#7c3aed;">• Complétez toutes les sections de votre profil</td></tr>
    </table>
  </td></tr>
</table>

<table cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr>
    <td style="background:#7c3aed;border-radius:8px;">
      <a href="{{lien_site}}/candidate/applications" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">
        Voir mes candidatures →
      </a>
    </td>
  </tr>
</table>',
  '["prenom", "nom", "lien_site"]'::jsonb,
  true,
  'operational'
) ON CONFLICT DO NOTHING;

-- 6. Maintenance / mise à jour plateforme
INSERT INTO admin_communication_templates (name, description, channel, subject, content, variables, is_active, category)
VALUES (
  'Maintenance plateforme',
  'Email d''information sur une maintenance programmée ou une mise à jour',
  'email',
  '🔧 Maintenance programmée — JobGuinée',
  '<h2 style="color:#1e293b;margin:0 0 16px 0;font-size:22px;">Bonjour {{prenom}},</h2>

<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
  Nous vous informons qu''une maintenance programmée aura lieu prochainement sur la plateforme JobGuinée.
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#fef2f2;border-radius:8px;border:1px solid #fecaca;">
  <tr><td style="padding:20px;">
    <p style="margin:0 0 8px 0;font-size:16px;font-weight:bold;color:#991b1b;">⚙️ Détails de la maintenance :</p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#b91c1c;">
      [Date et heure de la maintenance]<br/>
      [Durée estimée]<br/>
      [Services impactés]
    </p>
  </td></tr>
</table>

<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
  Pendant cette période, certains services pourraient être temporairement indisponibles. 
  Nous nous excusons pour la gêne occasionnée et vous remercions de votre compréhension.
</p>

<p style="margin:0;font-size:14px;color:#64748b;">
  L''équipe technique JobGuinée
</p>',
  '["prenom", "nom"]'::jsonb,
  true,
  'system'
) ON CONFLICT DO NOTHING;

-- 7. Promotion / offre spéciale
INSERT INTO admin_communication_templates (name, description, channel, subject, content, variables, is_active, category)
VALUES (
  'Offre promotionnelle',
  'Email pour annoncer des promotions ou offres spéciales sur les services premium',
  'email',
  '🎉 Offre exclusive — Boostez votre visibilité sur JobGuinée !',
  '<h2 style="color:#1e293b;margin:0 0 16px 0;font-size:22px;">Bonjour {{prenom}},</h2>

<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
  Pour une durée limitée, profitez de notre offre spéciale pour maximiser votre impact sur JobGuinée !
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:8px;border:1px solid #f59e0b;">
  <tr><td style="padding:24px;text-align:center;">
    <p style="margin:0 0 8px 0;font-size:24px;font-weight:bold;color:#92400e;">⭐ OFFRE SPÉCIALE ⭐</p>
    <p style="margin:0;font-size:16px;line-height:1.6;color:#78350f;">
      [Décrivez votre offre promotionnelle ici]
    </p>
  </td></tr>
</table>

<table cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr>
    <td style="background:#F59E0B;border-radius:8px;">
      <a href="{{lien_site}}/pricing" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">
        Profiter de l''offre →
      </a>
    </td>
  </tr>
</table>

<p style="margin:20px 0 0 0;font-size:13px;color:#94a3b8;text-align:center;">
  Offre valable pour une durée limitée. Conditions sur le site.
</p>',
  '["prenom", "nom", "lien_site"]'::jsonb,
  true,
  'marketing'
) ON CONFLICT DO NOTHING;

-- 8. Invitation à un événement / webinaire
INSERT INTO admin_communication_templates (name, description, channel, subject, content, variables, is_active, category)
VALUES (
  'Invitation événement',
  'Email d''invitation à un événement, webinaire ou salon de l''emploi',
  'email',
  '📅 Vous êtes invité(e) — Événement JobGuinée',
  '<h2 style="color:#1e293b;margin:0 0 16px 0;font-size:22px;">Bonjour {{prenom}},</h2>

<p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#334155;">
  Nous avons le plaisir de vous inviter à un événement exclusif organisé par JobGuinée !
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#eef2ff;border-radius:8px;border:1px solid #c7d2fe;">
  <tr><td style="padding:20px;">
    <p style="margin:0 0 12px 0;font-size:18px;font-weight:bold;color:#3730a3;">📅 Détails de l''événement</p>
    <table cellpadding="0" cellspacing="0">
      <tr><td style="padding:4px 0;font-size:14px;color:#4338ca;"><strong>Quoi :</strong> [Nom de l''événement]</td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#4338ca;"><strong>Quand :</strong> [Date et heure]</td></tr>
      <tr><td style="padding:4px 0;font-size:14px;color:#4338ca;"><strong>Où :</strong> [Lieu ou lien en ligne]</td></tr>
    </table>
  </td></tr>
</table>

<p style="margin:0 0 20px 0;font-size:15px;line-height:1.7;color:#334155;">
  Places limitées — réservez votre participation dès maintenant !
</p>

<table cellpadding="0" cellspacing="0" style="margin:0 auto;">
  <tr>
    <td style="background:#4f46e5;border-radius:8px;">
      <a href="{{lien_site}}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">
        S''inscrire à l''événement →
      </a>
    </td>
  </tr>
</table>',
  '["prenom", "nom", "lien_site"]'::jsonb,
  true,
  'marketing'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- SMS TEMPLATES (160 chars max)
-- =====================================================

-- 9. SMS - Compléter profil
INSERT INTO admin_communication_templates (name, description, channel, content, variables, is_active, category)
VALUES (
  'SMS - Compléter profil',
  'SMS court pour inciter à compléter le profil',
  'sms',
  'JobGuinée: {{prenom}}, votre profil est incomplet! Complétez-le pour être visible par les recruteurs. jobguinee-pro.com/profile',
  '["prenom"]'::jsonb,
  true,
  'operational'
) ON CONFLICT DO NOTHING;

-- 10. SMS - Nouvelles offres
INSERT INTO admin_communication_templates (name, description, channel, content, variables, is_active, category)
VALUES (
  'SMS - Nouvelles offres',
  'SMS court pour annoncer de nouvelles offres',
  'sms',
  'JobGuinée: De nouvelles offres d''emploi disponibles! Consultez-les sur jobguinee-pro.com/jobs',
  '["prenom"]'::jsonb,
  true,
  'marketing'
) ON CONFLICT DO NOTHING;

-- 11. SMS - Annonce importante
INSERT INTO admin_communication_templates (name, description, channel, content, variables, is_active, category)
VALUES (
  'SMS - Annonce',
  'SMS court pour une annonce importante',
  'sms',
  'JobGuinée: Information importante. Connectez-vous pour en savoir plus: jobguinee-pro.com',
  '["prenom"]'::jsonb,
  true,
  'system'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- WHATSAPP TEMPLATES
-- =====================================================

-- 12. WhatsApp - Compléter profil
INSERT INTO admin_communication_templates (name, description, channel, content, variables, is_active, category)
VALUES (
  'WhatsApp - Compléter profil',
  'Message WhatsApp pour inciter à compléter le profil',
  'whatsapp',
  '👋 Bonjour {{prenom}} !

Votre profil sur *JobGuinée* est encore incomplet.

Un profil complet vous permet de :
✅ Être visible par les recruteurs
✅ Recevoir des offres personnalisées
✅ Postuler en un clic

👉 Complétez-le ici : {{lien_profil}}

_L''équipe JobGuinée_',
  '["prenom", "lien_profil"]'::jsonb,
  true,
  'operational'
) ON CONFLICT DO NOTHING;

-- 13. WhatsApp - Nouvelles offres
INSERT INTO admin_communication_templates (name, description, channel, content, variables, is_active, category)
VALUES (
  'WhatsApp - Nouvelles offres',
  'Message WhatsApp pour annoncer de nouvelles offres',
  'whatsapp',
  '🔥 Bonjour {{prenom}} !

De *nouvelles offres d''emploi* sont disponibles sur JobGuinée !

Des postes dans tous les secteurs vous attendent.

👉 Voir les offres : {{lien_site}}/jobs

_L''équipe JobGuinée_',
  '["prenom", "lien_site"]'::jsonb,
  true,
  'marketing'
) ON CONFLICT DO NOTHING;

-- 14. WhatsApp - Annonce
INSERT INTO admin_communication_templates (name, description, channel, content, variables, is_active, category)
VALUES (
  'WhatsApp - Annonce importante',
  'Message WhatsApp pour une communication importante',
  'whatsapp',
  '📢 Bonjour {{prenom}} !

Un message important de *JobGuinée* :

[Votre message ici]

👉 Plus d''infos : {{lien_site}}

_L''équipe JobGuinée_',
  '["prenom", "lien_site"]'::jsonb,
  true,
  'system'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- NOTIFICATION TEMPLATES (in-app)
-- =====================================================

-- 15. Notification - Compléter profil
INSERT INTO admin_communication_templates (name, description, channel, content, variables, is_active, category)
VALUES (
  'Notification - Compléter profil',
  'Notification in-app pour inciter à compléter le profil',
  'notification',
  'Votre profil est incomplet ! Complétez-le pour être visible par les recruteurs et recevoir des offres personnalisées.',
  '["prenom"]'::jsonb,
  true,
  'operational'
) ON CONFLICT DO NOTHING;

-- 16. Notification - Nouvelles offres
INSERT INTO admin_communication_templates (name, description, channel, content, variables, is_active, category)
VALUES (
  'Notification - Nouvelles offres',
  'Notification in-app pour annoncer de nouvelles offres',
  'notification',
  'De nouvelles offres d''emploi sont disponibles ! Consultez-les pour trouver l''opportunité qui vous correspond.',
  '["prenom"]'::jsonb,
  true,
  'marketing'
) ON CONFLICT DO NOTHING;

-- 17. Notification - Annonce
INSERT INTO admin_communication_templates (name, description, channel, content, variables, is_active, category)
VALUES (
  'Notification - Annonce',
  'Notification in-app pour une annonce importante',
  'notification',
  'Information importante de l''équipe JobGuinée. Consultez votre boîte email pour plus de détails.',
  '["prenom"]'::jsonb,
  true,
  'system'
) ON CONFLICT DO NOTHING;

-- 18. Notification - Maintenance
INSERT INTO admin_communication_templates (name, description, channel, content, variables, is_active, category)
VALUES (
  'Notification - Maintenance',
  'Notification in-app pour une maintenance programmée',
  'notification',
  'Maintenance programmée : certains services pourraient être temporairement indisponibles. Nous nous excusons pour la gêne.',
  '[]'::jsonb,
  true,
  'system'
) ON CONFLICT DO NOTHING;
