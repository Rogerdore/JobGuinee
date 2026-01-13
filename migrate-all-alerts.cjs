#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/CMSAdmin.tsx',
  'src/pages/AdminPremiumSubscriptions.tsx',
  'src/pages/CreditStore.tsx',
  'src/pages/AdminIATemplates.tsx',
  'src/pages/AdminDiffusionSettings.tsx',
  'src/pages/AdminFormationBoost.tsx',
  'src/pages/AdminCandidateVerifications.tsx',
  'src/pages/AdminCreditPurchases.tsx',
  'src/pages/Home.tsx',
  'src/pages/AdminEnterpriseSubscriptions.tsx',
  'src/pages/AdminEmailTemplates.tsx',
  'src/pages/AdminCreditsIA.tsx',
  'src/pages/AdminCommunicationTemplates.tsx',
  'src/pages/PremiumSubscribe.tsx',
  'src/pages/AdminJobCreate.tsx',
  'src/pages/AdminSecurityLogs.tsx',
  'src/pages/AdminChatbot.tsx',
  'src/pages/AdminCommunicationCreate.tsx',
  'src/pages/AdminSEOLandingPages.tsx',
  'src/pages/AdminCVThequePricing.tsx',
  'src/pages/AdminHomepageContent.tsx',
  'src/pages/AdminIAConfig.tsx',
  'src/pages/AdminCreditStoreSettings.tsx',
  'src/pages/AdminProfilePurchases.tsx',
  'src/pages/PremiumAIServices.tsx',
  'src/pages/AdminCommunications.tsx',
  'src/pages/AdminIAPremiumQuota.tsx',
  'src/pages/AdminAutomationRules.tsx',
  'src/pages/AdminFormationList.tsx',
  'src/pages/Blog.tsx',
  'src/pages/CVDesigner.tsx',
  'src/pages/CandidateDashboard.tsx',
  'src/pages/RecruiterDashboard.tsx',
  'src/pages/Jobs.tsx',
  'src/pages/PurchasedProfiles.tsx',
  'src/pages/ExternalApplications.tsx',
];

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  ${filePath} - Not found`);
    return { migrated: false, alerts: 0 };
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Count alerts before
  const alertsBefore = (content.match(/\balert\(/g) || []).length;
  const confirmsBefore = (content.match(/\bconfirm\(/g) || []).length;
  const totalBefore = alertsBefore + confirmsBefore;

  if (totalBefore === 0) {
    console.log(`✓ ${filePath} - Already migrated`);
    return { migrated: false, alerts: 0 };
  }

  // Add import if needed
  if (!content.includes('useModalContext')) {
    const importMatch = content.match(/(import.*?;\n)+/);
    if (importMatch) {
      const lastImport = importMatch[0];
      content = lastImport + "import { useModalContext } from '../contexts/ModalContext';\n" + content.substring(lastImport.length);
    }
  }

  // Add hook if needed
  if (!content.includes('useModalContext()')) {
    const functionMatch = content.match(/export default function \w+.*?\{/);
    if (functionMatch) {
      const match = functionMatch[0];
      const index = content.indexOf(match) + match.length;
      content = content.substring(0, index) + "\n  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();" + content.substring(index);
    }
  }

  // Replace simple success alerts
  content = content.replace(/alert\(['"]([^'"]*?)(créé|créée|modifié|modifiée|mis à jour|mise à jour|enregistré|enregistrée|sauvegardé|sauvegardée|supprimé|supprimée|publié|publiée|ajouté|ajoutée|activé|activée|désactivé|désactivée)[^'"]*?['"]\)/gi,
    (match, text, action) => {
      const titles = {
        'créé': 'Créé', 'créée': 'Créée',
        'modifié': 'Modifié', 'modifiée': 'Modifiée',
        'mis à jour': 'Mis à jour', 'mise à jour': 'Mise à jour',
        'enregistré': 'Enregistré', 'enregistrée': 'Enregistrée',
        'sauvegardé': 'Sauvegardé', 'sauvegardée': 'Sauvegardée',
        'supprimé': 'Supprimé', 'supprimée': 'Supprimée',
        'publié': 'Publié', 'publiée': 'Publiée',
        'ajouté': 'Ajouté', 'ajoutée': 'Ajoutée',
        'activé': 'Activé', 'activée': 'Activée',
        'désactivé': 'Désactivé', 'désactivée': 'Désactivée'
      };
      const title = titles[action.toLowerCase()] || 'Succès';
      const fullMessage = match.match(/alert\(['"]([^'"]+)['"]\)/)?.[1] || 'Opération effectuée avec succès!';
      return `showSuccess('${title}', '${fullMessage}')`;
    });

  // Replace error alerts
  content = content.replace(/alert\(['"]Erreur[^'"]*['"]\)/gi, (match) => {
    const msg = match.match(/alert\(['"](.+?)['"]\)/)?.[1] || 'Une erreur est survenue';
    return `showError('Erreur', '${msg}. Veuillez réessayer.')`;
  });

  // Replace "Veuillez..." warnings
  content = content.replace(/alert\(['"]Veuillez[^'"]*['"]\)/gi, (match) => {
    const msg = match.match(/alert\(['"](.+?)['"]\)/)?.[1] || 'Veuillez vérifier les informations';
    return `showWarning('Attention', '${msg}')`;
  });

  // Replace remaining generic alerts with error
  content = content.replace(/alert\(['"]([^'"]+)['"]\)/g, (match, msg) => {
    if (!msg.toLowerCase().includes('succès') && !msg.toLowerCase().includes('erreur')) {
      return `showWarning('Information', '${msg}')`;
    }
    return match;
  });

  // Replace simple confirms
  content = content.replace(/if\s*\(\s*!confirm\(['"]([^'"]+)['"]\)\s*\)\s*return;/g, (match, message) => {
    return `// Replaced with showConfirm - needs manual async wrapping\n    // Original: ${match}`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');

    const alertsAfter = (content.match(/\balert\(/g) || []).length;
    const confirmsAfter = (content.match(/\bconfirm\(/g) || []).length;
    const totalAfter = alertsAfter + confirmsAfter;

    console.log(`✅ ${filePath} - ${totalBefore - totalAfter}/${totalBefore} migrated (${totalAfter} remaining)`);
    return { migrated: true, alerts: totalBefore - totalAfter };
  }

  console.log(`⏭️  ${filePath} - No changes`);
  return { migrated: false, alerts: 0 };
}

console.log('🚀 Starting automatic alert migration...\n');

let totalMigrated = 0;
let totalAlerts = 0;
let filesMigrated = 0;

files.forEach(file => {
  const result = processFile(file);
  if (result.migrated) {
    filesMigrated++;
    totalAlerts += result.alerts;
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`✅ Migration complete!`);
console.log(`📁 Files processed: ${filesMigrated}/${files.length}`);
console.log(`🔄 Alerts migrated: ${totalAlerts}`);
console.log(`\n⚠️  Note: confirm() calls need manual async wrapping`);
console.log(`${'='.repeat(60)}\n`);
