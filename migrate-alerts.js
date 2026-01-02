const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filesToMigrate = [
  'src/pages/AdminJobList.tsx',
  'src/pages/AdminPremiumSubscriptions.tsx',
  'src/pages/CMSAdmin.tsx',
  'src/pages/CreditStore.tsx',
  'src/pages/AdminCreditPurchases.tsx',
  'src/pages/AdminFormationBoost.tsx',
  'src/pages/AdminCandidateVerifications.tsx',
  'src/pages/AdminDiffusionSettings.tsx',
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
  'src/pages/AdminIATemplates.tsx',
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
  'src/pages/AdminCTAConfiguration.tsx',
  'src/pages/AdminCampaignPayments.tsx',
  'src/pages/DownloadDocumentation.tsx',
  'src/pages/AdminTrainerManagement.tsx',
  'src/pages/AdminJobBadges.tsx',
];

function addImportsIfNeeded(content, filePath) {
  if (content.includes('useModalContext') || content.includes('useModal')) {
    return content;
  }

  const hasAlert = content.match(/\balert\s*\(/);
  const hasConfirm = content.match(/\bconfirm\s*\(/);

  if (!hasAlert && !hasConfirm) {
    return content;
  }

  let newContent = content;

  const importMatch = content.match(/^(import.*?\n)+/m);
  if (importMatch) {
    const lastImport = importMatch[0];
    const importToAdd = "import { useModalContext } from '../contexts/ModalContext';\n";

    if (!lastImport.includes('useModalContext')) {
      newContent = lastImport + importToAdd + content.substring(lastImport.length);
    }
  }

  const exportMatch = newContent.match(/export default function (\w+)/);
  if (exportMatch) {
    const functionName = exportMatch[1];
    const funcStart = newContent.indexOf(`export default function ${functionName}`);
    const firstBrace = newContent.indexOf('{', funcStart);
    const beforeBrace = newContent.substring(0, firstBrace + 1);
    const afterBrace = newContent.substring(firstBrace + 1);

    if (!afterBrace.includes('useModalContext')) {
      const hookLine = "\n  const { showSuccess, showError, showWarning, showInfo, showConfirm } = useModalContext();\n";
      newContent = beforeBrace + hookLine + afterBrace;
    }
  }

  return newContent;
}

function migrateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  content = addImportsIfNeeded(content, filePath);

  const replacements = [
    {
      pattern: /alert\(['"]([^'"]+) (supprimé|créé|modifié|ajouté|enregistré|mis à jour|publié|activé|désactivé).*?['"]\)/gi,
      replacement: (match, text, action) => {
        const title = action.charAt(0).toUpperCase() + action.slice(1);
        return `showSuccess('${title}', '${text} ${action} avec succès!')`;
      }
    },
    {
      pattern: /alert\(['"]([^'"]*?)succès[^'"]*?['"]\)/gi,
      replacement: (match, text) => {
        return `showSuccess('Succès', '${text.trim() || 'Opération effectuée'} avec succès!')`;
      }
    },
    {
      pattern: /alert\(['"]Erreur[^'"]*?['"]\)/gi,
      replacement: (match) => {
        const msg = match.match(/alert\(['"](.+?)['"]\)/)?.[1] || 'Une erreur est survenue';
        return `showError('Erreur', '${msg}. Veuillez réessayer.')`;
      }
    },
    {
      pattern: /if\s*\(\s*!confirm\(['"]([^'"]+)['"]\)\s*\)\s*return;/g,
      replacement: (match, message) => {
        return `showConfirm('Confirmer', '${message}', () => {`;
      }
    },
  ];

  let modified = false;
  replacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  });

  if (modified && content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Migrated: ${filePath}`);
    return true;
  } else {
    console.log(`⏭️  Skipped: ${filePath} (no changes needed)`);
    return false;
  }
}

console.log('🚀 Starting alert migration...\n');

let migratedCount = 0;
filesToMigrate.forEach(file => {
  if (migrateFile(file)) {
    migratedCount++;
  }
});

console.log(`\n✅ Migration complete! ${migratedCount}/${filesToMigrate.length} files migrated.`);
console.log('\n⚠️  Note: Some complex patterns may need manual review.');
