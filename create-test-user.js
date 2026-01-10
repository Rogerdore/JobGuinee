#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('\n🔧 Création d\'Utilisateurs de Test\n');
console.log('═'.repeat(70));

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('   Vérifiez votre fichier .env\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function createTestUser() {
  const users = [
    {
      email: 'test@jobguinee.gn',
      password: 'Test123456!',
      name: 'Utilisateur Test',
      user_type: 'candidate'
    },
    {
      email: 'doreroger07@gmail.com',
      password: 'Dore123456!',
      name: 'Dore Roger',
      user_type: 'candidate'
    },
    {
      email: 'admin@jobguinee.gn',
      password: 'Admin123456!',
      name: 'Administrateur',
      user_type: 'admin'
    }
  ];

  console.log('📋 Création de 3 utilisateurs de test...\n');

  for (const user of users) {
    console.log(`🔹 ${user.email}`);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            full_name: user.name,
            user_type: user.user_type
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          console.log('   ✅ Compte existe déjà');
          console.log(`   📧 Email: ${user.email}`);
          console.log(`   🔑 Mot de passe: ${user.password}`);
        } else {
          console.log(`   ❌ Erreur: ${error.message}`);
        }
      } else if (data.user) {
        console.log('   ✅ Compte créé avec succès');
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Mot de passe: ${user.password}`);
        console.log(`   🆔 ID: ${data.user.id}`);
      }

      console.log('');
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}\n`);
    }
  }
}

async function testLogin() {
  console.log('═'.repeat(70));
  console.log('\n🔐 Test de Connexion\n');

  const testUser = {
    email: 'test@jobguinee.gn',
    password: 'Test123456!'
  };

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });

    if (error) {
      console.log('❌ Échec de connexion:', error.message);
    } else {
      console.log('✅ Connexion réussie!');
      console.log('   Email:', data.user.email);
      console.log('   ID:', data.user.id);
      console.log('   Type:', data.user.user_metadata?.user_type || 'N/A');

      await supabase.auth.signOut();
      console.log('   Déconnexion OK');
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

async function main() {
  try {
    await createTestUser();
    await testLogin();

    console.log('\n' + '═'.repeat(70));
    console.log('\n✅ UTILISATEURS DE TEST PRÊTS\n');

    console.log('Vous pouvez maintenant vous connecter avec:');
    console.log('');
    console.log('👤 Compte 1 (Candidat):');
    console.log('   Email: test@jobguinee.gn');
    console.log('   Mot de passe: Test123456!');
    console.log('');
    console.log('👤 Compte 2 (Dore Roger):');
    console.log('   Email: doreroger07@gmail.com');
    console.log('   Mot de passe: Dore123456!');
    console.log('');
    console.log('👤 Compte 3 (Admin):');
    console.log('   Email: admin@jobguinee.gn');
    console.log('   Mot de passe: Admin123456!');
    console.log('');

    console.log('🚀 Prochaines étapes:');
    console.log('   1. Ouvrez http://localhost:5173');
    console.log('   2. Utilisez un des comptes ci-dessus');
    console.log('   3. Si "Failed to fetch", ouvrez /test-connexion.html');
    console.log('');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);

    if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
      console.log('\n💡 DIAGNOSTIC:\n');
      console.log('L\'erreur "fetch failed" indique:');
      console.log('  1. Pas de connexion internet');
      console.log('  2. Supabase inaccessible');
      console.log('  3. URL Supabase incorrecte dans .env');
      console.log('');
      console.log('Solutions:');
      console.log('  1. Vérifiez votre connexion internet');
      console.log('  2. Vérifiez le fichier .env');
      console.log('  3. Testez depuis un navigateur: http://localhost:5173/test-connexion.html');
      console.log('');
    }

    process.exit(1);
  }
}

main();
