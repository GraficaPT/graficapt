
import fs from 'fs';
import path from 'path';

// Helper: build URL list from the generated sitemap file (basic parse)
let allUrls = [];
try {
  const sm = fs.readFileSync('sitemap.xml','utf-8');
  allUrls = Array.from(sm.matchAll(/<loc>(.*?)<\/loc>/g)).map(m=>m[1]);
} catch {}



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


// --- AUTO SEO PING & WEBSUB ---
try {
  const ORIGIN = process.env.SITE_ORIGIN || 'https://graficapt.com';
  const SITEMAP_URL = `${ORIGIN}/sitemap.xml`;

  // 1) Ping Google + Bing (Sitemap)
  const pingTargets = [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`,
  ];
  for (const url of pingTargets) {
    try {
      const r = await fetch(url);
      console.log('[SEO][PING]', url, r.status);
    } catch (e) {
      console.warn('[SEO][PING][ERR]', url, e.message);
    }
  }

  // 2) IndexNow (optional) - submit a subset of URLs if key is set
  const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
  if (INDEXNOW_KEY && Array.isArray(allUrls) && allUrls.length) {
    const host = (process.env.INDEXNOW_HOST || ORIGIN).replace(/^https?:\/\//,'');
    const chunk = allUrls.slice(0, Math.min(1000, allUrls.length)); // safety cap
    const payload = {
      host,
      key: INDEXNOW_KEY,
      keyLocation: process.env.INDEXNOW_KEY_LOCATION || `https://${host}/${INDEXNOW_KEY}.txt`,
      urlList: chunk
    };
    try {
      const r = await fetch('https://api.indexnow.org/indexnow', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      console.log('[SEO][INDEXNOW]', r.status);
    } catch (e) {
      console.warn('[SEO][INDEXNOW][ERR]', e.message);
    }
  }

  // 3) WebSub publish (optional)
  const topic = `${ORIGIN}/api/updates.atom`;
  const hub = 'https://pubsubhubbub.appspot.com';
  try {
    const form = new URLSearchParams();
    form.set('hub.mode', 'publish');
    form.set('hub.url', topic);
    const r = await fetch(hub, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body: form.toString() });
    console.log('[SEO][WEBSUB] publish', r.status);
  } catch (e) {
    console.warn('[SEO][WEBSUB][ERR]', e.message);
  }
} catch (e) {
  console.warn('[SEO][AUTO][ERR]', e.message);
}
// --- end AUTO SEO ---

