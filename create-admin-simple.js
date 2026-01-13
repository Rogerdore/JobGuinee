import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const email = 'doreroger07@yahoo.fr';
const password = 'Rogerdore1986@';
const fullName = 'Roger Dore';

console.log('\n🚀 Création du compte administrateur');
console.log('📧 Email:', email);
console.log('\n⏳ Veuillez patienter...\n');

async function createAdmin() {
  try {
    // Essayer de créer le compte
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: 'admin',
        }
      }
    });

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Aucun utilisateur retourné');
    }

    console.log('✅ Compte créé avec succès!');
    console.log('📝 ID:', data.user.id);

    // Attendre que le trigger crée le profil
    console.log('\n⏳ Attente de la création du profil...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mettre à jour le profil en admin
    console.log('📝 Mise à jour du profil en administrateur...');

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        user_type: 'admin',
        full_name: fullName
      })
      .eq('id', data.user.id);

    if (updateError) {
      console.error('\n⚠️  Attention: Erreur lors de la mise à jour du profil:', updateError.message);
      console.log('Le compte a été créé mais n\'est peut-être pas administrateur.');
      console.log('Vous devrez peut-être mettre à jour manuellement le type d\'utilisateur.');
    } else {
      console.log('✅ Profil mis à jour!');
    }

    // Se déconnecter
    await supabase.auth.signOut();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ COMPTE ADMINISTRATEUR CRÉÉ AVEC SUCCÈS!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📧 Email:', email);
    console.log('🔑 Mot de passe:', password);
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n🌐 Rendez-vous sur http://localhost:5173 pour vous connecter!\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);

    if (error.message.includes('User already registered')) {
      console.log('\n💡 Un compte existe déjà avec cet email.');
      console.log('💡 Essayez de vous connecter avec le mot de passe:', password);
      console.log('💡 Ou utilisez un autre email pour créer un nouveau compte.');
    }

    process.exit(1);
  }
}

createAdmin();
