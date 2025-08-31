// Remove import/export from bundles so they can load as classic scripts.
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const files = [
  path.join(ROOT, 'js', 'app.js'),
  path.join(ROOT, 'js', 'components.js'),
  path.join(ROOT, 'js', 'admin.js'),
  path.join(ROOT, 'js', 'encomendas.js')
];

for (const f of files){
  if (!fs.existsSync(f)) continue;
  let txt = fs.readFileSync(f,'utf-8');
  const before = txt;
  // strip top-level import/export lines
  txt = txt.replace(/^\s*import\b[\s\S]*?;\s*$/mg, '');
  txt = txt.replace(/^\s*export\b[\s\S]*?;\s*$/mg, '');
  if (txt !== before){
    fs.writeFileSync(f, txt, 'utf-8');
    console.log('Sanitized', f);
  }
}
