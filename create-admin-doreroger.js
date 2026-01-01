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

const email = 'doreroger07@gmail.com';
const password = 'Rogerdore1986@';
const fullName = 'Roger Dore';

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║   CRÉATION COMPTE ADMINISTRATEUR - JOBGUINÉE V6      ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');
console.log('📧 Email:', email);
console.log('👤 Nom:', fullName);
console.log('\n⏳ Veuillez patienter...\n');

async function createAdmin() {
  try {
    // Étape 1: Créer le compte utilisateur
    console.log('📝 Étape 1/3: Création du compte utilisateur...');

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: 'admin',
        }
      }
    });

    if (signUpError) {
      throw signUpError;
    }

    if (!signUpData.user) {
      throw new Error('Aucun utilisateur retourné');
    }

    console.log('✅ Compte créé avec succès!');
    console.log('   User ID:', signUpData.user.id);

    // Étape 2: Attendre la création du profil par le trigger
    console.log('\n📝 Étape 2/3: Attente de la création automatique du profil...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Étape 3: Mettre à jour le profil en admin
    console.log('📝 Étape 3/3: Configuration des droits administrateur...');

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        user_type: 'admin',
        full_name: fullName,
        profile_completed: true
      })
      .eq('id', signUpData.user.id);

    if (updateError) {
      console.error('\n⚠️  Attention: Erreur lors de la mise à jour du profil:', updateError.message);
      console.log('Le compte a été créé mais les droits admin n\'ont peut-être pas été appliqués.');
      console.log('Vous devrez peut-être mettre à jour manuellement le type d\'utilisateur dans la base.');
    } else {
      console.log('✅ Droits administrateur appliqués!');
    }

    // Vérifier le profil créé
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signUpData.user.id)
      .single();

    if (profileError) {
      console.log('\n⚠️  Impossible de vérifier le profil:', profileError.message);
    } else {
      console.log('\n📊 Vérification du profil:');
      console.log('   Type d\'utilisateur:', profileData.user_type);
      console.log('   Nom complet:', profileData.full_name);
      console.log('   Email:', profileData.email);
    }

    // Se déconnecter
    await supabase.auth.signOut();

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║      ✅ COMPTE ADMINISTRATEUR CRÉÉ AVEC SUCCÈS!      ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('\n📋 INFORMATIONS DE CONNEXION:');
    console.log('   📧 Email:        ', email);
    console.log('   🔑 Mot de passe: ', password);
    console.log('   👤 Nom:          ', fullName);
    console.log('   🛡️  Type:         Administrateur');
    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('🌐 Vous pouvez maintenant vous connecter à l\'application!\n');
    console.log('💡 Note: Si vous avez reçu un email de confirmation,');
    console.log('   vous devez confirmer votre email avant de vous connecter.\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);

    if (error.message.includes('User already registered') || error.message.includes('already registered')) {
      console.log('\n╔═══════════════════════════════════════════════════════╗');
      console.log('║              COMPTE DÉJÀ EXISTANT                    ║');
      console.log('╚═══════════════════════════════════════════════════════╝');
      console.log('\n💡 Un compte existe déjà avec cet email.');
      console.log('💡 Vous pouvez vous connecter avec:');
      console.log('   📧 Email:        ', email);
      console.log('   🔑 Mot de passe: ', password);
      console.log('\n💡 Si vous avez oublié votre mot de passe, utilisez');
      console.log('   la fonction "Mot de passe oublié" de l\'application.\n');
    } else if (error.message.includes('rate limit')) {
      console.log('\n⚠️  LIMITE DE TAUX ATTEINTE');
      console.log('💡 Trop de tentatives de création de compte.');
      console.log('💡 Veuillez réessayer dans quelques minutes.\n');
    } else {
      console.log('\n💡 Détails de l\'erreur:', error);
    }

    process.exit(1);
  }
}

createAdmin();
