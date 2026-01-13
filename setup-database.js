import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  try {
    const envFile = readFileSync(join(__dirname, '.env'), 'utf8');
    const env = {};
    envFile.split('\n').forEach(line => {
      const [key, ...values] = line.split('=');
      if (key && values.length) {
        env[key.trim()] = values.join('=').trim();
      }
    });
    return env;
  } catch (err) {
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  console.log('Assurez-vous que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Test de connexion à Supabase...\n');
  console.log('URL:', supabaseUrl);

  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);

    if (error) {
      if (error.message.includes('relation "profiles" does not exist')) {
        console.log('⚠️  La table "profiles" n\'existe pas encore.');
        console.log('📝 Vous devez appliquer les migrations depuis le dashboard Supabase.\n');
        return false;
      }
      console.error('❌ Erreur:', error.message);
      return false;
    }

    console.log('✅ Connexion réussie à Supabase!');
    console.log('✅ La base de données est configurée.\n');
    return true;
  } catch (err) {
    console.error('❌ Erreur de connexion:', err.message);
    return false;
  }
}

async function checkTables() {
  console.log('📊 Vérification des tables...\n');

  const tables = [
    'profiles',
    'candidate_profiles',
    'companies',
    'jobs',
    'applications',
    'formations',
    'blog_posts'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.log(`❌ ${table}: manquante`);
      } else {
        console.log(`✅ ${table}: OK`);
      }
    } catch (err) {
      console.log(`❌ ${table}: erreur`);
    }
  }

  console.log('\n📁 Fichiers de migration disponibles:');
  const migrationsDir = join(__dirname, 'supabase', 'migrations');
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  console.log(`   ${files.length} migrations trouvées\n`);
}

async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Configuration Base de Données Supabase  ║');
  console.log('╚════════════════════════════════════════════╝\n');

  const connected = await testConnection();

  if (connected) {
    await checkTables();
    console.log('✅ Votre base de données est prête!\n');
  } else {
    console.log('📋 Pour configurer votre base de données:\n');
    console.log('1. Allez sur https://supabase.com/dashboard');
    console.log('2. Sélectionnez votre projet');
    console.log('3. Database > Migrations');
    console.log('4. Connectez votre dépôt GitHub OU');
    console.log('5. Copiez/collez le contenu des migrations depuis supabase/migrations/\n');
  }
}

main();
