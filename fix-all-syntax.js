#!/usr/bin/env node
import fs from 'fs';

const filesToFix = [
  'src/pages/RecruiterDashboard.tsx',
  'src/pages/Blog.tsx',
  'src/pages/CMSAdmin.tsx',
  'src/pages/CreditStore.tsx',
  'src/pages/CVDesigner.tsx',
  'src/pages/PurchasedProfiles.tsx',
  'src/pages/ExternalApplications.tsx'
];

filesToFix.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');

    // Check if file has the bad pattern
    const badPattern = /export default function \w+\(\{\s*const \{ showSuccess/;

    if (badPattern.test(content)) {
      // Fix by moving the hook to the function body
      const fixed = content.replace(
        /(export default function \w+)\(\{\s*const \{ showSuccess, showError, showWarning, showConfirm \} = useModalContext\(\);\s*([^}]+)\}:\s*(\w+Props)\)\s*\{/g,
        (match, funcName, params, propsType) => {
          const cleanParams = params.trim().replace(/,\s*$/, '');
          return `${funcName}({ ${cleanParams} }: ${propsType}) {\n  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();`;
        }
      );

      fs.writeFileSync(file, fixed, 'utf8');
      console.log(`✅ Fixed: ${file}`);
    } else {
      console.log(`⏭️  ${file} - OK or not applicable`);
    }
  } catch (error) {
    console.log(`❌ ${file} - Error: ${error.message}`);
  }
});

console.log('\n✅ Done!');
