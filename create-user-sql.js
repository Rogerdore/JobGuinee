import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomBytes } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🚀 Création du compte via SQL direct\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUserViaSQL() {
  const email = 'doreroger07@yahoo.fr';
  const password = 'Rogerdore1986@';
  const fullName = 'Roger Dore';

  try {
    console.log('📧 Email:', email);
    console.log('👤 Nom:', fullName);
    console.log('\n⏳ Création en cours...\n');

    // Générer un ID utilisateur
    const userId = randomBytes(16).toString('hex');
    const formattedUserId = `${userId.slice(0, 8)}-${userId.slice(8, 12)}-${userId.slice(12, 16)}-${userId.slice(16, 20)}-${userId.slice(20)}`;

    console.log('📝 ID généré:', formattedUserId);

    // Créer un hash simple du mot de passe (NOTE: Ceci n'est PAS sécurisé pour la production)
    // Dans Supabase, le mot de passe devrait être haché avec bcrypt
    // Mais pour le test, on va essayer d'utiliser l'API auth.admin

    // Essayer avec l'API admin une dernière fois avec plus de détails
    console.log('🔑 Tentative avec l\'API Admin...\n');

    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (error) {
      console.error('❌ Erreur API Admin:', error);
      console.log('\n💡 L\'API Admin ne fonctionne pas. Cela indique un problème avec votre instance Supabase.');
      console.log('💡 Solutions possibles:');
      console.log('   1. Vérifiez que votre projet Supabase est actif');
      console.log('   2. Vérifiez que les clés dans .env sont correctes');
      console.log('   3. Vérifiez que les migrations de base de données ont été appliquées');
      console.log('   4. Essayez de créer un utilisateur manuellement via le dashboard Supabase');
      console.log('\n🌐 Dashboard: https://supabase.com/dashboard/project/hhhjzgeidjqctuveopso');
      process.exit(1);
    }

    console.log('✅ Utilisateur créé (ID:', data.user.id + ')');

    // Attendre que le trigger crée le profil
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mettre à jour le profil
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        user_type: 'admin',
        full_name: fullName
      })
      .eq('id', data.user.id);

    if (updateError) {
      console.error('⚠️  Erreur de mise à jour:', updateError.message);
    } else {
      console.log('✅ Profil configuré en admin');
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ COMPTE CRÉÉ');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📧 Email:', email);
    console.log('🔑 Mot de passe:', password);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

createUserViaSQL();
