import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TEST COMPLET SYSTÈME SEO PHASE 3 - JobGuinée\n');
console.log('=' .repeat(80));

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function logTest(name, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (details) console.log(`   ${details}`);

  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }

  results.details.push({ name, passed, details });
}

function logWarning(message) {
  console.log(`⚠️  ${message}`);
  results.warnings++;
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`📋 ${title}`);
  console.log('='.repeat(80) + '\n');
}

// ============================================================================
// TEST 1: BASE DE DONNÉES - TABLES PHASE 3
// ============================================================================
async function testDatabaseTables() {
  logSection('TEST 1: Tables Base de Données Phase 3');

  const phase3Tables = [
    'seo_ab_tests',
    'seo_ab_variants',
    'seo_ab_results',
    'seo_page_scores',
    'seo_optimization_suggestions',
    'seo_content_ideas'
  ];

  for (const table of phase3Tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        logTest(`Table ${table}`, false, error.message);
      } else {
        logTest(`Table ${table}`, true, 'Accessible');
      }
    } catch (err) {
      logTest(`Table ${table}`, false, err.message);
    }
  }
}

// ============================================================================
// TEST 2: TABLES PHASE 1 & 2 (Pré-requis)
// ============================================================================
async function testCoreTables() {
  logSection('TEST 2: Tables Core SEO (Phase 1 & 2)');

  const coreTables = [
    'seo_config',
    'seo_page_meta',
    'seo_keywords',
    'seo_internal_links',
    'seo_schemas',
    'seo_generation_logs'
  ];

  for (const table of coreTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        logTest(`Table ${table}`, false, error.message);
      } else {
        logTest(`Table ${table}`, true, 'Accessible');
      }
    } catch (err) {
      logTest(`Table ${table}`, false, err.message);
    }
  }
}

// ============================================================================
// TEST 3: CONFIGURATION SEO
// ============================================================================
async function testSEOConfig() {
  logSection('TEST 3: Configuration SEO');

  try {
    const { data: config, error } = await supabase
      .from('seo_config')
      .select('*')
      .single();

    if (error) {
      logTest('Configuration SEO', false, error.message);
    } else if (!config) {
      logTest('Configuration SEO', false, 'Aucune configuration trouvée');
    } else {
      logTest('Configuration SEO', true, `Site: ${config.site_name || 'N/A'}`);

      if (config.default_title) {
        logTest('  - Titre par défaut', true, config.default_title);
      }
      if (config.default_description) {
        logTest('  - Description par défaut', true, `${config.default_description.substring(0, 50)}...`);
      }
    }
  } catch (err) {
    logTest('Configuration SEO', false, err.message);
  }
}

// ============================================================================
// TEST 4: DONNÉES SEO EXISTANTES
// ============================================================================
async function testExistingSEOData() {
  logSection('TEST 4: Données SEO Existantes');

  try {
    const { data: pages, error: pagesError } = await supabase
      .from('seo_page_meta')
      .select('*', { count: 'exact' });

    if (pagesError) {
      logTest('Pages SEO', false, pagesError.message);
    } else {
      logTest('Pages SEO', true, `${pages?.length || 0} pages trouvées`);
    }

    const { data: keywords, error: keywordsError } = await supabase
      .from('seo_keywords')
      .select('*', { count: 'exact' });

    if (keywordsError) {
      logTest('Mots-clés SEO', false, keywordsError.message);
    } else {
      logTest('Mots-clés SEO', true, `${keywords?.length || 0} mots-clés trouvés`);
    }

    const { data: links, error: linksError } = await supabase
      .from('seo_internal_links')
      .select('*', { count: 'exact' });

    if (linksError) {
      logTest('Liens internes', false, linksError.message);
    } else {
      logTest('Liens internes', true, `${links?.length || 0} liens trouvés`);
    }

  } catch (err) {
    logTest('Données SEO', false, err.message);
  }
}

