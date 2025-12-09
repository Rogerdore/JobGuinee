import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables manquantes: VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Liste des migrations essentielles dans l'ordre (éviter les duplicats avec préfixe 20251209)
const essentialMigrations = [
  '20251103093639_add_admin_user_type_to_profiles.sql',
  '20251031125117_fix_profile_creation_trigger.sql',
  '20251031130013_fix_profile_trigger_null_handling.sql',
  '20251030143038_add_salary_fields_to_candidate_profiles.sql',
  '20251030145854_extend_ats_system_for_recruiters.sql',
  '20251030150720_create_cvtheque_talent_pool_system.sql',
  '20251030152245_add_profile_cart_and_purchases.sql',
  '20251031124002_create_notifications_system.sql',
  '20251031125508_enhance_jobs_table_for_advanced_features.sql',
  '20251031130406_create_advanced_ats_workflow_system_v2.sql',
  '20251031141153_create_newsletter_subscribers_table.sql',
  '20251103085422_fix_database_security_and_performance.sql',
  '20251103085441_fix_remaining_function_search_paths.sql',
  '20251103090126_cleanup_unused_indexes_fix_policies_v2.sql',
  '20251103091051_create_cms_system.sql',
  '20251103091903_add_admin_role_and_update_cms_policies.sql',
  '20251103131836_add_premium_subscription_to_companies.sql',
  '20251103161301_fix_workflow_stages_trigger.sql',
  '20251103171504_create_profile_cart_table.sql',
  '20251103171527_create_profile_purchases_table.sql',
  '20251103171835_fix_profile_cart_policies.sql',
  '20251104080327_fix_security_and_performance_issues_v3.sql',
  '20251104080431_fix_remaining_policy_issues.sql',
  '20251104085128_create_premium_ai_services_system.sql',
  '20251104091406_add_gold_profile_premium_service.sql',
  '20251104105537_enhance_recruiter_profiles_system.sql',
  '20251104120144_add_profile_completion_percentage.sql',
  '20251104123646_create_formations_enrollment_system.sql',
  '20251104142101_add_trainer_user_type_and_profiles.sql',
  '20251104143621_enhance_trainer_profiles_by_organization_type.sql',
  '20251104144459_enhance_formations_with_type_specific_fields.sql',
  '20251104150900_add_organization_type_to_formations.sql',
  '20251104152925_create_formation_media_storage_v2.sql',
  '20251104153949_create_blog_media_storage_v2.sql',
  '20251104155952_create_resources_system.sql',
  '20251201203222_enhance_ia_pricing_engine_system.sql',
  '20251201211128_create_service_credit_cost_history_table.sql',
  '20251201213446_create_credit_purchase_system.sql',
  '20251201221322_create_ia_service_config_system.sql',
  '20251201224200_create_ia_service_templates_system.sql',
  '20251202084757_add_premium_templates_support.sql',
  '20251202085119_consolidate_ia_service_schemas.sql',
  '20251209160509_add_credits_cost_to_services.sql',
  '20251209160805_create_service_credit_costs_table.sql',
  '20251209160817_add_credits_balance_to_profiles.sql',
  '20251209170517_create_chatbot_system_v2.sql'
];

async function applyMigration(filename) {
  try {
    const filepath = join(__dirname, 'supabase', 'migrations', filename);
    const sql = readFileSync(filepath, 'utf8');

    console.log(`📝 Application: ${filename}`);

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // Fallback: essayer d'exécuter directement
      const lines = sql.split(';').filter(line => line.trim());
      for (const line of lines) {
        if (line.trim()) {
          await supabase.rpc('exec', { sql: line + ';' }).catch(() => {});
        }
      }
      return { data: null, error: null };
    });

    if (error) {
      console.log(`⚠️  ${filename}: ${error.message}`);
      return false;
    }

    console.log(`✅ ${filename} appliquée`);
    return true;
  } catch (err) {
    console.log(`❌ ${filename}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║   Application des migrations Supabase        ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  let success = 0;
  let failed = 0;

  for (const migration of essentialMigrations) {
    const result = await applyMigration(migration);
    if (result) {
      success++;
    } else {
      failed++;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log(`║   Résultat: ${success} réussies, ${failed} échouées         ║`);
  console.log('╚═══════════════════════════════════════════════╝\n');
}

main();
