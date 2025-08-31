import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'js'); // <-- agora geramos diretamente em /js/env.js
fs.mkdirSync(outDir, { recursive: true });

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const STORAGE_PUBLIC = process.env.STORAGE_PUBLIC || (SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/products/` : '');

const content = `window.__ENV = {
  SUPABASE_URL: "${SUPABASE_URL}",
  SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}",
  STORAGE_PUBLIC: "${STORAGE_PUBLIC}"
};`;

fs.writeFileSync(path.join(outDir, 'env.js'), content, 'utf-8');
console.log('✅ /js/env.js gerado');
