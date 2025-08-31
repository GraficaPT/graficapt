import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

/**
 * scripts/generate-sitemap.mjs
 * - Homepage
 * - /produto/<slug>
 * - /produto/<slug>/<variantSlug> (size variants)
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
  try { return (d ? new Date(d) : new Date()).toISOString(); }
  catch { return new Date().toISOString(); }
}
const slugify = (s='') => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/--+/g,'-');

function normalizeLabel(s=''){ return String(s).trim().toLowerCase(); }

function getSizeGroups(opcoes){
  const result = [];
  if (!opcoes) return result;

  let opts = [];
  if (Array.isArray(opcoes)) opts = opcoes;
  else if (typeof opcoes === 'object') opts = Object.entries(opcoes).map(([label, op]) => ({ label, ...(op || {}) }));
  else {
    try { opts = JSON.parse(opcoes); } catch { opts = []; }
  }

  for (const op of opts) {
    const label = String(op?.label || '').trim();
    const norm  = normalizeLabel(label);
    if (!/^(tamanho|tam|size)\b/.test(norm)) continue;
    const valores = Array.isArray(op?.valores) ? op.valores : [];
    const names = valores.map(v => (v && typeof v === 'object') ? (v.nome || v.name || v.label || '') : String(v || '')).filter(Boolean);
    if (names.length) result.push({ label, values: names });
  }
  return result;
}

async function fetchProducts(){
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return { products: null, error: new Error('missing env') };
  const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supa.from('products').select('slug, name, opcoes, updated_at');
  if (error) return { products: null, error };
  return { products: data, error: null };
}

function fallbackProductsFromFs(){
  const productDir = path.join(ROOT, 'produto');
  try {
    return fs.readdirSync(productDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => ({ slug: d.name, name: d.name, opcoes: [], updated_at: new Date() }));
  } catch {
    return [];
  }
}

async function main(){
  const urls = [];
  const pushUrl = (loc, lastmod, priority = null, changefreq = null) => {
    urls.push({ loc, lastmod: fmtDate(lastmod), priority, changefreq });
  };

  // homepage
  pushUrl(`${BASE_URL}/`, new Date(), 0.9, 'daily');

  let { products, error } = await fetchProducts();
  if (error || !products) {
    console.warn('[sitemap] Using FS fallback:', error?.message || 'unknown');
    products = fallbackProductsFromFs();
  }

  let variants = 0;
  for (const p of products) {
    const slug = p.slug || p.Slug || p.name;
    if (!slug) continue;
    const last = p.updated_at || new Date();

    // base product url
    const base = `${BASE_URL}/produto/${encodeURIComponent(slug)}`;
    pushUrl(base, last, 0.8, 'weekly');

    // variant urls
    const groups = getSizeGroups(p.opcoes);
    for (const g of groups) {
      for (const val of g.values) {
        const vs = slugify(val);
        pushUrl(`${base}/${vs}`, last, 0.6, 'weekly');
        variants++;
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
  console.log(`✅ sitemap.xml gerado: ${urls.length} URLs (${variants} variantes)`);
}

main().catch(e => { console.error(e); process.exit(1); });
