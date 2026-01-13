import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testPurchaseUpdate() {
  console.log('\n=== Test Purchase Update ===\n');

  // First, let's see if there are any pending purchases
  const { data: purchases, error: listError } = await supabase
    .from('credit_purchases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (listError) {
    console.error('Error listing purchases:', listError);
    return;
  }

  console.log('Recent purchases:');
  purchases?.forEach(p => {
    console.log(`  - ID: ${p.id}`);
    console.log(`    User: ${p.user_id}`);
    console.log(`    Status: ${p.payment_status} / ${p.purchase_status}`);
    console.log(`    Created: ${p.created_at}`);
    console.log('');
  });

  if (purchases && purchases.length > 0) {
    const testPurchase = purchases[0];
    console.log(`\nAttempting to update purchase ${testPurchase.id}...`);

    // Try to update it
    const { data: updateData, error: updateError } = await supabase
      .from('credit_purchases')
      .update({ payment_status: 'waiting_proof' })
      .eq('id', testPurchase.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      console.error('Error details:', JSON.stringify(updateError, null, 2));
    } else {
      console.log('✅ Update successful:', updateData);
    }
  }

  // Check auth status
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('\n=== Auth Status ===');
  if (authError) {
    console.error('❌ Not authenticated');
  } else if (user) {
    console.log('✅ Authenticated as:', user.id, user.email);
  } else {
    console.log('❌ No user found');
  }
}

testPurchaseUpdate()
  .then(() => {
    console.log('\n=== Test Complete ===\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
