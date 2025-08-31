import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: products, error } = await supabase
    .from('products')
    .select('slug, name, nome, description, descricao, metawords, images, banner, category')
    .eq('active', true);

  if (error) { console.error('Supabase error:', error); process.exit(1); }

  const tpl = fs.readFileSync(path.join(process.cwd(), 'product.html'), 'utf-8');

  for (const p of products || []) {
    const slug = p.slug;
    const name = p.name || p.nome || 'Produto';
    const desc = p.description || p.descricao || `Compra ${name} personalizada na GráficaPT.`;
    const url = `${BASE_URL}/produto/${encodeURIComponent(slug)}`;
    let img = null;
    try {
      const arr = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]');
      if (arr && arr.length) img = arr[0];
    } catch(e){}
    if (!img && p.banner) img = p.banner;
    if (img && !/^https?:\/\//.test(img)) {
      // prefix to public path
      img = `${BASE_URL}/imagens/produtos/${img.replace(/^\//,'')}`;
    }
    if (!img) img = `${BASE_URL}/imagens/social/logo_minimal.png`;
    const keywords = Array.isArray(p.metawords) ? p.metawords.filter(Boolean).join(', ') : '';

    const headTags = `
<title>${escapeHtml(name)} | GráficaPT</title>
<link rel="canonical" href="${url}">
<meta name="description" content="${escapeHtml(desc)}">
<meta name="keywords" content="${escapeHtml(keywords)}">
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

    const bootstrap = `<script>window.__PRODUCT__=${JSON.stringify({slug, name, desc, url, img, keywords})};</script>`;
    let html = tpl.replace(/<\/head>/i, `${headTags}\n</head>`);
    html = html.replace(/<\/body>/i, `${bootstrap}\n</body>`);

    const dir = path.join(outRoot, slug);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
    console.log('✓ built /produto/%s', slug);
  }

  console.log('✅ Static product pages built.');
}

main().catch((e)=>{ console.error(e); process.exit(1); });
