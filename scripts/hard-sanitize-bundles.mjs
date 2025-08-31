import fs from 'fs';
import path from 'path';

const files = [
  path.join(process.cwd(), 'js', 'app.bundle.js'),
  path.join(process.cwd(), 'js', 'components.js'),
  path.join(process.cwd(), 'js', 'admin.bundle.js'),
  path.join(process.cwd(), 'js', 'encomendas.bundle.js'),
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let txt = fs.readFileSync(f, 'utf-8');
  const before = txt;
  // remove ANY occurrence of 'export ' to avoid 'Unexpected token export'
  txt = txt.replace(/\bexport\s+default\b/g, '');
  txt = txt.replace(/\bexport\s+\{[\s\S]*?\};?/g, '');
  txt = txt.replace(/\bexport\s+const\b/g, 'const');
  txt = txt.replace(/\bexport\s+let\b/g, 'let');
  txt = txt.replace(/\bexport\s+var\b/g, 'var');
  txt = txt.replace(/\bexport\s+function\b/g, 'function');
  // also strip top-level import lines just in case
  txt = txt.replace(/^\s*import\b[\s\S]*?;\s*$/mg, '');
  if (txt !== before) {
    fs.writeFileSync(f, txt, 'utf-8');
    console.log('Sanitized:', path.basename(f));
  }
}
console.log('✅ bundles sanitized');
