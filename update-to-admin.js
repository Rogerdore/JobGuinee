import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateToAdmin() {
  const email = 'doreroger07@yahoo.fr';
  const fullName = 'Roger Dore';

  console.log('\n📝 Mise à jour du compte en administrateur\n');

  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        user_type: 'admin',
        full_name: fullName
      })
      .eq('email', email);

    if (error) {
      console.error('❌ Erreur:', error.message);
      process.exit(1);
    }

    console.log('✅ Compte mis à jour en administrateur!');
    console.log('\n🌐 Vous pouvez maintenant vous connecter\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

updateToAdmin();
