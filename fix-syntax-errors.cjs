const fs = require('fs');

const files = [
  'src/pages/Jobs.tsx',
  'src/pages/Blog.tsx',
  'src/pages/CMSAdmin.tsx',
  'src/pages/CreditStore.tsx',
  'src/pages/CVDesigner.tsx',
  'src/pages/CandidateDashboard.tsx',
  'src/pages/RecruiterDashboard.tsx',
  'src/pages/PurchasedProfiles.tsx',
  'src/pages/ExternalApplications.tsx'
];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Fix: export default function Name({ HOOK_INSERTED_HERE params }: Type)
    // Pattern: hook was inserted in the function parameter
    const regex = /(export default function \w+\(\{)\s*const \{ showSuccess[^;]+;\s*([^}]+\}:\s*\w+Props\))/g;

    if (regex.test(content)) {
      content = fs.readFileSync(file, 'utf8'); // Re-read to reset regex

      // Extract the misplaced hook and params
      content = content.replace(regex, (match, funcStart, paramsAndType) => {
        // Return just the function signature
        return `${funcStart} ${paramsAndType}`;
      });

      // Now add the hook at the correct place (first line inside function body)
      content = content.replace(
        /(export default function \w+\([^)]+\):[^{]+\{)(?!\s*const \{ showSuccess)/g,
        '$1\n  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();'
      );

      if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`✅ Fixed: ${file}`);
      }
    }
  } catch (error) {
    console.log(`⏭️  ${file} - ${error.message}`);
  }
});

console.log('✅ Done');
