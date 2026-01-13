import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkAllProfiles() {
  console.log('🔍 Vérification de tous les profils\n');

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, user_type')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('❌ AUCUN profil trouvé dans la base de données\n');
    console.log('Vous devez créer un compte recruteur via l\'interface web ou utiliser:');
    console.log('  node create-premium-recruiter.js\n');
    return;
  }

  console.log(`✓ ${profiles.length} profil(s) trouvé(s)\n`);
  console.log('━'.repeat(70));

  const byType = profiles.reduce((acc, p) => {
    acc[p.user_type] = (acc[p.user_type] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 RÉSUMÉ PAR TYPE:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  console.log('\n📋 DÉTAIL DES PROFILS:\n');

  for (const profile of profiles) {
    console.log(`   ${profile.user_type.toUpperCase()}: ${profile.full_name || profile.email}`);
    console.log(`   └─ Email: ${profile.email}`);
    console.log(`   └─ ID: ${profile.id}`);

    if (profile.user_type === 'recruiter') {
      const { data: company } = await supabase
        .from('companies')
        .select('id, company_name')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (company) {
        console.log(`   └─ Entreprise: ${company.company_name} (${company.id})`);

        const { data: jobs } = await supabase
          .from('jobs')
          .select('id, title, status')
          .eq('company_id', company.id);

        console.log(`   └─ Offres: ${jobs?.length || 0}`);

        if (jobs && jobs.length > 0) {
          jobs.forEach(job => {
            console.log(`      • ${job.title} [${job.status}]`);
          });
        }
      } else {
        console.log(`   └─ ⚠️  Entreprise: MANQUANTE`);
      }
    }

    console.log('');
  }

  console.log('━'.repeat(70));
}

checkAllProfiles().catch(console.error);
