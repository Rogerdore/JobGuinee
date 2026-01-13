import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPublicAccess() {
  console.log('\n📋 TEST 1: Accès Public (Non connecté)');
  console.log('─'.repeat(60));

  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, status')
      .eq('status', 'published')
      .limit(5);

    if (error) {
      console.log('❌ Lecture jobs publics:', error.message);
    } else {
      console.log('✅ Lecture jobs publics:', jobs?.length || 0, 'jobs');
    }
  } catch (error) {
    console.log('❌ Erreur:', error.message);
  }

  try {
    const { data: applications, error } = await supabase
      .from('applications')
      .select('id')
      .limit(1);

    if (error) {
      console.log('✅ Accès applications refusé (normal):', error.message);
    } else {
      console.log('❌ SÉCURITÉ: Accès applications autorisé sans auth!', applications?.length);
    }
  } catch (error) {
    console.log('✅ Accès applications bloqué correctement');
  }

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);

    if (error) {
      console.log('✅ Accès profiles refusé (normal):', error.message);
    } else {
      console.log('❌ SÉCURITÉ: Accès profiles autorisé sans auth!', profiles?.length);
    }
  } catch (error) {
    console.log('✅ Accès profiles bloqué correctement');
  }
}

async function testCandidateAccess(email, password) {
  console.log('\n📋 TEST 2: Accès Candidat');
  console.log('─'.repeat(60));

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.log('❌ Connexion candidat échouée:', authError.message);
      return;
    }

    console.log('✅ Connexion candidat réussie:', authData.user.email);

    const { data: ownProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.log('❌ Lecture propre profil:', profileError.message);
    } else {
      console.log('✅ Lecture propre profil:', ownProfile?.user_type);
    }

    const { data: ownApplications, error: appError } = await supabase
      .from('applications')
      .select('id, status')
      .eq('candidate_id', authData.user.id);

    if (appError) {
      console.log('❌ Lecture propres candidatures:', appError.message);
    } else {
      console.log('✅ Lecture propres candidatures:', ownApplications?.length || 0);
    }

    const { data: savedJobs, error: savedError } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('user_id', authData.user.id);

    if (savedError) {
      console.log('❌ Lecture jobs sauvegardés:', savedError.message);
    } else {
      console.log('✅ Lecture jobs sauvegardés:', savedJobs?.length || 0);
    }

    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('id')
      .neq('id', authData.user.id)
      .limit(1);

    if (allProfilesError) {
      console.log('✅ Accès autres profiles refusé (normal):', allProfilesError.message);
    } else if (allProfiles?.length > 0) {
      console.log('⚠️ ATTENTION: Candidat peut voir autres profiles');
    }

    await supabase.auth.signOut();
    console.log('✅ Déconnexion candidat');
  } catch (error) {
    console.log('❌ Erreur test candidat:', error.message);
  }
}

async function testRecruiterAccess(email, password) {
  console.log('\n📋 TEST 3: Accès Recruteur');
  console.log('─'.repeat(60));

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.log('❌ Connexion recruteur échouée:', authError.message);
      return;
    }

    console.log('✅ Connexion recruteur réussie:', authData.user.email);

    const { data: ownJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, status')
      .eq('user_id', authData.user.id);

    if (jobsError) {
      console.log('❌ Lecture propres jobs:', jobsError.message);
    } else {
      console.log('✅ Lecture propres jobs:', ownJobs?.length || 0);
    }

    if (ownJobs && ownJobs.length > 0) {
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select('id, status, candidate_id')
        .eq('job_id', ownJobs[0].id);

      if (appError) {
        console.log('❌ Lecture candidatures pour ses jobs:', appError.message);
      } else {
        console.log('✅ Lecture candidatures pour ses jobs:', applications?.length || 0);
      }
    }

    const { data: otherJobs, error: otherJobsError } = await supabase
      .from('jobs')
      .select('id')
      .neq('user_id', authData.user.id)
      .neq('status', 'published')
      .limit(1);

    if (otherJobsError) {
      console.log('✅ Accès jobs autres recruteurs refusé (normal)');
    } else if (otherJobs?.length > 0) {
      console.log('⚠️ ATTENTION: Recruteur peut voir jobs non-publiés d\'autres');
    }

    await supabase.auth.signOut();
    console.log('✅ Déconnexion recruteur');
  } catch (error) {
    console.log('❌ Erreur test recruteur:', error.message);
  }
}

async function testAdminAccess(email, password) {
  console.log('\n📋 TEST 4: Accès Admin');
  console.log('─'.repeat(60));

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.log('❌ Connexion admin échouée:', authError.message);
      return;
    }

    console.log('✅ Connexion admin réussie:', authData.user.email);

    const { data: allJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, status')
      .limit(10);

    if (jobsError) {
      console.log('❌ Lecture tous jobs:', jobsError.message);
    } else {
      console.log('✅ Lecture tous jobs:', allJobs?.length || 0);
    }

    const { data: allApplications, error: appError } = await supabase
      .from('applications')
      .select('id, status')
      .limit(10);

    if (appError) {
      console.log('❌ Lecture toutes candidatures:', appError.message);
    } else {
      console.log('✅ Lecture toutes candidatures:', allApplications?.length || 0);
    }

    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .limit(10);

    if (profilesError) {
      console.log('❌ Lecture tous profiles:', profilesError.message);
    } else {
      console.log('✅ Lecture tous profiles:', allProfiles?.length || 0);
    }

    const { data: downloadLogs, error: logsError } = await supabase
      .from('download_logs')
      .select('id, action')
      .limit(5);

    if (logsError) {
      console.log('❌ Lecture logs téléchargement:', logsError.message);
    } else {
      console.log('✅ Lecture logs téléchargement:', downloadLogs?.length || 0);
    }

    await supabase.auth.signOut();
    console.log('✅ Déconnexion admin');
  } catch (error) {
    console.log('❌ Erreur test admin:', error.message);
  }
}

async function testStorageAccess() {
  console.log('\n📋 TEST 5: Accès Storage');
  console.log('─'.repeat(60));

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      console.log('❌ Liste buckets:', error.message);
    } else {
      console.log('✅ Liste buckets:', buckets?.map(b => b.name).join(', '));
    }
  } catch (error) {
    console.log('❌ Erreur storage:', error.message);
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🔒 TEST DE SÉCURITÉ RLS - JobGuinée V6');
  console.log('='.repeat(60));

  await testPublicAccess();
  await testStorageAccess();

  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(60));
  console.log('\n✅ Tests d\'accès public terminés');
  console.log('\n⚠️  Pour tester les autres rôles, appelez:');
  console.log('   - testCandidateAccess(email, password)');
  console.log('   - testRecruiterAccess(email, password)');
  console.log('   - testAdminAccess(email, password)');
  console.log('\n' + '='.repeat(60) + '\n');
}

runAllTests().catch(console.error);
