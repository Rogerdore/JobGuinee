import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilePhotos() {
  try {
    console.log('🔍 Checking for profile photos in database...\n');

    // Lister tous les profils candidats
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, user_type')
      .eq('user_type', 'candidate')
      .limit(10);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`📋 Found ${profiles.length} candidate profiles\n`);

    if (profiles.length === 0) {
      console.log('❌ No candidate profiles found');
      return;
    }

    // Pour chaque profil, vérifier s'il a une photo
    for (const profile of profiles) {
      const { data: candidateProfile, error } = await supabase
        .from('candidate_profiles')
        .select('id, profile_photo')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (error) {
        console.log(`❌ Error for ${profile.full_name}:`, error.message);
        continue;
      }

      if (candidateProfile) {
        const hasPhoto = candidateProfile.profile_photo ? '✅ HAS PHOTO' : '❌ NO PHOTO';
        console.log(`${hasPhoto} - ${profile.full_name} (ID: ${profile.id})`);

        if (candidateProfile.profile_photo) {
          console.log(`   Photo URL: ${candidateProfile.profile_photo}`);
        }
      } else {
        console.log(`❌ NO PROFILE DATA - ${profile.full_name} (ID: ${profile.id})`);
      }
    }

    // Statistiques
    console.log('\n📊 Statistics:');
    const { count: totalWithPhotos } = await supabase
      .from('candidate_profiles')
      .select('*', { count: 'exact', head: true })
      .not('profile_photo', 'is', null);

    const { count: totalProfiles } = await supabase
      .from('candidate_profiles')
      .select('*', { count: 'exact', head: true });

    console.log(`   Total candidate profiles: ${totalProfiles}`);
    console.log(`   Profiles with photos: ${totalWithPhotos}`);
    console.log(`   Profiles without photos: ${totalProfiles - totalWithPhotos}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkProfilePhotos();
