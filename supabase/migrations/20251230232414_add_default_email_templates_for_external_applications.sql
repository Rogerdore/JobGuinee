/*
  # Templates Email par Défaut pour Candidatures Externes

  1. Mise à jour
    - Ajoute des templates email par défaut dans la configuration
    - Template pour candidature initiale
    - Template pour relance

  2. Contenu
    - Template d'email de candidature conforme aux spécifications
    - Variables dynamiques avec syntaxe {{variable}}
    - Support des conditions {{#if variable}}...{{/if}}
*/

-- Template email de candidature par défaut
UPDATE external_applications_config
SET
  application_email_template = E'Bonjour {{#if recruiter_name}}{{recruiter_name}}{{/if}},

Je vous adresse ma candidature pour le poste de **{{job_title}}** au sein de **{{company_name}}**.

Cette candidature vous est transmise via la plateforme **JobGuinée**, le portail emploi et RH de référence en Guinée.

Vous trouverez en pièces jointes :
- mon CV{{#if has_cover_letter}}
- ma lettre de motivation{{/if}}{{#if has_other_documents}}
- d\'autres documents utiles à ma candidature{{/if}}

{{#if custom_message}}
**Message du candidat :**
{{custom_message}}

{{/if}}
👉 **Vous pouvez consulter mon profil professionnel complet** (sans création de compte) via le lien sécurisé ci-dessous :

🔗 {{profile_url}}

Ce lien vous permet d\'accéder à :
✓ Mon parcours professionnel détaillé
✓ Mes compétences et certifications
✓ Mes documents téléchargeables
✓ Mes coordonnées complètes

Cordialement,

{{candidate_name}}
📧 {{candidate_email}}{{#if candidate_phone}}
📱 {{candidate_phone}}{{/if}}

---
*Envoyé via JobGuinée - Plateforme emploi & RH en Guinée*
*🌐 {{platform_url}}*',

  relance_email_template = E'Bonjour {{#if recruiter_name}}{{recruiter_name}}{{/if}},

Je me permets de revenir vers vous concernant ma candidature au poste de **{{job_title}}** au sein de **{{company_name}}**, que je vous ai envoyée le {{sent_date}}.

Je reste très intéressé(e) par cette opportunité et serais ravi(e) d\'échanger avec vous sur mon profil et mes motivations.

{{#if custom_message}}
{{custom_message}}

{{/if}}
Pour rappel, vous pouvez consulter mon profil complet via ce lien :
🔗 {{profile_url}}

Je reste à votre disposition pour tout complément d\'information.

Dans l\'attente de votre retour,

Cordialement,

{{candidate_name}}
📧 {{candidate_email}}{{#if candidate_phone}}
📱 {{candidate_phone}}{{/if}}

---
*Envoyé via JobGuinée - Plateforme emploi & RH en Guinée*
*🌐 {{platform_url}}*'

WHERE id IS NOT NULL;

-- Si aucune config n'existe, la créer avec les templates
INSERT INTO external_applications_config (
  module_enabled,
  min_profile_completion,
  max_applications_per_day,
  max_relances_per_application,
  min_days_between_relances,
  token_validity_days,
  max_file_size_mb,
  allowed_file_types,
  application_email_template,
  relance_email_template
)
SELECT
  true,
  80,
  10,
  3,
  7,
  90,
  10,
  ARRAY['pdf', 'doc', 'docx', 'jpg', 'png']::text[],
  E'Bonjour {{#if recruiter_name}}{{recruiter_name}}{{/if}},

Je vous adresse ma candidature pour le poste de **{{job_title}}** au sein de **{{company_name}}**.

Cette candidature vous est transmise via la plateforme **JobGuinée**, le portail emploi et RH de référence en Guinée.

Vous trouverez en pièces jointes :
- mon CV{{#if has_cover_letter}}
- ma lettre de motivation{{/if}}{{#if has_other_documents}}
- d\'autres documents utiles à ma candidature{{/if}}

{{#if custom_message}}
**Message du candidat :**
{{custom_message}}

{{/if}}
👉 **Vous pouvez consulter mon profil professionnel complet** (sans création de compte) via le lien sécurisé ci-dessous :

🔗 {{profile_url}}

Ce lien vous permet d\'accéder à :
✓ Mon parcours professionnel détaillé
✓ Mes compétences et certifications
✓ Mes documents téléchargeables
✓ Mes coordonnées complètes

Cordialement,

{{candidate_name}}
📧 {{candidate_email}}{{#if candidate_phone}}
📱 {{candidate_phone}}{{/if}}

---
*Envoyé via JobGuinée - Plateforme emploi & RH en Guinée*
*🌐 {{platform_url}}*',
  E'Bonjour {{#if recruiter_name}}{{recruiter_name}}{{/if}},

Je me permets de revenir vers vous concernant ma candidature au poste de **{{job_title}}** au sein de **{{company_name}}**, que je vous ai envoyée le {{sent_date}}.

Je reste très intéressé(e) par cette opportunité et serais ravi(e) d\'échanger avec vous sur mon profil et mes motivations.

{{#if custom_message}}
{{custom_message}}

{{/if}}
Pour rappel, vous pouvez consulter mon profil complet via ce lien :
🔗 {{profile_url}}

Je reste à votre disposition pour tout complément d\'information.

Dans l\'attente de votre retour,

Cordialement,

{{candidate_name}}
📧 {{candidate_email}}{{#if candidate_phone}}
📱 {{candidate_phone}}{{/if}}

---
*Envoyé via JobGuinée - Plateforme emploi & RH en Guinée*
*🌐 {{platform_url}}*'
WHERE NOT EXISTS (SELECT 1 FROM external_applications_config);

COMMENT ON COLUMN external_applications_config.application_email_template IS 'Template email pour candidature initiale. Variables: {{candidate_name}}, {{candidate_email}}, {{candidate_phone}}, {{job_title}}, {{company_name}}, {{recruiter_name}}, {{profile_url}}, {{platform_url}}, {{custom_message}}, {{has_cv}}, {{has_cover_letter}}, {{has_other_documents}}';

COMMENT ON COLUMN external_applications_config.relance_email_template IS 'Template email pour relance. Variables: {{candidate_name}}, {{candidate_email}}, {{candidate_phone}}, {{job_title}}, {{company_name}}, {{recruiter_name}}, {{profile_url}}, {{platform_url}}, {{custom_message}}, {{sent_date}}';
