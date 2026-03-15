/*
  # Autoriser les admins à insérer des notifications pour tout utilisateur
  
  Le module de communication admin a besoin d'insérer des notifications
  pour les destinataires. La policy RLS actuelle limite les INSERT à
  auth.uid() = user_id, ce qui bloque l'admin.
  
  Ajoute une policy INSERT pour les admins via is_admin().
*/

-- Ajouter la policy admin pour INSERT sur notifications
CREATE POLICY "Admins can insert notifications for any user"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());
