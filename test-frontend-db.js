import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n🔍 Test de connexion à la base de données frontend\n');
console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : 'Non trouvée');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabase() {
  try {
    console.log('\n1️⃣ Test de connexion à la table profiles...');
    const { data: profiles, error: profileError, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (profileError) {
      console.error('❌ Erreur:', profileError.message);
      console.error('Code:', profileError.code);
      console.error('Details:', profileError.details);
      return;
    }

    console.log('✅ Table profiles accessible');
    console.log('Nombre de profils:', count);

    console.log('\n2️⃣ Recherche du compte admin...');
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'doreroger07@yahoo.fr')
      .maybeSingle();

    if (adminError) {
      console.error('❌ Erreur:', adminError.message);
      return;
    }

    if (adminProfile) {
      console.log('✅ Compte trouvé:');
      console.log('   ID:', adminProfile.id);
      console.log('   Email:', adminProfile.email);
      console.log('   Nom:', adminProfile.full_name);
      console.log('   Type:', adminProfile.user_type);
    } else {
      console.log('❌ Aucun compte trouvé avec cet email');
      console.log('\n📝 Le compte doit être créé dans cette base de données.');
    }

    console.log('\n3️⃣ Test de l\'API Auth...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Erreur auth:', sessionError.message);
      return;
    }

    console.log('✅ API Auth fonctionnelle');
    console.log('Session active:', session ? 'Oui' : 'Non');

  } catch (error) {
    console.error('\n❌ Erreur inattendue:', error.message);
  }
}

testDatabase();
