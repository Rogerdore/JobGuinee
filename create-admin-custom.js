// Script pour créer un compte administrateur
// Exécuter avec: node create-admin-custom.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Assurez-vous que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  const email = 'doreroger07@yahoo.fr';
  const password = 'Rogerdore1986@';
  const fullName = 'Roger Dore';

  console.log('🚀 Création du compte administrateur...');
  console.log('📧 Email:', email);

  try {
    // Créer l'utilisateur avec signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          user_type: 'admin'
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('ℹ️  Un compte existe déjà avec cet email');
        console.log('🔄 Tentative de connexion...');

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          console.error('❌ Erreur:', signInError.message);
          console.log('\n💡 Vérifiez votre mot de passe ou créez un nouveau compte avec un autre email');
          process.exit(1);
        }

        console.log('✅ Connexion réussie');
        console.log('📝 Mise à jour du profil en admin...');

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            user_type: 'admin',
            full_name: fullName
          })
          .eq('id', signInData.user.id);

        if (updateError) {
          console.error('❌ Erreur lors de la mise à jour:', updateError.message);
          process.exit(1);
        }

        await supabase.auth.signOut();
        console.log('✅ Profil mis à jour en administrateur');
      } else {
        console.error('❌ Erreur lors de la création:', authError.message);
        process.exit(1);
      }
    } else {
      console.log('✅ Utilisateur créé avec succès');
      console.log('📝 ID utilisateur:', authData.user.id);

      // Attendre un peu pour que le trigger crée le profil
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mettre à jour le profil pour être admin
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_type: 'admin',
          full_name: fullName
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('❌ Erreur lors de la mise à jour du profil:', profileError.message);
        process.exit(1);
      }

      await supabase.auth.signOut();
      console.log('✅ Profil mis à jour en administrateur');
    }

    console.log('\n🎉 Compte administrateur créé avec succès!\n');
    console.log('📋 Vos identifiants:');
    console.log('   Email:', email);
    console.log('   Mot de passe:', password);
    console.log('\n🔐 Vous pouvez maintenant vous connecter sur http://localhost:5173!\n');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    process.exit(1);
  }
}

createAdminUser();
