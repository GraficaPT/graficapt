import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

/**
 * build-products.mjs — SSR fiel ao comportamento original
 * -------------------------------------------------------
 * - Sem JSDOM/Puppeteer (build rápido e determinístico)
 * - Usa product.html como base e injeta o HTML final em #produto-dinamico
 * - Extrai topbar/footer do js/app.bundle.js para manter EXACTAMENTE o markup/classes
 * - Gera carousel, opções e formulário de orçamento com as mesmas classes do CSS
 * - Remove loader/env/supabase do HTML final (sem ecrã de loading)
 * - Preserva todos os <link rel="stylesheet"> excepto loader.css
 * - Logging detalhado por etapa
 */

const t0 = Date.now();
const log = (...a) => console.log('[build-products]', ...a);

// ------------ ENV ------------
const SUPABASE_URL      = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const BASE_URL          = process.env.BASE_URL || 'https://graficapt.com';
const STORAGE_PUBLIC    = process.env.STORAGE_PUBLIC ||
  (SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/products/` : `${BASE_URL}/imagens/produtos/`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[build-products] Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const ROOT     = process.cwd();
const OUT_ROOT = path.join(ROOT, 'produto');

// ------------ IO helpers ------------
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf-8');
const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const writeFileAtomic = (filePath, content) => {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, content, 'utf-8');
  fs.renameSync(tmp, filePath);
};

// ------------ Small utils ------------
const esc = (s='') => String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

const asArray = (v) => Array.isArray(v) ? v : (v ? String(v).split(',').map(x=>x.trim()).filter(Boolean) : []);

const mkUrl = (p) => {
  if (!p) return `${BASE_URL}/imagens/social/logo_minimal.svg`;
  if (/^https?:\/\//i.test(p)) return p;
  return `${STORAGE_PUBLIC}${String(p).replace(/^\/+/, '')}`;
};

// ------------ Extract head/CSS + topbar/footer ------------
function loadBaseHead() {
  const html = read('product.html');
  const m = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headInner = m ? m[1] : '';
  const links = [...headInner.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)]
    .map(x => x[0])
    .filter(tag => !/loader\.css/i.test(tag));
  const metas = [];
  const metaCharset = headInner.match(/<meta[^>]*charset[^>]*>/i);
  if (metaCharset) metas.push(metaCharset[0]);
  const viewport = headInner.match(/<meta[^>]*name=["']viewport["'][^>]*>/i);
  if (viewport) metas.push(viewport[0]);
  const favicon = headInner.match(/<link[^>]*rel=["']icon["'][^>]*>/i);
  if (favicon) metas.push(favicon[0]);
  const fonts   = [...headInner.matchAll(/<link\b[^>]*fonts\.googleapis[^>]*>/gi)].map(x=>x[0]);
  return { cssLinks: links.join('\n'), baseMetas: metas.join('\n') + '\n' + fonts.join('\n'), fullHTML: html };
}

function extractTopbarFooter() {
  const bundle = read('js/app.bundle.js');
  const mTop = bundle.match(/const\s+topbarHTML\s*=\s*`([\s\S]*?)`;/);
  const mFoot= bundle.match(/const\s+footerHTML\s*=\s*`([\s\S]*?)`;/);
  if (!mTop || !mFoot) {
    throw new Error('Could not extract topbarHTML/footerHTML from js/app.bundle.js');
  }
  return { topbarHTML: mTop[1], footerHTML: mFoot[1] };
}

// ------------ UI HTML builders (carrossel, opções, etc.) ------------
function criarCarrosselHTML(images) {
  const imgs = images && images.length ? images : [ `${BASE_URL}/imagens/social/logo_minimal.svg` ];
  const faixa = `
<div class="carrossel-container">
  <button class="carrossel-btn prev" type="button" aria-label="Anterior" onclick="window.mudarImagem && window.mudarImagem(-1)">&#10094;</button>
  <div class="carrossel-wrapper">
    <div class="carrossel-imagens" id="carrossel">
      ${imgs.map((img, i) => `
      <div class="carrossel-slide" data-index="${i}">
        <img class="carrossel-img" src="${esc(img)}" alt="Imagem ${i + 1}" onerror="this.onerror=null; this.style.opacity='0.4'; this.alt='Erro ao carregar imagem';">
      </div>`).join('')}
    </div>
  </div>
  <button class="carrossel-btn next" type="button" aria-label="Seguinte" onclick="window.mudarImagem && window.mudarImagem(1)">&#10095;</button>
</div>`;

  const dots = `
<div class="indicadores">
  ${imgs.map((_, i) => `<span class="indicador" data-index="${i}" onclick="window.irParaImagem && window.irParaImagem(${i})"></span>`).join('')}
</div>`;

  const boot = `
<script>
(function(){
  const wrapper = document.getElementById('carrossel');
  if (!wrapper) return;
  const slides = Array.from(wrapper.querySelectorAll('.carrossel-slide'));
  const dots = Array.from(document.querySelectorAll('.indicadores .indicador'));
  let current = 0;
  function goto(i){
    if (!slides.length) return;
    current = (i + slides.length) % slides.length;
    wrapper.style.transform = 'translateX(' + (-current * 100) + '%)';
    dots.forEach((d, idx) => d.classList.toggle('ativo', idx === current));
  }
  window.irParaImagem = function(i){ goto(i); };
  window.mudarImagem  = function(delta){ goto(current + (delta || 1)); };
  goto(0);
})();
</script>`;

  return `${faixa}\n${dots}\n${boot}`;
}

function renderOptionSSR(opt={}, index=0) {
  const tipo = String(opt?.tipo || opt?.type || 'select').toLowerCase();
  const label = esc(opt?.label || `${index+1}:`);
  const valores = Array.isArray(opt?.valores) ? opt.valores : (Array.isArray(opt?.options) ? opt.options : []);

  let inputHTML = '';

  if (tipo === 'select'){
    inputHTML = `<select name="${label}" required>
      ${valores.map((v,i)=>`<option value="${esc(typeof v==='object' ? (v.nome||v.label||v.value||v) : v)}"${i===0?' selected':''}>${esc(typeof v==='object' ? (v.nome||v.label||v.value||v) : v)}</option>`).join('')}
    </select>`;
  }
  else if (tipo === 'number'){
    inputHTML = `<input type="number" name="${label}" min="1" value="${esc(opt?.valor||1)}" required>`;
  }
  else if (tipo === 'cores' || tipo === 'color' || tipo === 'colors'){
    inputHTML = `<div class="color-options">
      ${valores.map((item,idx)=>{
        let title='', colorStyle='', imgAssoc='';
        if (typeof item === 'object'){
          title = item.nome || item.label || item.value || '';
          colorStyle = item.cor || item.hex || '';
          imgAssoc = item.imagem || item.img || '';
        } else {
          title = String(item);
          colorStyle = String(item);
        }
        if (title.toLowerCase() === 'multicolor' || title.toLowerCase() === 'multicor'){
          colorStyle = 'linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet)';
          title = 'Multicor';
        }
        const styleAttr = colorStyle ? `style="background:${esc(colorStyle)}"` : '';
        const dataImg = imgAssoc ? `data-img="${esc(mkUrl(imgAssoc))}"` : '';
        return `<button type="button" class="color-swatch" name="${label}" value="${esc(title)}" ${styleAttr} ${dataImg} aria-label="${esc(title)}"></button>`;
      }).join('')}
    </div>`;
  }
  else if (tipo === 'radio' || tipo === 'checkbox'){
    const type = (tipo === 'radio') ? 'radio' : 'checkbox';
    inputHTML = `<div class="posicionamento-options">
      ${valores.map((v,i)=>{
        const id = `${label}-${i}`.replace(/\s+/g,'-').toLowerCase();
        const vv = esc(typeof v==='object' ? (v.nome||v.label||v.value||v) : v);
        return `
        <label for="${id}">
          <input type="${type}" id="${id}" name="${label}${type==='checkbox'?'[]':''}" value="${vv}" ${type==='radio' && i===0 ? 'checked' : ''}>
          <span>${vv}</span>
        </label>`;
      }).join('')}
    </div>`;
  }
  else {
    inputHTML = `<input type="text" name="${label}" value="${esc(opt?.valor||'')}" required>`;
  }

  return `
<div class="option-group">
  <div class="form-group">
    <label>${label}</label>
    ${inputHTML}
  </div>
</div>`;
}

function staticFieldsSSR(){
  // Estrutura com classes existentes em css/product.css
  return `
<div class="options-row">
  <div class="form-group">
    <label for="detalhes">Detalhes</label>
    <textarea name="Detalhes" placeholder="Descreve como queres o design, medidas, acabamentos e atenções extra." required></textarea>
  </div>
  <div class="form-group">
    <label for="empresa">Empresa / Nome</label>
    <input type="text" name="Empresa" placeholder="Empresa ou nome pessoal" required>
  </div>
</div>

<div class="options-row">
  <div class="form-group">
    <label for="telefone">Telefone</label>
    <input type="tel" name="Telefone" placeholder="+351 ..." required>
  </div>
  <div class="form-group">
    <label for="email">Email</label>
    <input type="email" name="Email" placeholder="seu@email.com" required>
  </div>
</div>

<div class="options-row">
  <div class="form-group">
    <label for="quantidade">Quantidade</label>
    <input type="number" name="Quantidade" min="1" value="1" required>
  </div>
  <div class="form-group">
    <label for="ficheiro">Logotipo / Ficheiro</label>
    <input type="file" id="ficheiro" name="Ficheiro">
    <input type="hidden" name="Logotipo" id="link_ficheiro">
    <p id="uploadStatus" style="display:none"></p>
  </div>
</div>

<div class="options-row">
  <div class="form-group">
    <button type="submit" class="btSubmit">Pedir Orçamento</button>
  </div>
</div>`;
}

// ------------ Build a single product page ------------
function buildPageFromTemplate({ tpl, topbarHTML, footerHTML, head, body, slug, productMeta }) {
  let html = tpl;

  // remove loader & scripts que já não precisamos
  html = html.replace('<link rel="stylesheet" href="/css/loader.css">', '');
  html = html.replace('<script src="/js/env.js"></script>', '');
  html = html.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js[^"]*"><\/script>/i, '');
  html = html.replace('<script src="/js/core/supabase.js"></script>', '');
  html = html.replace('<script src="/js/app.bundle.js"></script>', ''); // evitamos loader e render duplo

  // inject head
  html = html.replace(/<meta[^>]*charset[^>]*>\s*<meta[^>]*name=["']viewport["'][^>]*>/i, head);

  // topbar/footer
  html = html.replace('<div class="topbar" id="topbar"></div>', `<div class="topbar" id="topbar">\n${topbarHTML}\n</div>`);
  html = html.replace('<footer class="footer" id="footer"></footer>', `<footer class="footer" id="footer">\n${footerHTML}\n</footer>`);

  // produto
  html = html.replace('<div id="produto-dinamico"></div>', `<div id="produto-dinamico">${body}</div>`);

  // bootstrap para tracking/compat
  html = html.replace('</body>', `<script>window.__PRODUCT__=${JSON.stringify(productMeta)};</script>\n</body>`);

  return html;
}

// ------------ MAIN ------------
async function main() {
  log('start', new Date().toISOString());

  const tHead = Date.now();
  const { cssLinks, baseMetas, fullHTML } = loadBaseHead();
  log('head parsed in', (Date.now()-tHead)+'ms');

  const tNav = Date.now();
  const { topbarHTML, footerHTML } = extractTopbarFooter();
  log('nav/footer extracted in', (Date.now()-tNav)+'ms');

  const tFetch = Date.now();
  const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: products, error } = await supa.from('products').select('*');
  if (error) { console.error(error); process.exit(1); }
  log('fetched products:', products?.length ?? 0, 'in', (Date.now()-tFetch)+'ms');

  if (!products || !products.length) {
    console.warn('[build-products] No products found.');
    return;
  }

  ensureDir(OUT_ROOT);

  let count = 0;
  const tGen = Date.now();

  for (const p of products) {
    const t1 = Date.now();
    const slug = p.slug || p.Slug || p.name || p.nome;
    if (!slug) continue;
    const name = p.name || p.nome || 'Produto';
    const url  = `${BASE_URL}/produto/${encodeURIComponent(slug)}`;

    // imagens
    let images = [];
    try { images = Array.isArray(p.images) ? p.images : JSON.parse(p.images||'[]'); } catch {}
    const hero  = mkUrl((images && images[0]) || p.banner || 'logo_minimal.png');
    const imgsAbs = (images && images.length ? images : [hero]).map(mkUrl);

    // opcoes
    let opcoes = [];
    if (Array.isArray(p.opcoes)) opcoes = p.opcoes;
    else if (p.opcoes && typeof p.opcoes === 'object') {
      opcoes = Object.entries(p.opcoes).map(([label,op])=>({label, ...(op||{})}));
    }

    // HEAD (produto)
    const head = `
${baseMetas}
<title>${esc(name)} | GráficaPT</title>
<link rel="canonical" href="${url}">
<meta name="description" content="${esc(p.shortdesc || p.descricao || `Compra ${name} personalizada na GráficaPT.`)}">
<meta name="keywords" content="${esc(asArray(p.metawords).join(', '))}">
<meta name="robots" content="index, follow">
<meta property="og:title" content="${esc(name)} | GráficaPT">
<meta property="og:description" content="${esc(p.shortdesc || p.descricao || '')}">
<meta property="og:image" content="${esc(p.og_image || hero)}">
<meta property="og:type" content="product">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
${cssLinks}`.trim();

    // BODY (produto)
    const imagensHTML = criarCarrosselHTML(imgsAbs);
    const optionsHTML = opcoes.map((opt,i)=>renderOptionSSR(opt,i)).join('\n');
    const staticHTML  = staticFieldsSSR();

    const body = `
<div class="product-image">
  ${imagensHTML}
</div>

<form class="product" id="orcamentoForm" method="POST" enctype="multipart/form-data">
  <input type="text" class="productname" id="productname" name="Produto" value="${esc(name)}">
  <div class="product-details">
    <h1>${esc(name)}</h1>
    ${optionsHTML}
    ${staticHTML}
  </div>
</form>`;

    const productMeta = {
      slug, name, url,
      hero,
      images: imgsAbs,
      keywords: asArray(p.metawords).join(', ')
    };

    const html = buildPageFromTemplate({
      tpl: fullHTML,
      topbarHTML, footerHTML,
      head, body,
      slug,
      productMeta
    });

    const dir = path.join(OUT_ROOT, slug);
    ensureDir(dir);
    writeFileAtomic(path.join(dir, 'index.html'), html);
    count++;
    log('wrote', `/produto/${slug}/index.html`, 'in', (Date.now()-t1)+'ms');
  }

  log('generated all pages in', (Date.now()-tGen)+'ms');
  console.log(`✅ Built ${count} product pages in ${Date.now()-t0}ms (SSR exact logic).`);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
