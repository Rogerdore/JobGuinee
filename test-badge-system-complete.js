/**
 * COMPREHENSIVE BADGE SYSTEM TEST SUITE
 * Tests the complete workflow from badge request to expiration
 * Run: node test-badge-system-complete.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function createTestRecruiter() {
  logSection('ÉTAPE 1: CRÉATION RECRUTEUR DE TEST');

  // Create auth user
  const email = `test-recruiter-badges-${Date.now()}@jobguinee.com`;
  const password = 'TestBadges2026!';

  log(`📧 Email: ${email}`, 'blue');

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });

  if (authError) {
    log(`❌ Erreur auth: ${authError.message}`, 'red');
    return null;
  }

  log('✅ Compte auth créé', 'green');

  // Wait for profile creation
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError) {
    log(`❌ Erreur profile: ${profileError.message}`, 'red');
    return null;
  }

  // Create company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: 'Test Company Badges',
      user_id: authData.user.id,
      industry: 'Technology',
      size: '50-100'
    })
    .select()
    .single();

  if (companyError) {
    log(`❌ Erreur company: ${companyError.message}`, 'red');
    return null;
  }

  log('✅ Entreprise créée', 'green');

  // Update profile to recruiter with premium
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      user_type: 'recruiter',
      company_id: company.id,
      account_type: 'premium' // Premium gets 5 badge limit
    })
    .eq('id', authData.user.id);

  if (updateError) {
    log(`❌ Erreur update profile: ${updateError.message}`, 'red');
    return null;
  }

  log('✅ Profile mis à jour (recruiter premium)', 'green');

  return {
    user: authData.user,
    profile,
    company,
    email,
    password
  };
}

async function createTestJob(userId, companyId) {
  logSection('ÉTAPE 2: CRÉATION OFFRE D\'EMPLOI TEST');

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      title: 'Développeur Senior - Test Badges',
      description: 'Offre de test pour système de badges',
      company_id: companyId,
      user_id: userId,
      contract_type: 'CDI',
      location: 'Conakry',
      salary_min: 5000000,
      salary_max: 8000000,
      status: 'published'
    })
    .select()
    .single();

  if (error) {
    log(`❌ Erreur création job: ${error.message}`, 'red');
    return null;
  }

  log(`✅ Job créé: ${job.id}`, 'green');
  log(`   Titre: ${job.title}`, 'blue');

  return job;
}

async function testBadgeEligibility(recruiterId) {
  logSection('ÉTAPE 3: TEST ÉLIGIBILITÉ BADGES');

  // Test URGENT badge eligibility
  log('🔍 Vérification éligibilité URGENT...', 'yellow');
  const { data: urgentEligibility, error: urgentError } = await supabase
    .rpc('check_badge_eligibility', {
      p_recruiter_id: recruiterId,
      p_badge_type: 'urgent'
    });

  if (urgentError) {
    log(`❌ Erreur: ${urgentError.message}`, 'red');
  } else {
    log(`✅ Éligibilité URGENT:`, 'green');
    log(`   Can request: ${urgentEligibility.can_request}`, 'blue');
    log(`   Active count: ${urgentEligibility.active_count}`, 'blue');
    log(`   Max allowed: ${urgentEligibility.max_allowed}`, 'blue');
    log(`   Remaining: ${urgentEligibility.remaining}`, 'blue');
  }

  // Test FEATURED badge eligibility
  log('\n🔍 Vérification éligibilité À LA UNE...', 'yellow');
  const { data: featuredEligibility, error: featuredError } = await supabase
    .rpc('check_badge_eligibility', {
      p_recruiter_id: recruiterId,
      p_badge_type: 'featured'
    });

  if (featuredError) {
    log(`❌ Erreur: ${featuredError.message}`, 'red');
  } else {
    log(`✅ Éligibilité À LA UNE:`, 'green');
    log(`   Can request: ${featuredEligibility.can_request}`, 'blue');
    log(`   Active count: ${featuredEligibility.active_count}`, 'blue');
    log(`   Max allowed: ${featuredEligibility.max_allowed}`, 'blue');
    log(`   Remaining: ${featuredEligibility.remaining}`, 'blue');
  }

  return { urgentEligibility, featuredEligibility };
}

async function createBadgeRequest(jobId, recruiterId, companyId, badgeType) {
  logSection(`ÉTAPE 4: CRÉATION DEMANDE BADGE ${badgeType.toUpperCase()}`);

  const duration = badgeType === 'urgent' ? 7 : 30;
  const paymentRef = `TEST_${badgeType.toUpperCase()}_${Date.now()}`;

  const { data: request, error } = await supabase
    .from('job_badge_requests')
    .insert({
      job_id: jobId,
      recruiter_id: recruiterId,
      company_id: companyId,
      badge_type: badgeType,
      price_gnf: 500000,
      duration_days: duration,
      status: 'pending',
      payment_method: 'orange_money',
      payment_reference: paymentRef,
      payment_status: 'completed'
    })
    .select()
    .single();

  if (error) {
    log(`❌ Erreur création demande: ${error.message}`, 'red');
    return null;
  }

  log(`✅ Demande créée: ${request.id}`, 'green');
  log(`   Badge: ${badgeType}`, 'blue');
  log(`   Status: ${request.status}`, 'blue');
  log(`   Prix: ${request.price_gnf} GNF`, 'blue');
  log(`   Durée: ${request.duration_days} jours`, 'blue');
  log(`   Référence: ${request.payment_reference}`, 'blue');

  return request;
}

async function getAdminUser() {
  logSection('ÉTAPE 5: RÉCUPÉRATION UTILISATEUR ADMIN');

  const { data: admin, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_type', 'admin')
    .limit(1)
    .single();

  if (error) {
    log(`❌ Aucun admin trouvé: ${error.message}`, 'red');
    log('💡 Créez un admin avec: node create-admin.js', 'yellow');
    return null;
  }

  log(`✅ Admin trouvé: ${admin.id}`, 'green');
  log(`   Email: ${admin.email || 'N/A'}`, 'blue');

  return admin;
}

async function approveBadgeRequest(requestId, adminId) {
  logSection('ÉTAPE 6: VALIDATION ADMIN DE LA DEMANDE');

  log('⏳ Appel fonction activate_job_badge...', 'yellow');

  const { data, error } = await supabase
    .rpc('activate_job_badge', {
      p_request_id: requestId,
      p_admin_notes: 'Badge approuvé - Test système complet'
    });

  if (error) {
    log(`❌ Erreur activation: ${error.message}`, 'red');
    return false;
  }

  log('✅ Badge activé avec succès!', 'green');

  // Verify request status updated
  const { data: request, error: requestError } = await supabase
    .from('job_badge_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (requestError) {
    log(`❌ Erreur vérification: ${requestError.message}`, 'red');
    return false;
  }

  log('📊 Statut demande après activation:', 'blue');
  log(`   Status: ${request.status}`, 'blue');
  log(`   Approved by: ${request.approved_by}`, 'blue');
  log(`   Starts at: ${request.starts_at}`, 'blue');
  log(`   Ends at: ${request.ends_at}`, 'blue');

  return true;
}

async function verifyJobBadgeActivated(jobId, badgeType) {
  logSection('ÉTAPE 7: VÉRIFICATION BADGE SUR OFFRE');

  const { data: job, error } = await supabase
    .from('jobs')
    .select('id, title, is_urgent, is_featured')
    .eq('id', jobId)
    .single();

  if (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    return false;
  }

  log('📊 État badges sur offre:', 'blue');
  log(`   is_urgent: ${job.is_urgent}`, job.is_urgent ? 'green' : 'yellow');
  log(`   is_featured: ${job.is_featured}`, job.is_featured ? 'green' : 'yellow');

  const expectedField = badgeType === 'urgent' ? 'is_urgent' : 'is_featured';
  const isActivated = job[expectedField];

  if (isActivated) {
    log(`✅ Badge ${badgeType} correctement activé sur l'offre!`, 'green');
  } else {
    log(`❌ Badge ${badgeType} PAS activé sur l'offre`, 'red');
  }

  return isActivated;
}

async function testBadgeExpiration(requestId, jobId) {
  logSection('ÉTAPE 8: TEST EXPIRATION AUTOMATIQUE');

  log('🔧 Modification date expiration (ends_at passé)...', 'yellow');

  // Set ends_at to 1 hour ago
  const { error: updateError } = await supabase
    .from('job_badge_requests')
    .update({
      ends_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    })
    .eq('id', requestId);

  if (updateError) {
    log(`❌ Erreur update: ${updateError.message}`, 'red');
    return false;
  }

  log('✅ Date expiration modifiée', 'green');

  log('\n⏳ Appel fonction expire_job_badges()...', 'yellow');

  const { data: expiredCount, error: expireError } = await supabase
    .rpc('expire_job_badges');

  if (expireError) {
    log(`❌ Erreur expiration: ${expireError.message}`, 'red');
    return false;
  }

  log(`✅ Fonction exécutée - Badges expirés: ${expiredCount}`, 'green');

  // Verify request status
  const { data: request, error: requestError } = await supabase
    .from('job_badge_requests')
    .select('status, admin_notes')
    .eq('id', requestId)
    .single();

  if (requestError) {
    log(`❌ Erreur vérification: ${requestError.message}`, 'red');
    return false;
  }

  log('\n📊 Statut demande après expiration:', 'blue');
  log(`   Status: ${request.status}`, request.status === 'expired' ? 'green' : 'red');
  log(`   Admin notes: ${request.admin_notes}`, 'blue');

  // Verify badge removed from job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('is_urgent, is_featured')
    .eq('id', jobId)
    .single();

  if (jobError) {
    log(`❌ Erreur job: ${jobError.message}`, 'red');
    return false;
  }

  log('\n📊 État badges après expiration:', 'blue');
  log(`   is_urgent: ${job.is_urgent}`, !job.is_urgent ? 'green' : 'red');
  log(`   is_featured: ${job.is_featured}`, !job.is_featured ? 'green' : 'red');

  const success = request.status === 'expired' && !job.is_urgent && !job.is_featured;

  if (success) {
    log('\n✅ Expiration automatique fonctionne correctement!', 'green');
  } else {
    log('\n❌ Problème avec expiration automatique', 'red');
  }

  return success;
}

async function generateMonitoringReport() {
  logSection('ÉTAPE 9: RAPPORT DE MONITORING');

  // Total requests
  const { count: totalRequests, error: e1 } = await supabase
    .from('job_badge_requests')
    .select('*', { count: 'exact', head: true });

  // Pending requests
  const { count: pendingRequests, error: e2 } = await supabase
    .from('job_badge_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Active badges
  const { count: activeUrgent, error: e3 } = await supabase
    .from('job_badge_requests')
    .select('*', { count: 'exact', head: true })
    .eq('badge_type', 'urgent')
    .eq('status', 'approved')
    .gt('ends_at', new Date().toISOString());

  const { count: activeFeatured, error: e4 } = await supabase
    .from('job_badge_requests')
    .select('*', { count: 'exact', head: true })
    .eq('badge_type', 'featured')
    .eq('status', 'approved')
    .gt('ends_at', new Date().toISOString());

  // Approval rate
  const { data: stats, error: e5 } = await supabase
    .from('job_badge_requests')
    .select('status')
    .in('status', ['approved', 'rejected']);

  const approved = stats?.filter(s => s.status === 'approved').length || 0;
  const rejected = stats?.filter(s => s.status === 'rejected').length || 0;
  const approvalRate = approved + rejected > 0
    ? ((approved / (approved + rejected)) * 100).toFixed(1)
    : 0;

  log('📊 STATISTIQUES SYSTÈME BADGES', 'cyan');
  log('─'.repeat(60), 'cyan');
  log(`Total demandes: ${totalRequests || 0}`, 'blue');
  log(`Demandes en attente: ${pendingRequests || 0}`, 'yellow');
  log(`Badges URGENT actifs: ${activeUrgent || 0}`, 'blue');
  log(`Badges À LA UNE actifs: ${activeFeatured || 0}`, 'blue');
  log(`Taux d'approbation: ${approvalRate}%`, 'green');

  // Recent activity
  const { data: recent, error: e6 } = await supabase
    .from('job_badge_requests')
    .select('badge_type, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recent && recent.length > 0) {
    log('\n📋 Activité récente (5 dernières):', 'cyan');
    recent.forEach((req, i) => {
      log(`   ${i + 1}. ${req.badge_type} - ${req.status} - ${new Date(req.created_at).toLocaleString()}`, 'blue');
    });
  }
}

async function testRejectBadgeRequest() {
  logSection('TEST BONUS: REJET DE DEMANDE');

  // Create a recruiter and job
  const recruiter = await createTestRecruiter();
  if (!recruiter) return;

  const job = await createTestJob(recruiter.user.id, recruiter.company.id);
  if (!job) return;

  // Create badge request
  const request = await createBadgeRequest(job.id, recruiter.user.id, recruiter.company.id, 'featured');
  if (!request) return;

  log('\n⏳ Test de rejet de demande...', 'yellow');

  const { data, error } = await supabase
    .rpc('reject_badge_request', {
      p_request_id: request.id,
      p_rejection_reason: 'Offre ne respecte pas les critères de qualité'
    });

  if (error) {
    log(`❌ Erreur rejet: ${error.message}`, 'red');
    return false;
  }

  // Verify
  const { data: rejectedRequest, error: verifyError } = await supabase
    .from('job_badge_requests')
    .select('status, rejection_reason, payment_status')
    .eq('id', request.id)
    .single();

  if (verifyError) {
    log(`❌ Erreur vérification: ${verifyError.message}`, 'red');
    return false;
  }

  log('✅ Demande rejetée avec succès', 'green');
  log(`   Status: ${rejectedRequest.status}`, 'blue');
  log(`   Raison: ${rejectedRequest.rejection_reason}`, 'blue');
  log(`   Payment status: ${rejectedRequest.payment_status}`, 'blue');

  return true;
}

async function runCompleteTest() {
  log('╔═══════════════════════════════════════════════════════╗', 'bright');
  log('║   TEST COMPLET SYSTÈME DE BADGES - JOBGUINÉE V6     ║', 'bright');
  log('╚═══════════════════════════════════════════════════════╝', 'bright');

  try {
    // Step 1: Create test recruiter
    const recruiter = await createTestRecruiter();
    if (!recruiter) {
      log('\n❌ Échec création recruteur - Arrêt des tests', 'red');
      return;
    }

    // Step 2: Create test job
    const job = await createTestJob(recruiter.user.id, recruiter.company.id);
    if (!job) {
      log('\n❌ Échec création job - Arrêt des tests', 'red');
      return;
    }

    // Step 3: Test eligibility
    const eligibility = await testBadgeEligibility(recruiter.user.id);

    // Step 4: Create badge request
    const request = await createBadgeRequest(
      job.id,
      recruiter.user.id,
      recruiter.company.id,
      'urgent'
    );
    if (!request) {
      log('\n❌ Échec création demande - Arrêt des tests', 'red');
      return;
    }

    // Step 5: Get admin
    const admin = await getAdminUser();
    if (!admin) {
      log('\n⚠️  Pas d\'admin - Tests partiels uniquement', 'yellow');
    } else {
      // Step 6: Approve request
      const approved = await approveBadgeRequest(request.id, admin.id);

      if (approved) {
        // Step 7: Verify badge on job
        await verifyJobBadgeActivated(job.id, 'urgent');

        // Step 8: Test expiration
        await testBadgeExpiration(request.id, job.id);
      }
    }

    // Step 9: Monitoring report
    await generateMonitoringReport();

    // Bonus: Test rejection
    if (admin) {
      await testRejectBadgeRequest();
    }

    logSection('🎉 TESTS TERMINÉS');
    log('✅ Tous les tests ont été exécutés', 'green');
    log('\n💡 Prochaine étape: Configurer le cron job dans Supabase Dashboard', 'yellow');
    log('   Expression: 0 * * * * (toutes les heures)', 'blue');

  } catch (error) {
    log(`\n❌ ERREUR GLOBALE: ${error.message}`, 'red');
    console.error(error);
  }
}

// Run tests
runCompleteTest();
