import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixRecruiterCompany() {
  console.log('🔧 Correction des entreprises manquantes pour les recruteurs\n');

  const { data: recruiterProfiles } = await supabase
    .from('profiles')
    .select('id, email, full_name, user_type')
    .eq('user_type', 'recruiter');

  if (!recruiterProfiles || recruiterProfiles.length === 0) {
    console.log('❌ Aucun profil recruteur trouvé');
    return;
  }

  console.log(`✓ ${recruiterProfiles.length} profil(s) recruteur trouvé(s)\n`);

  for (const profile of recruiterProfiles) {
    console.log(`\n📋 Recruteur: ${profile.full_name || profile.email}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   ID: ${profile.id}`);

    const { data: existingCompany } = await supabase
      .from('companies')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (existingCompany) {
      console.log(`   ✓ Entreprise existante: ${existingCompany.company_name}`);
      console.log(`   ✓ ID: ${existingCompany.id}`);
      console.log(`   ✓ Abonnement: ${existingCompany.subscription_tier}`);

      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, title, status')
        .eq('company_id', existingCompany.id);

      console.log(`   ✓ Offres: ${jobs?.length || 0}`);
    } else {
      console.log('   ⚠️  Aucune entreprise associée - Création...');

      const companyName = profile.full_name
        ? `${profile.full_name} Recrutement`
        : 'Entreprise Recrutement';

      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert({
          profile_id: profile.id,
          company_name: companyName,
          industry: 'Services',
          company_size: '1-10',
          website: '',
          description: 'Entreprise de recrutement',
          subscription_tier: 'free',
          subscription_status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Erreur lors de la création:`, error);
      } else {
        console.log(`   ✅ Entreprise créée: ${newCompany.company_name}`);
        console.log(`   ✅ ID: ${newCompany.id}`);

        const { data: stages } = await supabase
          .from('workflow_stages')
          .select('*')
          .eq('company_id', newCompany.id);

        if (!stages || stages.length === 0) {
          console.log('   ⚠️  Création des étapes de workflow...');

          const defaultStages = [
            { stage_name: 'Candidature reçue', stage_order: 1, stage_color: '#3B82F6' },
            { stage_name: 'En révision', stage_order: 2, stage_color: '#F59E0B' },
            { stage_name: 'Entretien', stage_order: 3, stage_color: '#8B5CF6' },
            { stage_name: 'Offre', stage_order: 4, stage_color: '#10B981' },
            { stage_name: 'Refusé', stage_order: 5, stage_color: '#EF4444' }
          ];

          const stagesWithCompanyId = defaultStages.map(stage => ({
            ...stage,
            company_id: newCompany.id
          }));

          const { error: stagesError } = await supabase
            .from('workflow_stages')
            .insert(stagesWithCompanyId);

          if (stagesError) {
            console.error('   ❌ Erreur création workflow:', stagesError);
          } else {
            console.log('   ✅ Workflow créé (5 étapes)');
          }
        } else {
          console.log(`   ✓ Workflow existant (${stages.length} étapes)`);
        }
      }
    }
  }

  console.log('\n━'.repeat(60));
  console.log('✅ Traitement terminé\n');
}

fixRecruiterCompany().catch(console.error);