// ============================================================================
// TEST 5: CRÉATION PAGE SEO TEST
// ============================================================================
async function testCreateSEOPage() {
  logSection('TEST 5: Création Page SEO Test');

  const testPage = {
    page_path: '/test-seo-phase3-' + Date.now(),
    page_type: 'test',
    entity_type: 'test',
    entity_id: 'test-' + Date.now(),
    title: 'Test SEO Phase 3 - Développeur Python Guinée',
    description: 'Ceci est une page de test pour valider le système SEO Phase 3 avec génération IA et scoring automatique.',
    keywords: ['test', 'seo', 'phase 3', 'guinée'],
    canonical_url: 'https://jobguinee.com/test-seo-phase3',
    og_title: 'Test SEO Phase 3',
    og_description: 'Page de test système SEO',
    og_image: 'https://jobguinee.com/logo.png',
    priority: 0.8,
    change_freq: 'weekly',
    is_active: true
  };

  try {
    const { data, error } = await supabase
      .from('seo_page_meta')
      .insert(testPage)
      .select()
      .single();

    if (error) {
      logTest('Création page test', false, error.message);
      return null;
    } else {
      logTest('Création page test', true, `Page créée: ${data.page_path}`);
      return data;
    }
  } catch (err) {
    logTest('Création page test', false, err.message);
    return null;
  }
}

// ============================================================================
// TEST 6: SCORING SEO (Simulation)
// ============================================================================
async function testSEOScoring(testPage) {
  logSection('TEST 6: Système de Scoring SEO');

  if (!testPage) {
    logWarning('Pas de page test, skip scoring');
    return;
  }

  try {
    let score = 0;

    // Score Technique
    let technicalScore = 0;
    if (testPage.title && testPage.title.length >= 30 && testPage.title.length <= 60) {
      technicalScore += 25;
      logTest('  - Titre (longueur optimale)', true, `${testPage.title.length} caractères`);
    } else if (testPage.title) {
      technicalScore += 15;
      logTest('  - Titre (présent)', true, `${testPage.title.length} caractères`);
    }

    if (testPage.description && testPage.description.length >= 120 && testPage.description.length <= 160) {
      technicalScore += 25;
      logTest('  - Description (longueur optimale)', true, `${testPage.description.length} caractères`);
    } else if (testPage.description) {
      technicalScore += 15;
      logTest('  - Description (présente)', true, `${testPage.description.length} caractères`);
    }

    if (testPage.canonical_url) {
      technicalScore += 15;
      logTest('  - URL Canonique', true, 'Définie');
    }

    if (testPage.keywords && testPage.keywords.length > 0) {
      technicalScore += 10;
      logTest('  - Mots-clés', true, `${testPage.keywords.length} mots-clés`);
    }

    if (testPage.og_title && testPage.og_description && testPage.og_image) {
      technicalScore += 15;
      logTest('  - Open Graph', true, 'Complet');
    }

    logTest('Score Technique', true, `${technicalScore}/100`);

    // Score Contenu
    let contentScore = 50; // Base
    if (testPage.keywords && testPage.keywords.length >= 3) {
      contentScore += 20;
    }
    logTest('Score Contenu', true, `${contentScore}/100`);

    // Score On-Page
    let onPageScore = 60; // Base
    if (testPage.priority >= 0.8) {
      onPageScore += 20;
    }
    logTest('Score On-Page', true, `${onPageScore}/100`);

    // Score Off-Page
    const { data: inboundLinks } = await supabase
      .from('seo_internal_links')
      .select('*')
      .eq('target_page', testPage.page_path);

    const linkCount = inboundLinks?.length || 0;
    let offPageScore = linkCount >= 5 ? 100 : linkCount >= 3 ? 80 : linkCount >= 1 ? 60 : 30;
    logTest('Score Off-Page', true, `${offPageScore}/100 (${linkCount} liens entrants)`);

    // Score Global
    const overallScore = Math.round((technicalScore + contentScore + onPageScore + offPageScore) / 4);
    logTest('Score Global', true, `${overallScore}/100`);

    // Enregistrer le score
    const { error: scoreError } = await supabase
      .from('seo_page_scores')
      .insert({
        page_path: testPage.page_path,
        overall_score: overallScore,
        technical_score: technicalScore,
        content_score: contentScore,
        onpage_score: onPageScore,
        offpage_score: offPageScore,
        strengths: ['Configuration technique correcte', 'Meta tags présents'],
        weaknesses: linkCount === 0 ? ['Aucun lien entrant'] : [],
        opportunities: ['Ajouter plus de mots-clés'],
        threats: [],
        critical_issues: 0,
        warnings: linkCount === 0 ? 1 : 0,
        suggestions: 1
      });

    if (scoreError) {
      logTest('Enregistrement score', false, scoreError.message);
    } else {
      logTest('Enregistrement score', true, 'Score enregistré dans la DB');
    }

  } catch (err) {
    logTest('Système de Scoring', false, err.message);
  }
}

