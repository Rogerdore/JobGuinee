#!/usr/bin/env node

/**
 * Script de validation des URLs de partage social
 * Vérifie que TOUTES les URLs utilisent /s/ et pas /offres/
 */

const fs = require('fs');
const path = require('path');

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const BOLD = '\x1b[1m';

console.log(`${BOLD}${BLUE}╔════════════════════════════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}${BLUE}║    VALIDATION DES URLS DE PARTAGE SOCIAL - JobGuinée         ║${RESET}`);
console.log(`${BOLD}${BLUE}╚════════════════════════════════════════════════════════════════╝${RESET}\n`);

const issues = [];
const warnings = [];
const success = [];

// Vérifier socialShareService.ts
console.log(`${BOLD}1. Vérification de socialShareService.ts${RESET}`);
try {
  const serviceFile = fs.readFileSync(
    path.join(__dirname, 'src/services/socialShareService.ts'),
    'utf8'
  );

  // Vérifier generateJobMetadata
  if (serviceFile.includes('const jobUrl = `${BASE_URL}/s/${job.id}`')) {
    success.push('✓ generateJobMetadata() utilise /s/');
    console.log(`  ${GREEN}✓${RESET} generateJobMetadata() utilise /s/`);
  } else if (serviceFile.includes('const jobUrl = `${BASE_URL}/offres/${job.id}`')) {
    issues.push('✗ generateJobMetadata() utilise encore /offres/');
    console.log(`  ${RED}✗${RESET} generateJobMetadata() utilise encore /offres/`);
  }

  // Vérifier generateShareLinks
  if (serviceFile.includes('const baseShareUrl = `${BASE_URL}/s/${job.id}`')) {
    success.push('✓ generateShareLinks() utilise /s/');
    console.log(`  ${GREEN}✓${RESET} generateShareLinks() utilise /s/`);
  } else if (serviceFile.includes('const shareUrl = `${BASE_URL}/offres/${job.id}`')) {
    issues.push('✗ generateShareLinks() utilise encore /offres/');
    console.log(`  ${RED}✗${RESET} generateShareLinks() utilise encore /offres/`);
  }

  // Vérifier paramètres de tracking
  const hasTracking = serviceFile.includes('?src=facebook') &&
                      serviceFile.includes('?src=linkedin') &&
                      serviceFile.includes('?src=twitter') &&
                      serviceFile.includes('?src=whatsapp');

  if (hasTracking) {
    success.push('✓ Paramètres de tracking présents (src={network})');
    console.log(`  ${GREEN}✓${RESET} Paramètres de tracking présents (src={network})`);
  } else {
    issues.push('✗ Paramètres de tracking manquants');
    console.log(`  ${RED}✗${RESET} Paramètres de tracking manquants`);
  }

} catch (error) {
  issues.push(`✗ Erreur lecture socialShareService.ts: ${error.message}`);
  console.log(`  ${RED}✗${RESET} Erreur lecture: ${error.message}`);
}

// Vérifier .htaccess
console.log(`\n${BOLD}2. Vérification du .htaccess${RESET}`);
try {
  const htaccessFile = fs.readFileSync(
    path.join(__dirname, 'public/.htaccess'),
    'utf8'
  );

  // Vérifier règle de redirection pour bots
  if (htaccessFile.includes('RewriteCond %{HTTP_USER_AGENT}') &&
      htaccessFile.includes('facebookexternalhit')) {
    success.push('✓ Règle de détection des bots présente');
    console.log(`  ${GREEN}✓${RESET} Règle de détection des bots présente`);
  } else {
    issues.push('✗ Règle de détection des bots manquante');
    console.log(`  ${RED}✗${RESET} Règle de détection des bots manquante`);
  }

  // Vérifier redirection vers Edge Function
  if (htaccessFile.includes('job-og-preview') &&
      htaccessFile.includes('?job_id=$1')) {
    success.push('✓ Redirection vers Edge Function configurée');
    console.log(`  ${GREEN}✓${RESET} Redirection vers Edge Function configurée`);
  } else {
    issues.push('✗ Redirection vers Edge Function manquante');
    console.log(`  ${RED}✗${RESET} Redirection vers Edge Function manquante`);
  }

  // Vérifier RewriteCond pour /s/
  if (htaccessFile.includes('RewriteCond %{REQUEST_URI} ^/s/')) {
    success.push('✓ Condition pour /s/ présente');
    console.log(`  ${GREEN}✓${RESET} Condition pour /s/ présente`);
  } else {
    issues.push('✗ Condition pour /s/ manquante');
    console.log(`  ${RED}✗${RESET} Condition pour /s/ manquante`);
  }

} catch (error) {
  issues.push(`✗ Erreur lecture .htaccess: ${error.message}`);
  console.log(`  ${RED}✗${RESET} Erreur lecture: ${error.message}`);
}

