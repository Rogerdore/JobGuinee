/*
  # Create IA Service Templates System

  1. New Tables
    - ia_service_templates: Templates for IA service outputs
    - ia_service_templates_history: Version history and audit trail

  2. Features
    - Multiple templates per service
    - Multiple output formats (html, markdown, text, json)
    - Placeholder system for dynamic content
    - Template versioning
    - Preview and validation

  3. Security
    - RLS policies for admin management
    - User selection of templates
    - Version history immutable
*/

-- Create ia_service_templates table
CREATE TABLE IF NOT EXISTS ia_service_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code text NOT NULL,
  template_name text NOT NULL,
  template_description text,
  
  -- Template content
  template_structure text NOT NULL,
  format text NOT NULL CHECK (format IN ('html', 'markdown', 'text', 'json')),
  
  -- Styling and preview
  css_styles text,
  preview_data jsonb,
  
  -- Configuration
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  
  -- Metadata
  placeholders text[],
  required_fields text[],
  tags text[],
  
  -- Audit
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure unique names per service
  UNIQUE(service_code, template_name)
);

-- Create ia_service_templates_history table
CREATE TABLE IF NOT EXISTS ia_service_templates_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES ia_service_templates(id) ON DELETE CASCADE,
  service_code text NOT NULL,
  template_name text NOT NULL,
  
  -- Changes tracking
  old_structure text,
  new_structure text,
  old_format text,
  new_format text,
  change_summary text,
  field_changes jsonb,
  
  -- Audit
  changed_by uuid REFERENCES auth.users(id),
  change_reason text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ia_templates_service ON ia_service_templates(service_code);
CREATE INDEX IF NOT EXISTS idx_ia_templates_active ON ia_service_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_ia_templates_default ON ia_service_templates(service_code, is_default);
CREATE INDEX IF NOT EXISTS idx_ia_templates_format ON ia_service_templates(format);
CREATE INDEX IF NOT EXISTS idx_ia_templates_history_template ON ia_service_templates_history(template_id);
CREATE INDEX IF NOT EXISTS idx_ia_templates_history_date ON ia_service_templates_history(created_at DESC);

-- Function: Get templates for a service
CREATE OR REPLACE FUNCTION get_ia_service_templates(
  p_service_code text,
  p_active_only boolean DEFAULT true
)
RETURNS json AS $$
DECLARE
  v_templates json;
