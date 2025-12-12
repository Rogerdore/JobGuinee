/*
  # Create Communication Templates System

  1. New Tables
    - `communication_templates`
      - `id` (uuid, primary key)
      - `company_id` (uuid, foreign key to companies, nullable for system templates)
      - `template_type` (text) - Type of communication
      - `template_name` (text) - Name of the template
      - `subject` (text) - Email subject
      - `body` (text) - Message body with placeholders
      - `is_system` (boolean) - System template or custom
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `communications_log`
      - `id` (uuid, primary key)
      - `application_id` (uuid, foreign key to applications)
      - `sender_id` (uuid, foreign key to profiles)
      - `recipient_id` (uuid, foreign key to profiles)
      - `communication_type` (text) - Type of communication
      - `channel` (text) - notification, email, sms, whatsapp
      - `subject` (text) - Subject if email
      - `message` (text) - Message content
      - `status` (text) - sent, delivered, failed
      - `sent_at` (timestamptz)
      - `delivered_at` (timestamptz)
      - `metadata` (jsonb)

  2. Security
    - Enable RLS
    - Companies can only access their own templates
    - System templates are readable by all
*/

CREATE TABLE IF NOT EXISTS communication_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  template_type text NOT NULL CHECK (template_type IN ('interview_invitation', 'rejection', 'on_hold', 'selection', 'reminder', 'custom')),
  template_name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  is_system boolean DEFAULT false NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS communications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  communication_type text NOT NULL,
  channel text NOT NULL DEFAULT 'notification' CHECK (channel IN ('notification', 'email', 'sms', 'whatsapp')),
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed')),
  sent_at timestamptz DEFAULT now() NOT NULL,
  delivered_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_communication_templates_company_id ON communication_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_communication_templates_type ON communication_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_communication_templates_is_system ON communication_templates(is_system);

CREATE INDEX IF NOT EXISTS idx_communications_log_application_id ON communications_log(application_id);
CREATE INDEX IF NOT EXISTS idx_communications_log_sender_id ON communications_log(sender_id);
CREATE INDEX IF NOT EXISTS idx_communications_log_recipient_id ON communications_log(recipient_id);
CREATE INDEX IF NOT EXISTS idx_communications_log_sent_at ON communications_log(sent_at DESC);

-- Enable RLS
ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for communication_templates
CREATE POLICY "Companies can view own and system templates"
  ON communication_templates FOR SELECT
  TO authenticated
  USING (
    is_system = true OR
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = communication_templates.company_id
      AND c.profile_id = auth.uid()
    )
  );

CREATE POLICY "Companies can create own templates"
  ON communication_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = communication_templates.company_id
      AND c.profile_id = auth.uid()
    )
  );

CREATE POLICY "Companies can update own templates"
  ON communication_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = communication_templates.company_id
      AND c.profile_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies c
      WHERE c.id = communication_templates.company_id
      AND c.profile_id = auth.uid()
    )
  );

-- RLS Policies for communications_log
CREATE POLICY "Users can view own communications"
  ON communications_log FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR recipient_id = auth.uid()
  );

CREATE POLICY "Users can create communications"
  ON communications_log FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
  );

-- Insert system templates
INSERT INTO communication_templates (template_type, template_name, subject, body, is_system, is_active) VALUES
('interview_invitation', 'Invitation entretien standard', 'Invitation à un entretien', 'Bonjour {{candidate_name}},

Nous avons le plaisir de vous inviter à un entretien pour le poste de {{job_title}}.

📅 Date: {{interview_date}}
🕐 Heure: {{interview_time}}
{{#if_video}}💻 Lien: {{interview_link}}{{/if_video}}
{{#if_physical}}📍 Lieu: {{interview_location}}{{/if_physical}}

Nous avons hâte de vous rencontrer.

Cordialement,
L''équipe de recrutement', true, true),

('rejection', 'Rejet poli', 'Suite à votre candidature', 'Bonjour {{candidate_name}},

Nous vous remercions pour l''intérêt que vous portez au poste de {{job_title}}.

Après étude attentive de votre profil, nous avons le regret de vous informer que nous ne donnerons pas suite à votre candidature pour ce poste.

Nous vous encourageons à postuler à nos futures offres qui correspondent mieux à votre profil.

Nous vous souhaitons plein succès dans vos recherches.

Cordialement,
L''équipe de recrutement', true, true),

('on_hold', 'Mise en attente', 'Votre candidature est en cours d''examen', 'Bonjour {{candidate_name}},

Nous avons bien reçu votre candidature pour le poste de {{job_title}}.

Votre profil nous intéresse et nous souhaitons poursuivre l''évaluation. Nous vous tiendrons informé(e) de l''avancement du processus dans les prochains jours.

Merci pour votre patience.

Cordialement,
L''équipe de recrutement', true, true),

('selection', 'Sélection finale', 'Félicitations!', 'Bonjour {{candidate_name}},

Nous sommes ravis de vous annoncer que vous avez été sélectionné(e) pour le poste de {{job_title}}!

Nous vous contacterons prochainement pour discuter des détails de votre intégration.

Félicitations et bienvenue dans notre équipe!

Cordialement,
L''équipe de recrutement', true, true)
ON CONFLICT DO NOTHING;