// Vérifier ShareJobModal
console.log(`\n${BOLD}3. Vérification de ShareJobModal.tsx${RESET}`);
try {
  const modalFile = fs.readFileSync(
    path.join(__dirname, 'src/components/common/ShareJobModal.tsx'),
    'utf8'
  );

  if (modalFile.includes('socialShareService.generateShareLinks')) {
    success.push('✓ ShareJobModal utilise socialShareService');
    console.log(`  ${GREEN}✓${RESET} ShareJobModal utilise socialShareService`);
  } else {
    warnings.push('⚠ ShareJobModal ne semble pas utiliser le service');
    console.log(`  ${YELLOW}⚠${RESET} ShareJobModal ne semble pas utiliser le service`);
  }

  // Vérifier qu'il n'y a pas d'URLs hardcodées
  if (modalFile.includes('/offres/${') || modalFile.includes('`/offres/')) {
    issues.push('✗ ShareJobModal contient des URLs /offres/ hardcodées');
    console.log(`  ${RED}✗${RESET} ShareJobModal contient des URLs /offres/ hardcodées`);
  } else {
    success.push('✓ Pas d\'URLs /offres/ hardcodées dans ShareJobModal');
    console.log(`  ${GREEN}✓${RESET} Pas d'URLs /offres/ hardcodées`);
  }

} catch (error) {
  warnings.push(`⚠ Erreur lecture ShareJobModal: ${error.message}`);
  console.log(`  ${YELLOW}⚠${RESET} Erreur lecture: ${error.message}`);
}

// Vérifier Edge Function
console.log(`\n${BOLD}4. Vérification de l'Edge Function${RESET}`);
try {
  const edgeFunctionFile = fs.readFileSync(
    path.join(__dirname, 'supabase/functions/job-og-preview/index.ts'),
    'utf8'
  );

  // Vérifier que job_id est attendu
  if (edgeFunctionFile.includes('url.searchParams.get("job_id")')) {
    success.push('✓ Edge Function attend le paramètre job_id');
    console.log(`  ${GREEN}✓${RESET} Edge Function attend le paramètre job_id`);
  } else {
    issues.push('✗ Edge Function n\'attend pas job_id');
    console.log(`  ${RED}✗${RESET} Edge Function n'attend pas job_id`);
  }

  // Vérifier og:description utilise contenu réel
  if (edgeFunctionFile.includes('cleanedDesc.substring(0, 217)') ||
      edgeFunctionFile.includes('cleanedDesc') && edgeFunctionFile.includes('Postulez via JobGuinée')) {
    success.push('✓ og:description utilise le contenu réel du poste');
    console.log(`  ${GREEN}✓${RESET} og:description utilise le contenu réel du poste`);
  } else {
    warnings.push('⚠ og:description pourrait ne pas utiliser le contenu réel');
    console.log(`  ${YELLOW}⚠${RESET} og:description pourrait ne pas utiliser le contenu réel`);
  }

  // Vérifier format titre
  if (edgeFunctionFile.includes('${jobTitle} – ${company}')) {
    success.push('✓ Titre au format "Poste – Entreprise"');
    console.log(`  ${GREEN}✓${RESET} Titre au format "Poste – Entreprise"`);
  } else {
    warnings.push('⚠ Format du titre pourrait être différent');
    console.log(`  ${YELLOW}⚠${RESET} Format du titre pourrait être différent`);
  }

} catch (error) {
  warnings.push(`⚠ Erreur lecture Edge Function: ${error.message}`);
  console.log(`  ${YELLOW}⚠${RESET} Erreur lecture: ${error.message}`);
}

// Résumé final
console.log(`\n${BOLD}═══════════════════════════════════════════════════════════════${RESET}`);
console.log(`${BOLD}                      RÉSUMÉ DE LA VALIDATION${RESET}`);
console.log(`${BOLD}═══════════════════════════════════════════════════════════════${RESET}\n`);

console.log(`${GREEN}${BOLD}✓ Succès: ${success.length}${RESET}`);
success.forEach(item => console.log(`  ${GREEN}•${RESET} ${item}`));

if (warnings.length > 0) {
  console.log(`\n${YELLOW}${BOLD}⚠ Avertissements: ${warnings.length}${RESET}`);
  warnings.forEach(item => console.log(`  ${YELLOW}•${RESET} ${item}`));
}

if (issues.length > 0) {
  console.log(`\n${RED}${BOLD}✗ Problèmes: ${issues.length}${RESET}`);
  issues.forEach(item => console.log(`  ${RED}•${RESET} ${item}`));
}

console.log('\n' + '═'.repeat(63));

if (issues.length === 0) {
  console.log(`\n${GREEN}${BOLD}✅ VALIDATION RÉUSSIE !${RESET}`);
  console.log(`${GREEN}Tous les partages sociaux utilisent /s/ avec tracking.${RESET}`);
  console.log(`${GREEN}Prêt pour production !${RESET}\n`);
  process.exit(0);
} else {
  console.log(`\n${RED}${BOLD}❌ VALIDATION ÉCHOUÉE${RESET}`);
  console.log(`${RED}Des problèmes ont été détectés et doivent être corrigés.${RESET}\n`);
  process.exit(1);
}