BEGIN
  IF p_active_only THEN
    SELECT json_agg(row_to_json(t.*))
    INTO v_templates
    FROM ia_service_templates t
    WHERE t.service_code = p_service_code
      AND t.is_active = true
    ORDER BY t.display_order, t.template_name;
  ELSE
    SELECT json_agg(row_to_json(t.*))
    INTO v_templates
    FROM ia_service_templates t
    WHERE t.service_code = p_service_code
    ORDER BY t.display_order, t.template_name;
  END IF;

  RETURN json_build_object(
    'success', true,
    'templates', COALESCE(v_templates, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get default template for service
CREATE OR REPLACE FUNCTION get_default_template(p_service_code text)
RETURNS json AS $$
DECLARE
  v_template record;
BEGIN
  SELECT * INTO v_template
  FROM ia_service_templates
  WHERE service_code = p_service_code
    AND is_default = true
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT * INTO v_template
    FROM ia_service_templates
    WHERE service_code = p_service_code
      AND is_active = true
    ORDER BY display_order, created_at
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'NO_TEMPLATE_FOUND',
      'message', 'No template found for this service'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'template', row_to_json(v_template)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create template
CREATE OR REPLACE FUNCTION create_ia_service_template(p_template jsonb)
RETURNS json AS $$
DECLARE
  v_user_id uuid;
  v_template_id uuid;
  v_is_default boolean;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED'
    );
  END IF;

  v_is_default := COALESCE((p_template->>'is_default')::boolean, false);

  -- If setting as default, unset other defaults for this service
  IF v_is_default THEN
    UPDATE ia_service_templates
    SET is_default = false
    WHERE service_code = p_template->>'service_code'
      AND is_default = true;
  END IF;

  INSERT INTO ia_service_templates (
    service_code,
    template_name,
    template_description,
    template_structure,
    format,
    css_styles,
    is_default,
    is_active,
    display_order,
    created_by,
    updated_by
  ) VALUES (
    p_template->>'service_code',
    p_template->>'template_name',
    p_template->>'template_description',
    p_template->>'template_structure',
    p_template->>'format',
    p_template->>'css_styles',
    v_is_default,
    COALESCE((p_template->>'is_active')::boolean, true),
    COALESCE((p_template->>'display_order')::integer, 0),
    v_user_id,
    v_user_id
  )
  RETURNING id INTO v_template_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Template created successfully',
    'template_id', v_template_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update template (creates history entry)
CREATE OR REPLACE FUNCTION update_ia_service_template(
  p_template_id uuid,
  p_updates jsonb,
  p_change_reason text DEFAULT NULL
)
RETURNS json AS $$
DECLARE
  v_current record;
  v_user_id uuid;
  v_is_default boolean;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'UNAUTHORIZED'
    );
  END IF;

  -- Get current template
  SELECT * INTO v_current
  FROM ia_service_templates
  WHERE id = p_template_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'TEMPLATE_NOT_FOUND'
    );
  END IF;

  v_is_default := COALESCE((p_updates->>'is_default')::boolean, v_current.is_default);

  -- If setting as default, unset other defaults
  IF v_is_default AND NOT v_current.is_default THEN
    UPDATE ia_service_templates
    SET is_default = false
    WHERE service_code = v_current.service_code
      AND is_default = true
      AND id != p_template_id;
  END IF;

  -- Save to history
  INSERT INTO ia_service_templates_history (
    template_id,
    service_code,
    template_name,
    old_structure,
    new_structure,
    old_format,
    new_format,
    field_changes,
    changed_by,
    change_reason
  ) VALUES (
    p_template_id,
    v_current.service_code,
    v_current.template_name,
    v_current.template_structure,
    COALESCE(p_updates->>'template_structure', v_current.template_structure),
    v_current.format,
    COALESCE(p_updates->>'format', v_current.format),
    p_updates,
    v_user_id,
    p_change_reason
  );

  -- Update template
  UPDATE ia_service_templates
  SET
    template_name = COALESCE(p_updates->>'template_name', template_name),
    template_description = COALESCE(p_updates->>'template_description', template_description),
    template_structure = COALESCE(p_updates->>'template_structure', template_structure),
    format = COALESCE(p_updates->>'format', format),
    css_styles = COALESCE(p_updates->>'css_styles', css_styles),
    is_default = v_is_default,
    is_active = COALESCE((p_updates->>'is_active')::boolean, is_active),
    display_order = COALESCE((p_updates->>'display_order')::integer, display_order),
    updated_by = v_user_id,
    updated_at = now()
  WHERE id = p_template_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Template updated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE ia_service_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia_service_templates_history ENABLE ROW LEVEL SECURITY;

-- Users can view active templates
DROP POLICY IF EXISTS "Users can view active templates" ON ia_service_templates;
CREATE POLICY "Users can view active templates"
  ON ia_service_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Admins can manage templates
DROP POLICY IF EXISTS "Admins can manage templates" ON ia_service_templates;
CREATE POLICY "Admins can manage templates"
  ON ia_service_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Admins can view history
DROP POLICY IF EXISTS "Admins can view template history" ON ia_service_templates_history;
CREATE POLICY "Admins can view template history"
  ON ia_service_templates_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_ia_templates_updated_at ON ia_service_templates;
CREATE TRIGGER update_ia_templates_updated_at
  BEFORE UPDATE ON ia_service_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default templates for existing services
INSERT INTO ia_service_templates (service_code, template_name, template_description, template_structure, format, is_default) VALUES

