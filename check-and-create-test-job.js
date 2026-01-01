import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkAndCreateTestJob() {
  try {
    console.log('🔍 Vérification des offres dans la base de données...\n');

    // Vérifier combien d'offres existent
    const { data: allJobs, error: countError } = await supabase
      .from('jobs')
      .select('id, title, status', { count: 'exact' });

    if (countError) {
      console.error('❌ Erreur lors du comptage des offres:', countError);
      return;
    }

    console.log(`📊 Nombre total d'offres: ${allJobs?.length || 0}`);

    if (allJobs && allJobs.length > 0) {
      console.log('\n📋 Liste des offres:');
      allJobs.forEach((job, index) => {
        console.log(`  ${index + 1}. ${job.title} - Status: ${job.status} (ID: ${job.id})`);
      });
    }

    // Vérifier les offres en attente
    const { data: pendingJobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'pending');

    console.log(`\n⏳ Offres en attente de modération: ${pendingJobs?.length || 0}`);

    // Trouver un recruteur pour créer une offre de test
    const { data: recruiters } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('user_type', 'recruiter')
      .limit(1);

    if (!recruiters || recruiters.length === 0) {
      console.log('\n⚠️  Aucun recruteur trouvé. Impossible de créer une offre de test.');
      return;
    }

    const recruiter = recruiters[0];
    console.log(`\n👤 Recruteur trouvé: ${recruiter.full_name} (${recruiter.email})`);

    if (!pendingJobs || pendingJobs.length === 0) {
      console.log('\n🆕 Création d\'une offre de test en attente...');

      const { data: newJob, error: createError } = await supabase
        .from('jobs')
        .insert({
          user_id: recruiter.id,
          title: 'Développeur Full Stack - TEST',
          description: 'Offre de test pour la modération. Nous recherchons un développeur full stack expérimenté pour rejoindre notre équipe.',
          location: 'Conakry',
          contract_type: 'CDI',
          sector: 'Informatique',
          salary_range: '500000-1000000',
          department: 'Entreprise Test SA',
          category: 'Développement',
          position_count: 1,
          experience_level: '3-5 ans',
          education_level: 'Bac+3',
          status: 'pending',
          submitted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erreur lors de la création de l\'offre:', createError);
        return;
      }

      console.log('✅ Offre de test créée avec succès!');
      console.log(`   ID: ${newJob.id}`);
      console.log(`   Titre: ${newJob.title}`);
      console.log(`   Status: ${newJob.status}`);
    } else {
      console.log('✅ Des offres en attente existent déjà, aucune création nécessaire.');
    }

    console.log('\n✨ Vérification terminée!');
    console.log('\n💡 Rechargez la page de modération pour voir les offres.');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

checkAndCreateTestJob();