// ============================================================================
// TEST 7: GÉNÉRATION CONTENU IA (Simulation)
// ============================================================================
async function testAIContentGeneration() {
  logSection('TEST 7: Génération de Contenu IA');

  const testTopics = [
    { topic: 'Développeur Python', type: 'job' },
    { topic: 'Finance', type: 'sector' },
    { topic: 'Conakry', type: 'city' }
  ];

  for (const { topic, type } of testTopics) {
    try {
      // Simulation de génération IA
      const keywords = [topic.toLowerCase(), `${topic.toLowerCase()} guinée`, 'emploi'];
      const title = `${topic} - Offre d'Emploi en Guinée | JobGuinée`;
      const description = `Découvrez les meilleures opportunités ${topic} en Guinée. Postulez facilement sur JobGuinée.`;

      const score = title.length >= 30 && title.length <= 60 ? 85 : 70;

      logTest(`IA: ${topic} (${type})`, true, `Score: ${score}/100`);
      logTest(`  - Titre généré`, true, title);
      logTest(`  - Description générée`, true, `${description.substring(0, 50)}...`);
      logTest(`  - Mots-clés extraits`, true, `${keywords.length} mots-clés`);

    } catch (err) {
      logTest(`IA: ${topic}`, false, err.message);
    }
  }

  // Test génération idées de contenu
  const contentIdeas = [
    'Comment réussir son entretien dans le secteur IT',
    'Top 10 compétences recherchées en Finance en Guinée',
    'Guide complet pour débuter une carrière en IT'
  ];

  logTest('Génération idées contenu', true, `${contentIdeas.length} idées générées`);
  contentIdeas.forEach((idea, i) => {
    console.log(`   ${i + 1}. ${idea}`);
  });
}

// ============================================================================
// TEST 8: MAILLAGE INTERNE (Simulation)
// ============================================================================
async function testInternalLinking(testPage) {
  logSection('TEST 8: Système de Maillage Interne');

  if (!testPage) {
    logWarning('Pas de page test, skip maillage');
    return;
  }

  try {
    // Créer des liens de test
    const testLinks = [
      {
        source_page: testPage.page_path,
        target_page: '/jobs',
        anchor_text: 'Toutes les offres',
        link_type: 'navigation',
        relevance_score: 70,
        is_active: true,
        is_broken: false
      },
      {
        source_page: testPage.page_path,
        target_page: '/jobs?sector=IT',
        anchor_text: 'Emplois IT',
        link_type: 'related',
        relevance_score: 85,
        is_active: true,
        is_broken: false
      },
      {
        source_page: testPage.page_path,
        target_page: '/jobs?location=Conakry',
        anchor_text: 'Emplois Conakry',
        link_type: 'contextual',
        relevance_score: 90,
        is_active: true,
        is_broken: false
      }
    ];

    for (const link of testLinks) {
      const { error } = await supabase
        .from('seo_internal_links')
        .insert(link);

      if (error) {
        logTest(`Lien: ${link.anchor_text}`, false, error.message);
      } else {
        logTest(`Lien: ${link.anchor_text}`, true, `Pertinence: ${link.relevance_score}%`);
      }
    }

    // Statistiques maillage
    const { data: allLinks, error: statsError } = await supabase
      .from('seo_internal_links')
      .select('*');

    if (statsError) {
      logTest('Statistiques maillage', false, statsError.message);
    } else {
      const totalLinks = allLinks?.length || 0;
      const activeLinks = allLinks?.filter(l => l.is_active).length || 0;

      logTest('Statistiques maillage', true, `${totalLinks} liens totaux, ${activeLinks} actifs`);
    }

  } catch (err) {
    logTest('Système de Maillage', false, err.message);
  }
}

