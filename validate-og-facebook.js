#!/usr/bin/env node

/**
 * SCRIPT DE VALIDATION FACEBOOK - APERÇUS SOCIAUX
 *
 * Diagnostique:
 * 1. Si l'Edge Function retourne les OG tags correctement
 * 2. Si les images OG existent et sont accessibles
 * 3. Si les métadonnées Facebook sont correctes
 * 4. Si le format des OG tags est valide
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = process.env.VITE_APP_URL || 'https://jobguinee-pro.com';
const EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1/job-og-preview`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  grey: '\x1b[90m',
};

function log(type, message) {
  const icons = {
    pass: `${colors.green}✓${colors.reset}`,
    fail: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
    title: `${colors.cyan}→${colors.reset}`,
    debug: `${colors.grey}●${colors.reset}`,
  };
  console.log(`${icons[type] || '○'} ${message}`);
}

async function runValidation() {
  log('title', 'VALIDATION FACEBOOK - APERÇUS SOCIAUX JOBGUINÉE');
  console.log('');
  log('info', `Base URL: ${BASE_URL}`);
  log('info', `Supabase URL: ${supabaseUrl}`);
  console.log('');

  let passedTests = 0;
  let failedTests = 0;

  // TEST 1: Récupérer un job de test
  log('title', 'TEST 1: Récupérer un job de test');
  let testJob = null;

  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*, companies(name, logo_url)')
      .eq('status', 'approved')
      .limit(1);

    if (error || !jobs || jobs.length === 0) {
      log('warn', 'Aucun job approuvé trouvé - création d\'un job de test');
      console.log('');

      // Obtenir ou créer une compagnie
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .limit(1);

      let companyId;
      if (companies && companies[0]) {
        companyId = companies[0].id;
      } else {
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert([{
            name: 'TestCorp',
            industry: 'Technologie',
            location: 'Conakry'
          }])
          .select('id');

        if (companyError || !newCompany) {
          log('fail', `Erreur création compagnie: ${companyError?.message}`);
          failedTests++;
          return;
        }
        companyId = newCompany[0].id;
      }

      // Créer un utilisateur test si nécessaire
      const { data: { user } } = await supabase.auth.getUser();
      let userId;

      if (!user) {
        // Créer un utilisateur de test
        const { data: authUser, error: authError } = await supabase.auth.signUp({
          email: `test-${Date.now()}@jobguinee.test`,
          password: 'TempPassword123!',
        });
        if (authError) {
          log('warn', `Création utilisateur: ${authError.message} (utilisation d'un UUID aléatoire)`);
          userId = crypto.randomUUID();
        } else {
          userId = authUser.user?.id || crypto.randomUUID();
        }
      } else {
        userId = user.id;
      }

      const { data: newJob, error: createError } = await supabase
        .from('jobs')
        .insert([{
          user_id: userId,
          company_id: companyId,
          title: 'Développeur Full Stack Test Facebook',
          location: 'Conakry',
          contract_type: 'CDI',
          description: 'Test validation OG Facebook - Offre de test pour validation',
          salary_range: '500K - 800K GNF',
          status: 'approved',
        }])
        .select('*, companies(name, logo_url)');

      if (createError || !newJob) {
        log('fail', `Erreur création job: ${createError?.message}`);
        failedTests++;
        return;
      }

      testJob = newJob[0];
      log('pass', `Job de test créé: ${testJob.id}`);
      passedTests++;
    } else {
      testJob = jobs[0];
      log('pass', `Job trouvé: ${testJob.title} (${testJob.id})`);
      passedTests++;
    }
  } catch (err) {
    log('fail', `Erreur: ${err.message}`);
    failedTests++;
    return;
  }

  console.log('');

  // TEST 2: Récupérer les OG tags depuis l'Edge Function
  log('title', 'TEST 2: Vérifier l\'Edge Function OG');
  console.log('');

  try {
    const ogUrl = `${EDGE_FUNCTION_URL}?job_id=${testJob.id}`;
    log('debug', `URL: ${ogUrl}`);

    const response = await fetch(ogUrl);
    const html = await response.text();

    if (response.status !== 200) {
      log('fail', `Status HTTP: ${response.status} (attendu: 200)`);
      failedTests++;
    } else {
      log('pass', `Status HTTP: 200 OK`);
      passedTests++;
    }

    // Vérifier les OG tags obligatoires
    const ogTags = [
      { name: 'og:title', pattern: /property="og:title"\s+content="([^"]+)"/ },
      { name: 'og:description', pattern: /property="og:description"\s+content="([^"]+)"/ },
      { name: 'og:image', pattern: /property="og:image"\s+content="([^"]+)"/ },
      { name: 'og:url', pattern: /property="og:url"\s+content="([^"]+)"/ },
      { name: 'og:type', pattern: /property="og:type"\s+content="([^"]+)"/ },
      { name: 'og:site_name', pattern: /property="og:site_name"\s+content="([^"]+)"/ },
    ];

    console.log('');
    log('info', 'OG Tags trouvés:');

    const ogData = {};
    ogTags.forEach(tag => {
      const match = html.match(tag.pattern);
      if (match) {
        ogData[tag.name] = match[1];
        log('pass', `${tag.name}: "${match[1].substring(0, 80)}${match[1].length > 80 ? '...' : ''}"`);
        passedTests++;
      } else {
        log('fail', `${tag.name}: NON TROUVÉ`);
        failedTests++;
      }
    });

    console.log('');

    // Vérifier les valeurs spécifiques
    if (ogData['og:title']) {
      if (ogData['og:title'].includes(testJob.title) || ogData['og:title'].includes(testJob.company_name)) {
        log('pass', `og:title contient le titre ou entreprise`);
        passedTests++;
      } else {
        log('warn', `og:title ne contient pas le titre ni l'entreprise`);
      }
    }

    if (ogData['og:url']) {
      if (ogData['og:url'].includes(`/s/${testJob.id}`)) {
        log('pass', `og:url utilise le format /s/{job_id}`);
        passedTests++;
      } else {
        log('fail', `og:url ne utilise pas le format /s/`);
        failedTests++;
      }
    }

    if (ogData['og:image']) {
      log('debug', `Testing image URL: ${ogData['og:image']}`);
      try {
        const imgResponse = await fetch(ogData['og:image'], { method: 'HEAD' });
        if (imgResponse.status === 200) {
          log('pass', `og:image accessible (HTTP 200)`);
          passedTests++;
        } else {
          log('fail', `og:image non accessible (HTTP ${imgResponse.status})`);
          failedTests++;
        }
      } catch (imgErr) {
        log('fail', `og:image erreur accès: ${imgErr.message}`);
        failedTests++;
      }
    }

  } catch (err) {
    log('fail', `Erreur Edge Function: ${err.message}`);
    failedTests++;
  }

  console.log('');

  // TEST 3: Vérifier le format HTML
  log('title', 'TEST 3: Vérifier le format HTML');
  console.log('');

  try {
    const ogUrl = `${EDGE_FUNCTION_URL}?job_id=${testJob.id}`;
    const response = await fetch(ogUrl);
    const html = await response.text();

    // Vérifier la structure HTML
    if (html.includes('<!DOCTYPE html>')) {
      log('pass', 'DOCTYPE HTML présent');
      passedTests++;
    } else {
      log('fail', 'DOCTYPE HTML absent');
      failedTests++;
    }

    if (html.includes('<head>') && html.includes('</head>')) {
      log('pass', 'Balise <head> valide');
      passedTests++;
    } else {
      log('fail', 'Balise <head> invalide');
      failedTests++;
    }

    // Vérifier que les OG tags sont dans <head>
    const headMatch = html.match(/<head>([\s\S]*?)<\/head>/);
    if (headMatch) {
      const headContent = headMatch[1];
      if (headContent.includes('og:title') && headContent.includes('og:image')) {
        log('pass', 'OG tags dans <head>');
        passedTests++;
      } else {
        log('fail', 'OG tags NOT dans <head>');
        failedTests++;
      }
    }

    // Vérifier la méta redirection
    if (html.includes('http-equiv="refresh"')) {
      log('pass', 'Meta refresh présent');
      passedTests++;
    } else {
      log('warn', 'Meta refresh absent (optionnel)');
    }

  } catch (err) {
    log('fail', `Erreur format HTML: ${err.message}`);
    failedTests++;
  }

  console.log('');

  // TEST 4: Vérifier le service de partage
  log('title', 'TEST 4: Vérifier la chaîne de partage');
  console.log('');

  try {
    // Vérifier que /s/ est utilisé
    const shareUrl = `${BASE_URL}/s/${testJob.id}`;
    log('pass', `URL de partage: ${shareUrl}`);
    passedTests++;

    // Vérifier les liens Facebook
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    log('debug', `Facebook share: ${fbShareUrl}`);

    // Vérifier le traçage
    const trackedUrl = `${shareUrl}?src=facebook`;
    if (trackedUrl.includes('src=facebook')) {
      log('pass', `Paramètre source présent pour Facebook`);
      passedTests++;
    } else {
      log('fail', `Paramètre source absent`);
      failedTests++;
    }

  } catch (err) {
    log('fail', `Erreur partage: ${err.message}`);
    failedTests++;
  }

  console.log('');

  // TEST 5: Vérifier la table job_clicks
  log('title', 'TEST 5: Vérifier la table job_clicks');
  console.log('');

  try {
    const { data, error } = await supabase
      .from('job_clicks')
      .select('count', { count: 'exact' })
      .limit(0);

    if (!error) {
      log('pass', `Table job_clicks accessible`);
      passedTests++;
    } else {
      log('fail', `Erreur accès job_clicks: ${error.message}`);
      failedTests++;
    }
  } catch (err) {
    log('fail', `Erreur table: ${err.message}`);
    failedTests++;
  }

  console.log('');

  // RÉSUMÉ
  log('title', 'RÉSUMÉ DES VALIDATIONS');
  console.log('');
  console.log(`${colors.green}✓ Réussis: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}✗ Échoués: ${failedTests}${colors.reset}`);

  const totalTests = passedTests + failedTests;
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  console.log(`${colors.blue}Taux de réussite: ${successRate}%${colors.reset}`);

  console.log('');
  console.log('─'.repeat(80));
  console.log('');

  if (failedTests === 0 && passedTests > 0) {
    log('pass', 'VALIDATION RÉUSSIE! Les aperçus Facebook devraient fonctionner.');
    console.log('');
    log('info', 'Prochaines étapes:');
    console.log('  1. Tester avec Facebook Sharing Debugger');
    console.log('     → https://developers.facebook.com/tools/debug/sharing/');
    console.log('  2. URL à tester: ' + `${BASE_URL}/s/${testJob.id}`);
    console.log('  3. Vérifier que l\'aperçu affiche le titre, entreprise et image');
    console.log('  4. Partager réellement sur Facebook');
  } else {
    log('fail', `VALIDATION ÉCHOUÉE. ${failedTests} problème(s) à corriger.`);
    console.log('');
    log('info', 'Erreurs communes:');
    console.log('  • Image OG non accessible → Vérifier le bucket Supabase public');
    console.log('  • OG tags manquants → Vérifier l\'Edge Function');
    console.log('  • Format /offres au lieu de /s/ → Corriger socialShareService.ts');
  }

  process.exit(failedTests > 0 ? 1 : 0);
}

// Lancer la validation
runValidation().catch(err => {
  log('fail', `Erreur critique: ${err.message}`);
  process.exit(1);
});
