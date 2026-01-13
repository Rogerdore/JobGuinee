// Script pour réinitialiser le mot de passe administrateur
// Exécuter avec: node reset-admin-password.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword() {
  const userId = 'f7da9eea-527c-43c9-b810-fa81fe9f70f5';
  const newPassword = 'Rogerdore1986@';

  console.log('Réinitialisation du mot de passe...');

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      console.error('Erreur:', error.message);
      process.exit(1);
    }

    console.log('Mot de passe réinitialisé avec succès');
    console.log('Email: doreroger07@yahoo.fr');
    console.log('Nouveau mot de passe: Rogerdore1986@');
    console.log('Vous pouvez maintenant vous connecter!');

  } catch (error) {
    console.error('Erreur inattendue:', error);
    process.exit(1);
  }
}

resetPassword();