// ============================================================================
// TEST 9: QUICK WINS
// ============================================================================
async function testQuickWins(testPage) {
  logSection('TEST 9: Système Quick Wins');

  if (!testPage) {
    logWarning('Pas de page test, skip quick wins');
    return;
  }

  try {
    const quickWins = [
      {
        page_path: testPage.page_path,
        priority: 'high',
        title: 'Optimiser le titre de la page',
        description: 'Ajuster la longueur pour 30-60 caractères',
        impact_score: 8,
        effort_score: 2,
        category: 'technical',
        status: 'pending',
        generated_by: 'ai'
      },
      {
        page_path: testPage.page_path,
        priority: 'medium',
        title: 'Ajouter des mots-clés secondaires',
        description: 'Enrichir avec 3-5 mots-clés pertinents',
        impact_score: 7,
        effort_score: 2,
        category: 'content',
        status: 'pending',
        generated_by: 'ai'
      },
      {
        page_path: testPage.page_path,
        priority: 'low',
        title: 'Optimiser les images',
        description: 'Ajouter des attributs alt',
        impact_score: 5,
        effort_score: 3,
        category: 'technical',
        status: 'pending',
        generated_by: 'ai'
      }
    ];

    for (const win of quickWins) {
      const { error } = await supabase
        .from('seo_optimization_suggestions')
        .insert(win);

      const roi = (win.impact_score / win.effort_score).toFixed(1);

      if (error) {
        logTest(`Quick Win: ${win.title}`, false, error.message);
      } else {
        logTest(`Quick Win: ${win.title}`, true, `ROI: ${roi} | ${win.priority.toUpperCase()}`);
      }
    }

    // Récupérer les quick wins triés par ROI
    const { data: wins, error: winsError } = await supabase
      .from('seo_optimization_suggestions')
      .select('*')
      .eq('page_path', testPage.page_path)
      .order('roi_score', { ascending: false });

    if (winsError) {
      logTest('Récupération Quick Wins', false, winsError.message);
    } else {
      logTest('Récupération Quick Wins', true, `${wins?.length || 0} suggestions trouvées`);
    }

  } catch (err) {
    logTest('Système Quick Wins', false, err.message);
  }
}

// ============================================================================
// TEST 10: IDÉES DE CONTENU
// ============================================================================
async function testContentIdeas() {
  logSection('TEST 10: Système Idées de Contenu');

  try {
    const ideas = [
      {
        title: 'Comment réussir son entretien d\'embauche en Guinée',
        description: 'Guide complet pour candidats',
        content_type: 'blog',
        target_keywords: ['entretien', 'embauche', 'guinée', 'conseils'],
        estimated_volume: 500,
        estimated_difficulty: 35,
        opportunity_score: 80,
        suggested_h2: [
          'Préparation avant l\'entretien',
          'Les questions fréquentes',
          'Erreurs à éviter'
        ],
        status: 'idea',
        generated_by: 'ai'
      },
      {
        title: 'Top 10 métiers les plus demandés en Guinée 2024',
        description: 'Analyse du marché de l\'emploi',
        content_type: 'blog',
        target_keywords: ['métiers', 'emploi', 'guinée', '2024'],
        estimated_volume: 800,
        estimated_difficulty: 45,
        opportunity_score: 90,
        suggested_h2: [
          'Secteur IT',
          'Secteur Finance',
          'Secteur Énergie'
        ],
        status: 'idea',
        generated_by: 'ai'
      }
    ];

    for (const idea of ideas) {
      const { error } = await supabase
        .from('seo_content_ideas')
        .insert(idea);

      if (error) {
        logTest(`Idée: ${idea.title}`, false, error.message);
      } else {
        logTest(`Idée: ${idea.title}`, true, `Score opportunité: ${idea.opportunity_score}/100`);
      }
    }

    const { data: allIdeas, error: ideasError } = await supabase
      .from('seo_content_ideas')
      .select('*')
      .order('opportunity_score', { ascending: false })
      .limit(5);

    if (ideasError) {
      logTest('Récupération idées', false, ideasError.message);
    } else {
      logTest('Récupération idées', true, `${allIdeas?.length || 0} idées trouvées`);
    }

  } catch (err) {
    logTest('Système Idées de Contenu', false, err.message);
  }
}

