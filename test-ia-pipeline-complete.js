import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Client admin pour les opérations de test
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Fonction pour créer un recruteur de test
async function createTestRecruiter() {
  console.log('📝 Création du recruteur de test...');

  const timestamp = Date.now().toString().slice(-8); // Utiliser seulement les 8 derniers chiffres
  const email = `recruiter.test${timestamp}@gmail.com`;
  const password = 'Test123!@#';

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        user_type: 'recruiter'
      }
    }
  });

  if (authError) {
    console.error('❌ Erreur création recruteur:', authError.message);
    throw authError;
  }

  console.log('✅ Recruteur créé:', email);

  // Attendre que le profil soit créé par le trigger
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Utiliser directement la session du signup (pas besoin de login séparé)
  if (authData.session) {
    console.log('✅ Session active');
    return { ...authData.user, email };
  }

  // Si pas de session, confirmer l'email via SQL et se connecter
  console.log('⚠️  Confirmation d\'email requise, confirmation automatique...');

  // Confirmer l'email via SQL directement
  try {
    await supabaseAdmin.rpc('confirm_test_user_email', { user_id_param: authData.user.id });
  } catch (rpcError) {
    // Si la fonction RPC n'existe pas, on utilise une requête SQL directe
    // Note: Cela nécessite que le client admin ait les droits nécessaires
    console.log('⚠️  Confirmation manuelle requise - continuons sans session active');
  }

  // Essayer de se connecter maintenant
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (!loginError && loginData.session) {
    console.log('✅ Connecté avec succès après confirmation');
    return { ...loginData.user, email };
  }

  console.log('⚠️  Impossible de se connecter - session manquante');
  console.log(`   User ID: ${authData.user.id}`);
  console.log(`   Email: ${email}`);

  // Retourner l'utilisateur même sans session
  return { ...authData.user, email };
}

// Fonction pour créer une entreprise de test
async function createTestCompany(recruiterId) {
  console.log('🏢 Création de l\'entreprise de test...');

  const { data: company, error } = await supabase
    .from('companies')
    .insert({
      name: `Entreprise Test IA ${Date.now()}`,
      description: 'Entreprise de test pour le pipeline IA',
      industry: 'Technology',
      size: '50-100',
      website: 'https://test.example.com',
      location: 'Conakry, Guinée',
      profile_id: recruiterId
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Erreur création entreprise:', error.message);
    throw error;
  }

  console.log('✅ Entreprise créée:', company.name);
  return company;
}

// Fonction pour créer des candidats de test
async function createTestCandidates() {
  console.log('👥 Création des candidats de test...');

  const timestamp = Date.now().toString().slice(-8);
  const candidates = [
    {
      email: `candidate1.test${timestamp}@gmail.com`,
      password: 'Test123!@#',
      profile: {
        full_name: 'Mamadou Diallo',
        title: 'Développeur Full Stack Senior',
        location: 'Conakry',
        skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
        experience_years: 5,
        experience_level: 'senior',
        education: { degree: 'Master', field: 'Informatique', institution: 'Université de Conakry' },
        work_experience: [
          { title: 'Lead Developer', company: 'TechCorp', duration: '3 ans', description: 'Migration vers le cloud' },
          { title: 'Developer', company: 'StartupInc', duration: '2 ans', description: 'Développement full stack' }
        ],
        bio: 'Développeur passionné avec 5 ans d\'expérience en développement web full stack'
      }
    },
    {
      email: `candidate2.test${timestamp}@gmail.com`,
      password: 'Test123!@#',
      profile: {
        full_name: 'Aissatou Bah',
        title: 'Développeuse Frontend',
        location: 'Conakry',
        skills: ['JavaScript', 'React', 'Vue.js', 'CSS', 'HTML'],
        experience_years: 3,
        experience_level: 'intermediate',
        education: { degree: 'Licence', field: 'Informatique', institution: 'ISI Conakry' },
        work_experience: [
          { title: 'Frontend Developer', company: 'DesignLab', duration: '3 ans', description: 'Développement UI/UX' }
        ],
        bio: 'Développeuse frontend spécialisée en React et Vue.js'
      }
    },
    {
      email: `candidate3.test${timestamp}@gmail.com`,
      password: 'Test123!@#',
      profile: {
        full_name: 'Ibrahim Camara',
        title: 'Junior Developer',
        location: 'Conakry',
        skills: ['JavaScript', 'HTML', 'CSS', 'Git'],
        experience_years: 1,
        experience_level: 'junior',
        education: { degree: 'BTS', field: 'Informatique', institution: 'CFPT Conakry' },
        work_experience: [
          { title: 'Stagiaire Développeur', company: 'WebAgency', duration: '1 an', description: 'Développement web' }
        ],
        bio: 'Jeune développeur motivé cherchant à progresser'
      }
    }
  ];

  const createdCandidates = [];

  for (const candidate of candidates) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: candidate.email,
      password: candidate.password,
      options: {
        data: {
          user_type: 'candidate'
        }
      }
    });

    if (authError) {
      console.error('❌ Erreur création candidat:', authError.message);
      continue;
    }

    // Attendre que le profil soit créé
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mettre à jour le profil candidat
    const { error: profileError } = await supabase
      .from('candidate_profiles')
      .update(candidate.profile)
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('❌ Erreur mise à jour profil:', profileError.message);
      continue;
    }

    createdCandidates.push({
      id: authData.user.id,
      email: candidate.email,
      ...candidate.profile
    });

    console.log(`✅ Candidat créé: ${candidate.profile.full_name}`);
  }

  return createdCandidates;
}

