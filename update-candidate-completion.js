import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file
const envContent = readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.VITE_SUPABASE_ANON_KEY
);

function calculateCandidateCompletion(profile) {
  let score = 0;
  if (profile.full_name?.trim()) score += 10;
  if (profile.desired_position?.trim()) score += 10;
  if (profile.bio?.trim()) score += 10;
  if (profile.phone?.trim()) score += 10;
  if (profile.location?.trim()) score += 10;
  if (profile.experience_years !== undefined && profile.experience_years >= 0) score += 10;
  if (profile.education_level?.trim()) score += 10;
  if (profile.skills && profile.skills.length > 0) score += 10;
  if (profile.languages && profile.languages.length > 0) score += 4;
  if (profile.cv_url?.trim()) score += 4;
  if (profile.linkedin_url?.trim()) score += 4;
  if (profile.portfolio_url?.trim()) score += 4;
  if (profile.desired_salary_min?.toString().trim() || profile.desired_salary_max?.toString().trim()) score += 4;
  return score;
}

async function updateCandidateCompletions() {
  console.log('🔄 Fetching all candidate profiles...');

  // Get all candidate profiles
  const { data: candidates, error: fetchError } = await supabase
    .from('candidate_profiles')
    .select('*');

  if (fetchError) {
    console.error('❌ Error fetching candidates:', fetchError);
    return;
  }

  console.log(`📊 Found ${candidates.length} candidate profiles to update`);

  // Get corresponding profiles
  const profileIds = candidates.map(c => c.profile_id);
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, phone, user_type')
    .in('id', profileIds);

  if (profileError) {
    console.error('❌ Error fetching profiles:', profileError);
    return;
  }

  const profileMap = {};
  profiles.forEach(p => {
    profileMap[p.id] = p;
  });

  for (const candidate of candidates) {
    const profile = profileMap[candidate.profile_id];

    // Extract education level from education array
    const educationArray = candidate.education || [];
    const educationLevel = Array.isArray(educationArray) && educationArray.length > 0
      ? (educationArray[0]?.['Diplôme obtenu'] || educationArray[0]?.degree || '')
      : '';

    // Build profile data for calculation
    const profileData = {
      full_name: candidate.full_name || '',
      desired_position: candidate.title || '',
      bio: candidate.bio || '',
      phone: profile?.phone || '',
      location: candidate.location || '',
      experience_years: candidate.experience_years || 0,
      education_level: educationLevel,
      skills: candidate.skills || [],
      languages: candidate.languages || [],
      cv_url: candidate.cv_url || '',
      linkedin_url: '',
      portfolio_url: '',
      desired_salary_min: '',
      desired_salary_max: '',
    };

    const completionPercentage = calculateCandidateCompletion(profileData);

    console.log(`\n👤 ${candidate.full_name}`);
    console.log(`   Profile ID: ${candidate.profile_id}`);
    console.log(`   Completion: ${completionPercentage}%`);

    // Update profile completion percentage
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_completion_percentage: completionPercentage })
      .eq('id', candidate.profile_id);

    if (updateError) {
      console.error(`   ❌ Error updating:`, updateError);
    } else {
      console.log(`   ✅ Updated successfully`);
    }
  }

  console.log('\n✨ All candidate profiles updated!');
}

updateCandidateCompletions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
