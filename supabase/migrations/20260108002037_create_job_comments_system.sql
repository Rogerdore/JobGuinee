/*
  # Système de Commentaires sur les Offres d'Emploi

  ## Description
  Ce système permet aux utilisateurs (candidats et recruteurs) de commenter les offres d'emploi,
  favorisant l'échange d'informations et la transparence.

  ## Tables Créées

  ### job_comments
  - `id` (uuid, primary key) - Identifiant unique du commentaire
  - `job_id` (uuid, foreign key) - Référence à l'offre d'emploi
  - `user_id` (uuid, foreign key) - Auteur du commentaire
  - `parent_id` (uuid, nullable) - Pour les réponses aux commentaires
  - `content` (text) - Contenu du commentaire
  - `is_edited` (boolean) - Indique si le commentaire a été modifié
  - `is_flagged` (boolean) - Signalement par modération
  - `created_at` (timestamptz) - Date de création
  - `updated_at` (timestamptz) - Date de dernière modification

  ### job_comment_reactions
  - `id` (uuid, primary key) - Identifiant unique
  - `comment_id` (uuid, foreign key) - Référence au commentaire
  - `user_id` (uuid, foreign key) - Utilisateur qui réagit
  - `reaction_type` (text) - Type de réaction (like, helpful, etc.)

  ## Sécurité (RLS)
  - Les commentaires sont visibles par tous les utilisateurs authentifiés
  - Seul l'auteur peut modifier ou supprimer son commentaire
  - Les administrateurs peuvent modérer tous les commentaires
  - Prévention du spam avec limite de commentaires par heure

  ## Fonctionnalités
  - Commentaires avec réponses (threading)
  - Réactions aux commentaires
  - Édition et suppression
  - Modération admin
  - Compteurs en temps réel
*/

-- Table des commentaires sur les offres d'emploi
CREATE TABLE IF NOT EXISTS job_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES job_comments(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 2000),
  is_edited boolean DEFAULT false,
  is_flagged boolean DEFAULT false,
  flagged_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des réactions aux commentaires
CREATE TABLE IF NOT EXISTS job_comment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES job_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'helpful', 'insightful')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id, reaction_type)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_job_comments_job_id ON job_comments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_comments_user_id ON job_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_job_comments_parent_id ON job_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_job_comments_created_at ON job_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_comment_reactions_comment_id ON job_comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_job_comment_reactions_user_id ON job_comment_reactions(user_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_job_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.is_edited = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_comment_updated_at_trigger
  BEFORE UPDATE ON job_comments
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content)
  EXECUTE FUNCTION update_job_comment_updated_at();

-- Fonction pour compter les commentaires d'une offre
CREATE OR REPLACE FUNCTION count_job_comments(job_uuid uuid)
RETURNS integer AS $$
  SELECT COUNT(*)::integer
  FROM job_comments
  WHERE job_id = job_uuid AND parent_id IS NULL;
$$ LANGUAGE sql STABLE;

-- Fonction pour compter les réponses d'un commentaire
CREATE OR REPLACE FUNCTION count_comment_replies(comment_uuid uuid)
RETURNS integer AS $$
  SELECT COUNT(*)::integer
  FROM job_comments
  WHERE parent_id = comment_uuid;
$$ LANGUAGE sql STABLE;

-- Fonction pour compter les réactions d'un commentaire
CREATE OR REPLACE FUNCTION count_comment_reactions(comment_uuid uuid, reaction text DEFAULT NULL)
RETURNS integer AS $$
  SELECT COUNT(*)::integer
  FROM job_comment_reactions
  WHERE comment_id = comment_uuid
    AND (reaction IS NULL OR reaction_type = reaction);
$$ LANGUAGE sql STABLE;

-- Vue enrichie des commentaires avec infos utilisateur
CREATE OR REPLACE VIEW job_comments_with_details AS
SELECT
  jc.*,
  p.full_name,
  p.user_type,
  p.avatar_url as user_avatar,
  count_comment_replies(jc.id) as replies_count,
  count_comment_reactions(jc.id, 'like') as likes_count,
  count_comment_reactions(jc.id, 'helpful') as helpful_count,
  count_comment_reactions(jc.id, 'insightful') as insightful_count
