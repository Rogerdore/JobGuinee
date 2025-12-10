// Script pour réinitialiser le mot de passe utilisateur via API REST
// Exécuter avec: node reset-password-api.js

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

async function resetPassword() {
  const userId = 'ae429d0e-416f-40ed-92cb-5bf8b272a589';
  const userEmail = 'doreroger07@yahoo.fr';
  const newPassword = 'Rogerdore1986@';

  console.log(`Réinitialisation du mot de passe pour: ${userEmail}`);
  console.log(`User ID: ${userId}`);

  try {
    const response = await fetch(
      `${supabaseUrl}/auth/v1/admin/users/${userId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          password: newPassword
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur lors de la réinitialisation:', errorData);
      process.exit(1);
    }

    const data = await response.json();

    console.log('\n✅ Mot de passe réinitialisé avec succès!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${userEmail}`);
    console.log(`Nouveau mot de passe: ${newPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nVous pouvez maintenant vous connecter avec ces identifiants!');

  } catch (error) {
    console.error('Erreur inattendue:', error.message);
    process.exit(1);
  }
}

resetPassword();
