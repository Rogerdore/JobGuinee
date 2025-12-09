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

  try {
    // Créer l'utilisateur avec l'API Admin
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
      console.error('❌ Erreur lors de la création de l\'utilisateur:', authError.message);
      process.exit(1);
    }

    console.log('✅ Utilisateur créé avec succès');
    console.log('📝 ID utilisateur:', authData.user.id);

    // Attendre un peu pour que le trigger crée le profil
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mettre à jour le profil pour être admin
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update({
        user_type: 'admin',
        full_name: fullName
      })
      .eq('id', authData.user.id)
      .select();

    if (profileError) {
      console.error('❌ Erreur lors de la mise à jour du profil:', profileError.message);
      process.exit(1);
    }

    console.log('✅ Profil mis à jour en administrateur');
    console.log('\n🎉 Compte administrateur créé avec succès!\n');
    console.log('📋 Vos identifiants:');
    console.log('   Email:', email);
    console.log('   Mot de passe: [MASQUÉ POUR SÉCURITÉ]');
    console.log('\n🔐 Vous pouvez maintenant vous connecter avec ces identifiants!\n');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    process.exit(1);
  }
}

createAdminUser();
