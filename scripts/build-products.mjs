import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// -----------------------------
// Environment
// -----------------------------
const SUPABASE_URL      = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const BASE_URL          = process.env.BASE_URL || 'https://graficapt.com';
const STORAGE_PUBLIC    = process.env.STORAGE_PUBLIC ||
  (SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/products/` : `${BASE_URL}/imagens/produtos/`);

const ROOT     = process.cwd();
const OUT_ROOT = path.join(ROOT, 'produto');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[build-products] Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const log = (...a) => console.log('[build-products]', ...a);

// -----------------------------
// IO helpers
// -----------------------------
const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const writeFileAtomic = (filePath, content) => {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, content, 'utf-8');
  fs.renameSync(tmp, filePath);
};
const readIfExists = (rel) => {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf-8'); } catch { return null; }
};

// -----------------------------
// Small utils
// -----------------------------
const esc = (s='') => String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#039;');

const asArray = (x) => Array.isArray(x) ? x : (x ? [x] : []);

function joinPublicPath(...parts) {
  const raw = parts.join('/');
  return raw.replace(/(https?:\/\/[^/]+)\/+/,'$1/').replace(/([^:])\/+/g,'$1/');
}

function resolveImagePath(slug, image, storageBase) {
  if (!image) return '';
  if (/^https?:\/\//i.test(image)) return image;
  return joinPublicPath(storageBase, slug, image);
}

// -----------------------------
// Extract topbar/footer from bundle (with fallbacks)
// -----------------------------
function extractTopbarFooter() {
  const bundle = readIfExists('js/app.bundle.js') || readIfExists('js/main.js') || '';
  let topbar = '', footer = '';
  if (bundle) {
    const mTop   = bundle.match(/const\s+topbarHTML\s*=\s*`([\s\S]*?)`;/);
    const mFoot  = bundle.match(/const\s+footerHTML\s*=\s*`([\s\S]*?)`;/);
    topbar = mTop ? mTop[1] : topbar;
    footer = mFoot ? mFoot[1] : footer;
  }
  // try html partials
  topbar = topbar || readIfExists('partials/topbar.html') || '';
  footer = footer || readIfExists('partials/footer.html') || '';
  return { topbarHTML: topbar, footerHTML: footer };
}

// -----------------------------
// JSON-LD
// -----------------------------
function buildProductJsonLd({ baseUrl, title, descr, images = [], sku = '', brand = 'GraficaPT', category = '', offers }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": title,
    "description": descr,
    "image": (images || []).filter(Boolean),
    "sku": sku || undefined,
    "brand": brand ? { "@type": "Brand", "name": brand } : undefined,
    "category": category || undefined,
    "url": baseUrl
  };
  if (offers && offers.price) {
    ld.offers = {
      "@type": "Offer",
      "priceCurrency": offers.priceCurrency || "EUR",
      "price": String(offers.price),
      "availability": offers.availability || "https://schema.org/InStock",
      "url": baseUrl
    };
  }
  return '<script type="application/ld+json">' + JSON.stringify(ld) + '</script>';
}

function buildServiceJsonLd({ baseUrl, title, descr, images = [], brand = 'GráficaPT', category = '' }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": title,
    "description": descr,
    "image": (images || []).filter(Boolean),
    "serviceType": category || "Impressão e personalização",
    "areaServed": { "@type": "Country", "name": "PT" },
    "provider": { "@type": "Organization", "name": brand || "GráficaPT", "url": BASE_URL },
    "url": baseUrl
  };
  return '<script type="application/ld+json">' + JSON.stringify(ld) + '</script>';
}

function buildBreadcrumbJsonLd(items = []) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((it, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": it.name,
      "item": it.item
    }))
  };
  return '<script type="application/ld+json">' + JSON.stringify(ld) + '</script>';
}

function buildFaqJsonLd(faqItems = []) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": (faqItems || []).map(it => ({
      "@type": "Question",
      "name": it.q,
      "acceptedAnswer": { "@type": "Answer", "text": it.a }
    }))
  };
  return '<script type="application/ld+json">' + JSON.stringify(ld) + '</script>';
}

function defaultFaqForProduct(name = 'Produto') {
  const n = String(name || 'Produto');
  return [
    { q: `Como faço o upload do meu design para ${n}?`, a: 'Usa o formulário nesta página para anexar o teu ficheiro e preencher os campos.' },
    { q: `Quanto tempo demora a produção de ${n}?`, a: 'O prazo médio é de 3 a 7 dias úteis após confirmação do ficheiro.' },
    { q: 'Fazem entregas em todo o país?', a: 'Sim, enviamos para todo o território de Portugal Continental e Ilhas.' }
  ];
}

// -----------------------------
// Head
// -----------------------------
function buildHead(baseUrl, title, descr, keywords, ogImage, ogType = 'website', preconnects = []) {
  return [
    '<meta charset="utf-8">',
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(title)}</title>`,
    `<link rel="canonical" href="${esc(baseUrl)}">`,
    `<meta name="description" content="${esc(descr)}">`,
    (keywords ? `<meta name="keywords" content="${esc(keywords)}">` : ''),
    '<meta name="robots" content="index, follow">',
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(descr)}">`,
    (ogImage ? `<meta property="og:image" content="${esc(ogImage)}">` : ''),
    `<meta property="og:type" content="${esc(ogType)}">`,
    '<link rel="icon" href="/favicon.ico">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    preconnects.map(u => `<link rel="preconnect" href="${esc(u)}" crossorigin>`).join('\n'),
    '<link rel="stylesheet" href="/css/index.css">',
    '<link rel="stylesheet" href="/css/product.css">'
  ].filter(Boolean).join('\n');
}

