import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('📊 Vérification de la base de données...\n');
console.log('🔗 URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'Non trouvée');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabase() {
  try {
    // Vérifier si la table profiles existe
    console.log('\n🔍 Test de connexion à la table profiles...');
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Erreur:', error.message);
      console.error('Code:', error.code);
      console.error('Détails:', error.details);
      console.error('Hint:', error.hint);

      console.log('\n💡 La table "profiles" n\'existe peut-être pas ou les permissions RLS bloquent l\'accès.');
      console.log('💡 Vous devez peut-être appliquer les migrations de base de données.');
      return;
    }

    console.log('✅ Connexion réussie!');
    console.log('📊 Nombre de profils:', count);

    // Vérifier les utilisateurs auth
    console.log('\n🔍 Test de l\'API Auth...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Erreur auth:', sessionError.message);
      return;
    }

    console.log('✅ API Auth fonctionnelle');
    console.log('📝 Session:', session.session ? 'Active' : 'Aucune session active');

  } catch (error) {
    console.error('\n❌ Erreur inattendue:', error.message);
    console.error(error);
  }
}

checkDatabase();
