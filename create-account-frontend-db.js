import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🚀 Création du compte dans la base de données frontend\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAccount() {
  const email = 'doreroger07@yahoo.fr';
  const password = 'Rogerdore1986@';
  const fullName = 'Roger Dore';

  try {
    console.log('📧 Email:', email);
    console.log('👤 Nom:', fullName);
    console.log('\n⏳ Création en cours...\n');

    // Utiliser l'API Admin pour créer l'utilisateur
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        user_type: 'admin'
      }
    });

    if (userError) {
      console.error('❌ Erreur Admin API:', userError.message);
      console.log('\n💡 Essai avec la méthode signUp...\n');

      // Essayer avec signUp si l'API Admin échoue
      const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);

      const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            user_type: 'admin'
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error('Aucun utilisateur créé');
      }

      console.log('✅ Utilisateur créé (ID:', signUpData.user.id + ')');

      // Attendre que le trigger crée le profil
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mettre à jour le profil en admin avec le service key
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_type: 'admin',
          full_name: fullName
        })
        .eq('id', signUpData.user.id);

      if (updateError) {
        console.error('⚠️  Avertissement lors de la mise à jour:', updateError.message);
      } else {
        console.log('✅ Profil mis à jour en admin');
      }

      await anonClient.auth.signOut();
    } else {
      console.log('✅ Utilisateur créé (ID:', userData.user.id + ')');

      // Attendre que le trigger crée le profil
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Vérifier et mettre à jour le profil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_type: 'admin',
          full_name: fullName
        })
        .eq('id', userData.user.id);

      if (updateError) {
        console.error('⚠️  Avertissement:', updateError.message);
      } else {
        console.log('✅ Profil configuré en admin');
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ COMPTE ADMINISTRATEUR CRÉÉ');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📧 Email:', email);
    console.log('🔑 Mot de passe:', password);
    console.log('👤 Rôle: Administrateur');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n🌐 Connectez-vous sur http://localhost:5173\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);

    if (error.code) {
      console.error('Code:', error.code);
    }
    if (error.details) {
      console.error('Details:', error.details);
    }

    process.exit(1);
  }
}

createAccount();
