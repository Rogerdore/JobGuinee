const fs = require('fs');
const glob = require('fs').readdirSync;

// Find all tsx files
const pages = fs.readdirSync('src/pages').filter(f => f.endsWith('.tsx'));

let fixed = 0;

pages.forEach(file => {
  const filePath = `src/pages/${file}`;
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Pattern: export default function Name({ HOOK_HERE params }: Type)
  const matches = content.match(/export default function (\w+)\(\{\s*const \{ showSuccess[^;]+;\s*([^}]+)\}:\s*(\w+Props)\)/);

  if (matches) {
    const [fullMatch, funcName, params, propsType] = matches;
    const cleanParams = params.trim().replace(/,\s*$/, '');

    // Replace the bad function signature
    content = content.replace(
      fullMatch,
      `export default function ${funcName}({ ${cleanParams} }: ${propsType})`
    );

    // Add the hook right after the opening brace
    const funcStart = content.indexOf(`export default function ${funcName}`);
    const bracePos = content.indexOf('{', funcStart);

    // Insert hook after the brace
    const before = content.substring(0, bracePos + 1);
    const after = content.substring(bracePos + 1);

    // Check if hook is already present
    if (!after.trim().startsWith('const { showSuccess')) {
      content = before + '\n  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();' + after;
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      fixed++;
      console.log(`✅ Fixed: ${filePath}`);
    }
  }
});

console.log(`\n✅ Fixed ${fixed} files total`);
