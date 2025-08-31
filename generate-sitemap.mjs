import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nbcmqkcztuogflejswau.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_co9n_L7O6rCcc9mb570Uhw_Bg8eqWIL';
const BASE_URL = process.env.BASE_URL || 'https://graficapt.com';
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'sitemap.xml');

const staticPages = [
  '/',
  '/aboutus',
  '/privacidade',
  '/encomendas',
];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const iso = (d) => new Date(d || Date.now()).toISOString();

function urlTag(loc, lastmod) {
  return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`;
}

async function main() {
  const { data: products, error } = await supabase
    .from('products')
    .select('slug');

  if (error) {
    console.error('Erro Supabase:', error);
    process.exit(1);
  }

  const entries = [];

  for (const p of staticPages) {
    entries.push(urlTag(`${BASE_URL}${p}`, iso()));
  }

  for (const p of (products || [])) {
    const loc = `${BASE_URL}/produto/${encodeURIComponent(p.slug)}`;
    entries.push(urlTag(loc, iso()));
  }

  const xml =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, xml, 'utf-8');
  console.log('✅ sitemap.xml gerado em:', OUTPUT_PATH);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
