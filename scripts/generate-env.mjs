// scripts/generate-env.mjs
// Gera /js/env.js a partir das variáveis de ambiente do Vercel.
// Inclui FORM_ACTION_URL para o envio do formulário e FORM_NEXT_URL para o redirect pós-submit.

import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'js');
const outFile = path.join(outDir, 'env.js');

const ENV = {
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_UPLOAD_BUCKET: process.env.SUPABASE_UPLOAD_BUCKET || 'uploads',
  FORM_ACTION_URL: process.env.FORM_ACTION_URL || '',
  FORM_NEXT_URL: process.env.FORM_NEXT_URL || 'https://graficapt.com',
};

const content = `window.__ENV = ${JSON.stringify(ENV, null, 2)};`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, content, 'utf-8');
console.log('✅ /js/env.js gerado');
