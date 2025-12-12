import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Identifiants du recruteur existant
const RECRUITER_EMAIL = 'recruiter.test48014245@gmail.com';
const RECRUITER_PASSWORD = 'Test123!@#';
const RECRUITER_ID = '584baa73-a7b2-451a-ab08-aa6687a12019';
const COMPANY_ID = '2d95f560-c740-4ed4-bf0f-3593daa05f9c';

async function loginRecruiter() {
  console.log('🔐 Connexion du recruteur...');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: RECRUITER_EMAIL,
    password: RECRUITER_PASSWORD
  });

  if (error) {
    console.error('❌ Erreur login:', error.message);
    throw error;
  }

  console.log('✅ Connecté:', RECRUITER_EMAIL);
  return data.user;
}

async function getOrCreateJob() {
  console.log('💼 Vérification de l\'offre d\'emploi...');

  // Vérifier si un job existe déjà
  const { data: existingJobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', COMPANY_ID)
    .eq('status', 'published')
    .limit(1);

  if (existingJobs && existingJobs.length > 0) {
    console.log('✅ Utilisation du job existant:', existingJobs[0].title);
    return existingJobs[0];
  }

  // Créer un nouveau job
  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      company_id: COMPANY_ID,
      user_id: RECRUITER_ID,
      title: 'Développeur Full Stack React/Node.js',
      description: `Nous recherchons un développeur Full Stack expérimenté.

Profil recherché:
- Minimum 3 ans d'expérience en développement web
- Maîtrise de React et Node.js
- Connaissance de TypeScript et PostgreSQL`,
      requirements: 'React, Node.js, TypeScript, PostgreSQL, JavaScript - 3 ans minimum',
      responsibilities: 'Développer et maintenir des applications web avec React et Node.js',
      location: 'Conakry, Guinée',
      contract_type: 'CDI',
      experience_level: 'senior',
      education_level: 'Bachelor',
      salary_min: 5000000,
      salary_max: 8000000,
      keywords: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'JavaScript'],
      department: 'Engineering',
      sector: 'Informatique',
      status: 'published'
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Erreur création job:', error.message);
    throw error;
  }

  console.log('✅ Job créé:', job.title);
  return job;
}

async function getCandidateProfiles() {
  console.log('👥 Récupération des profils candidats...');

  const { data: profiles, error } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('visibility', 'public')
    .limit(10);

  if (error) {
    console.error('❌ Erreur récupération candidats:', error.message);
    return [];
  }

  console.log(`✅ ${profiles?.length || 0} candidats trouvés`);
  return profiles || [];
}

