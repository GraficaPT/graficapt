import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

/**
 * Deterministic static generator for /produto/<slug>/index.html
 * - No browser/JSDOM; single batched fetch to Supabase
 * - Extracts topbar/footer from js/app.bundle.js to keep exact markup/classes
 * - Preserves CSS links from product.html (minus loader.css)
 * - Adds detailed timings to find bottlenecks in CI
 */

const t0 = Date.now();
const log = (...a) => console.log('[build-products]', ...a);

// ---------- ENV ----------
const SUPABASE_URL       = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY  = process.env.SUPABASE_ANON_KEY || '';
const BASE_URL           = process.env.BASE_URL || 'https://graficapt.com';
const STORAGE_PUBLIC     = process.env.STORAGE_PUBLIC ||
  (SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/products/` : `${BASE_URL}/imagens/produtos/`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[build-products] Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const ROOT     = process.cwd();
const OUT_ROOT = path.join(ROOT, 'produto');

// ---------- IO ----------
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf-8');
const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const writeFileAtomic = (filePath, content) => {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, content, 'utf-8');
  fs.renameSync(tmp, filePath);
};

// ---------- Helpers ----------
const esc = (s='') => String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

const asArray = (v) => Array.isArray(v) ? v : (v ? String(v).split(',').map(x=>x.trim()).filter(Boolean) : []);

function loadBaseHead() {
  const t = Date.now();
  const html = read('product.html');
  const m = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headInner = m ? m[1] : '';
  // collect stylesheet links (except loader.css)
  const links = [...headInner.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)]
    .map(x => x[0])
    .filter(tag => !/loader\.css/i.test(tag));
  // common metas to keep
  const metas = [];
  const metaCharset = headInner.match(/<meta[^>]*charset[^>]*>/i);
  if (metaCharset) metas.push(metaCharset[0]);
  const viewport = headInner.match(/<meta[^>]*name=["']viewport["'][^>]*>/i);
  if (viewport) metas.push(viewport[0]);
  const favicon = headInner.match(/<link[^>]*rel=["']icon["'][^>]*>/i);
  if (favicon) metas.push(favicon[0]);
  const fonts   = [...headInner.matchAll(/<link\b[^>]*fonts\.googleapis[^>]*>/gi)].map(x=>x[0]);
  log('loadBaseHead ok in', (Date.now()-t)+'ms');
  return { cssLinks: links.join('\n'), baseMetas: metas.join('\n') + '\n' + fonts.join('\n') };
}

function extractTopbarFooter() {
  const t = Date.now();
  const bundle = read('js/app.bundle.js');
  const mTop = bundle.match(/const\s+topbarHTML\s*=\s*`([\s\S]*?)`;/);
  const mFoot= bundle.match(/const\s+footerHTML\s*=\s*`([\s\S]*?)`;/);
  if (!mTop || !mFoot) {
    throw new Error('Could not extract topbarHTML/footerHTML from js/app.bundle.js');
  }
  log('extractTopbarFooter ok in', (Date.now()-t)+'ms');
  return { topbarHTML: mTop[1], footerHTML: mFoot[1] };
}

function buildImages(product) {
  const slug = product.slug || product.Slug || product.name || product.nome || '';
  const arr = [];
  if (Array.isArray(product.images) && product.images.length) {
    for (const f of product.images) {
      arr.push(STORAGE_PUBLIC + String(f).replace(/^\/+/, ''));
    }
  } else {
    const files = ['banner.webp','1.webp','2.webp','3.webp','4.webp','5.webp'];
    for (const f of files) arr.push(`${STORAGE_PUBLIC}${slug}/${f}`);
  }
  return [...new Set(arr)];
}

function buildMetaHead(baseMetas, cssLinks, slug, p) {
  const title = p.title || p.name || p.nome || `${slug} | GraficaPT`;
  const descr = p.shortdesc || p.descricao || p.description || 'Produto personalizado GraficaPT.';
  const keywords = asArray(p.metawords).join(', ');
  const ogImg = p.og_image || p.hero || `${STORAGE_PUBLIC}${slug}/og/index.png`;
  return [
    baseMetas,
    `<title>${esc(title)}</title>`,
    `<link rel="canonical" href="${BASE_URL}/produto/${esc(slug)}">`,
    `<meta name="description" content="${esc(descr)}">`,
    `<meta name="keywords" content="${esc(keywords)}">`,
    `<meta name="robots" content="index, follow">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(descr)}">`,
    `<meta property="og:image" content="${esc(ogImg)}">`,
    `<meta property="og:type" content="product">`,
    `<meta property="og:url" content="${BASE_URL}/produto/${esc(slug)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(title)}">`,
    `<meta name="twitter:description" content="${esc(descr)}">`,
    `<meta name="twitter:image" content="${esc(ogImg)}">`,
    cssLinks
  ].join('\n');
}

