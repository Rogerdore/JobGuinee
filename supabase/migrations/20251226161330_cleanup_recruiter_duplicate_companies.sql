/*
  # Nettoyer les entreprises dupliquées du recruteur

  Supprime les enregistrements d'entreprise dupliquées et garde seulement 
  la version la plus récente avec le vrai logo Supabase.
*/

DELETE FROM companies 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY profile_id ORDER BY created_at DESC) as rn
    FROM companies
    WHERE profile_id = '13f857b2-0bc2-4f09-b845-335908d1a00e'
  ) AS ranked
  WHERE rn > 1
);
