#!/usr/bin/env node

/**
 * Diagnostic du problème de connexion
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n🔍 Diagnostic du Problème de Connexion\n');
console.log('═'.repeat(70));

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

console.log('✅ Variables d\'environnement OK');
console.log(`   URL: ${supabaseUrl}`);
console.log('');

// Créer client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function diagnose() {
  console.log('📋 Test 1: Vérifier si l\'utilisateur existe');
  console.log('─'.repeat(70));

  const email = 'doreroger07@gmail.com';

  try {
    // Chercher l'utilisateur dans auth.users (accessible en tant qu'admin seulement)
    // On va plutôt chercher dans profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      console.log('⚠️ Erreur lors de la recherche du profil:', profileError.message);
      console.log('   Code:', profileError.code);
    } else if (!profile) {
      console.log('❌ Aucun profil trouvé pour:', email);
      console.log('\n💡 L\'utilisateur n\'existe pas dans la base de données');
      console.log('   Options:');
      console.log('   1. Créer un nouveau compte via "S\'inscrire"');
      console.log('   2. Vérifier l\'orthographe de l\'email');
      console.log('   3. Utiliser un autre email\n');
      return false;
    } else {
      console.log('✅ Profil trouvé:');
      console.log('   ID:', profile.id);
      console.log('   Email:', profile.email);
      console.log('   Type:', profile.user_type);
      console.log('   Créé le:', new Date(profile.created_at).toLocaleDateString());
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
    return false;
  }

  console.log('\n📋 Test 2: Tester la connexion Auth');
  console.log('─'.repeat(70));

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.log('❌ Erreur getSession:', error.message);
      return false;
    }

    console.log('✅ getSession() fonctionne');
    console.log('   Session active:', data.session ? 'Oui' : 'Non');
  } catch (err) {
    console.log('❌ Exception getSession:', err.message);
    return false;
  }

  console.log('\n📋 Test 3: Tester une connexion réelle');
  console.log('─'.repeat(70));
  console.log('⚠️ Ce test nécessite le mot de passe réel');
  console.log('   Pour des raisons de sécurité, on ne peut pas tester ici');
  console.log('');

  console.log('\n📋 Test 4: Vérifier les RLS policies');
  console.log('─'.repeat(70));

  try {
    // Tester l'accès public à la table profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log('⚠️ RLS Policy restrictive:', error.message);
      console.log('   Code:', error.code);
    } else {
      console.log('✅ Accès aux profiles: OK');
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('\n💡 DIAGNOSTIC\n');

  console.log('Causes possibles de "Failed to fetch":');
  console.log('  1. Connexion internet instable');
  console.log('  2. Supabase temporairement indisponible');
  console.log('  3. CORS bloqué par le navigateur');
  console.log('  4. Extension de navigateur (AdBlock, etc.)');
  console.log('  5. Firewall qui bloque Supabase');
  console.log('');

  console.log('Solutions:');
  console.log('  1. Vérifier la connexion internet');
  console.log('  2. Désactiver les extensions du navigateur');
  console.log('  3. Essayer en navigation privée');
  console.log('  4. Vider le cache du navigateur (Ctrl+Shift+Delete)');
  console.log('  5. Essayer un autre navigateur');
  console.log('  6. Créer un nouvel utilisateur si celui-ci n\'existe pas');
  console.log('');

  return true;
}

async function createTestUser() {
  console.log('\n📋 Test 5: Créer un utilisateur de test');
  console.log('─'.repeat(70));

  const testEmail = 'test@jobguinee.gn';
  const testPassword = 'Test123456!';

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Utilisateur Test',
          user_type: 'candidate'
        }
      }
    });

    if (error) {
      console.log('⚠️ Erreur création:', error.message);

      if (error.message.includes('already registered')) {
        console.log('✅ Le compte existe déjà');
        console.log('\n💡 Utilisez ces identifiants pour tester:');
        console.log(`   Email: ${testEmail}`);
        console.log(`   Mot de passe: ${testPassword}`);
      }
    } else if (data.user) {
      console.log('✅ Utilisateur de test créé:');
      console.log(`   Email: ${testEmail}`);
      console.log(`   Mot de passe: ${testPassword}`);
      console.log(`   ID: ${data.user.id}`);
      console.log('\n💡 Utilisez ces identifiants pour tester la connexion');
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('');
}

async function main() {
  await diagnose();
  await createTestUser();
}

main().catch(console.error);
