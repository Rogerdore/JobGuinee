import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Need: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRecruiterCompanies() {
  console.log('🔍 Looking for recruiter profiles without companies...\n');

  // Get all recruiter profiles
  const { data: recruiterProfiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, user_type')
    .eq('user_type', 'recruiter');

  if (profileError) {
    console.error('❌ Error fetching profiles:', profileError.message);
    return;
  }

  if (!recruiterProfiles || recruiterProfiles.length === 0) {
    console.log('⚠️  No recruiter profiles found');
    return;
  }

  console.log(`✅ Found ${recruiterProfiles.length} recruiter profile(s)\n`);

  for (const profile of recruiterProfiles) {
    console.log(`\n📋 Processing: ${profile.email}`);

    // Check if company exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id, name, subscription_tier')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (existingCompany) {
      console.log(`   ✅ Company exists: ${existingCompany.name}`);
      console.log(`   📊 Tier: ${existingCompany.subscription_tier || 'free'}`);
    } else {
      console.log('   ⚠️  No company found, creating one...');

      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      const { error: createError } = await supabase
        .from('companies')
        .insert({
          profile_id: profile.id,
          name: `${profile.full_name || 'Company'} Inc.`,
          description: 'Entreprise de recrutement',
          industry: 'Technology',
          size: '10-50',
          location: 'Paris, France',
          subscription_tier: 'free',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: endDate.toISOString(),
        });

      if (createError) {
        console.error(`   ❌ Error creating company: ${createError.message}`);
      } else {
        console.log('   ✅ Company created successfully!');
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All recruiter profiles processed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function upgradeRecruiterToPremium(email) {
  console.log(`\n🌟 Upgrading ${email} to Premium...\n`);

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .eq('user_type', 'recruiter')
    .maybeSingle();

  if (profileError || !profile) {
    console.error('❌ Recruiter profile not found');
    return;
  }

  // Get company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id')
    .eq('profile_id', profile.id)
    .maybeSingle();

  if (companyError || !company) {
    console.error('❌ Company not found');
    return;
  }

  // Update to premium
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  const { error: updateError } = await supabase
    .from('companies')
    .update({
      subscription_tier: 'premium',
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: endDate.toISOString(),
    })
    .eq('id', company.id);

  if (updateError) {
    console.error('❌ Error upgrading:', updateError.message);
  } else {
    console.log('✅ Successfully upgraded to Premium!');
    console.log(`   Valid until: ${endDate.toLocaleDateString()}\n`);
  }
}

// Main execution
const command = process.argv[2];
const email = process.argv[3];

if (command === 'upgrade' && email) {
  fixRecruiterCompanies()
    .then(() => upgradeRecruiterToPremium(email))
    .catch(console.error);
} else {
  fixRecruiterCompanies().catch(console.error);
}
