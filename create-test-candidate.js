import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestCandidate() {
  const testEmail = 'candidat@test.com';
  const testPassword = 'Test123456!';

  try {
    console.log('\n🔧 Création du compte candidat de test...\n');

    // 1. Créer l'utilisateur via signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Candidat Test',
          user_type: 'candidate',
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('✓ L\'utilisateur existe déjà\n');

        // Se connecter
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });

        if (signInError) {
          console.error('❌ Erreur de connexion:', signInError.message);
          return;
        }

        const userId = signInData.user.id;
        console.log(`✓ Connecté: ${userId}\n`);

        // Vérifier le profil
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          console.log('✓ Profil existe');
        }

        // Vérifier candidate_profile
        const { data: candidateProfile } = await supabase
          .from('candidate_profiles')
          .select('*')
          .eq('profile_id', userId)
          .maybeSingle();

        if (candidateProfile) {
          console.log('✓ Profil candidat existe');
          console.log('\nEXPÉRIENCES:', JSON.stringify(candidateProfile.work_experience, null, 2));
          console.log('\nFORMATIONS:', JSON.stringify(candidateProfile.education, null, 2));
        } else {
          console.log('⚠️  Profil candidat manquant - sera créé automatiquement lors de la première sauvegarde');
        }
      } else {
        throw authError;
      }
    } else {
      const userId = authData.user?.id;
      console.log(`✓ Utilisateur créé: ${userId}`);
      console.log('✓ Profil et profil candidat seront créés automatiquement par le trigger');
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ COMPTE CANDIDAT DE TEST PRÊT\n');
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔑 Mot de passe: ${testPassword}\n`);
    console.log('Vous pouvez maintenant vous connecter et tester le formulaire !');
    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
  }
}

createTestCandidate();
