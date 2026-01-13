// Script pour créer un compte administrateur
// Exécuter avec: node create-admin.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Assurez-vous que VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const email = 'doreroger07@yahoo.fr';
  const password = 'Rogerdore1986@';
  const fullName = 'Roger Dore';

  console.log('🚀 Création du compte administrateur...');
  console.log('📧 Email:', email);
  console.log('👤 Nom:', fullName);
  console.log('\n⏳ Veuillez patienter...\n');

  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        user_type: 'admin'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
        console.log('ℹ️  Un compte existe déjà avec cet email');
        console.log('🔍 Recherche du compte existant...\n');

        const { data: users, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
          console.error('❌ Erreur lors de la recherche:', listError.message);
          process.exit(1);
        }

        const existingUser = users.users.find(u => u.email === email);

        if (!existingUser) {
          console.error('❌ Utilisateur introuvable dans la base de données');
          process.exit(1);
        }

        console.log('✅ Compte trouvé (ID:', existingUser.id + ')');
        console.log('📝 Mise à jour du profil en administrateur...\n');

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            user_type: 'admin',
            full_name: fullName
          })
          .eq('id', existingUser.id);

        if (updateError) {
          console.error('❌ Erreur lors de la mise à jour:', updateError.message);
          process.exit(1);
        }

        console.log('✅ Profil mis à jour avec succès!');
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('✅ COMPTE ADMINISTRATEUR PRÊT');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📧 Email:', email);
        console.log('🔑 Mot de passe:', password);
        console.log('👤 Rôle: Administrateur');
        console.log('═══════════════════════════════════════════════════════');
        console.log('\n🌐 Connectez-vous sur http://localhost:5173\n');

        return;
      }

      console.error('❌ Erreur lors de la création:', authError.message);
      process.exit(1);
    }

    console.log('✅ Utilisateur créé avec succès');
    console.log('📝 ID utilisateur:', authData.user.id);

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📝 Mise à jour du profil en administrateur...');

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        user_type: 'admin',
        full_name: fullName
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('⚠️  Avertissement:', profileError.message);
      console.log('Le compte a été créé mais le profil n\'a peut-être pas été mis à jour.');
    } else {
      console.log('✅ Profil configuré avec succès!');
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ COMPTE ADMINISTRATEUR CRÉÉ AVEC SUCCÈS');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📧 Email:', email);
    console.log('🔑 Mot de passe:', password);
    console.log('👤 Rôle: Administrateur');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n🌐 Connectez-vous sur http://localhost:5173\n');

  } catch (error) {
    console.error('\n❌ Erreur inattendue:', error.message);
    process.exit(1);
  }
}

createAdminUser();
