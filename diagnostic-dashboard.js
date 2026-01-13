import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnoseDashboard() {
  console.log('🔍 Diagnostic du Dashboard Recruteur\n');
  console.log('━'.repeat(60));

  const { data: companies } = await supabase
    .from('companies')
    .select('id, company_name, subscription_tier');

  if (!companies || companies.length === 0) {
    console.log('❌ Aucune entreprise trouvée dans la base');
    return;
  }

  console.log(`✓ ${companies.length} entreprise(s) trouvée(s)\n`);

  for (const company of companies) {
    console.log(`\n📊 Entreprise: ${company.company_name} (${company.subscription_tier})`);
    console.log(`   ID: ${company.id}`);
    console.log('   ' + '─'.repeat(55));

    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, title, status, created_at')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    console.log(`\n   💼 OFFRES D'EMPLOI: ${jobs?.length || 0}`);
    if (jobs && jobs.length > 0) {
      jobs.forEach((job, idx) => {
        console.log(`      ${idx + 1}. ${job.title} [${job.status}]`);
        console.log(`         ID: ${job.id}`);
        console.log(`         Créée: ${new Date(job.created_at).toLocaleDateString('fr-FR')}`);
      });

      const activeJobs = jobs.filter(j => j.status === 'published');
      console.log(`\n      → Offres actives: ${activeJobs.length}/${jobs.length}`);

      const jobIds = jobs.map(j => j.id);
      const { count: totalApps } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .in('job_id', jobIds);

      console.log(`      → Total candidatures: ${totalApps || 0}`);

      const { data: recentApps } = await supabase
        .from('applications')
        .select(`
          id,
          candidate_id,
          job_id,
          workflow_stage,
          applied_at
        `)
        .in('job_id', jobIds)
        .order('applied_at', { ascending: false })
        .limit(5);

      console.log(`\n   👥 CANDIDATURES RÉCENTES: ${recentApps?.length || 0}`);
      if (recentApps && recentApps.length > 0) {
        recentApps.forEach((app, idx) => {
          console.log(`      ${idx + 1}. Application ${app.id.substring(0, 8)}...`);
          console.log(`         Job ID: ${app.job_id.substring(0, 8)}...`);
          console.log(`         Étape: ${app.workflow_stage}`);
          console.log(`         Date: ${new Date(app.applied_at).toLocaleDateString('fr-FR')}`);
        });
      }
    } else {
      console.log('      ⚠️  Aucune offre trouvée pour cette entreprise');
    }

    console.log('\n   🔧 TEST DES FONCTIONS RPC:');

    try {
      const { data: rpcMetrics, error: metricsError } = await supabase.rpc('get_recruiter_dashboard_metrics', {
        company_id_param: company.id
      });

      if (metricsError) {
        console.log(`      ❌ get_recruiter_dashboard_metrics: ${metricsError.message}`);
      } else {
        console.log(`      ✓ get_recruiter_dashboard_metrics: OK`);
        console.log(`        - Total jobs: ${rpcMetrics.total_jobs}`);
        console.log(`        - Active jobs: ${rpcMetrics.active_jobs}`);
      }
    } catch (e) {
      console.log(`      ❌ get_recruiter_dashboard_metrics: ${e.message}`);
    }

    try {
      const { data: rpcJobs, error: jobsError } = await supabase.rpc('get_recruiter_recent_jobs', {
        company_id_param: company.id,
        limit_count: 5
      });

      if (jobsError) {
        console.log(`      ❌ get_recruiter_recent_jobs: ${jobsError.message}`);
      } else {
        console.log(`      ✓ get_recruiter_recent_jobs: OK (${rpcJobs?.length || 0} résultats)`);
      }
    } catch (e) {
      console.log(`      ❌ get_recruiter_recent_jobs: ${e.message}`);
    }

    try {
      const { data: rpcApps, error: appsError } = await supabase.rpc('get_recruiter_recent_applications', {
        company_id_param: company.id,
        limit_count: 10
      });

      if (appsError) {
        console.log(`      ❌ get_recruiter_recent_applications: ${appsError.message}`);
      } else {
        console.log(`      ✓ get_recruiter_recent_applications: OK (${rpcApps?.length || 0} résultats)`);
      }
    } catch (e) {
      console.log(`      ❌ get_recruiter_recent_applications: ${e.message}`);
    }
  }

  console.log('\n' + '━'.repeat(60));
  console.log('✅ Diagnostic terminé\n');
}

diagnoseDashboard().catch(console.error);
