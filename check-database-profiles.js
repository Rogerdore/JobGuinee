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

async function checkAllProfiles() {
  try {
    console.log('🔍 Checking all profiles in database...\n');
    console.log(`Connecting to: ${supabaseUrl}\n`);

    // Vérifier la table profiles
    const { data: allProfiles, error: profilesError, count } = await supabase
      .from('profiles')
      .select('id, full_name, user_type', { count: 'exact' })
      .limit(10);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`📋 Total profiles in 'profiles' table: ${count || 0}\n`);

    if (allProfiles && allProfiles.length > 0) {
      console.log('Profiles found:');
      allProfiles.forEach((p, idx) => {
        console.log(`${idx + 1}. ${p.full_name || 'No name'} - Type: ${p.user_type} (ID: ${p.id})`);
      });

      // Maintenant vérifier candidate_profiles
      console.log('\n🔍 Checking candidate_profiles table...\n');

      for (const profile of allProfiles) {
        const { data: candidateProfile, error } = await supabase
          .from('candidate_profiles')
          .select('id, profile_id, profile_photo, full_name, phone')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (candidateProfile) {
          console.log(`✅ Candidate profile found for ${profile.full_name}`);
          console.log(`   Profile ID: ${candidateProfile.profile_id}`);
          console.log(`   Full Name: ${candidateProfile.full_name || 'Not set'}`);
          console.log(`   Phone: ${candidateProfile.phone || 'Not set'}`);
          console.log(`   Photo: ${candidateProfile.profile_photo ? '✅ YES' : '❌ NO'}`);
          if (candidateProfile.profile_photo) {
            console.log(`   Photo URL: ${candidateProfile.profile_photo}`);
          }
          console.log('');
        }
      }
    } else {
      console.log('❌ No profiles found in the database');
    }

    // Vérifier les colonnes de la table candidate_profiles
    console.log('\n📊 Checking candidate_profiles table structure...');
    const { data: candidateProfiles, error: cpError } = await supabase
      .from('candidate_profiles')
      .select('*')
      .limit(1);

    if (cpError) {
      console.error('❌ Error:', cpError.message);
    } else if (candidateProfiles && candidateProfiles.length > 0) {
      console.log('✅ Table exists. Sample columns:');
      console.log(Object.keys(candidateProfiles[0]).join(', '));
    } else {
      console.log('⚠️  Table exists but is empty');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAllProfiles();