// -----------------------------
// FAQ HTML
// -----------------------------
function renderFaqHTML(faqItems) {
  if (!faqItems || !faqItems.length) return '';
  const items = faqItems.map(it => [
    '<details class="faq-item">',
    `  <summary>${esc(it.q)}</summary>`,
    `  <div class="faq-answer"><p>${esc(it.a)}</p></div>`,
    '</details>'
  ].join('\n')).join('\n');
  return [
    '<section class="faq">',
    '  <div class="faq__head"><h2>Perguntas frequentes</h2></div>',
    '  <div class="faq__list">',
    items,
    '  </div>',
    '</section>'
  ].join('\n');
}

// -----------------------------
// Product & related
// -----------------------------
function renderCard(p) {
  const slug = p.slug || p.Slug || p.name || p.nome;
  const name = p.name || p.nome || slug;
  const img  = resolveImagePath(slug, (asArray(p.images)[0] || ''), STORAGE_PUBLIC);
  const url  = `${BASE_URL}/produto/${encodeURIComponent(slug)}`;
  const descr= p.shortdesc || p.descricao || 'Personaliza e pede orçamento.';
  return [
    `<a class="card" href="${esc(url)}">`,
    (img ? `<img aria-hidden="true" src="${esc(img)}" alt="${esc(name)}">` : ''),
    `<div class="card-body"><h3>${esc(name)}</h3><p>${esc(descr)}</p></div>`,
    '</a>'
  ].join('');
}

function renderRelated(allProducts = [], currentSlug = '') {
  const others = allProducts.filter(p => (p.slug || p.Slug) !== currentSlug).slice(0, 4);
  if (!others.length) return '';
  const cards = others.map(renderCard).join('\n');
  return [
    '<section class="related">',
    '  <h2>Também podes gostar</h2>',
    '  <div class="cards">',
    cards,
    '  </div>',
    '</section>'
  ].join('\n');
}

