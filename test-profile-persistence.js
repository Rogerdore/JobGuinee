import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testProfilePersistence() {
  console.log('🔍 Test de persistance du profil candidat...\n');

  try {
    const timestamp = Date.now();
    const testEmail = 'test.persist.' + timestamp + '@jobguinee.com';
    const testPassword = 'TestPassword123!';

    console.log('1️⃣  Création du compte...');
    const signUpResult = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test Persistance',
          user_type: 'candidate'
        }
      }
    });

    if (signUpResult.error || !signUpResult.data.user) {
      console.error('❌ Erreur:', signUpResult.error);
      return;
    }

    const userId = signUpResult.data.user.id;
    console.log('✅ Compte créé:', userId);
    console.log('   Email:', testEmail);
    console.log('   Password:', testPassword);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const profileResult = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profileResult.data) {
      console.error('❌ Profil non trouvé');
      return;
    }

    console.log('✅ Profil trouvé\n');

    console.log('2️⃣  Insertion de données complètes...');

    const testData = {
      profile_id: profileResult.data.id,
      user_id: userId,
      full_name: 'Test Persistance Complet',
      phone: '+224 621111111',
      birth_date: '1990-01-01',
      city: 'Conakry',
      photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TestPersist',
      work_experience: [
        {
          position: 'Développeur Senior',
          company: 'Test Company',
          start_date: '2020-01',
          end_date: null,
          is_current: true,
          description: 'Développement de solutions web'
        }
      ],
      education: [
        {
          degree: 'Master',
          field: 'Informatique',
          institution: 'Université Test',
          start_date: '2018',
          end_date: '2020'
        }
      ],
      skills: ['JavaScript', 'React', 'Node.js'],
      cv_url: 'https://example.com/test-cv.pdf',
      updated_at: new Date().toISOString()
    };

    const insertResult = await supabase
      .from('candidate_profiles')
      .insert(testData)
      .select()
      .single();

    if (insertResult.error) {
      console.error('❌ Erreur insertion:', insertResult.error);
      return;
    }

    console.log('✅ Données insérées\n');

    console.log('3️⃣  Vérification de la persistance...');

    const retrieveResult = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('profile_id', profileResult.data.id)
      .single();

    if (retrieveResult.error) {
      console.error('❌ Erreur récupération:', retrieveResult.error);
      return;
    }

    const retrieved = retrieveResult.data;
    console.log('✅ Données récupérées:');
    console.log('   Photo:', retrieved.photo_url ? '✅' : '❌');
    console.log('   Expériences:', retrieved.work_experience?.length || 0);
    console.log('   Formations:', retrieved.education?.length || 0);
    console.log('   Compétences:', retrieved.skills?.length || 0);
    console.log('   CV:', retrieved.cv_url ? '✅' : '❌');

    console.log('\n📋 DÉTAILS:');
    console.log('─'.repeat(70));
    console.log('Photo URL:', retrieved.photo_url);
    console.log('Expériences:', JSON.stringify(retrieved.work_experience, null, 2));
    console.log('Formations:', JSON.stringify(retrieved.education, null, 2));
    console.log('Compétences:', retrieved.skills);
    console.log('CV URL:', retrieved.cv_url);
    console.log('─'.repeat(70));

    console.log('\n✨ Test terminé! Credentials:');
    console.log('   Email:', testEmail);
    console.log('   Password:', testPassword);

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testProfilePersistence();
