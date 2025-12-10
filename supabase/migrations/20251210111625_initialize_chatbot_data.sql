/*
  # Initialize Chatbot Data
  
  1. Settings
    - Create default chatbot settings if not exists
    
  2. Styles
    - Create default chatbot style if not exists
    
  3. Quick Actions
    - Create default quick actions (Generate CV, Buy Credits, View Jobs)
    
  4. Knowledge Base
    - Create initial FAQ entries
*/

-- Insert default settings if not exists
INSERT INTO chatbot_settings (
  id,
  is_enabled,
  position,
  welcome_message,
  idle_message,
  ia_service_code,
  show_quick_actions,
  max_context_messages,
  proactive_mode,
  proactive_delay
)
SELECT
  gen_random_uuid(),
  true,
  'bottom-right',
  'Bonjour! Je suis l''assistant JobGuinée. Comment puis-je vous aider aujourd''hui?',
  'Besoin d''aide? Je suis là pour vous guider!',
  'site_chatbot',
  true,
  10,
  false,
  15000
WHERE NOT EXISTS (SELECT 1 FROM chatbot_settings LIMIT 1);

-- Insert default style if not exists
INSERT INTO chatbot_styles (
  id,
  name,
  primary_color,
  secondary_color,
  background_color,
  text_color,
  bubble_color_user,
  bubble_color_bot,
  border_radius,
  widget_size,
  icon_type,
  icon_value,
  enable_dark_mode,
  shadow_strength,
  animation_type,
  is_default
)
SELECT
  gen_random_uuid(),
  'Style Par Défaut',
  '#3B82F6',
  '#1E40AF',
  '#FFFFFF',
  '#1F2937',
  '#3B82F6',
  '#F3F4F6',
  12,
  'medium',
  'default',
  null,
  false,
  'soft',
  'slide',
  true
WHERE NOT EXISTS (SELECT 1 FROM chatbot_styles WHERE is_default = true);

-- Insert default quick actions if not exists
INSERT INTO chatbot_quick_actions (label, description, icon, action_type, action_payload, is_active, order_index)
SELECT * FROM (VALUES
  ('Générer mon CV IA', 'Créez un CV professionnel avec l''IA', 'FileText', 'open_route', '{"page":"ai-cv-generator"}'::jsonb, true, 1),
  ('Voir les offres', 'Parcourir les opportunités d''emploi', 'Briefcase', 'open_route', '{"page":"jobs"}'::jsonb, true, 2),
  ('Acheter des crédits', 'Recharger mes crédits IA', 'CreditCard', 'open_route', '{"page":"credit-store"}'::jsonb, true, 3),
  ('Services Premium IA', 'Découvrir tous les services IA', 'Sparkles', 'open_route', '{"page":"premium-ai"}'::jsonb, true, 4)
) AS t(label, description, icon, action_type, action_payload, is_active, order_index)
WHERE NOT EXISTS (SELECT 1 FROM chatbot_quick_actions LIMIT 1);

-- Insert initial knowledge base entries if not exists
INSERT INTO chatbot_knowledge_base (category, question, answer, intent_name, priority_level, tags, is_active)
SELECT * FROM (VALUES
  ('cv', 'Comment créer un CV?', 'JobGuinée propose plusieurs outils IA pour créer votre CV : le Générateur CV IA (gratuit avec crédits) crée un CV complet à partir de votre profil, et le service Premium Gold Profile optimise votre CV avec un expert IA. Rendez-vous dans "Services Premium IA"!', 'create_cv', 10, ARRAY['cv', 'création', 'ia', 'services'], true),
  ('credits', 'Comment fonctionnent les crédits IA?', 'Les crédits IA permettent d''utiliser nos services intelligents (CV, lettres de motivation, matching, coaching). Vous recevez des crédits gratuits à l''inscription, et pouvez en acheter plus dans la Boutique de Crédits. Chaque service a un coût différent en crédits.', 'buy_credits', 9, ARRAY['crédits', 'paiement', 'services', 'ia'], true),
  ('emploi', 'Comment postuler à une offre?', 'Pour postuler : 1) Consultez les offres dans "Offres d''emploi", 2) Cliquez sur une offre qui vous intéresse, 3) Cliquez "Postuler", 4) Complétez votre profil si nécessaire. Astuce : utilisez notre service Matching IA pour découvrir les offres les plus adaptées à votre profil!', 'apply_job', 8, ARRAY['emploi', 'postuler', 'offres'], true),
  ('profil', 'Comment compléter mon profil?', 'Un profil complet augmente vos chances! Rendez-vous dans votre Dashboard, puis complétez : informations personnelles, expériences professionnelles, formations, compétences, et langues. Plus votre profil est détaillé, mieux notre IA pourra vous aider!', 'complete_profile', 8, ARRAY['profil', 'compte', 'dashboard'], true),
  ('matching', 'Qu''est-ce que le Matching IA?', 'Le Matching IA analyse votre profil et les offres d''emploi pour calculer votre compatibilité avec chaque poste. Il vous donne un score de matching, identifie vos points forts, et suggère des axes d''amélioration. C''est comme avoir un conseiller carrière personnel!', 'matching_info', 7, ARRAY['matching', 'ia', 'compatibilité'], true),
  ('lettre', 'Comment générer une lettre de motivation?', 'Utilisez notre Générateur de Lettre IA! Il crée une lettre personnalisée en fonction de votre profil et de l''offre ciblée. Rendez-vous dans "Services Premium IA" > "Lettre de Motivation IA". Coût : 20 crédits.', 'cover_letter', 7, ARRAY['lettre', 'motivation', 'ia'], true),
  ('coach', 'Qu''est-ce que le Coach Carrière IA?', 'Le Coach Carrière IA est votre mentor virtuel! Posez-lui des questions sur votre carrière, vos choix professionnels, la préparation d''entretiens, ou la négociation salariale. Il vous donne des conseils personnalisés basés sur votre profil.', 'coach_info', 6, ARRAY['coach', 'carrière', 'conseils', 'ia'], true),
  ('recruteur', 'Comment publier une offre d''emploi?', 'En tant que recruteur, connectez-vous et accédez à votre "Espace Recruteur". Cliquez sur "Publier une offre", remplissez les détails du poste (titre, description, compétences, salaire), et publiez! Vous pouvez aussi utiliser notre Générateur d''Offre IA pour gagner du temps.', 'post_job', 6, ARRAY['recruteur', 'offre', 'publication'], true)
) AS t(category, question, answer, intent_name, priority_level, tags, is_active)
WHERE NOT EXISTS (SELECT 1 FROM chatbot_knowledge_base LIMIT 1);