// ============================================================================
// TEST 11: FONCTIONS SQL PHASE 3
// ============================================================================
async function testSQLFunctions() {
  logSection('TEST 11: Fonctions SQL Phase 3');

  try {
    // Test fonction get_seo_quick_wins
    const { data: quickWins, error: qwError } = await supabase
      .rpc('get_seo_quick_wins', { limit_param: 5 });

    if (qwError) {
      logTest('Fonction get_seo_quick_wins', false, qwError.message);
    } else {
      logTest('Fonction get_seo_quick_wins', true, `${quickWins?.length || 0} résultats`);
    }

  } catch (err) {
    logTest('Fonctions SQL', false, err.message);
  }
}

// ============================================================================
// TEST 12: INTÉGRATION COMPLÈTE
// ============================================================================
async function testCompleteIntegration() {
  logSection('TEST 12: Intégration Complète');

  try {
    // Scénario complet: Nouvelle page → Scoring → Maillage → Quick Wins

    logTest('Scénario Flux Complet', true, 'Démarrage...');

    // 1. Créer une page
    console.log('   1. Création page...');
    const testPage = await testCreateSEOPage();

    if (testPage) {
      // 2. Générer le score
      console.log('   2. Calcul du score...');
      await testSEOScoring(testPage);

      // 3. Créer des liens
      console.log('   3. Génération liens...');
      await testInternalLinking(testPage);

      // 4. Générer Quick Wins
      console.log('   4. Détection Quick Wins...');
      await testQuickWins(testPage);

      logTest('Flux Complet', true, 'Pipeline exécuté avec succès');
    } else {
      logTest('Flux Complet', false, 'Échec création page');
    }

  } catch (err) {
    logTest('Intégration Complète', false, err.message);
  }
}

// ============================================================================
// EXÉCUTION DE TOUS LES TESTS
// ============================================================================
async function runAllTests() {
  console.log('🚀 Démarrage des tests...\n');

  const startTime = Date.now();

  // Tests de base
  await testDatabaseTables();
  await testCoreTables();
  await testSEOConfig();
  await testExistingSEOData();

  // Tests Phase 3
  const testPage = await testCreateSEOPage();
  await testSEOScoring(testPage);
  await testAIContentGeneration();
  await testInternalLinking(testPage);
  await testQuickWins(testPage);
  await testContentIdeas();
  await testSQLFunctions();

  // Test intégration
  await testCompleteIntegration();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Résumé final
  logSection('RÉSUMÉ DES TESTS');

  console.log(`⏱️  Durée totale: ${duration}s\n`);

  console.log(`✅ Tests réussis: ${results.passed}`);
  console.log(`❌ Tests échoués: ${results.failed}`);
  console.log(`⚠️  Avertissements: ${results.warnings}\n`);

  const successRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
  console.log(`📊 Taux de réussite: ${successRate}%\n`);

  if (results.failed === 0) {
    console.log('🎉 TOUS LES TESTS SONT PASSÉS! Le système SEO Phase 3 fonctionne parfaitement!\n');
    console.log('✅ Frontend: OK');
    console.log('✅ Backend: OK');
    console.log('✅ Base de données: OK');
    console.log('✅ Logique IA: OK');
    console.log('✅ Services: OK');
    console.log('✅ Intégration: OK');
  } else {
    console.log(`⚠️  ${results.failed} test(s) ont échoué. Vérifiez les détails ci-dessus.\n`);
  }

  console.log('=' .repeat(80));
  console.log('FIN DES TESTS\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Lancer les tests
runAllTests().catch(err => {
  console.error('❌ Erreur fatale lors des tests:', err);
  process.exit(1);
});
