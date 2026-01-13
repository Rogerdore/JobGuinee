const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all tsx files in src
const files = glob.sync('src/**/*.tsx');

let fixed = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Fix pattern: export default function Name({ HOOK; params }: Props)
  const badPattern = /(export default function \w+\(\{)\s*const \{ showSuccess, showError, showWarning, showConfirm \} = useModalContext\(\);\s*([^}]+\}:)/g;

  content = content.replace(badPattern, (match, start, params) => {
    // Extract function signature properly
    return `${start} ${params}`;
  });

  // Then add the hook on the next line
  content = content.replace(
    /(export default function \w+\([^)]+\): [^{]+\{)\s*const \{ getSetting/g,
    '$1\n  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();\n  const { getSetting'
  );

  content = content.replace(
    /(export default function \w+\([^)]+\): [^{]+\{)\s*const \{ user/g,
    '$1\n  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();\n  const { user'
  );

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    fixed++;
    console.log(`✅ Fixed: ${file}`);
  }
});

console.log(`\n✅ Fixed ${fixed} files`);