function buildCarousel(slug, images) {
  if (!images.length) return '';
  const indicators = images.map((_,i)=>`<span class="indicador ${i===0?'ativo':''}" data-index="${i}"></span>`).join('');
  const imgs = images.map((src,i)=>`<img class="carrossel-img ${i===0?'visivel':''}" src="${src}" alt="${esc(slug)} imagem ${i+1}" loading="lazy">`).join('');
  return `
  <div class="carrossel">
    <button class="nav prev" aria-label="Imagem anterior">&#10094;</button>
    <div class="carrossel-imagens">
      ${imgs}
    </div>
    <button class="nav next" aria-label="Próxima imagem">&#10095;</button>
    <div class="indicadores">${indicators}</div>
  </div>`;
}

function buildPriceOrOptions(p) {
  const pt = Array.isArray(p.price_table) ? p.price_table : null;
  const opts = Array.isArray(p.options) ? p.options : null;
  if (pt && pt.length) {
    const rows = pt.map(r => `
      <tr>
        <td>${esc(r.label || r.nome || '')}</td>
        <td>${esc(r.spec || r.descricao || '')}</td>
        <td>${esc(r.price || r.preco || '')}</td>
      </tr>`).join('');
    return `
      <div class="price-table">
        <h3>Tabela de preços</h3>
        <table>
          <thead><tr><th>Opção</th><th>Descrição</th><th>Preço</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }
  if (opts && opts.length) {
    const lis = opts.map(o => `<li>${esc(o.label || o)}</li>`).join('');
    return `<div class="options"><h3>Opções</h3><ul>${lis}</ul></div>`;
  }
  return '';
}

function buildBody(topbarHTML, footerHTML, slug, p) {
  const nome = p.title || p.name || p.nome || slug;
  const descr = p.descricao || p.shortdesc || '';
  const images = buildImages(p);
  const price = buildPriceOrOptions(p);
  const carousel = buildCarousel(slug, images);

  return `
  <div class="topbar" id="topbar">
${topbarHTML}
  </div>

  <div class="productcontainer">
    <div class="produto">
      <h1 class="produto-titulo">${esc(nome)}</h1>
      ${carousel}
    </div>
    <div class="produto-descricao">
      <p>${esc(descr)}</p>
      ${price}
    </div>
  </div>

  <footer class="footer" id="footer">
${footerHTML}
  </footer>

  <script>
  // Sidebar toggle (UI only)
  function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const isOpen = sidebar && sidebar.style.left === "0%";
    if (!sidebar || !overlay) return;
    sidebar.style.left = isOpen ? "-100%" : "0%";
    overlay.style.display = isOpen ? "none" : "block";
  }
  // Carousel minimal JS (UI only)
  (function() {
    const wrap = document.querySelector('.carrossel-imagens');
    if (!wrap) return;
    const imgs = Array.from(wrap.querySelectorAll('.carrossel-img'));
    const indicators = Array.from(document.querySelectorAll('.indicador'));
    let idx = 0;
    function show(i){
      idx = (i + imgs.length) % imgs.length;
      imgs.forEach((img,k)=>img.classList.toggle('visivel', k===idx));
      indicators.forEach((el,k)=>el.classList.toggle('ativo', k===idx));
    }
    document.querySelector('.nav.prev')?.addEventListener('click',()=>show(idx-1));
    document.querySelector('.nav.next')?.addEventListener('click',()=>show(idx+1));
    indicators.forEach((el,i)=>el.addEventListener('click',()=>show(i)));
  })();
  </script>
  `;
}

function renderFullHTML(headInner, bodyInner) {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
${headInner}
</head>
<body>
${bodyInner}
</body>
</html>`;
}

// ---------- MAIN ----------
async function main() {
  log('start', new Date().toISOString());
  const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const tFetch = Date.now();
  const { data: products, error } = await supa.from('products').select('*');
  if (error) throw error;
  log('fetched products:', products?.length ?? 0, 'in', (Date.now()-tFetch)+'ms');

  if (!products || !products.length) {
    console.warn('[build-products] No products found.');
    return;
  }

  ensureDir(OUT_ROOT);

  const { cssLinks, baseMetas } = loadBaseHead();
  const { topbarHTML, footerHTML } = extractTopbarFooter();

  let count = 0;
  const tGen = Date.now();
  for (const p of products) {
    const t1 = Date.now();
    const slug = p.slug || p.Slug || p.name || p.nome;
    if (!slug) continue;

    const head = buildMetaHead(baseMetas, cssLinks, slug, p);
    const body = buildBody(topbarHTML, footerHTML, slug, p);
    const html = renderFullHTML(head, body);

    const dir = path.join(OUT_ROOT, slug);
    ensureDir(dir);
    writeFileAtomic(path.join(dir, 'index.html'), html);
    count++;
    log('wrote', `/produto/${slug}/index.html`, 'in', (Date.now()-t1)+'ms');
  }
  log('generated all pages in', (Date.now()-tGen)+'ms');

  console.log(`✅ Built ${count} product pages in ${Date.now()-t0}ms (no browser, single query).`);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