FROM job_comments jc
LEFT JOIN profiles p ON jc.user_id = p.id
ORDER BY jc.created_at DESC;

-- Enable Row Level Security
ALTER TABLE job_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour job_comments

-- Tout le monde peut voir les commentaires non signalés
CREATE POLICY "Anyone can view non-flagged comments"
  ON job_comments FOR SELECT
  TO authenticated
  USING (NOT is_flagged OR user_id = auth.uid());

-- Les utilisateurs authentifiés peuvent créer des commentaires
CREATE POLICY "Authenticated users can create comments"
  ON job_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      SELECT COUNT(*)
      FROM job_comments
      WHERE user_id = auth.uid()
        AND created_at > now() - interval '1 hour'
    ) < 10
  );

-- Les utilisateurs peuvent modifier leurs propres commentaires
CREATE POLICY "Users can update own comments"
  ON job_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres commentaires
CREATE POLICY "Users can delete own comments"
  ON job_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Les admins peuvent tout faire
CREATE POLICY "Admins can manage all comments"
  ON job_comments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );

-- RLS Policies pour job_comment_reactions

-- Tout le monde peut voir les réactions
CREATE POLICY "Anyone can view reactions"
  ON job_comment_reactions FOR SELECT
  TO authenticated
  USING (true);

-- Les utilisateurs peuvent ajouter des réactions
CREATE POLICY "Users can add reactions"
  ON job_comment_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres réactions
CREATE POLICY "Users can delete own reactions"
  ON job_comment_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour signaler un commentaire
CREATE OR REPLACE FUNCTION flag_job_comment(
  comment_uuid uuid,
  reason text
)
RETURNS boolean AS $$
DECLARE
  is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND user_type = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can flag comments';
  END IF;

  UPDATE job_comments
  SET is_flagged = true,
      flagged_reason = reason,
      updated_at = now()
  WHERE id = comment_uuid;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les commentaires d'une offre avec pagination
CREATE OR REPLACE FUNCTION get_job_comments(
  job_uuid uuid,
  page_limit integer DEFAULT 20,
  page_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  job_id uuid,
  user_id uuid,
  parent_id uuid,
  content text,
  is_edited boolean,
  created_at timestamptz,
  updated_at timestamptz,
  full_name text,
  user_type text,
  user_avatar text,
  replies_count integer,
  likes_count integer,
  helpful_count integer,
  insightful_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    jcwd.id,
    jcwd.job_id,
    jcwd.user_id,
    jcwd.parent_id,
    jcwd.content,
    jcwd.is_edited,
    jcwd.created_at,
    jcwd.updated_at,
    jcwd.full_name,
    jcwd.user_type,
    jcwd.user_avatar,
    jcwd.replies_count,
    jcwd.likes_count,
    jcwd.helpful_count,
    jcwd.insightful_count
  FROM job_comments_with_details jcwd
  WHERE jcwd.job_id = job_uuid
    AND jcwd.parent_id IS NULL
    AND NOT jcwd.is_flagged
  ORDER BY jcwd.created_at DESC
  LIMIT page_limit
  OFFSET page_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Ajouter une colonne comments_count à la table jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;

-- Fonction pour mettre à jour le compteur de commentaires
CREATE OR REPLACE FUNCTION update_job_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NULL THEN
    UPDATE jobs SET comments_count = comments_count + 1 WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NULL THEN
    UPDATE jobs SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.job_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_comments_count_trigger
  AFTER INSERT OR DELETE ON job_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_job_comments_count();

-- Grant permissions
GRANT SELECT ON job_comments_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION count_job_comments TO authenticated;
GRANT EXECUTE ON FUNCTION count_comment_replies TO authenticated;
GRANT EXECUTE ON FUNCTION count_comment_reactions TO authenticated;
GRANT EXECUTE ON FUNCTION get_job_comments TO authenticated;
GRANT EXECUTE ON FUNCTION flag_job_comment TO authenticated;