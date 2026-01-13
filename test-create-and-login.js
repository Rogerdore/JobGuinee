// Script pour créer un nouvel utilisateur et tester la connexion
// Exécuter avec: node test-create-and-login.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCreateAndLogin() {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  console.log('Test de création d\'utilisateur...');
  console.log(`Email: ${testEmail}`);

  try {
    // Créer un nouvel utilisateur
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          user_type: 'candidate',
          full_name: 'Test User'
        }
      }
    });

    if (signUpError) {
      console.error('\n❌ Erreur lors de la création:', signUpError.message);
      console.error('Code:', signUpError.status);
      console.error('Détails:', signUpError);
      process.exit(1);
    }

    console.log('\n✅ Utilisateur créé avec succès!');
    console.log('ID:', signUpData.user.id);

    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Déconnexion
    await supabase.auth.signOut();

    // Tester la connexion
    console.log('\nTest de connexion...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('\n❌ Erreur de connexion:', signInError.message);
      console.error('Code:', signInError.status);
      console.error('Détails:', signInError);
      process.exit(1);
    }

    console.log('\n✅ Connexion réussie!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', signInData.user.email);
    console.log('ID:', signInData.user.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single();

    if (profileError) {
      console.error('\n⚠️  Erreur lors de la récupération du profil:', profileError.message);
    } else {
      console.log('\nProfil:');
      console.log('- Nom:', profile.full_name);
      console.log('- Type:', profile.user_type);
      console.log('- Crédits:', profile.credits_balance);
    }

    // Déconnexion
    await supabase.auth.signOut();
    console.log('\n✅ Test terminé avec succès!');

  } catch (error) {
    console.error('\n❌ Erreur inattendue:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testCreateAndLogin();