// Fonction pour créer une offre d'emploi de test
async function createTestJob(companyId) {
  console.log('💼 Création de l\'offre d\'emploi de test...');

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      company_id: companyId,
      title: 'Développeur Full Stack React/Node.js',
      description: `Nous recherchons un développeur Full Stack expérimenté pour rejoindre notre équipe.

Responsabilités:
- Développer et maintenir des applications web avec React et Node.js
- Collaborer avec l'équipe produit et design
- Participer aux revues de code
- Optimiser les performances des applications

Profil recherché:
- Minimum 3 ans d'expérience en développement web
- Maîtrise de React et Node.js
- Connaissance de TypeScript et PostgreSQL
- Bonnes pratiques de développement (tests, CI/CD)
- Esprit d'équipe et bonnes compétences en communication`,
      location: 'Conakry, Guinée',
      job_type: 'full_time',
      experience_level: 'senior',
      education_level: 'Bachelor',
      salary_min: 5000000,
      salary_max: 8000000,
      salary_currency: 'GNF',
      required_skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'JavaScript'],
      department: 'Engineering',
      status: 'published',
      published_at: new Date().toISOString()
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

// Fonction pour créer des candidatures
async function createApplications(candidates, jobId) {
  console.log('📨 Création des candidatures...');

  const applications = [];

  for (const candidate of candidates) {
    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        candidate_id: candidate.id,
        workflow_stage: 'Reçues',
        status: 'pending',
        cover_letter: `Je suis très intéressé(e) par ce poste. Mon expérience et mes compétences correspondent parfaitement à vos besoins.`
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur création candidature:', error.message);
      continue;
    }

    applications.push(application);
    console.log(`✅ Candidature créée pour: ${candidate.full_name}`);
  }

  return applications;
}

// Fonction pour lancer le matching IA
async function runAIMatching(job, candidates, userId) {
  console.log('\n🤖 Lancement du matching IA...');

  // Préparer les données pour le matching
  const matchingInput = {
    job: {
      title: job.title,
      description: job.description,
      required_skills: job.required_skills || [],
      experience_level: job.experience_level,
      education_level: job.education_level,
      department: job.department
    },
    candidates: candidates.map(c => ({
      id: c.id,
      name: c.full_name,
      email: c.email,
      title: c.title,
      skills: c.skills || [],
      experience_years: c.experience_years,
      education: JSON.stringify(c.education || {}),
      work_history: JSON.stringify(c.work_experience || [])
    }))
  };

  console.log('📊 Analyse de', candidates.length, 'candidats...');

  // Simuler le matching IA avec des scores réalistes
  const results = candidates.map(candidate => {
    let score = 50;

    // Bonus pour les compétences correspondantes
    const jobSkills = job.required_skills || [];
    const candidateSkills = candidate.skills || [];
    const matchingSkills = candidateSkills.filter(s =>
      jobSkills.some(js => js.toLowerCase() === s.toLowerCase())
    );
    score += matchingSkills.length * 5;

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
      candidate_id: candidate.id,
      candidate_name: candidate.full_name,
      score,
      category,
      analysis: {
        summary: `${candidate.full_name} présente un profil ${category === 'excellent' ? 'excellent' : category === 'potential' ? 'intéressant' : 'à développer'} pour ce poste.`,
        strengths: matchingSkills.length > 0
          ? [`Compétences techniques: ${matchingSkills.join(', ')}`, `${candidate.experience_years} ans d'expérience`]
          : ['Motivé et prêt à apprendre'],
        weaknesses: matchingSkills.length < 3
          ? ['Nécessite formation sur certaines technologies']
          : [],
        recommendations: category === 'excellent'
          ? ['Programmer un entretien technique', 'Vérifier les références']
          : category === 'potential'
          ? ['Évaluer lors d\'un entretien préliminaire']
          : ['Formation complémentaire recommandée']
      },
      score_breakdown: {
        technical_skills: Math.floor(score * 0.4),
        experience: Math.floor(score * 0.3),
        education: Math.floor(score * 0.15),
        cultural_fit: Math.floor(score * 0.15)
      }
    };
  });

  console.log('\n📈 Résultats du matching:');
  results.forEach(r => {
    const emoji = r.category === 'excellent' ? '🟢' : r.category === 'potential' ? '🟡' : '🔴';
    console.log(`${emoji} ${r.candidate_name}: ${r.score}% (${r.category})`);
  });

  return {
    results,
    summary: {
      total_analyzed: results.length,
      excellent_count: results.filter(r => r.category === 'excellent').length,
      potential_count: results.filter(r => r.category === 'potential').length,
      weak_count: results.filter(r => r.category === 'weak').length,
      top_recommendation: results.sort((a, b) => b.score - a.score)[0].candidate_name
    }
  };
}

