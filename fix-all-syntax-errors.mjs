import fs from 'fs';
import path from 'path';

const pagesDir = 'src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

let fixedCount = 0;

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Fix the bad pattern: function Name({ HOOK; params }: Type)
  // Pattern to match:
  // export default function Name({
  //   const { showSuccess... } = useModalContext(); paramName }: Type) {

  const regex = /(export default function \w+)\(\{\s*const \{ showSuccess, showError, showWarning, showConfirm \} = useModalContext\(\);\s+([^}]+)\}:\s*(\w+(?:Props)?)\s*(?:=\s*\{\})?\)\s*\{/g;

  if (regex.test(content)) {
    // Reset content and reapply
    content = fs.readFileSync(filePath, 'utf8');

    content = content.replace(
      regex,
      (match, funcDecl, params, propsType) => {
        const cleanParams = params.trim().replace(/,\s*$/, '');
        return `${funcDecl}({ ${cleanParams} }: ${propsType}) {\n  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();`;
      }
    );

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      fixedCount++;
      console.log(`✅ Fixed: ${filePath}`);
    }
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
