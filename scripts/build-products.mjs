import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

/**
 * build-products.mjs — FULL STATIC BUILD (injects /js/env.js for formSender)
 */

const log = (...a) => console.log('[build-products]', ...a);

// ENV
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

// IO helpers
const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const writeFileAtomic = (filePath, content) => {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, content, 'utf-8');
  fs.renameSync(tmp, filePath);
};
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf-8');

// Utils
const esc = (s='') => String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const asArray = (v) => Array.isArray(v) ? v : (v ? String(v).split(',').map(x=>x.trim()).filter(Boolean) : []);
const mkUrl = (p) => !p ? '' : (/^https?:\/\//i.test(p) ? p : (STORAGE_PUBLIC + String(p).replace(/^\/+/, '')));
const safeJson = (v) => { try { return JSON.parse(v || '[]'); } catch { return []; } };

// Extract topbar/footer from bundle
function extractTopbarFooter() {
  const t = Date.now();
  const bundle = read('js/app.bundle.js');
  const mTop = bundle.match(/const\s+topbarHTML\s*=\s*`([\s\S]*?)`;/);
  const mFoot= bundle.match(/const\s+footerHTML\s*=\s*`([\s\S]*?)`;/);
  if (!mTop || !mFoot) throw new Error('Could not extract topbarHTML/footerHTML from js/app.bundle.js');
  log('nav extracted in', (Date.now()-t)+'ms');
  return { topbarHTML: mTop[1], footerHTML: mFoot[1] };
}

// HEAD builder
function buildHead(slug, p) {
  const title = p.name || p.nome || slug;
  const descr = p.shortdesc || p.descricao || `Compra ${title} personalizada na GráficaPT.`;
  const keywords = asArray(p.metawords).join(', ');
  const images = Array.isArray(p.images) ? p.images : safeJson(p.images);
  const og = mkUrl((images && images[0]) || p.og_image || '');
  const canonical = `${BASE_URL}/produto/${encodeURIComponent(slug)}`;

  return `
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | GráficaPT</title>
<link rel="canonical" href="${canonical}">
<meta name="description" content="${esc(descr)}">
${keywords ? `<meta name="keywords" content="${esc(keywords)}">` : ''}
<meta name="robots" content="index, follow">
<meta property="og:title" content="${esc(title)} | GráficaPT">
<meta property="og:description" content="${esc(descr)}">
${og ? `<meta property="og:image" content="${esc(og)}">` : ''}
<meta property="og:type" content="product">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/imagens/logo.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=League+Spartan&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/index.css">
<link rel="stylesheet" href="/css/product.css">`.trim();
}

// Components (EXACT classes)

function criarCarrosselHTML(slug, imagens) {
  const imgs = (imagens || []).map(mkUrl).filter(Boolean);
  if (!imgs.length) return '';
  return `
<div class="carrossel-container">
  <button class="carrossel-btn prev" onclick="mudarImagem(-1)" aria-label="Anterior">&#10094;</button>
  <div class="carrossel-imagens-wrapper">
    <div class="carrossel-imagens" id="carrossel">
      ${imgs.map((src, i)=>`<img src="${esc(src)}" alt="Imagem ${i+1}" class="carrossel-img">`).join('')}
    </div>
  </div>
  <button class="carrossel-btn next" onclick="mudarImagem(1)" aria-label="Seguinte">&#10095;</button>
</div>
<div class="indicadores" id="indicadores"></div>`;
}

function renderOption(opt={}, index=0) {
  const tipo = String(opt?.tipo || '').toLowerCase();
  const label = esc(opt?.label || `${index+1}:`);
  const valores = Array.isArray(opt?.valores) ? opt.valores : [];

  const labelRow = `<div class="overcell"><label>${label}:</label></div>`;

  if (tipo === 'select') {
    const inputHTML = `<select name="${label}" required>
      ${valores.map((v,i)=>`<option value="${esc(v)}"${i===0?' selected':''}>${esc(v)}</option>`).join('')}
    </select>`;
    return `<div class="option-group">${labelRow}<div class="overcell">${inputHTML}</div></div>`;
  }
  if (tipo === 'number') {
    const inputHTML = `<input type="number" name="${label}" min="1" value="1" required>`;
    return `<div class="option-group">${labelRow}<div class="overcell">${inputHTML}</div></div>`;
  }
  if (tipo === 'cores') {
    const cores = valores.map((item, idx) => {
      let title='', colorStyle='', imgAssoc='';
      if (typeof item === 'object') {
        title = item.nome || '';
        colorStyle = item.cor || '';
        imgAssoc = item.imagem || '';
      } else { title = item; colorStyle = item; }
      const tLower = String(title).toLowerCase();
      if (tLower === 'multicolor' || tLower === 'multicor') {
        colorStyle = 'linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet)';
        title = 'Multicor';
      }
      const id = `${label.replace(/\s+/g,'-').toLowerCase()}-color-${idx}`;
      return `
        <div class="overcell">
          <input type="radio" id="${esc(id)}" name="${label}" value="${esc(title)}"${idx===0?' checked':''} required>
          <label class="color-circle" for="${esc(id)}" title="${esc(title)}" style="background:${esc(colorStyle)}"
            ${imgAssoc ? `onclick="selecionarCorEImagem('${esc(imgAssoc)}')"` : ''}></label>
        </div>`;
    }).join('');
    return `<div class="option-group">${labelRow}<div class="overcell"><div class="color-options">${cores}</div></div></div>`;
  }
  if (tipo === 'imagem-radio') {
    const blocks = valores.map((item, idx) => {
      const posID = `${label.replace(/\s+/g,'-').toLowerCase()}-pos-${idx}`;
      const nome = esc(item?.nome || '');
      const imgSrc = item?.imagem ? mkUrl(item.imagem) : '';
      return `
        <div class="overcell">
          <input type="radio" id="${esc(posID)}" name="${label}" value="${nome}"${idx===0?' checked':''} required>
          <label class="posicionamento-label" for="${esc(posID)}">
            <div class="posicionamento-img-wrapper">
              <img class="posicionamento-img" src="${esc(imgSrc)}" alt="${nome}" title="${nome}">
              <span class="posicionamento-nome">${nome}</span>
            </div>
          </label>
        </div>`;
    }).join('');
    return `<div class="option-group">${labelRow}<div class="overcell"><div class="posicionamento-options">${blocks}</div></div></div>`;
  }
  if (tipo === 'quantidade-por-tamanho') {
    const grid = valores.map((t) => {
      const id = `tamanho-${t}`;
      return `
        <div class="tamanho-input">
          <label for="${esc(id)}">${esc(t)}:</label>
          <input type="number" id="${esc(id)}" name="Tamanho - ${esc(t)}" min="0" value="0">
        </div>`;
    }).join('');
    return `<div class="option-group">${labelRow}<div class="overcell"><div class="quantidades-tamanhos">${grid}</div></div></div>`;
  }
  return `<div class="option-group">${labelRow}<div class="overcell"></div></div>`;
}

function createStaticFields() {
  return `
  <div class="options-row">
    <div class="form-group">
      <div class="overcell">
        <label for="detalhes">Detalhes:</label>
        <textarea name="Detalhes" placeholder="Descreve todas as informações sobre como queres o design e atenções extras!" required></textarea>
      </div>
    </div>
  </div>

  <div class="options-row">
    <div class="form-group">
      <div class="overcell">
        <label for="empresa">Empresa / Nome:</label>
        <input type="text" name="Empresa" placeholder="Empresa ou Nome" required>
      </div>
    </div>
    <div class="form-group">
      <div class="overcell">
        <label for="ficheiro">(Opcional) Logotipo:</label>
        <input type="file" id="ficheiro" name="Ficheiro">
        <input type="hidden" name="Logotipo" id="link_ficheiro">
        <p id="uploadStatus" style="display:none"></p>
      </div>
    </div>
  </div>

  <div class="options-row">
    <div class="form-group">
      <div class="overcell">
        <label for="email">Email:</label>
        <input type="email" name="Email" placeholder="o.teu@email.com" required>
      </div>
    </div>
    <div class="form-group">
      <div class="overcell">
        <label for="telemovel">Telemóvel:</label>
        <input type="tel" name="Telemóvel" placeholder="+351 ..." required>
      </div>
    </div>
  </div>

  <input type="hidden" name="_captcha" value="false">
  <input type="hidden" name="_next" value="https://graficapt.com">

  <button id="submit" type="submit">Pedir Orçamento</button>
  `;
}

function inlineCarouselScript() {
  return `<script>
  (function(){
    window.imagemAtual = window.imagemAtual ?? 0;
    function atualizarIndicadores(){
      const dots = document.querySelectorAll('.indicador');
      dots.forEach((d,i)=>d.classList.toggle('ativo', i===window.imagemAtual));
    }
    window.irParaImagem = function(i){
      const imgs = document.querySelectorAll('.carrossel-img');
      const wrap = document.querySelector('.carrossel-imagens');
      if (!imgs.length || !wrap) return;
      window.imagemAtual = (i + imgs.length) % imgs.length;
      wrap.style.transform = 'translateX(' + (-window.imagemAtual * 100) + '%)';
      atualizarIndicadores();
    };
    window.mudarImagem = function(delta){ window.irParaImagem((window.imagemAtual||0) + (delta||1)); };
    window.selecionarCorEImagem = function(imgPath){
      if (!imgPath) return;
      const imgs = Array.from(document.querySelectorAll('.carrossel-img'));
      const idx = imgs.findIndex(img => img.src.endsWith(imgPath) || img.src.includes(imgPath));
      if (idx>=0) window.irParaImagem(idx);
    };
    const ind = document.getElementById('indicadores');
    const imgs = document.querySelectorAll('.carrossel-img');
    if (ind && imgs.length) {
      ind.innerHTML = '';
      imgs.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = 'indicador' + (idx===0 ? ' ativo' : '');
        dot.addEventListener('click', ()=>window.irParaImagem(idx));
        ind.appendChild(dot);
      });
    }
    window.irParaImagem(window.imagemAtual||0);
  })();
  </script>`;
}

function inlineFormGuardScript() {
  return `<script>
  (function(){
    if (!window.__FORMSENDER_GUARD__) {
      window.__FORMSENDER_GUARD__ = true;
      const f = document.getElementById('orcamentoForm');
      if (f) {
        f.addEventListener('submit', function(e){
          // Só bloqueia se o formSender não estiver carregado (evita página em branco)
          if (!window.formSenderInitialized) {
            e.preventDefault();
            alert('Não foi possível enviar agora. Verifica a ligação e tenta novamente.');
          }
        }, { capture: true });
      }
    }
  })();
  </script>`;
}

function renderPage(slug, p, topbarHTML, footerHTML) {
  const head = buildHead(slug, p);
  const images = Array.isArray(p.images) ? p.images : safeJson(p.images);
  let opcoes = [];
  if (Array.isArray(p.opcoes)) opcoes = p.opcoes;
  else if (p.opcoes && typeof p.opcoes === 'object') opcoes = Object.entries(p.opcoes).map(([label,op])=>({label, ...(op||{})}));

  const carouselHTML = images && images.length ? `<div class="product-image">${criarCarrosselHTML(slug, images)}</div>` : '';
  const optionsHTML = (opcoes||[]).map((opt,i)=>renderOption(opt,i)).join('');
  const staticFields = createStaticFields();

  const body = `
<div class="topbar" id="topbar">
${topbarHTML}
</div>

<div class="productcontainer" id="produto-dinamico">
  ${carouselHTML}
  <form class="product" id="orcamentoForm" method="POST" enctype="multipart/form-data">
    <input type="text" class="productname" id="productname" name="Produto" value="${esc(p.name || p.nome || slug)}">
    <div class="product-details">
      <h1>${esc(p.name || p.nome || slug)}</h1>
      ${optionsHTML}
      ${staticFields}
    </div>
  </form>
</div>

<footer class="footer" id="footer">
${footerHTML}
</footer>

<!-- ENV must load BEFORE formSender.js -->
<script src="/js/env.js"></script>
${inlineCarouselScript()}
<script src="/js/formSender.js" defer></script>
${inlineFormGuardScript()}
`;

  return `<!DOCTYPE html>
<html lang="pt">
<head>
${head}
</head>
<body>
${body}
</body>
</html>`;
}

// MAIN
async function main() {
  log('start', new Date().toISOString());
  const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const tFetch = Date.now();
  const { data: products, error } = await supa.from('products').select('*');
  if (error) { console.error(error); process.exit(1); }
  log('fetched products:', products?.length ?? 0, 'in', (Date.now()-tFetch)+'ms');

  const { topbarHTML, footerHTML } = extractTopbarFooter();

  ensureDir(OUT_ROOT);
  let count = 0;
  const tGen = Date.now();
  for (const p of products) {
    const t1 = Date.now();
    const slug = p.slug || p.Slug || p.name || p.nome;
    if (!slug) continue;
    const html = renderPage(slug, p, topbarHTML, footerHTML);
    const dir = path.join(OUT_ROOT, slug);
    ensureDir(dir);
    writeFileAtomic(path.join(dir, 'index.html'), html);
    count++;
    log('wrote', `/produto/${slug}/index.html`, 'in', (Date.now()-t1)+'ms');
  }
  log('generated all pages in', (Date.now()-tGen)+'ms');
  console.log(`✅ Built ${count} product pages (FULL STATIC)`);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
