/*
  # Correction de la contrainte de longueur des commentaires

  1. Modifications
    - Réduire la longueur minimale des commentaires de 10 à 3 caractères
    - Plus user-friendly et permet des commentaires courts naturels
  
  2. Raison
    - 10 caractères est trop restrictif
    - Les utilisateurs peuvent vouloir écrire "Intéressant!", "Merci!", etc.
*/

-- Supprimer l'ancienne contrainte
ALTER TABLE job_comments 
DROP CONSTRAINT IF EXISTS job_comments_content_check;

-- Ajouter la nouvelle contrainte avec 3 caractères minimum
ALTER TABLE job_comments 
ADD CONSTRAINT job_comments_content_check 
CHECK (char_length(content) >= 3 AND char_length(content) <= 2000);
