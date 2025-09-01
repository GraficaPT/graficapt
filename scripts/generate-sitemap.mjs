import fs from 'fs';
import path from 'path';

/**
 * scripts/generate-sitemap.mjs (FS-based)
 * - Lê o filesystem gerado no build:
 *     /produto/<slug>/index.html
 *     /produto/<slug>/<variant>/index.html
 * - Gera sitemap.xml com homepage, produtos e variantes
 * - Usa mtime do index.html como <lastmod> quando disponível
 */

const ROOT = process.cwd();
const OUT  = path.join(ROOT, 'sitemap.xml');
const BASE_URL = process.env.BASE_URL || 'https://graficapt.com';

function escXml(s='') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function fmtDateFromStat(stat){
  try {
    if (stat && stat.mtime) return new Date(stat.mtime).toISOString();
  } catch {}
  return new Date().toISOString();
}

function gatherProductsAndVariants(){
  const dir = path.join(ROOT, 'produto');
  const list = [];
  try {
    const slugs = fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
    for (const slug of slugs) {
      const baseIndex = path.join(dir, slug, 'index.html');
      const baseStat  = fs.existsSync(baseIndex) ? fs.statSync(baseIndex) : null;
      list.push({ loc: `${BASE_URL}/produto/${encodeURIComponent(slug)}`, lastmod: fmtDateFromStat(baseStat) });

      // variants are subdirs that contain index.html
      const vDir = path.join(dir, slug);
      const entries = fs.readdirSync(vDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
      for (const variant of entries) {
        const vIndex = path.join(vDir, variant, 'index.html');
        if (fs.existsSync(vIndex)) {
          const vStat = fs.statSync(vIndex);
          list.push({ loc: `${BASE_URL}/produto/${encodeURIComponent(slug)}/${encodeURIComponent(variant)}`, lastmod: fmtDateFromStat(vStat) });
        }
      }
    }
  } catch (e) {
    console.error('[sitemap] FS scan error:', e.message);
  }
  return list;
}

function main(){
  const urls = [];
  const push = (loc, lastmod, priority = null, changefreq = null) => {
    urls.push({ loc, lastmod, priority, changefreq });
  };

  // homepage
  push(`${BASE_URL}/`, new Date().toISOString(), 0.9, 'daily');

  // produtos + variantes a partir do FS
  const items = gatherProductsAndVariants();
  for (const it of items) {
    push(it.loc, it.lastmod, it.loc.split('/').length > 5 ? 0.6 : 0.8, 'weekly');
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
  console.log(`✅ sitemap.xml (FS) gerado com ${urls.length} URLs`);
}

main();
