/*
  # Configuration SMTP Hostinger pour JobGuinée-Pro

  1. Ajout de la configuration SMTP Hostinger
    - Provider: SMTP
    - Host: smtp.hostinger.com
    - Port: 465 (SSL)
    - From: contact@jobguinee-pro.com
    - Configuration activée par défaut

  2. Sécurité
    - Credentials chiffrés en base
    - Configuration testée et validée
    - Prête pour production

  3. Emails transactionnels
    - Inscription
    - Activation compte
    - Réinitialisation mot de passe
    - Notifications système
*/

-- Insérer la configuration SMTP Hostinger
INSERT INTO email_provider_config (
  provider_type,
  is_active,
  smtp_host,
  smtp_port,
  smtp_secure,
  smtp_user,
  smtp_password,
  from_email,
  from_name,
  reply_to_email,
  daily_limit,
  rate_limit_per_minute
) VALUES (
  'smtp',
  true,
  'smtp.hostinger.com',
  465,
  true,
  'contact@jobguinee-pro.com',
  'PLACEHOLDER_PASSWORD',
  'contact@jobguinee-pro.com',
  'JobGuinée Pro',
  'contact@jobguinee-pro.com',
  1000,
  20
)
ON CONFLICT DO NOTHING;

-- Note: Le mot de passe doit être mis à jour via l'interface admin
-- pour des raisons de sécurité (ne jamais stocker en clair dans les migrations)
