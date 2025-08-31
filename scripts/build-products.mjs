import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nbcmqkcztuogflejswau.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_co9n_L7O6rCcc9mb570Uhw_Bg8eqWIL';
const BASE_URL = process.env.BASE_URL || 'https://graficapt.com';

const outRoot = path.join(process.cwd(), 'produto');

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
const mkUrl = (x) => /^https?:\/\//.test(String(x||'')) ? String(x) : `${BASE_URL}/imagens/produtos/${String(x||'').replace(/^\//,'')}`;

// Clean generic head
function stripExistingHeadTags(html) {
  html = html.replace(/<title>[\s\S]*?<\/title>/i, '');
  html = html.replace(/<meta[^>]+name=["']description["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]+name=["']keywords["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]+name=["']twitter:card["'][^>]*>/gi, '');
  html = html.replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '');
  html = html.replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi, '');
  html = html.replace(/<script>\s*window\.prerenderReady\s*=\s*false;?\s*<\/script>/i, '');
  return html;
}
const injectHead = (html, headTags) => html.replace(/<\/head>/i, `${headTags}\n</head>`);

// Render helpers for options
function renderOption(opt, storagePublic){
  const type = (opt.tipo || opt.type || '').toLowerCase();
  const label = escapeHtml(opt.label || '');
  const values = opt.values || opt.opcoes || opt.options || [];
  const idBase = label.toLowerCase().replace(/\s+/g,'-');
  let html = '';

  switch(type){
    case 'imagem-radio': {
      html += `<fieldset class="opt opt--img opt--radio"><legend>${label}</legend>`;
      (values || []).forEach((v,i)=>{
        const val = (typeof v==='string')? v : (v.value || v.label || '');
        const img = (typeof v==='object' && v.img)? v.img : null;
        const id = `${idBase}-${i}`;
        html += `<label for="${id}" class="opt__imgcard">`;
        html += `<input type="radio" id="${id}" name="${label}" value="${escapeHtml(val)}" ${i===0?'checked':''}>`;
        if (img) html += `<img src="${mkUrl(img)}" alt="${escapeHtml(val)}">`;
        html += `<span>${escapeHtml(val)}</span>`;
        html += `</label>`;
      });
      html += `</fieldset>`;
      break;
    }
    case 'imagem-checkbox': {
      html += `<fieldset class="opt opt--img opt--checkbox"><legend>${label}</legend>`;
      (values || []).forEach((v,i)=>{
        const val = (typeof v==='string')? v : (v.value || v.label || '');
        const img = (typeof v==='object' && v.img)? v.img : null;
        const id = `${idBase}-${i}`;
        html += `<label for="${id}" class="opt__imgcard">`;
        html += `<input type="checkbox" id="${id}" name="${label}" value="${escapeHtml(val)}">`;
        if (img) html += `<img src="${mkUrl(img)}" alt="${escapeHtml(val)}">`;
        html += `<span>${escapeHtml(val)}</span>`;
        html += `</label>`;
      });
      html += `</fieldset>`;
      break;
    }
    case 'select': {
      html += `<label class="opt"><span class="opt__label">${label}</span>`;
      html += `<select name="${label}">`;
      (values || []).forEach((v,i)=>{
        const val = (typeof v==='string')? v : (v.value || v.label || '');
        html += `<option value="${escapeHtml(val)}" ${i===0?'selected':''}>${escapeHtml(val)}</option>`;
      });
      html += `</select></label>`;
      break;
    }
    case 'number': {
      const min = (opt.min ?? 1);
      const def = (opt.default ?? 1);
      html += `<label class="opt"><span class="opt__label">${label}</span>`;
      html += `<input type="number" name="${label}" min="${min}" value="${def}" required></label>`;
      break;
    }
    case 'text':
    default: {
      html += `<label class="opt"><span class="opt__label">${label}</span>`;
      html += `<input type="text" name="${label}" placeholder="${escapeHtml(opt.placeholder || '')}"></label>`;
    }
  }

  return html;
}

function renderOptions(opcoes, storagePublic){
  if (!Array.isArray(opcoes)) return '';
  return opcoes.map(o => renderOption(o, storagePublic)).join('\n');
}

async function main(){
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: products, error } = await supabase
    .from('products')
    .select('slug, name, metawords, images, banner, category, opcoes');

  if (error) { console.error('Supabase error:', error); process.exit(1); }

  const tpl = fs.readFileSync(path.join(process.cwd(), 'product.html'), 'utf-8');
  const STORAGE_PUBLIC = `${BASE_URL}/imagens/produtos/`;

  for (const p of (products || [])) {
    const slug = p.slug;
    const name = p.name || 'Produto';
    const desc = `Compra ${name} personalizada na GráficaPT. Impressão profissional, ideal para empresas e eventos.`;
    const url = `${BASE_URL}/produto/${encodeURIComponent(slug)}`;

    // images
    let imagesArr = [];
    try { imagesArr = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'); } catch {}
    let hero = imagesArr && imagesArr.length ? imagesArr[0] : (p.banner || null);
    let heroUrl = mkUrl(hero) || `${BASE_URL}/imagens/social/logo_minimal.png`;
    const thumbs = (imagesArr || []).slice(1).map(mkUrl);

    const keywords = Array.isArray(p.metawords) ? p.metawords.filter(Boolean).join(', ') : String(p.metawords || '');

    // HEAD
    const headTags = `
<title>${escapeHtml(name)} | GráficaPT</title>
<link rel="canonical" href="${url}">
<meta name="description" content="${escapeHtml(desc)}">
<meta name="keywords" content="${escapeHtml(keywords)}">
<meta property="og:type" content="product">
<meta property="og:title" content="${escapeHtml(name)} | GráficaPT">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:image" content="${heroUrl}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json" id="product-jsonld">${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Product",
  "name": name,
  "image": [heroUrl],
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

    // FORM/OPTIONS server-rendered
    let opcoes = p.opcoes;
    if (!Array.isArray(opcoes)) {
      try {
        if (opcoes && typeof opcoes === 'string') opcoes = JSON.parse(opcoes);
        else if (opcoes && typeof opcoes === 'object') {
          opcoes = Object.entries(opcoes).map(([label, obj]) => ({ label, ...obj }));
        } else opcoes = [];
      } catch { opcoes = []; }
    }
    const optionsHTML = renderOptions(opcoes, STORAGE_PUBLIC);

    const productHTML = `
  <article class="product">
    <header class="product-header">
      <h1>${escapeHtml(name)}</h1>
    </header>

    <figure class="product-hero">
      <img src="${heroUrl}" alt="${escapeHtml(name)}" loading="eager">
    </figure>

    ${thumbs.length ? `<div class="product-thumbs">${thumbs.map((t,i)=>`<img src="${t}" alt="${escapeHtml(name)} — imagem ${i+2}" loading="lazy">`).join('')}</div>` : ''}

    <form class="product" id="orcamentoForm" method="post" action="/encomendas">
      ${optionsHTML}
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Pedir orçamento</button>
      </div>
    </form>

    <section class="product-cta">
      <a class="btn btn-secondary" href="/encomendas">Pedir orçamento</a>
    </section>
  </article>
`;

    // write file
    let html = stripExistingHeadTags(tpl);
    html = injectHead(html, headTags);
    html = html.replace(/<div\s+id=["']produto-dinamico["']><\/div>/i, `<div id="produto-dinamico">${productHTML}</div>`);

    const bootstrap = `<script>window.__PRODUCT__=${JSON.stringify({slug, name, desc, url, img: heroUrl, keywords})};</script>`;
    html = html.replace(/<\/body>/i, `${bootstrap}\n</body>`);

    const dir = path.join(outRoot, slug);
    ensureDir(dir);
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
    console.log('✓ built /produto/%s', slug);
  }

  console.log('✅ Static product pages built with options.');
}

main().catch(e => { console.error(e); process.exit(1); });
