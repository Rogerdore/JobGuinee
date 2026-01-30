#!/usr/bin/env node

/**
 * VALIDATION COMPLÈTE DES OG TAGS - JobGuinée
 *
 * Ce script valide l'intégralité du système d'aperçus sociaux:
 * - Teste tous les réseaux (Facebook, LinkedIn, Twitter, WhatsApp, Telegram)
 * - Vérifie toutes les balises OG obligatoires
 * - Génère une table de validation détaillée
 * - Teste le tracking des clics sociaux
 * - Valide les images OG
 *
 * Usage: node scripts/validate-og-tags-complete.js [job_id1] [job_id2] ...
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables d\'environnement manquantes!');
  console.error('Requis: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const NETWORKS = ['facebook', 'linkedin', 'twitter', 'whatsapp', 'telegram'];
const REQUIRED_OG_TAGS = [
  'og:title',
  'og:description',
  'og:image',
  'og:url',
  'og:type',
  'og:site_name',
  'twitter:card',
  'twitter:title',
  'twitter:description',
  'twitter:image'
];

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(text) {
  const line = '═'.repeat(text.length + 4);
  log(`\n╔${line}╗`, 'cyan');
  log(`║  ${text}  ║`, 'cyan');
  log(`╚${line}╝\n`, 'cyan');
}

async function validateOGTags(jobId, network) {
  const url = `${SUPABASE_URL}/functions/v1/job-og-preview/s/${jobId}?src=${network}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'JobGuinee-OG-Validator/1.0'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        url,
        network,
        error: `HTTP ${response.status}`,
        tags: {},
        missingTags: REQUIRED_OG_TAGS
      };
    }

    const html = await response.text();

    // Extract OG tags
    const tags = {};
    const missingTags = [];

    for (const tag of REQUIRED_OG_TAGS) {
      const propertyMatch = html.match(new RegExp(`<meta[^>]*property=["']${tag}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
                            html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${tag}["']`, 'i'));

      const nameMatch = html.match(new RegExp(`<meta[^>]*name=["']${tag}["'][^>]*content=["']([^"']*)["']`, 'i')) ||
                        html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${tag}["']`, 'i'));

      const match = propertyMatch || nameMatch;

      if (match && match[1]) {
        tags[tag] = match[1];
      } else {
        missingTags.push(tag);
      }
    }

    // Validate image URL
    let imageValid = false;
    if (tags['og:image']) {
      try {
        const imageResponse = await fetch(tags['og:image'], { method: 'HEAD' });
        imageValid = imageResponse.ok;
      } catch (e) {
        imageValid = false;
      }
    }

    return {
      success: missingTags.length === 0,
      url,
      network,
      tags,
      missingTags,
      imageValid,
      htmlLength: html.length
    };
  } catch (error) {
    return {
      success: false,
      url,
      network,
      error: error.message,
      tags: {},
      missingTags: REQUIRED_OG_TAGS
    };
  }
}

async function testTrackingForJob(jobId) {
  try {
    const { data, error } = await supabase.rpc('track_social_click', {
      p_job_id: jobId,
      p_source_network: 'test',
      p_session_fingerprint: `validation-${Date.now()}`
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: data?.success || false, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getJobStats(jobId) {
  try {
    const { data, error } = await supabase.rpc('get_job_social_stats_complete', {
      p_job_id: jobId
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, stats: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function generateMarkdownTable(results) {
  let markdown = '# RAPPORT DE VALIDATION OG TAGS - JobGuinée\n\n';
  markdown += `**Date**: ${new Date().toLocaleString('fr-FR')}\n\n`;
  markdown += `**Jobs testés**: ${results.length}\n\n`;

  markdown += '## TABLEAU DE VALIDATION GLOBAL\n\n';
  markdown += '| Job ID | Network | og:title | og:description | og:image | Image OK | URL | Status |\n';
  markdown += '|--------|---------|----------|----------------|----------|----------|-----|--------|\n';

  for (const result of results) {
    for (const validation of result.validations) {
      const titleOk = validation.tags['og:title'] ? '✅' : '❌';
      const descOk = validation.tags['og:description'] ? '✅' : '❌';
      const imageOk = validation.tags['og:image'] ? '✅' : '❌';
      const imageValid = validation.imageValid ? '✅' : '❌';
      const status = validation.success ? '✅ OK' : '❌ FAIL';

      markdown += `| ${result.jobId.substring(0, 8)}... | ${validation.network} | ${titleOk} | ${descOk} | ${imageOk} | ${imageValid} | [Test](${validation.url}) | ${status} |\n`;
    }
  }

  markdown += '\n## DÉTAILS PAR JOB\n\n';

  for (const result of results) {
    markdown += `### Job: ${result.jobTitle}\n\n`;
    markdown += `**ID**: \`${result.jobId}\`\n`;
    markdown += `**Entreprise**: ${result.company}\n`;
    markdown += `**Statut**: ${result.jobStatus}\n\n`;

    markdown += '#### Balises OG Détectées\n\n';
    const firstValidation = result.validations[0];
    if (firstValidation && firstValidation.tags) {
      markdown += '```json\n';
      markdown += JSON.stringify(firstValidation.tags, null, 2);
      markdown += '\n```\n\n';
    }

    markdown += '#### Statistiques Sociales\n\n';
    if (result.stats && result.stats.summary) {
      const summary = result.stats.summary;
      markdown += `- **Total clics**: ${summary.total_clicks || 0}\n`;
      markdown += `- **Vues**: ${summary.views_count || 0}\n`;
      if (summary.social_clicks) {
        markdown += `- **Clics par réseau**:\n`;
        for (const [network, count] of Object.entries(summary.social_clicks)) {
          markdown += `  - ${network}: ${count}\n`;
        }
      }
    }

    markdown += '\n#### URLs de Test\n\n';
    for (const validation of result.validations) {
      markdown += `- **${validation.network}**: ${validation.url}\n`;
    }

    markdown += '\n---\n\n';
  }

  markdown += '## OUTILS DE VALIDATION EXTERNE\n\n';
  markdown += '### Facebook Sharing Debugger\n';
  markdown += 'https://developers.facebook.com/tools/debug/\n\n';
  markdown += '### LinkedIn Post Inspector\n';
  markdown += 'https://www.linkedin.com/post-inspector/\n\n';
  markdown += '### Twitter Card Validator\n';
  markdown += 'https://cards-dev.twitter.com/validator\n\n';

  return markdown;
}

async function main() {
  header('VALIDATION COMPLÈTE OG TAGS - JobGuinée');

  let jobIds = process.argv.slice(2);

  if (jobIds.length === 0) {
    log('Aucun job_id fourni, récupération d\'un job publié...', 'yellow');
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, status')
      .eq('status', 'published')
      .limit(3);

    if (error || !jobs || jobs.length === 0) {
      log('❌ Aucun job publié trouvé', 'red');
      log('Usage: node scripts/validate-og-tags-complete.js [job_id1] [job_id2]', 'yellow');
      process.exit(1);
    }

    jobIds = jobs.map(j => j.id);
    log(`✅ Jobs trouvés: ${jobs.map(j => j.title).join(', ')}`, 'green');
  }

  const results = [];

  for (const jobId of jobIds) {
    log(`\n${'─'.repeat(80)}`, 'cyan');
    log(`📋 Validation du job: ${jobId}`, 'bold');
    log('─'.repeat(80), 'cyan');

    // Get job info
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, status, companies(name)')
      .eq('id', jobId)
      .maybeSingle();

    if (jobError || !job) {
      log(`❌ Job non trouvé: ${jobId}`, 'red');
      continue;
    }

    log(`\n📄 Titre: ${job.title}`, 'white');
    log(`🏢 Entreprise: ${job.companies?.name || 'N/A'}`, 'white');
    log(`📊 Statut: ${job.status}`, 'white');

    // Test tracking
    log('\n🔍 Test du tracking...', 'cyan');
    const trackingResult = await testTrackingForJob(jobId);
    if (trackingResult.success) {
      log('✅ Tracking fonctionnel', 'green');
    } else {
      log(`❌ Erreur tracking: ${trackingResult.error}`, 'red');
    }

    // Get stats
    log('\n📊 Récupération des statistiques...', 'cyan');
    const statsResult = await getJobStats(jobId);
    if (statsResult.success) {
      const summary = statsResult.stats?.summary;
      log(`✅ Stats: ${summary?.total_clicks || 0} clics, ${summary?.views_count || 0} vues`, 'green');
    } else {
      log(`⚠️  Erreur stats: ${statsResult.error}`, 'yellow');
    }

    // Validate OG tags for each network
    log('\n🌐 Validation des OG tags par réseau...', 'cyan');
    const validations = [];

    for (const network of NETWORKS) {
      log(`\n  Testing ${network}...`, 'white');
      const validation = await validateOGTags(jobId, network);
      validations.push(validation);

      if (validation.success) {
        log(`  ✅ ${network}: Toutes les balises OK`, 'green');
      } else {
        log(`  ❌ ${network}: ${validation.missingTags?.length || 0} balises manquantes`, 'red');
        if (validation.error) {
          log(`     Erreur: ${validation.error}`, 'red');
        }
        if (validation.missingTags && validation.missingTags.length > 0) {
          log(`     Manquantes: ${validation.missingTags.join(', ')}`, 'yellow');
        }
      }

      if (validation.tags['og:image']) {
        if (validation.imageValid) {
          log(`  ✅ Image accessible: ${validation.tags['og:image'].substring(0, 60)}...`, 'green');
        } else {
          log(`  ❌ Image inaccessible: ${validation.tags['og:image'].substring(0, 60)}...`, 'red');
        }
      }
    }

    results.push({
      jobId,
      jobTitle: job.title,
      company: job.companies?.name || 'N/A',
      jobStatus: job.status,
      validations,
      tracking: trackingResult,
      stats: statsResult.stats
    });
  }

  // Summary
  header('RÉSUMÉ GLOBAL');

  const totalTests = results.length * NETWORKS.length;
  const successfulTests = results.reduce((acc, r) =>
    acc + r.validations.filter(v => v.success).length, 0
  );

  log(`📊 Tests effectués: ${totalTests}`, 'white');
  log(`✅ Réussis: ${successfulTests}`, 'green');
  log(`❌ Échoués: ${totalTests - successfulTests}`, 'red');
  log(`📈 Taux de réussite: ${((successfulTests / totalTests) * 100).toFixed(1)}%`, 'cyan');

  // Generate markdown report
  const markdown = generateMarkdownTable(results);
  const reportPath = './VALIDATION_OG_TAGS_REPORT.md';
  writeFileSync(reportPath, markdown, 'utf-8');

  log(`\n📄 Rapport détaillé généré: ${reportPath}`, 'green');

  // Display validation table in console
  log('\n\n╔══════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    TABLE DE VALIDATION                               ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════════════╝\n', 'cyan');

  console.table(
    results.flatMap(r =>
      r.validations.map(v => ({
        'Job': r.jobTitle.substring(0, 30),
        'Network': v.network,
        'og:title': v.tags['og:title'] ? '✅' : '❌',
        'og:description': v.tags['og:description'] ? '✅' : '❌',
        'og:image': v.tags['og:image'] ? '✅' : '❌',
        'Image OK': v.imageValid ? '✅' : '❌',
        'Status': v.success ? '✅ OK' : '❌ FAIL'
      }))
    )
  );

  log('\n\n📋 PROCHAINES ÉTAPES:', 'cyan');
  log('1. Consultez le rapport: ./VALIDATION_OG_TAGS_REPORT.md', 'white');
  log('2. Testez les URLs dans Facebook Debugger', 'white');
  log('3. Vérifiez LinkedIn Post Inspector', 'white');
  log('4. Validez avec Twitter Card Validator', 'white');
  log('5. Partagez un lien test sur WhatsApp\n', 'white');

  if (successfulTests === totalTests) {
    log('🎉 SUCCÈS TOTAL! Le système OG tags est 100% opérationnel!', 'green');
    process.exit(0);
  } else {
    log('⚠️  Certains tests ont échoué. Consultez le rapport pour plus de détails.', 'yellow');
    process.exit(1);
  }
}

main().catch(err => {
  log(`\n❌ Erreur fatale: ${err.message}`, 'red');
  console.error(err);
  process.exit(1);
});