// -----------------------------
// Page renderers
// -----------------------------
function renderProductPage(p, topbarHTML, footerHTML, allProducts) {
  const slug     = p.slug || p.Slug || p.name || p.nome;
  const baseName = p.name || p.nome || slug;
  const url      = `${BASE_URL}/produto/${encodeURIComponent(slug)}`;

  const descr    = p.description || p.descricao || `Compra ${baseName} personalizada na GráficaPT.`;
  const keywords = asArray(p.keywords || p.metawords || p.tags).join(', ');
  const images   = asArray(p.images || p.fotos || []);
  const resolvedImages = images.map(u => resolveImagePath(slug, u, STORAGE_PUBLIC)).filter(Boolean);
  const ogImage  = resolvedImages[0] || '';

  // detect price (several possible field names)
  const rawPrice = p.price ?? p.preco ?? p.precoMin ?? p.min_price ?? p.minPrice;
  const priceNum = Number(String(rawPrice ?? '').replace(',', '.'));
  const hasPrice = Number.isFinite(priceNum) && priceNum > 0;

  const ogType = hasPrice ? 'product' : 'website';
  const head   = buildHead(url, `${baseName} | GráficaPT`, descr, keywords, ogImage, ogType, [new URL(STORAGE_PUBLIC).origin]);

  // JSON-LD
  const structuredLd = hasPrice
    ? buildProductJsonLd({
        baseUrl: url,
        title: baseName,
        descr,
        images: resolvedImages,
        brand: 'GráficaPT',
        category: p.categoria || '',
        offers: { price: priceNum.toFixed(2), priceCurrency: 'EUR' }
      })
    : buildServiceJsonLd({
        baseUrl: url,
        title: baseName,
        descr,
        images: resolvedImages,
        brand: 'GráficaPT',
        category: p.categoria || ''
      });

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: 'Início',   item: `${BASE_URL}/` },
    { name: 'Produtos', item: `${BASE_URL}/#filter=all` },
    { name: baseName,   item: url }
  ]);

  const faqItems = defaultFaqForProduct(baseName);
  const faqLd    = buildFaqJsonLd(faqItems);
  const headWithLd = [head, structuredLd, breadcrumbLd, faqLd].join('\n');

  const gallery = resolvedImages.length
    ? '<div class="gallery">' + resolvedImages.map(src => `<img src="${esc(src)}" alt="${esc(baseName)}">`).join('') + '</div>'
    : '';

  const related = renderRelated(allProducts, slug);

  const body = [
    '<div class="container product">',
    `  <h1>${esc(baseName)}</h1>`,
    gallery,
    `  <p class="lead">${esc(descr)}</p>`,
    '  <a class="btn btn-primary" href="/#orcamento">Pedir orçamento</a>',
    related,
    renderFaqHTML(faqItems),
    '</div>'
  ].join('\n');

  const html = [
    '<!DOCTYPE html>',
    '<html lang="pt">',
    '<head>',
    headWithLd,
    '</head>',
    '<body>',
    topbarHTML || '',
    body,
    footerHTML || '',
    '</body>',
    '</html>'
  ].join('\n');

  return html;
}

function renderHome(topbarHTML, footerHTML, products = []) {
  const url   = `${BASE_URL}/`;
  const title = 'GráficaPT — Impressão & Personalização';
  const descr = 'Impressão, personalização e soluções de comunicação visual. Pede orçamento online.';
  const head  = buildHead(url, title, descr, 'impressão, personalização, gráfica', '', 'website', [new URL(STORAGE_PUBLIC).origin]);

  const cards = products.map(renderCard).join('\n');
  const body = [
    '<div class="container">',
    '  <h1>Produtos</h1>',
    `  <div class="cards">${cards}</div>`,
    '</div>'
  ].join('\n');

  return [
    '<!DOCTYPE html>',
    '<html lang="pt">',
    '<head>',
    head,
    '</head>',
    '<body>',
    topbarHTML || '',
    body,
    footerHTML || '',
    '</body>',
    '</html>'
  ].join('\n');
}

// -----------------------------
// Helpers for resilient querying
// -----------------------------
async function run(q) {
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

async function fetchProducts() {
  // Try with `published` + order by `name`
  try {
    return await run(
      supabase.from('products').select('*').eq('published', true).order('name', { ascending: true })
    );
  } catch (e) {
    if (e.code !== '42703') throw e; // not a 'column does not exist'
  }
  // Try without `published`, still order by `name`
  try {
    return await run(
      supabase.from('products').select('*').order('name', { ascending: true })
    );
  } catch (e) {
    if (e.code !== '42703') throw e;
  }
  // Try order by `Slug`
  try {
    return await run(
      supabase.from('products').select('*').order('Slug', { ascending: true })
    );
  } catch (e) {
    if (e.code !== '42703') throw e;
  }
  // Last resort: plain select
  return await run(supabase.from('products').select('*'));
}

// -----------------------------
// Main
// -----------------------------
async function main() {
  const t0 = Date.now();
  log('start', new Date().toISOString());

  const { topbarHTML, footerHTML } = extractTopbarFooter();

  const tFetch = Date.now();
  const products = await fetchProducts();
  log('fetched products:', products.length, 'in', (Date.now() - tFetch) + 'ms');

  ensureDir(OUT_ROOT);

  let count = 0;
  for (const p of products) {
    const slug = p.slug || p.Slug || p.name || p.nome;
    if (!slug) continue;
    const html = renderProductPage(p, topbarHTML, footerHTML, products);
    const dir  = path.join(OUT_ROOT, slug);
    ensureDir(dir);
    writeFileAtomic(path.join(dir, 'index.html'), html);
    count++;
  }

  // home
  const homeHTML = renderHome(topbarHTML, footerHTML, products);
  writeFileAtomic(path.join(ROOT, 'index.html'), homeHTML);

  log(`generated ${count} product pages + homepage in ${Date.now()-t0}ms`);
  console.log(`✅ Built ${count} product pages + homepage (FULL STATIC)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
