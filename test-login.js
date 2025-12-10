// Script pour tester la connexion
// Exécuter avec: node test-login.js

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

async function testLogin() {
  const email = 'doreroger07@yahoo.fr';
  const password = 'Rogerdore1986@';

  console.log('Test de connexion...');
  console.log(`Email: ${email}`);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('\n❌ Erreur de connexion:', error.message);
      console.error('Code:', error.status);
      console.error('Détails:', error);
      process.exit(1);
    }

    console.log('\n✅ Connexion réussie!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Utilisateur:', data.user.email);
    console.log('ID:', data.user.id);
    console.log('Rôle:', data.user.role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
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
    process.exit(1);
  }
}

testLogin();