-- CV Generation Templates
('ai_cv_generation', 'CV Moderne', 'Template moderne avec sections bien structurees', 
'<div class="cv-modern">
  <header>
    <h1>{{fullName}}</h1>
    <p class="contact">{{email}} | {{phone}}</p>
  </header>
  
  <section class="summary">
    <h2>Profil Professionnel</h2>
    <p>{{summary}}</p>
  </section>
  
  <section class="experience">
    <h2>Experience Professionnelle</h2>
    {{#each experiences}}
    <div class="job">
      <h3>{{title}} - {{company}}</h3>
      <p class="duration">{{duration}}</p>
      <p>{{description}}</p>
    </div>
    {{/each}}
  </section>
  
  <section class="education">
    <h2>Formation</h2>
    {{#each education}}
    <div class="degree">
      <h3>{{degree}} - {{school}}</h3>
      <p>{{year}}</p>
    </div>
    {{/each}}
  </section>
  
  <section class="skills">
    <h2>Competences</h2>
    <ul>
      {{#each skills}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
  </section>
</div>', 
'html', true),

('ai_cv_generation', 'CV Classique', 'Template classique sobre et professionnel',
'# {{fullName}}

**Contact:** {{email}} | {{phone}}

## Profil Professionnel

{{summary}}

## Experience Professionnelle

{{#each experiences}}
### {{title}} - {{company}}
*{{duration}}*

{{description}}

{{/each}}

## Formation

{{#each education}}
- **{{degree}}** - {{school}} ({{year}})
{{/each}}

## Competences

{{#each skills}}
- {{this}}
{{/each}}',
'markdown', false),

-- Cover Letter Templates
('ai_cover_letter', 'Lettre Formelle', 'Format lettre de motivation formelle',
'<div class="cover-letter-formal">
  <div class="header">
    <p>{{candidateName}}</p>
    <p>{{candidateAddress}}</p>
    <p>{{candidateEmail}}</p>
  </div>
  
  <div class="recipient">
    <p>{{companyName}}</p>
    <p>{{recipientName}}</p>
    <p>{{date}}</p>
  </div>
  
  <div class="content">
    <p><strong>Objet : {{jobTitle}}</strong></p>
    
    <p>{{greeting}}</p>
    
    {{#each paragraphs}}
    <p>{{this}}</p>
    {{/each}}
    
    <p>{{closing}}</p>
    
    <p>{{signature}}</p>
  </div>
</div>',
'html', true),

-- Coaching Templates
('ai_coach', 'Conseils Structurees', 'Format conseils coach avec sections claires',
'<div class="coaching-advice">
  <h1>Votre Plan d Action Personnalise</h1>
  
  <section class="situation">
    <h2>Analyse de votre Situation</h2>
    <p>{{situationAnalysis}}</p>
  </section>
  
  <section class="strengths">
    <h2>Vos Points Forts</h2>
    <ul>
      {{#each strengths}}
      <li><strong>{{title}}:</strong> {{description}}</li>
      {{/each}}
    </ul>
  </section>
  
  <section class="opportunities">
    <h2>Opportunites a Saisir</h2>
    <ul>
      {{#each opportunities}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
  </section>
  
  <section class="action-plan">
    <h2>Plan d Action</h2>
    {{#each actionSteps}}
    <div class="step">
      <h3>Etape {{number}}: {{title}}</h3>
      <p>{{description}}</p>
      <p class="timeline"><strong>Delai:</strong> {{timeline}}</p>
    </div>
    {{/each}}
  </section>
</div>',
'html', true),

-- Matching Templates
('ai_matching', 'Rapport Compatibilite', 'Rapport detaille de matching candidat-job',
'<div class="matching-report">
  <header>
    <h1>Rapport de Compatibilite</h1>
    <div class="score">
      <span class="score-value">{{matchScore}}</span>
      <span class="score-label">/100</span>
    </div>
  </header>
  
  <section class="criteria">
    <h2>Evaluation par Critere</h2>
    {{#each criteria}}
    <div class="criterion">
      <div class="criterion-header">
        <h3>{{name}}</h3>
        <span class="score">{{score}}/{{maxScore}}</span>
      </div>
      <div class="progress-bar">
        <div class="progress" style="width: {{percentage}}%"></div>
      </div>
      <p>{{comment}}</p>
    </div>
    {{/each}}
  </section>
  
  <section class="strengths">
    <h2>Points Forts</h2>
    <ul>
      {{#each strengths}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
  </section>
  
  <section class="improvements">
    <h2>Axes d Amelioration</h2>
    <ul>
      {{#each improvements}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
  </section>
  
  <section class="recommendation">
    <h2>Recommandation</h2>
    <div class="recommendation-badge {{recommendationClass}}">
      {{recommendation}}
    </div>
    <p>{{recommendationReason}}</p>
  </section>
</div>',
'html', true)

ON CONFLICT (service_code, template_name) DO NOTHING;
