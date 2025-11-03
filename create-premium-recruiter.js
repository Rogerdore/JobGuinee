import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createPremiumRecruiter() {
  const email = 'recruiter-premium@example.com';
  const password = 'Premium123!';

  console.log('🔐 Creating premium recruiter account...\n');

  // Sign up the user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        user_type: 'recruiter',
        full_name: 'Premium Recruiter',
      }
    }
  });

  if (signUpError) {
    if (signUpError.message.includes('already registered')) {
      console.log('⚠️  User already exists, trying to sign in...\n');

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('❌ Error signing in:', signInError.message);
        return;
      }

      console.log('✅ Signed in existing user');
      await createOrUpdateCompany(signInData.user.id);
    } else {
      console.error('❌ Error creating user:', signUpError.message);
      return;
    }
  } else {
    console.log('✅ User created successfully');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);

    if (authData.user) {
      await createOrUpdateCompany(authData.user.id);
    }
  }
}

async function createOrUpdateCompany(userId) {
  console.log('🏢 Setting up premium company...\n');

  // Check if profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    console.log('Creating profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: 'recruiter-premium@example.com',
        full_name: 'Premium Recruiter',
        user_type: 'recruiter',
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      return;
    }
  }

  // Check if company exists
  const { data: existingCompany } = await supabase
    .from('companies')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle();

  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  if (existingCompany) {
    console.log('Upgrading existing company to premium...');
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        subscription_tier: 'premium',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: endDate.toISOString(),
      })
      .eq('id', existingCompany.id);

    if (updateError) {
      console.error('❌ Error updating company:', updateError.message);
      return;
    }
  } else {
    console.log('Creating new premium company...');
    const { error: companyError } = await supabase
      .from('companies')
      .insert({
        profile_id: userId,
        name: 'Premium Tech Company',
        description: 'A premium company with full access to AI features',
        industry: 'Technology',
        size: '50-200',
        location: 'Paris, France',
        subscription_tier: 'premium',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: endDate.toISOString(),
      });

    if (companyError) {
      console.error('❌ Error creating company:', companyError.message);
      return;
    }
  }

  console.log('\n✅ Premium company setup complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 LOGIN CREDENTIALS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   Email:    recruiter-premium@example.com');
  console.log('   Password: Premium123!');
  console.log('   Type:     Recruiter (Premium)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🎉 AI Matching feature is now available!');
  console.log('   - Log in with the credentials above');
  console.log('   - Go to Recruiter Dashboard');
  console.log('   - Click "Matching IA" on any job');
  console.log('   - Select candidates and launch analysis\n');
}

createPremiumRecruiter().catch(console.error);
