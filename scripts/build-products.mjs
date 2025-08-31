import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const BASE_URL = process.env.BASE_URL || 'https://graficapt.com';
const STORAGE_PUBLIC = process.env.STORAGE_PUBLIC || (SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/products/` : `${BASE_URL}/imagens/produtos/`);
const OUT_ROOT = path.join(process.cwd(), 'produto');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const escapeHtml = (s='') => String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

const mkUrl = x => /^https?:\/\//.test(String(x||'')) ? String(x) : `${STORAGE_PUBLIC}${String(x||'').replace(/^\//,'')}`;

const stripHead = html => html
  .replace(/<title>[\s\S]*?<\/title>/i,'')
  .replace(/<meta[^>]+name=["']description["'][^>]*>/gi,'')
  .replace(/<meta[^>]+name=["']keywords["'][^>]*>/gi,'')
  .replace(/<meta[^>]+name=["']twitter:card["'][^>]*>/gi,'')
  .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi,'')
  .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi,'')
  .replace(/<script>\s*window\.prerenderReady\s*=\s*false;?\s*<\/script>/i, '');

const injectHead = (html, head) => html.replace(/<\/head>/i, `${head}\n</head>`);

async function main(){
  const tpl = fs.readFileSync(path.join(process.cwd(), 'product.html'),'utf-8');
  const { data: products, error } = await supabase
    .from('products')
    .select('slug, name, metawords, images, banner, category');

  if (error) { console.error('Supabase error:', error); process.exit(1); }

  for (const p of products || []){
    const slug = p.slug;
    const name = p.name || 'Produto';
    const desc = `Compra ${name} personalizada na GráficaPT. Impressão profissional, ideal para empresas e eventos.`;
    const url = `${BASE_URL}/produto/${encodeURIComponent(slug)}`;

    // images
    let imagesArr = [];
    try { imagesArr = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'); } catch {}
    const hero = mkUrl(imagesArr[0] || p.banner || 'logo_minimal.png');
    const thumbs = imagesArr.slice(1).map(mkUrl);

    const keywords = Array.isArray(p.metawords) ? p.metawords.filter(Boolean).join(', ') : String(p.metawords || '');

    const head = `
<title>${escapeHtml(name)} | GráficaPT</title>
<link rel="canonical" href="${url}">
<meta name="description" content="${escapeHtml(desc)}">
<meta name="keywords" content="${escapeHtml(keywords)}">
<meta property="og:type" content="product">
<meta property="og:title" content="${escapeHtml(name)} | GráficaPT">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:image" content="${hero}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json" id="product-jsonld">${JSON.stringify({
  "@context":"https://schema.org",
  "@type":"Product",
  "name": name,
  "image": [hero],
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

    const body = `
<article class="product">
  <header class="product-header"><h1>${escapeHtml(name)}</h1></header>
  <figure class="product-hero"><img src="${hero}" alt="${escapeHtml(name)}" loading="eager"></figure>
  ${thumbs.length ? `<div class="product-thumbs">${thumbs.map((t,i)=>`<img src="${t}" alt="${escapeHtml(name)} — imagem ${i+2}" loading="lazy">`).join('')}</div>` : ''}
  <section class="product-cta"><a class="btn btn-primary" href="/encomendas">Pedir orçamento</a></section>
</article>`;

    let html = stripHead(tpl);
    html = injectHead(html, head);
    html = html.replace(/<div\s+id=["']produto-dinamico["']><\/div>/i, `<div id="produto-dinamico">${body}</div>`);
    const bootstrap = `<script>window.__PRODUCT__=${JSON.stringify({slug, name, desc, url, img: hero, keywords})};</script>`;
    html = html.replace(/<\/body>/i, `${bootstrap}\n</body>`);

    const outDir = path.join(OUT_ROOT, slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir,'index.html'), html, 'utf-8');
    console.log('✓ /produto/%s', slug);
  }

  console.log('✅ Static product pages built.');
}

main().catch(e => { console.error(e); process.exit(1); });
