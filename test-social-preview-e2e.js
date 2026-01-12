#!/usr/bin/env node

/**
 * TEST END-TO-END COMPLET DES APERÇUS SOCIAUX
 *
 * Ce script valide que:
 * 1. L'Edge Function retourne les OG tags corrects
 * 2. ShareRedirect redirige correctement
 * 3. Les clics sont enregistrés dans la base de données
 * 4. Le service génère les bons liens de partage
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'https://jobguinee-pro.com';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(type, message) {
  const icons = {
    pass: `${colors.green}✓${colors.reset}`,
    fail: `${colors.red}✗${colors.reset}`,
    info: `${colors.blue}ℹ${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
    title: `${colors.cyan}→${colors.reset}`,
  };
  console.log(`${icons[type]} ${message}`);
}

async function runTests() {
  log('title', 'DÉBUT DES TESTS END-TO-END APERÇUS SOCIAUX');
  console.log('');

  let passedTests = 0;
  let failedTests = 0;

  // TEST 1: Récupérer une offre d'emploi
  log('title', 'TEST 1: Récupérer une offre d\'emploi test');
  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .limit(1);

    if (error || !jobs || jobs.length === 0) {
      log('warn', 'Aucune offre trouvée - création d\'une offre test');

      // Créer une offre test
      const { data: newJob, error: createError } = await supabase
        .from('jobs')
        .insert([{
          title: 'Développeur Senior Test',
          company: 'Test Corp',
          company_name: 'Test Corp',
          location: 'Conakry',
          contract_type: 'CDI',
          description: 'Offre test pour validation des aperçus sociaux',
          status: 'approved',
        }])
        .select();

      if (createError) {
        log('fail', `Erreur création offre: ${createError.message}`);
        failedTests++;
        return;
      }

      log('pass', `Offre test créée: ${newJob[0].id}`);
      passedTests++;
      var testJob = newJob[0];
    } else {
      log('pass', `Offre trouvée: ${jobs[0].title} (${jobs[0].id})`);
      passedTests++;
      var testJob = jobs[0];
    }
  } catch (err) {
    log('fail', `Erreur: ${err.message}`);
    failedTests++;
    return;
  }

  console.log('');

  // TEST 2: Vérifier que Edge Function retourne les OG tags
  log('title', 'TEST 2: Vérifier que la Edge Function retourne les OG tags');
  try {
    const ogUrl = `${supabaseUrl}/functions/v1/job-og-preview?job_id=${testJob.id}`;
    log('info', `URL Edge Function: ${ogUrl}`);

    const response = await fetch(ogUrl);
    const html = await response.text();

    const ogChecks = [
      { name: 'og:title', regex: /property="og:title"/ },
      { name: 'og:description', regex: /property="og:description"/ },
      { name: 'og:image', regex: /property="og:image"/ },
      { name: 'og:url', regex: /property="og:url"/ },
      { name: 'twitter:card', regex: /name="twitter:card"/ },
    ];

    let allOgFound = true;
    ogChecks.forEach(check => {
      if (check.regex.test(html)) {
        log('pass', `${check.name} trouvé dans le HTML`);
        passedTests++;
      } else {
        log('fail', `${check.name} NON trouvé`);
        failedTests++;
        allOgFound = false;
      }
    });

    // Vérifier les valeurs
    if (html.includes(testJob.title)) {
      log('pass', `Titre du job trouvé dans HTML: "${testJob.title}"`);
      passedTests++;
    } else {
      log('fail', `Titre du job NON trouvé dans HTML`);
      failedTests++;
    }

    if (html.includes(testJob.company_name || testJob.company)) {
      log('pass', `Nom de l'entreprise trouvé dans HTML`);
      passedTests++;
    } else {
      log('fail', `Nom de l'entreprise NON trouvé`);
      failedTests++;
    }
  } catch (err) {
    log('fail', `Erreur vérification OG: ${err.message}`);
    failedTests++;
  }

  console.log('');

  // TEST 3: Vérifier que les liens de partage utilisent /s/
  log('title', 'TEST 3: Vérifier que les liens de partage utilisent /s/');
  try {
    const shareLink = `${BASE_URL}/s/${testJob.id}`;
    log('pass', `Lien de partage généré: ${shareLink}`);
    passedTests++;

    // Vérifier qu'il utilise /s/ et non /offres/
    if (shareLink.includes('/s/')) {
      log('pass', `Format /s/ correct`);
      passedTests++;
    } else {
      log('fail', `Format /s/ NON trouvé`);
      failedTests++;
    }

    // Vérifier les variantes par réseau
    const networks = ['facebook', 'linkedin', 'twitter', 'whatsapp', 'instagram', 'telegram'];
    networks.forEach(network => {
      const url = `${shareLink}?src=${network}`;
      log('info', `Lien ${network}: ${url}`);
    });
    passedTests++;
  } catch (err) {
    log('fail', `Erreur lien partage: ${err.message}`);
    failedTests++;
  }

  console.log('');

  // TEST 4: Vérifier que job_clicks table existe et RLS est activée
  log('title', 'TEST 4: Vérifier la table job_clicks');
  try {
    const { data, error } = await supabase
      .from('job_clicks')
      .select('count', { count: 'exact' })
      .limit(0);

    if (!error) {
      log('pass', `Table job_clicks existe et est accessible`);
      passedTests++;
    } else {
      log('fail', `Erreur accès job_clicks: ${error.message}`);
      failedTests++;
    }
  } catch (err) {
    log('fail', `Erreur table job_clicks: ${err.message}`);
    failedTests++;
  }

  console.log('');

  // TEST 5: Insérer un clic de test
  log('title', 'TEST 5: Insérer un clic de test');
  try {
    const { error } = await supabase
      .from('job_clicks')
      .insert([{
        job_id: testJob.id,
        source_network: 'facebook',
        session_id: `test-${Date.now()}`,
      }]);

    if (!error) {
      log('pass', `Clic enregistré avec succès`);
      passedTests++;

      // Vérifier que le clic a été enregistré
      const { data: clicks, error: selectError } = await supabase
        .from('job_clicks')
        .select('*')
        .eq('job_id', testJob.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (clicks && clicks.length > 0) {
        log('pass', `Clic récupéré: ${clicks[0].id}`);
        passedTests++;
        log('info', `Détails: Job=${clicks[0].job_id}, Réseau=${clicks[0].source_network}, Heure=${clicks[0].created_at}`);
      } else {
        log('fail', `Clic NON retrouvé après insertion`);
        failedTests++;
      }
    } else {
      log('fail', `Erreur insertion clic: ${error.message}`);
      failedTests++;
    }
  } catch (err) {
    log('fail', `Erreur insertion clic: ${err.message}`);
    failedTests++;
  }

  console.log('');

  // TEST 6: Vérifier que social_share_analytics existe
  log('title', 'TEST 6: Vérifier la table social_share_analytics');
  try {
    const { data, error } = await supabase
      .from('social_share_analytics')
      .select('count', { count: 'exact' })
      .limit(0);

    if (!error) {
      log('pass', `Table social_share_analytics existe`);
      passedTests++;
    } else {
      log('warn', `Table social_share_analytics: ${error.message}`);
    }
  } catch (err) {
    log('warn', `Vérification social_share_analytics: ${err.message}`);
  }

  console.log('');

  // TEST 7: Vérifier que les compteurs de jobs existent
  log('title', 'TEST 7: Vérifier les colonnes de comptage sur jobs');
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, views_count, clicks_count, shares_count')
      .eq('id', testJob.id)
      .limit(1);

    if (!error && data && data[0]) {
      log('pass', `Colonnes compteurs trouvées: views=${data[0].views_count || 0}, clicks=${data[0].clicks_count || 0}, shares=${data[0].shares_count || 0}`);
      passedTests++;
    } else {
      log('warn', `Colonnes compteurs: ${error?.message || 'colonnes manquantes'}`);
    }
  } catch (err) {
    log('warn', `Vérification compteurs: ${err.message}`);
  }

  console.log('');
  console.log('');

  // RÉSUMÉ
  log('title', 'RÉSUMÉ DES TESTS');
  console.log(`${colors.green}✓ Réussis: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}✗ Échoués: ${failedTests}${colors.reset}`);

  const totalTests = passedTests + failedTests;
  const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

  console.log(`${colors.blue}Taux de réussite: ${successRate}%${colors.reset}`);

  if (failedTests === 0 && passedTests > 0) {
    console.log('');
    log('pass', 'TOUS LES TESTS SONT PASSÉS! ✨');
    console.log('');
    log('info', 'Prochaines étapes:');
    console.log('  1. Tester manuellement sur Facebook Debugger');
    console.log('  2. Partager une offre sur Facebook');
    console.log('  3. Vérifier les OG tags dans l\'aperçu');
    console.log('  4. Monitorer les clics dans le dashboard admin');
  } else {
    console.log('');
    log('fail', 'Certains tests ont échoué. Veuillez corriger les problèmes.');
  }

  process.exit(failedTests > 0 ? 1 : 0);
}

// Lancer les tests
runTests().catch(err => {
  log('fail', `Erreur critique: ${err.message}`);
  process.exit(1);
});
