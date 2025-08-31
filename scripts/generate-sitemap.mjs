import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

/**
 * scripts/generate-sitemap.mjs
 * - Gera /sitemap.xml com homepage, /produto/<slug>, e variantes por tamanho (?tamanho=...)
 * - Fonte principal: Supabase (products.slug, name, opcoes, updated_at)
 * - Fallback: lê /produto/<slug>/index.html e extrai variantes do HTML (label "Tamanho")
 * - Logging claro para ver no Vercel Build
 */

const ROOT = process.cwd();
const OUT  = path.join(ROOT, 'sitemap.xml');

const BASE_URL          = process.env.BASE_URL || 'https://graficapt.com';
const SUPABASE_URL      = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

function escXml(s='') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function fmtDate(d){
  try {
    if (!d) return new Date().toISOString();
    const dt = (d instanceof Date) ? d : new Date(d);
    return dt.toISOString();
  } catch { return new Date().toISOString(); }
}
function normalizeLabel(s=''){ return String(s).trim().toLowerCase(); }

function getVariantValuesFromOptions(opcoes){
  const result = [];
  if (!opcoes) return result;

  let opts = [];
  if (Array.isArray(opcoes)) opts = opcoes;
  else if (typeof opcoes === 'object') opts = Object.entries(opcoes).map(([label, op]) => ({ label, ...(op || {}) }));
  else {
    try { opts = JSON.parse(opcoes); }
    catch { opts = []; }
  }

  for (const op of opts) {
    const label = String(op?.label || '').trim();
    const norm  = normalizeLabel(label);
    if (!/^(tamanho|tam|size)\b/.test(norm)) continue;
    const valores = Array.isArray(op?.valores) ? op.valores : [];
    const names = valores.map(v => (v && typeof v === 'object') ? (v.nome || v.name || v.label || '') : String(v || '')).filter(Boolean);
    if (names.length) result.push({ label: label || 'Tamanho', values: names });
  }
  return result;
}

function extractVariantsFromHTML(filePath){
  try {
    const html = fs.readFileSync(filePath, 'utf-8');
    // encontrar bloco option-group cujo label contém "Tamanho:"
    // e capturar os <span class="posicionamento-nome">VAL</span>
    const groups = [];
    const groupRegex = /<div class="option-group">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>|<div class="option-group">([\s\S]*?)<\/div>/g;
    let gm;
    while ((gm = groupRegex.exec(html)) !== null) {
      const chunk = gm[1] || gm[2] || '';
      if (!/Tamanho\s*:<\/label>/i.test(chunk)) continue;
      const vals = [];
      const valRe = /<span class="posicionamento-nome">([\s\S]*?)<\/span>/g;
      let m;
      while ((m = valRe.exec(chunk)) !== null) {
        const val = String(m[1]).replace(/<[^>]*>/g,'').trim();
        if (val) vals.push(val);
      }
      if (vals.length) groups.push({ label: 'tamanho', values: vals });
    }
    return groups;
  } catch {
    return [];
  }
}

async function fetchProductsFromSupabase(){
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[sitemap] Missing SUPABASE env, skipping DB fetch.');
    return { products: null, error: new Error('missing env') };
  }
  const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supa
    .from('products')
    .select('slug, name, images, opcoes, updated_at');
  if (error) return { products: null, error };
  return { products: data, error: null };
}

function fallbackProductsFromFs(){
  const productDir = path.join(ROOT, 'produto');
  let slugs = [];
  try {
    slugs = fs.readdirSync(productDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch {}
  return slugs.map(s => ({
    slug: s, name: s, images: [], opcoes: [], updated_at: new Date(),
    __fromFS: true
  }));
}

async function main(){
  const urls = [];
  const pushUrl = (loc, lastmod, priority = null, changefreq = null) => {
    urls.push({ loc, lastmod: fmtDate(lastmod), priority, changefreq });
  };

  // homepage
  pushUrl(`${BASE_URL}/`, new Date(), 0.9, 'daily');

  // produtos
  let { products, error } = await fetchProductsFromSupabase();
  let source = 'supabase';
  if (error || !products) {
    console.warn('[sitemap] Using FS fallback. Reason:', error?.message || 'unknown');
    products = fallbackProductsFromFs();
    source = 'fs';
  }

  let variantCount = 0;

  for (const p of products || []) {
    const slug = p.slug || p.Slug || p.name;
    if (!slug) continue;
    const last = p.updated_at || new Date();
    const base = `${BASE_URL}/produto/${encodeURIComponent(slug)}`;

    // url principal
    pushUrl(base, last, 0.8, 'weekly');

    // variantes (supabase -> opcoes; fs -> ler HTML)
    let groups = getVariantValuesFromOptions(p.opcoes);
    if ((!groups || !groups.length) && p.__fromFS) {
      const fp = path.join(ROOT, 'produto', slug, 'index.html');
      groups = extractVariantsFromHTML(fp);
    }

    for (const grp of groups) {
      const paramName = encodeURIComponent(normalizeLabel(grp.label) || 'tamanho');
      for (const val of grp.values) {
        const q = `${paramName}=${encodeURIComponent(String(val))}`;
        pushUrl(`${base}?${q}`, last, 0.5, 'weekly');
        variantCount++;
      }
    }
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(u => [
      '  <url>',
      `    <loc>${escXml(u.loc)}</loc>`,
      `    <lastmod>${escXml(u.lastmod)}</lastmod>`,
      u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>` : null,
      u.priority   ? `    <priority>${u.priority.toFixed(1)}</priority>` : null,
      '  </url>'
    ].filter(Boolean).join('\n')),
    '</urlset>\n'
  ].join('\n');

  fs.writeFileSync(OUT, xml, 'utf-8');
  console.log(`✅ sitemap.xml gerado com ${urls.length} URLs. Variantes: ${variantCount}. Fonte: ${source}`);
}

main().catch(e => { console.error(e); process.exit(1); });