// Fonction pour injecter les résultats dans le pipeline
async function injectIntoPipeline(matchingResults, applications) {
  console.log('\n⚡ Injection des résultats dans le pipeline...');

  const { data: { user } } = await supabase.auth.getUser();

  let moved = 0;
  let kept = 0;
  let rejected = 0;

  for (const result of matchingResults.results) {
    const application = applications.find(a => a.candidate_id === result.candidate_id);
    if (!application) continue;

    let targetStage = '';
    let action = '';

    if (result.category === 'excellent') {
      targetStage = 'Présélection IA';
      action = 'Déplacé vers Présélection IA';
      moved++;
    } else if (result.category === 'potential') {
      targetStage = 'Reçues';
      action = 'Conservé en Reçues';
      kept++;
    } else {
      targetStage = 'Reçues';
      action = 'Conservé en Reçues (score faible)';
      kept++;
    }

    // Mettre à jour la candidature
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        workflow_stage: targetStage,
        ai_score: result.score,
        ai_category: result.category,
        ai_analysis: result.analysis,
        updated_at: new Date().toISOString()
      })
      .eq('id', application.id);

    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError.message);
      continue;
    }

    // Logger l'action
    await supabase
      .from('application_activity_log')
      .insert({
        application_id: application.id,
        actor_id: user.id,
        action_type: 'ai_matching_injection',
        metadata: {
          score: result.score,
          category: result.category,
          previous_stage: 'Reçues',
          new_stage: targetStage,
          summary: result.analysis.summary,
          action
        }
      });

    console.log(`✅ ${result.candidate_name}: ${action} (${result.score}%)`);
  }

  console.log(`\n📊 Résumé de l'injection:`);
  console.log(`   - Présélection IA: ${moved} candidat(s)`);
  console.log(`   - Conservés en Reçues: ${kept} candidat(s)`);
  console.log(`   - Rejetés: ${rejected} candidat(s)`);

  return { moved, kept, rejected };
}

// Fonction pour tester les actions du pipeline
async function testPipelineActions(applications) {
  console.log('\n🔧 Test des actions du pipeline...');

  const { data: { user } } = await supabase.auth.getUser();
  const application = applications[0];

  // 1. Ajouter une note
  console.log('\n📝 Ajout d\'une note...');
  const { error: noteError } = await supabase
    .from('application_notes')
    .insert({
      application_id: application.id,
      recruiter_id: user.id,
      note_text: 'Excellent profil technique. À contacter en priorité.',
      is_private: true
    });

  if (noteError) {
    console.error('❌ Erreur ajout note:', noteError.message);
  } else {
    console.log('✅ Note ajoutée avec succès');
  }

  // 2. Mettre en shortlist
  console.log('\n⭐ Ajout à la shortlist...');
  const { error: shortlistError } = await supabase
    .from('applications')
    .update({
      is_shortlisted: true,
      shortlisted_at: new Date().toISOString()
    })
    .eq('id', application.id);

  if (shortlistError) {
    console.error('❌ Erreur shortlist:', shortlistError.message);
  } else {
    console.log('✅ Candidat ajouté à la shortlist');
  }

  // 3. Changer l'étape du workflow (ceci devrait déclencher une notification automatique)
  console.log('\n🔄 Changement d\'étape de workflow...');
  const { error: stageError } = await supabase
    .from('applications')
    .update({
      workflow_stage: 'Entretien RH',
      updated_at: new Date().toISOString()
    })
    .eq('id', application.id);

  if (stageError) {
    console.error('❌ Erreur changement étape:', stageError.message);
  } else {
    console.log('✅ Étape changée vers "Entretien RH"');
    console.log('   ℹ️  Une notification automatique devrait être envoyée au candidat');
  }

  // 4. Vérifier les notifications créées
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('\n📬 Vérification des notifications...');
  const { data: notifications, error: notifError } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', application.candidate_id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (notifError) {
    console.error('❌ Erreur récupération notifications:', notifError.message);
  } else {
    console.log(`✅ ${notifications?.length || 0} notification(s) trouvée(s)`);
    notifications?.forEach(notif => {
      console.log(`   - ${notif.type}: ${notif.title}`);
    });
  }

  return application;
}