async function getExistingApplications(jobId) {
  console.log('📨 Récupération des candidatures...');

  // Récupérer les applications
  const { data: applications, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('job_id', jobId)
    .limit(10);

  if (appError || !applications || applications.length === 0) {
    console.error('❌ Erreur ou aucune candidature:', appError?.message);
    return [];
  }

  // Récupérer les profils candidats
  const candidateIds = applications.map(a => a.candidate_id);
  const { data: profiles, error: profileError } = await supabase
    .from('candidate_profiles')
    .select('user_id, full_name, skills, experience_years')
    .in('user_id', candidateIds);

  if (profileError) {
    console.error('❌ Erreur récupération profils:', profileError.message);
    return applications; // Retourner quand même les applications
  }

  // Joindre les profils aux applications
  const applicationsWithProfiles = applications.map(app => ({
    ...app,
    candidate_profiles: profiles?.find(p => p.user_id === app.candidate_id) || {}
  }));

  console.log(`✅ ${applications.length} candidature(s) trouvée(s)`);
  return applicationsWithProfiles;
}

async function runAIMatching(job, candidates) {
  console.log('\n🤖 Lancement du matching IA...');
  console.log('📊 Analyse de', candidates.length, 'candidats...');

  const results = candidates.map(candidate => {
    let score = 50;

    // Bonus pour les compétences correspondantes
    const jobSkills = job.keywords || [];
    const candidateSkills = candidate.skills || [];
    const matchingSkills = candidateSkills.filter(s =>
      jobSkills.some(js => js.toLowerCase() === s.toLowerCase())
    );
    score += matchingSkills.length * 8;

    // Bonus pour l'expérience
    if (candidate.experience_years >= 3) score += 15;
    if (candidate.experience_years >= 5) score += 10;

    // Limiter le score entre 0 et 100
    score = Math.min(100, Math.max(0, score));

    // Déterminer la catégorie
    let category = 'weak';
    if (score >= 75) category = 'excellent';
    else if (score >= 50) category = 'potential';

    return {
      candidate_id: candidate.user_id,
      candidate_name: candidate.full_name || 'Candidat',
      score,
      category,
      matching_skills: matchingSkills,
      analysis: {
        summary: `Profil ${category === 'excellent' ? 'excellent' : category === 'potential' ? 'intéressant' : 'à développer'} pour ce poste.`,
        strengths: matchingSkills.length > 0
          ? [`Compétences: ${matchingSkills.join(', ')}`, `${candidate.experience_years || 0} ans d'expérience`]
          : ['Motivé'],
        weaknesses: matchingSkills.length < 3 ? ['Formation recommandée'] : [],
        recommendations: category === 'excellent'
          ? ['Entretien technique']
          : category === 'potential'
          ? ['Entretien préliminaire']
          : ['Formation']
      }
    };
  });

  console.log('\n📈 Résultats du matching:');
  results.forEach(r => {
    const emoji = r.category === 'excellent' ? '🟢' : r.category === 'potential' ? '🟡' : '🔴';
    console.log(`${emoji} ${r.candidate_name}: ${r.score}% (${r.matching_skills.join(', ') || 'aucune compétence'})`);
  });

  return results;
}

async function injectIntoPipeline(matchingResults, applications) {
  console.log('\n⚡ Injection des résultats dans le pipeline...');

  const { data: { user } } = await supabase.auth.getUser();
  let moved = 0, kept = 0;

  for (const result of matchingResults) {
    const application = applications.find(a => a.candidate_id === result.candidate_id);
    if (!application) continue;

    let targetStage = '';
    let action = '';

    if (result.category === 'excellent') {
      targetStage = 'Présélection IA';
      action = 'Déplacé vers Présélection IA';
      moved++;
    } else {
      targetStage = 'Reçues';
      action = 'Conservé en Reçues';
      kept++;
    }

    const { error: updateError } = await supabase
      .from('applications')
      .update({
        workflow_stage: targetStage,
        ai_score: result.score,
        ai_category: result.category
      })
      .eq('id', application.id);

    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError.message);
      continue;
    }

    await supabase
      .from('application_activity_log')
      .insert({
        application_id: application.id,
        actor_id: user.id,
        action_type: 'ai_matching_injection',
        metadata: {
          score: result.score,
          category: result.category,
          action
        }
      });

    console.log(`✅ ${result.candidate_name}: ${action} (${result.score}%)`);
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   - Présélection IA: ${moved}`);
  console.log(`   - Conservés: ${kept}`);

  return { moved, kept };
}

async function testPipelineActions(applications) {
  console.log('\n🔧 Test des actions du pipeline...');

  const { data: { user } } = await supabase.auth.getUser();
  const application = applications[0];

  if (!application) {
    console.log('⚠️  Aucune candidature disponible');
    return null;
  }

  // Ajouter une note
  await supabase.from('application_notes').insert({
    application_id: application.id,
    recruiter_id: user.id,
    note_text: 'Test: Excellent profil technique.',
    is_private: true
  });
  console.log('✅ Note ajoutée');

  // Mettre en shortlist
  await supabase
    .from('applications')
    .update({ is_shortlisted: true, shortlisted_at: new Date().toISOString() })
    .eq('id', application.id);
  console.log('✅ Ajouté à la shortlist');

  // Changer l'étape
  await supabase
    .from('applications')
    .update({
      workflow_stage: 'Entretien RH',
      updated_at: new Date().toISOString()
    })
    .eq('id', application.id);
  console.log('✅ Étape changée vers "Entretien RH"');
  console.log('   ℹ️  Notification automatique envoyée');

  return application;
}

async function displaySummary(jobId) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ DU TEST');
  console.log('='.repeat(80));

  // Récupérer les applications
  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .eq('job_id', jobId)
    .order('ai_score', { ascending: false });

  if (!applications || applications.length === 0) {
    console.log('\n⚠️  Aucune candidature trouvée\n');
    return;
  }

  // Récupérer les profils
  const candidateIds = applications.map(a => a.candidate_id);
  const { data: profiles } = await supabase
    .from('candidate_profiles')
    .select('user_id, full_name')
    .in('user_id', candidateIds);

  console.log(`\n${applications.length} candidature(s) au total\n`);

  applications.forEach(app => {
    const profile = profiles?.find(p => p.user_id === app.candidate_id);
    const emoji = app.ai_category === 'excellent' ? '🟢' : app.ai_category === 'potential' ? '🟡' : '🔴';
    const shortlist = app.is_shortlisted ? '⭐' : '  ';
    console.log(`${shortlist} ${emoji} ${profile?.full_name || 'Candidat'}`);
    console.log(`      Score IA: ${app.ai_score || 0}% | Étape: ${app.workflow_stage}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ Test du pipeline terminé avec succès!');
  console.log('='.repeat(80));
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 TEST PIPELINE IA - VERSION SIMPLIFIÉE');
  console.log('='.repeat(80) + '\n');

  try {
    await loginRecruiter();
    const job = await getOrCreateJob();
    const applications = await getExistingApplications(job.id);

    if (applications.length === 0) {
      console.log('⚠️  Aucune candidature trouvée. Créez des candidatures via SQL ou l\'interface.');
      return;
    }

    // Extraire les infos candidats des applications
    const candidates = applications.map(app => app.candidate_profiles);

    const matchingResults = await runAIMatching(job, candidates);
    await injectIntoPipeline(matchingResults, applications);
    await testPipelineActions(applications);
    await displaySummary(job.id);

    console.log('\n✨ Test terminé avec succès!\n');
  } catch (error) {
    console.error('\n💥 Erreur:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
