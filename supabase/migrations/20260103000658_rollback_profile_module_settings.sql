/*
  # Rollback Profile Module Settings

  1. Actions
    - Drop table profile_module_settings
    - Drop all associated policies
    - Drop all associated indexes
    
  2. Reason
    - Annulation de l'action précédente sur demande utilisateur
*/

DROP TABLE IF EXISTS profile_module_settings CASCADE;