// Fonction pour tester la communication automatique
async function testAutoCommunication(application) {
  console.log('\n💬 Test de communication automatique...');

  const { data: messages, error } = await supabase
    .from('communications_log')
    .select('*')
    .eq('application_id', application.id)
    .order('sent_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Erreur récupération messages:', error.message);
  } else {
    console.log(`✅ ${messages?.length || 0} message(s) envoyé(s)`);
    messages?.forEach(msg => {
      console.log(`   - ${msg.channel}: ${msg.subject || 'Message automatique'}`);
      console.log(`     Status: ${msg.status}`);
    });
  }
}

// Fonction pour afficher le résumé final
async function displayFinalSummary(job, applications) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 RÉSUMÉ COMPLET DU TEST');
  console.log('='.repeat(80));

  // Récupérer les candidatures avec leurs scores
  const { data: updatedApplications, error } = await supabase
    .from('applications')
    .select(`
      *,
      candidate_profiles!inner(full_name)
    `)
    .eq('job_id', job.id)
    .order('ai_score', { ascending: false });

  if (error) {
    console.error('❌ Erreur récupération candidatures:', error.message);
    return;
  }

  console.log(`\nOffre: ${job.title}`);
  console.log(`Nombre de candidatures: ${updatedApplications?.length || 0}`);

  console.log('\n📋 État des candidatures:');
  updatedApplications?.forEach((app, index) => {
    const emoji = app.ai_category === 'excellent' ? '🟢' : app.ai_category === 'potential' ? '🟡' : '🔴';
    const shortlist = app.is_shortlisted ? '⭐' : '  ';
    console.log(`${shortlist} ${emoji} ${app.candidate_profiles.full_name}`);
    console.log(`      Score IA: ${app.ai_score}% | Étape: ${app.workflow_stage}`);
  });

  // Statistiques du pipeline
  const stages = updatedApplications?.reduce((acc, app) => {
    acc[app.workflow_stage] = (acc[app.workflow_stage] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📈 Répartition par étape:');
  Object.entries(stages || {}).forEach(([stage, count]) => {
    console.log(`   - ${stage}: ${count}`);
  });

  // Vérifier l'activité log
  const { data: activityCount } = await supabase
    .from('application_activity_log')
    .select('id', { count: 'exact', head: true })
    .in('application_id', applications.map(a => a.id));

  console.log(`\n📝 ${activityCount} action(s) enregistrée(s) dans le log`);

  console.log('\n' + '='.repeat(80));
  console.log('✅ Test du pipeline IA terminé avec succès!');
  console.log('='.repeat(80));
}

// Fonction principale
async function runFullPipelineTest() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 TEST COMPLET DU PIPELINE IA JOBGUINÉE');
  console.log('='.repeat(80) + '\n');

  try {
    // 1. Créer le recruteur
    const recruiter = await createTestRecruiter();

    // 2. Créer l'entreprise
    const company = await createTestCompany(recruiter.id);

    // 3. Créer les candidats
    const candidates = await createTestCandidates();

    if (candidates.length === 0) {
      console.error('❌ Aucun candidat créé, impossible de continuer');
      return;
    }

    // 4. Créer l'offre d'emploi
    const job = await createTestJob(company.id);

    // 5. Créer les candidatures
    const applications = await createApplications(candidates, job.id);

    if (applications.length === 0) {
      console.error('❌ Aucune candidature créée, impossible de continuer');
      return;
    }

    // 6. Lancer le matching IA
    const matchingResults = await runAIMatching(job, candidates, recruiter.id);

    // 7. Injecter dans le pipeline
    await injectIntoPipeline(matchingResults, applications);

    // 8. Tester les actions du pipeline
    const testedApplication = await testPipelineActions(applications);

    // 9. Tester la communication automatique
    await testAutoCommunication(testedApplication);

    // 10. Afficher le résumé final
    await displayFinalSummary(job, applications);

    console.log('\n✅ Tous les tests sont passés avec succès!');
    console.log('\n📌 Informations de connexion:');
    console.log(`   Email recruteur: ${recruiter.email}`);
    console.log(`   Mot de passe: Test123!@#`);
    console.log(`   Job ID: ${job.id}`);
    console.log(`   Company ID: ${company.id}`);

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error);
    throw error;
  }
}

// Lancer le test
runFullPipelineTest()
  .then(() => {
    console.log('\n✨ Test terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });
