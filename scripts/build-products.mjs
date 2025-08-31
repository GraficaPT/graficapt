import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// ---------- ENV ----------
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const BASE_URL = process.env.BASE_URL || 'https://graficapt.com';
const STORAGE_PUBLIC =
  process.env.STORAGE_PUBLIC ||
  (SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/products/` : `${BASE_URL}/imagens/produtos/`);

const OUT_ROOT = path.join(process.cwd(), 'produto');

// ---------- HELPERS ----------
const esc = (s='') => String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

const mkUrl = (x) =>
  /^https?:\/\//.test(String(x||'')) ? String(x) : `${STORAGE_PUBLIC}${String(x||'').replace(/^\//,'')}`;

function stripHead(html){
  return html
    .replace(/<title>[\s\S]*?<\/title>/i,'')
    .replace(/<meta[^>]+name=["']description["'][^>]*>/gi,'')
    .replace(/<meta[^>]+name=["']keywords["'][^>]*>/gi,'')
    .replace(/<meta[^>]+name=["']twitter:card["'][^>]*>/gi,'')
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi,'')
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi,'');
}

const injectHead = (html, head) => html.replace(/<\/head>/i, `${head}\n</head>`);

// Options renderer: supports tipos ('imagem-radio','imagem-checkbox','select','number','text')
function renderOption(opt){
  const type = String(opt?.tipo || opt?.type || '').toLowerCase();
  const label = esc(opt?.label || '');
  const values = Array.isArray(opt?.values) ? opt.values :
                 Array.isArray(opt?.opcoes) ? opt.opcoes :
                 Array.isArray(opt?.options) ? opt.options : [];
  const idBase = label.toLowerCase().replace(/\s+/g,'-') || `opt-${Math.random().toString(36).slice(2,7)}`;

  if (type === 'imagem-radio'){
    return `
<fieldset class="opt opt--img opt--radio"><legend>${label}</legend>
${values.map((v,i)=>{
  const val = typeof v === 'string' ? v : (v.value || v.label || '');
  const img = (typeof v === 'object' && v.img) ? mkUrl(v.img) : null;
  const id = `${idBase}-${i}`;
  return `<label for="${id}" class="opt__imgcard">
  <input type="radio" id="${id}" name="${label}" value="${esc(val)}" ${i===0?'checked':''}>
  ${img ? `<img src="${img}" alt="${esc(val)}">` : ''}
  <span>${esc(val)}</span>
</label>`;
}).join('')}
</fieldset>`;
  }

  if (type === 'imagem-checkbox'){
    return `
<fieldset class="opt opt--img opt--checkbox"><legend>${label}</legend>
${values.map((v,i)=>{
  const val = typeof v === 'string' ? v : (v.value || v.label || '');
  const img = (typeof v === 'object' && v.img) ? mkUrl(v.img) : null;
  const id = `${idBase}-${i}`;
  return `<label for="${id}" class="opt__imgcard">
  <input type="checkbox" id="${id}" name="${label}" value="${esc(val)}">
  ${img ? `<img src="${img}" alt="${esc(val)}">` : ''}
  <span>${esc(val)}</span>
</label>`;
}).join('')}
</fieldset>`;
  }

  if (type === 'select'){
    return `
<label class="opt"><span class="opt__label">${label}</span>
  <select name="${label}">
    ${values.map((v,i)=>{
      const val = typeof v === 'string' ? v : (v.value || v.label || '');
      return `<option value="${esc(val)}" ${i===0?'selected':''}>${esc(val)}</option>`;
    }).join('')}
  </select>
</label>`;
  }

  if (type === 'number'){
    const min = opt?.min ?? 1;
    const def = opt?.default ?? 1;
    return `
<label class="opt"><span class="opt__label">${label}</span>
  <input type="number" name="${label}" min="${min}" value="${def}" required>
</label>`;
  }

  // default text
  return `
<label class="opt"><span class="opt__label">${label}</span>
  <input type="text" name="${label}" placeholder="${esc(opt?.placeholder || '')}">
</label>`;
}

function parseOpcoes(raw){
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string'){
    try { return JSON.parse(raw); } catch { return []; }
  }
  if (typeof raw === 'object'){
    // Supabase row with { label: {tipo, values...} }
    return Object.entries(raw).map(([label, data]) => ({ label, ...data }));
  }
  return [];
}

// ---------- MAIN ----------
async function main(){
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY){
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in env.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const tplPath = path.join(process.cwd(), 'product.html');
  if (!fs.existsSync(tplPath)){
    console.error('product.html not found at project root.');
    process.exit(1);
  }
  const tpl = fs.readFileSync(tplPath,'utf-8');

  const { data: products, error } = await supabase
    .from('products')
    .select('slug, name, metawords, images, banner, opcoes');

  if (error){
    console.error('Supabase error:', error);
    process.exit(1);
  }

  for (const p of (products||[])){
    const slug = p.slug;
    const name = p.name || 'Produto';
    const url = `${BASE_URL}/produto/${encodeURIComponent(slug)}`;
    const desc = `Compra ${name} personalizada na GráficaPT. Impressão profissional, ideal para empresas e eventos.`;

    let images = [];
    try { images = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'); } catch {}
    const hero = mkUrl(images[0] || p.banner || 'logo_minimal.png');
    const thumbs = (images||[]).slice(1).map(mkUrl);

    const keywords = Array.isArray(p.metawords) ? p.metawords.filter(Boolean).join(', ') : String(p.metawords || '');

    const opcoes = parseOpcoes(p.opcoes);
    const optionsHTML = opcoes.map(renderOption).join('\n');

    const head = `
<title>${esc(name)} | GráficaPT</title>
<link rel="canonical" href="${url}">
<meta name="description" content="${esc(desc)}">
<meta name="keywords" content="${esc(keywords)}">
<meta property="og:type" content="product">
<meta property="og:title" content="${esc(name)} | GráficaPT">
<meta property="og:description" content="${esc(desc)}">
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
  <header class="product-header">
    <h1>${esc(name)}</h1>
  </header>

  <figure class="product-hero">
    <img src="${hero}" alt="${esc(name)}" loading="eager">
  </figure>

  ${thumbs.length ? `
  <div class="product-thumbs">
    ${thumbs.map((t,i)=>`<img src="${t}" alt="${esc(name)} — imagem ${i+2}" loading="lazy">`).join('')}
  </div>` : ''}

  ${optionsHTML ? `
  <form class="product" id="orcamentoForm" method="post" action="/encomendas">
    ${optionsHTML}
    <label class="opt"><span class="opt__label">Quantidade</span>
      <input type="number" name="Quantidade" min="1" value="1" required>
    </label>
    <div class="form-actions">
      <button type="submit" class="btn btn-primary">Pedir orçamento</button>
    </div>
  </form>` : `
  <section class="product-cta">
    <a class="btn btn-primary" href="/encomendas">Pedir orçamento</a>
  </section>`}
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

  console.log('✅ Static product pages built (full layout).');
}

main().catch((e)=>{ console.error(e); process.exit(1); });
