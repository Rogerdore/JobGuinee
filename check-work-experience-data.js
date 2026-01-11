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

async function checkWorkExperience() {
  try {
    console.log('🔍 Checking work experience data for Candidat2 Doré...\n');

    // D'abord lister tous les profils de la table profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, user_type')
      .eq('user_type', 'candidate')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log(`📋 Profiles in 'profiles' table: ${profilesData.length}\n`);
    profilesData.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.full_name || 'No name'} (ID: ${p.id})`);
    });

    if (profilesData.length === 0) {
      console.log('❌ No candidate profiles found in profiles table');
      return;
    }

    // Prendre le premier ID de profil
    const firstProfileId = profilesData[0].id;

    // Maintenant chercher dans candidate_profiles avec cet ID
    const { data: allProfiles, error: listError } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('id', firstProfileId)
      .single();

    if (listError) {
      console.error('❌ Error fetching candidate_profiles:', listError);
      return;
    }

    const profiles = allProfiles;

    if (!profiles) {
      console.log('❌ No candidate_profiles entry found for this user');
      return;
    }

    console.log('\n📊 Analyzing candidate_profile for:', profilesData[0].full_name);
    console.log('ID:', profiles.id);
    console.log('\n📊 Work Experience Data:');
    console.log(JSON.stringify(profiles.work_experience, null, 2));
    console.log('\n📚 Education Data:');
    console.log(JSON.stringify(profiles.education, null, 2));

    // Analyser la structure
    if (profiles.work_experience && Array.isArray(profiles.work_experience)) {
      console.log('\n🔍 Analyzing work_experience structure:');
      profiles.work_experience.forEach((exp, index) => {
        console.log(`\nExperience ${index + 1}:`);
        console.log('Keys:', Object.keys(exp));
        console.log('Full object:', JSON.stringify(exp, null, 2));
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkWorkExperience();
