import fs from 'fs';
import path from 'path';
const out = path.join(process.cwd(),'public','js');
fs.mkdirSync(out,{recursive:true});
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const STORAGE_PUBLIC = process.env.STORAGE_PUBLIC || (SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/products/` : '');
fs.writeFileSync(path.join(out,'env.js'), `window.__ENV=${JSON.stringify({SUPABASE_URL,SUPABASE_ANON_KEY,STORAGE_PUBLIC})};`);
console.log('env.js ok');
