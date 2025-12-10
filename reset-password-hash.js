// Script pour réinitialiser le mot de passe en générant un hash bcrypt
// Exécuter avec: node reset-password-hash.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Fonction pour générer un hash bcrypt
async function hashPassword(password) {
  // Utiliser l'API Supabase pour hacher le mot de passe
  // En appelant l'API admin avec un utilisateur temporaire
  const tempEmail = `temp_${Date.now()}@example.com`;

  try {
    // Créer un utilisateur temporaire pour obtenir le hash
    const { data, error } = await supabase.auth.admin.createUser({
      email: tempEmail,
      password: password,
      email_confirm: true
    });

    if (error) {
      throw error;
    }

    // Récupérer le hash du mot de passe
    const { data: userData, error: fetchError } = await supabase
      .from('auth.users')
      .select('encrypted_password')
      .eq('id', data.user.id)
      .single();

    const hash = userData?.encrypted_password;

    // Supprimer l'utilisateur temporaire
    await supabase.auth.admin.deleteUser(data.user.id);

    return hash;
  } catch (error) {
    console.error('Erreur lors du hashage:', error);
    return null;
  }
}

async function resetPassword() {
  const userId = 'ae429d0e-416f-40ed-92cb-5bf8b272a589';
  const userEmail = 'doreroger07@yahoo.fr';
  const newPassword = 'Rogerdore1986@';

  console.log(`Approche alternative: suppression et recréation du compte`);
  console.log(`Email: ${userEmail}`);

  try {
    // D'abord, sauvegarder les données du profil
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Erreur lors de la récupération du profil:', profileError.message);
      process.exit(1);
    }

    console.log('Profil sauvegardé:', profileData);

    // Supprimer l'utilisateur actuel
    console.log('Suppression de l\'ancien compte...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Erreur lors de la suppression:', deleteError.message);
      console.log('\nEssayons une approche SQL directe...');

      // Approche SQL directe pour mettre à jour le mot de passe
      // Note: Ceci est une solution de contournement
      const { error: sqlError } = await supabase.rpc('reset_user_password', {
        user_email: userEmail,
        new_password: newPassword
      });

      if (sqlError) {
        console.error('Erreur SQL:', sqlError.message);
        console.log('\nLa base de données semble avoir un problème.');
        console.log('Solution: Connectez-vous au dashboard Supabase et réinitialisez le mot de passe manuellement.');
        process.exit(1);
      }
    } else {
      console.log('Ancien compte supprimé avec succès.');

      // Recréer l'utilisateur avec le nouveau mot de passe
      console.log('Création du nouveau compte...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: userEmail,
        password: newPassword,
        email_confirm: true,
        user_metadata: profileData
      });

      if (createError) {
        console.error('Erreur lors de la création:', createError.message);
        process.exit(1);
      }

      // Mettre à jour le profil avec les anciennes données
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', newUser.user.id);

      if (updateError) {
        console.log('Avertissement: Impossible de restaurer toutes les données du profil');
      }

      console.log('\n✅ Compte recréé avec succès!');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${userEmail}`);
    console.log(`Nouveau mot de passe: ${newPassword}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nVous pouvez maintenant vous connecter avec ces identifiants!');

  } catch (error) {
    console.error('Erreur inattendue:', error);
    process.exit(1);
  }
}

resetPassword();
