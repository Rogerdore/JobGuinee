import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createAdminTest() {
  const email = `admin.test${Date.now().toString().slice(-8)}@gmail.com`;
  const password = 'Admin123!@#';

  console.log('Création du compte admin de test...');
  console.log('Email:', email);
  console.log('Mot de passe:', password);

  // Créer l'utilisateur
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        user_type: 'admin'
      }
    }
  });

  if (authError) {
    console.error('Erreur:', authError.message);
    return;
  }

  console.log('\n✅ Compte créé avec succès!');
  console.log('User ID:', authData.user.id);

  // Confirmer l'email
  console.log('\nConfirmation de l\'email...');
  const { error: confirmError } = await supabase.rpc('confirm_test_user_email', {
    user_id_param: authData.user.id
  });

  if (confirmError) {
    console.log('⚠️  Confirmation manuelle requise via SQL:');
    console.log(`UPDATE auth.users SET email_confirmed_at = now() WHERE id = '${authData.user.id}';`);
  } else {
    console.log('✅ Email confirmé');
  }

  // Attendre que le profil soit créé
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mettre à jour le profil pour être admin
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      user_type: 'admin',
      full_name: 'Admin Test'
    })
    .eq('id', authData.user.id);

  if (profileError) {
    console.log('⚠️  Mise à jour profil requise via SQL:');
    console.log(`UPDATE profiles SET user_type = 'admin', full_name = 'Admin Test' WHERE id = '${authData.user.id}';`);
  } else {
    console.log('✅ Profil admin configuré');
  }

  console.log('\n' + '='.repeat(60));
  console.log('IDENTIFIANTS ADMIN:');
  console.log('='.repeat(60));
  console.log('Email:', email);
  console.log('Mot de passe:', password);
  console.log('='.repeat(60));
}

createAdminTest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Erreur:', err);
    process.exit(1);
  });
