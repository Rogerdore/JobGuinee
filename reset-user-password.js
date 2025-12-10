// Script pour réinitialiser le mot de passe utilisateur
// Exécuter avec: node reset-user-password.js

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
  const userEmail = 'doreroger07@yahoo.fr';
  const newPassword = 'Rogerdore1986@';

  console.log(`Recherche de l'utilisateur avec l'email: ${userEmail}...`);

  try {
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Erreur lors de la recherche:', listError.message);
      process.exit(1);
    }

    const user = users.find(u => u.email === userEmail);

    if (!user) {
      console.error(`Aucun utilisateur trouvé avec l'email: ${userEmail}`);
      process.exit(1);
    }

    console.log(`Utilisateur trouvé! ID: ${user.id}`);
    console.log('Réinitialisation du mot de passe...');

    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (error) {
      console.error('Erreur lors de la réinitialisation:', error.message);
      process.exit(1);
    }

    console.log('\n✅ Mot de passe réinitialisé avec succès!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${userEmail}`);
    console.log(`Nouveau mot de passe: ${newPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nVous pouvez maintenant vous connecter avec ces identifiants!');

  } catch (error) {
    console.error('Erreur inattendue:', error);
    process.exit(1);
  }
}

resetPassword();
