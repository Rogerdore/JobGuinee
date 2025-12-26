import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL manquant');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY manquant');
  console.log('Besoin de la clé service Supabase pour réinitialiser le mot de passe.');
  process.exit(1);
}

async function resetPassword() {
  const userId = '13f857b2-0bc2-4f09-b845-335908d1a00e';
  const userEmail = 'recruteur@miningcorp.gn';
  const newPassword = 'Rogerdore7';

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
    console.log(`Mot de passe: ${newPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nVous pouvez maintenant vous connecter!');

  } catch (error) {
    console.error('Erreur inattendue:', error.message);
    process.exit(1);
  }
}

resetPassword();
