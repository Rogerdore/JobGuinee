import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkExperiencesFormations() {
  try {
    // Récupérer tous les profils candidats
    const { data: profiles, error } = await supabase
      .from('candidate_profiles')
      .select('profile_id, full_name, work_experience, education')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Erreur:', error);
      return;
    }

    console.log('\n=== VÉRIFICATION DES EXPÉRIENCES ET FORMATIONS ===\n');

    if (!profiles || profiles.length === 0) {
      console.log('Aucun profil trouvé');
      return;
    }

    profiles.forEach((profile, index) => {
      console.log(`\n--- Profil ${index + 1}: ${profile.full_name || 'Sans nom'} ---`);
      console.log('Profile ID:', profile.profile_id);

      console.log('\nExpériences professionnelles (work_experience):');
      if (profile.work_experience) {
        console.log('Type:', typeof profile.work_experience);
        console.log('Contenu:', JSON.stringify(profile.work_experience, null, 2));
      } else {
        console.log('NULL ou vide');
      }

      console.log('\nFormations/Diplômes (education):');
      if (profile.education) {
        console.log('Type:', typeof profile.education);
        console.log('Contenu:', JSON.stringify(profile.education, null, 2));
      } else {
        console.log('NULL ou vide');
      }
    });

    console.log('\n=== FIN DE LA VÉRIFICATION ===\n');
  } catch (error) {
    console.error('Erreur:', error);
  }
}

checkExperiencesFormations();
