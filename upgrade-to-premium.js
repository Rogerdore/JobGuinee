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

async function upgradeCompanyToPremium() {
  console.log('🔍 Looking for companies...\n');

  const { data: companies, error: fetchError } = await supabase
    .from('companies')
    .select('id, name, profile_id, subscription_tier')
    .limit(10);

  if (fetchError) {
    console.error('❌ Error fetching companies:', fetchError.message);
    return;
  }

  if (!companies || companies.length === 0) {
    console.log('⚠️  No companies found in database');
    return;
  }

  console.log(`Found ${companies.length} company(ies):\n`);
  companies.forEach((company, index) => {
    console.log(`${index + 1}. ${company.name} (${company.id})`);
    console.log(`   Current tier: ${company.subscription_tier || 'free'}\n`);
  });

  const companyToUpgrade = companies[0];

  console.log(`\n⬆️  Upgrading "${companyToUpgrade.name}" to Premium...\n`);

  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  const { data: updated, error: updateError } = await supabase
    .from('companies')
    .update({
      subscription_tier: 'premium',
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: endDate.toISOString(),
    })
    .eq('id', companyToUpgrade.id)
    .select();

  if (updateError) {
    console.error('❌ Error updating company:', updateError.message);
    return;
  }

  console.log('✅ Company upgraded to Premium successfully!\n');
  console.log('Updated company details:');
  console.log(`  - Name: ${companyToUpgrade.name}`);
  console.log(`  - Subscription: premium`);
  console.log(`  - Valid until: ${endDate.toLocaleDateString()}`);
  console.log('\n🎉 The AI Matching feature is now available for this company!');
}

upgradeCompanyToPremium().catch(console.error);
