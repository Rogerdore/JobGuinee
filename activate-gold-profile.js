import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function activateGoldProfile(userEmail, durationMonths = 3) {
  try {
    console.log(`Activating Gold Profile for: ${userEmail}`);

    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return;
    }

    console.log(`Found user: ${user.full_name} (${user.email})`);

    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    const { data: profile, error: profileError } = await supabase
      .from('candidate_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Candidate profile not found. Creating one...');

      const { error: createError } = await supabase
        .from('candidate_profiles')
        .insert({
          user_id: user.id,
          profile_id: user.id,
          is_gold_member: true,
          gold_member_since: now.toISOString(),
          gold_member_expires_at: expiresAt.toISOString(),
          visibility_boost: 10,
          priority_ranking: 100
        });

      if (createError) {
        console.error('Error creating profile:', createError);
        return;
      }
    } else {
      const { error: updateError } = await supabase
        .from('candidate_profiles')
        .update({
          is_gold_member: true,
          gold_member_since: now.toISOString(),
          gold_member_expires_at: expiresAt.toISOString(),
          visibility_boost: 10,
          priority_ranking: 100
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return;
      }
    }

    const { error: serviceError } = await supabase
      .from('user_premium_services')
      .insert({
        user_id: user.id,
        service_id: (await supabase
          .from('premium_services')
          .select('id')
          .eq('category', 'gold_profile')
          .single()).data?.id,
        status: 'active',
        expires_at: expiresAt.toISOString(),
        payment_method: 'manual',
      });

    if (serviceError) {
      console.log('Note: Could not link service (may already exist)');
    }

    console.log('✅ Gold Profile activated successfully!');
    console.log(`Expires at: ${expiresAt.toLocaleDateString('fr-FR')}`);
    console.log(`Duration: ${durationMonths} months`);

  } catch (error) {
    console.error('Error:', error);
  }
}

async function deactivateGoldProfile(userEmail) {
  try {
    console.log(`Deactivating Gold Profile for: ${userEmail}`);

    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError || !user) {
      console.error('User not found');
      return;
    }

    const { error: updateError } = await supabase
      .from('candidate_profiles')
      .update({
        is_gold_member: false,
        gold_member_expires_at: null,
        visibility_boost: 0,
        priority_ranking: 0
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error:', updateError);
      return;
    }

    await supabase
      .from('user_premium_services')
      .update({ status: 'cancelled' })
      .eq('user_id', user.id)
      .eq('service_id', (await supabase
        .from('premium_services')
        .select('id')
        .eq('category', 'gold_profile')
        .single()).data?.id);

    console.log('✅ Gold Profile deactivated successfully!');

  } catch (error) {
    console.error('Error:', error);
  }
}

async function listGoldProfiles() {
  try {
    const { data: profiles, error } = await supabase
      .from('candidate_profiles')
      .select('user_id, is_gold_member, gold_member_since, gold_member_expires_at, profiles(email, full_name)')
      .eq('is_gold_member', true);

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('\n📊 Active Gold Profiles:\n');

    if (!profiles || profiles.length === 0) {
      console.log('No active Gold profiles found.');
      return;
    }

    profiles.forEach((profile, index) => {
      const expiresAt = profile.gold_member_expires_at
        ? new Date(profile.gold_member_expires_at).toLocaleDateString('fr-FR')
        : 'N/A';

      console.log(`${index + 1}. ${profile.profiles.full_name} (${profile.profiles.email})`);
      console.log(`   Since: ${new Date(profile.gold_member_since).toLocaleDateString('fr-FR')}`);
      console.log(`   Expires: ${expiresAt}\n`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

const command = process.argv[2];
const email = process.argv[3];
const duration = process.argv[4] ? parseInt(process.argv[4]) : 3;

if (command === 'activate' && email) {
  activateGoldProfile(email, duration);
} else if (command === 'deactivate' && email) {
  deactivateGoldProfile(email);
} else if (command === 'list') {
  listGoldProfiles();
} else {
  console.log(`
Gold Profile Management Script

Usage:
  node activate-gold-profile.js activate <email> [duration_months]
  node activate-gold-profile.js deactivate <email>
  node activate-gold-profile.js list

Examples:
  node activate-gold-profile.js activate user@example.com 3
  node activate-gold-profile.js deactivate user@example.com
  node activate-gold-profile.js list
  `);
}
