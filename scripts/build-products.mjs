import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nbcmqkcztuogflejswau.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_co9n_L7O6rCcc9mb570Uhw_Bg8eqWIL';
const BASE_URL = process.env.BASE_URL || 'https://graficapt.com';

const outRoot = path.join(process.cwd(), 'produto');

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// --- helpers para limpar o <head> genérico e injetar o específico ---
function stripExistingHeadTags(html) {
  // remove <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, '');
  // remove meta description/keywords/twitter:card
  html = html.replace(/<meta[^>]+name=["']description["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]+name=["']keywords["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]+name=["']twitter:card["'][^>]*>/gi, '');
  // remove canonical
  html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '');
  // remove OG genéricos
  html = html.replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi, '');
  // remove script de prerender antigo
  html = html.replace(/<script>\s*window\.prerenderReady\s*=\s*false;?\s*<\/script>/i, '');
  return html;
}

function injectHead(html, headTags) {
  return html.replace(/<\/head>/i, `${headTags}\n</head>`);
}

function mkUrl(x) {
  if (!x) return null;
  return /^https?:\/\//.test(x) ? x : `${BASE_URL}/imagens/produtos/${String(x).replace(/^\//,'')}`;
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: products, error } = await supabase
    .from('products')
    .select('slug, name, metawords, images, banner, category');

  if (error) {
    console.error('Supabase error:', error);
    process.exit(1);
  }

  const tpl = fs.readFileSync(path.join(process.cwd(), 'product.html'), 'utf-8');

  for (const p of products || []) {
    const slug = p.slug;
    const name = p.name || 'Produto';
    const desc = `Compra ${name} personalizada na GráficaPT. Impressão profissional, ideal para empresas e eventos.`;
    const url = `${BASE_URL}/produto/${encodeURIComponent(slug)}`;

    // imagem principal
    let img = null;
    let imagesArr = [];
    try {
      imagesArr = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]');
    } catch {}
    if (imagesArr && imagesArr.length) img = imagesArr[0];
    if (!img && p.banner) img = p.banner;
    img = mkUrl(img) || `${BASE_URL}/imagens/social/logo_minimal.png`;

    const keywords = Array.isArray(p.metawords) ? p.metawords.filter(Boolean).join(', ') : String(p.metawords || '');

    // tags específicas do produto
    const headTags = `
<title>${escapeHtml(name)} | GráficaPT</title>
<link rel="canonical" href="${url}">
<meta name="description" content="${escapeHtml(desc)}">
<meta name="keywords" content="${escapeHtml(keywords)}">
<meta property="og:type" content="product">
<meta property="og:title" content="${escapeHtml(name)} | GráficaPT">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:image" content="${img}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json" id="product-jsonld">${JSON.stringify({
  "@context":"https://schema.org",
  "@type":"Product",
  "name": name,
  "image": [img],
  "description": desc,
  "brand": {"@type":"Brand","name":"GraficaPT"},
  "url": url
})}</script>
<script type="application/ld+json" id="breadcrumbs-jsonld">${JSON.stringify({
  "@context":"https://schema.org",
  "@type":"BreadcrumbList",
  "itemListElement":[
    {"@type":"ListItem","position":1,"name":"Início","item":BASE_URL+"/"},
    {"@type":"ListItem","position":2,"name":"Produtos","item":BASE_URL+"/produtos/"},
    {"@type":"ListItem","position":3,"name":name,"item":url}
  ]
}).replace(/BASE_URL/g, BASE_URL)}</script>
`;

    // conteúdo server-rendered do produto
    const hero = img;
    const thumbs = imagesArr.filter(u => mkUrl(u) !== hero);
    const productHTML = `
  <article class="product">
    <header class="product-header">
      <h1>${escapeHtml(name)}</h1>
    </header>
    <figure class="product-hero">
      <img src="${hero}" alt="${escapeHtml(name)}" loading="eager">
    </figure>
    ${thumbs.length ? `
      <div class="product-thumbs">
        ${thumbs.map((t,i)=>`<img src="${mkUrl(t)}" alt="${escapeHtml(name)} — imagem ${i+2}" loading="lazy">`).join('')}
      </div>` : ''}
    <section class="product-cta">
      <a class="btn btn-primary" href="/encomendas">Pedir orçamento</a>
    </section>
  </article>
`;

    // limpar head genérico + injetar tags
    let html = stripExistingHeadTags(tpl);
    html = injectHead(html, headTags);

    // substituir placeholder pelo HTML renderizado
    html = html.replace(
      /<div\s+id=["']produto-dinamico["']><\/div>/i,
      `<div id="produto-dinamico">${productHTML}</div>`
    );

    // bootstrap opcional para JS no cliente
    const bootstrap = `<script>window.__PRODUCT__=${JSON.stringify({slug, name, desc, url, img, keywords})};</script>`;
    html = html.replace(/<\/body>/i, `${bootstrap}\n</body>`);

    const dir = path.join(outRoot, slug);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
    console.log('✓ built /produto/%s', slug);
  }

  console.log('✅ Static product pages built.');
}

main().catch((e)=>{ console.error(e); process.exit(1); });
