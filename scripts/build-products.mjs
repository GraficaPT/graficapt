import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';


const log = (...a) => console.log('[build-products]', ...a);

// ---------- ENV ----------
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

// ---------- IO HELPERS ----------
const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
const writeFileAtomic = (filePath, content) => {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, content, 'utf-8');
  fs.renameSync(tmp, filePath);
};
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf-8');

// ---------- UTILS ----------
const esc = (s='') => String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const asArray = (v) => Array.isArray(v) ? v : (v ? String(v).split(',').map(x=>x.trim()).filter(Boolean) : []);
const safeJson = (v) => { try { return JSON.parse(v || '[]'); } catch { return []; } };

const slugify = (s='') => {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .replace(/--+/g,'-');
};

// ---------- NAV/FOOTER FROM BUNDLE ----------
function extractTopbarFooter() {
  const t = Date.now();
  const bundle = read('js/app.bundle.js');
  const mTop   = bundle.match(/const\s+topbarHTML\s*=\s*`([\s\S]*?)`;/);
  const mFoot  = bundle.match(/const\s+footerHTML\s*=\s*`([\s\S]*?)`;/);
  if (!mTop || !mFoot) throw new Error('Could not extract topbarHTML/footerHTML from js/app.bundle.js');
  log('nav extracted in', (Date.now()-t)+'ms');
  return { topbarHTML: mTop[1], footerHTML: mFoot[1] };
}

// ---------- HEAD BUILDERS ----------

// ---------- FAQ BUILDERS ----------
function buildFaqJsonLd(faqItems) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": (faqItems||[]).map(it => ({
      "@type": "Question",
      "name": it.q,
      "acceptedAnswer": { "@type": "Answer", "text": it.a }
    }))
  };
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

function defaultFaqForProduct(name='Produto') {
  const n = String(name||'Produto');
  return [
    { q: `Qual é o prazo de produção do ${n}?`,
      a: "Normalmente 3–5 dias úteis após confirmação de arte final. Prazos urgentes podem ser possíveis mediante disponibilidade." },
    { q: "A arte/maquete está incluída?",
      a: "Sim, ajustamos o teu logotipo e texto básico sem custos. Trabalhos de design avançado podem ter orçamento adicional." },
    { q: "Que ficheiros aceitam?",
      a: "PDF, AI, SVG ou PNG/JPG de alta resolução. Se possível, envia em CMYK e com fontes convertidas em curvas." },
    { q: "Posso imprimir frente e verso?",
      a: "Sim. Se aplicável ao produto, adiciona essa informação nos detalhes do pedido." },
    { q: "Como é o envio e prazos de entrega?",
      a: "Expedimos por transportadora para todo o país. Após produção, a entrega habitual é 24–48h (dias úteis)." }
  ];
}

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
    `  <div class="faq__list">`,
    items,
    '  </div>',
    '</section>'
  ].join('\n');
}
function buildHead(baseUrl, title, descr, keywords, og) {
  return [
    '<meta charset="utf-8">',
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${esc(title)}</title>`,
    `<link rel="canonical" href="${esc(baseUrl)}">`,
    `<meta name="description" content="${esc(descr)}">`,
    keywords ? `<meta name="keywords" content="${esc(keywords)}">` : '',
    '<meta name="robots" content="index, follow">',
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(descr)}">`,
    og ? `<meta property="og:image" content="${esc(og)}">` : '',
    '<meta property="og:type" content="product">',
    `<meta property="og:url" content="${esc(baseUrl)}">`,
    og ? '<meta property="og:image:width" content="1200">' : '',
    og ? '<meta property="og:image:height" content="630">' : '',
    og ? `<link rel="preload" as="image" href="${esc(og)}" fetchpriority="high">` : '',
    '<meta name="twitter:card" content="summary_large_image">',
    '<link rel="icon" href="https://graficapt.com/imagens/logo.ico">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=League+Spartan&display=swap" rel="stylesheet">',
    '<link rel="stylesheet" href="/css/index.css">',
    '<link rel="stylesheet" href="/css/product.css">'
  ].filter(Boolean).join('\n');
}

function buildHeadHome() {
  const url = `${BASE_URL}/`;
  return [
    '<meta charset="utf-8">',
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>GráficaPT — Produtos Personalizáveis</title>',
    `<link rel="canonical" href="${esc(url)}">`,
    '<meta name="description" content="Impressão e personalização: bandeiras, sacos, rígidos, vestuário e muito mais. Pede orçamento grátis!">',
    '<meta name="robots" content="index, follow">',
    '<meta property="og:title" content="GráficaPT — Produtos Personalizáveis">',
    '<meta property="og:description" content="Impressão e personalização: bandeiras, sacos, rígidos, vestuário e muito mais.">',
    '<meta property="og:type" content="website">',
    `<meta property="og:url" content="${esc(url)}">`,
    '<link rel="icon" href="/imagens/logo.ico">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=League+Spartan&display=swap" rel="stylesheet">',
    '<link rel="stylesheet" href="/css/index.css">'
  ].join('\n');
}

// ---------- OPTION HELPERS ----------
function getSizeGroups(opcoes){
  let opts = [];
  if (!opcoes) return [];
  if (Array.isArray(opcoes)) opts = opcoes;
  else if (typeof opcoes === 'object') opts = Object.entries(opcoes).map(([label, op]) => ({ label, ...(op || {}) }));
  const groups = [];
  for (const op of opts) {
    const label = String(op?.label || '').trim();
    const norm  = label.toLowerCase();
    if (!/^(tamanho|tam|size)\b/.test(norm)) continue;
    const valores = Array.isArray(op?.valores) ? op.valores : [];
    const names = valores.map(v => (v && typeof v === 'object') ? (v.nome || v.name || v.label || '') : String(v || '')).filter(Boolean);
    if (names.length) groups.push({ label, values: names });
  }
  return groups;
}

// ---------- RELATED HELPERS (replica do teu front) ----------
function joinPublicPath(prefix, pth) {
  const parts = String(pth).split('/').filter(Boolean).map(encodeURIComponent);
  return prefix + parts.join('/');
}
function resolveImagePath(slug, raw, STORAGE_PUBLIC_ARG) {
  const base = STORAGE_PUBLIC_ARG || STORAGE_PUBLIC;
  if (!raw || typeof raw !== 'string') return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.includes('/')) return joinPublicPath(base, s);
  return joinPublicPath(base, `${slug}/${s}`);
}
function relatedImageUrl(prod, STORAGE_PUBLIC_ARG) {
  const slug = prod.slug || prod.Slug || prod.name || prod.nome || '';
  if (Array.isArray(prod.images) && prod.images[0]) {
    const u = resolveImagePath(slug, prod.images[0], STORAGE_PUBLIC_ARG);
    if (u) return u;
  }
  if (prod.banner) {
    const u = resolveImagePath(slug, prod.banner, STORAGE_PUBLIC_ARG);
    if (u) return u;
  }
  return 'https://placehold.co/800x600?text=Produto';
}
function renderRelated(current, allProducts){
  const currentSlug = (current.slug || current.Slug || current.name || current.nome);
  const cat = String(current.category || current.categoria || '').toLowerCase();
  if (!cat) return '';

  const rel = (allProducts || [])
    .filter(p => (p.slug || p.Slug || p.name || p.nome) !== currentSlug)
    .filter(p => String(p.category || p.categoria || '').toLowerCase() === cat)
    .sort((a,b)=> (b.id||0) - (a.id||0))
    .slice(0,4);

  if (!rel.length) return '';

  const cards = rel.map(p => {
    const slug = p.slug || p.Slug || p.name || p.nome;
    const name = p.name || p.nome || slug;
    const img = relatedImageUrl({ ...p, slug }, STORAGE_PUBLIC);
    return [
      `<a class="related__card" href="${BASE_URL}/produto/${esc(slug)}" aria-label="${esc(name)}">`,
      '  <div class="related__thumbwrap">',
      `    <img class="related__thumb" src="${esc(img)}" alt="${esc(name)}" loading="lazy">`,
      '  </div>',
      '  <div class="related__body">',
      `    <h3 class="related__title">${esc(name)}</h3>`,
      '  </div>',
      '</a>'
    ].join('\n');
  }).join('\n');

  return [
    '<section id="related-products" class="related">',
    '  <div class="related__head">',
    '    <h2>Produtos relacionados</h2>',
    '  </div>',
    '  <div id="related-grid" class="related__grid">',
         cards,
    '  </div>',
    '</section>'
  ].join('\n');
}

// ---------- HOMEPAGE ----------
function renderCard(p){
  const slug = p.slug || p.Slug || p.name || p.nome;
  const nome = p.name || p.nome || slug;
  const cat  = (p.category || p.categoria || '').toLowerCase();
  const tags = asArray(p.tags || p.metawords).join(',');
  const images = Array.isArray(p.images) ? p.images : safeJson(p.images);
  const img = resolveImagePath(slug, images[0] || '', STORAGE_PUBLIC);
  const href = `${BASE_URL}/produto/${encodeURIComponent(slug)}`;

  const parts = [];
  parts.push(`<a class="cell" href="${esc(href)}" data-categoria="${esc(cat)}" data-nome="${esc(nome)}" data-item data-tags="${esc(tags)}">`);
  if (img) parts.push(`  <img src="${esc(img)}" alt="${esc(nome)}">`);
  parts.push(`  <div class="cellText">${esc(nome)}</div>`);
  parts.push('  <div class="cellBtn">Ver Opções</div>');
  parts.push('</a>');
  return parts.join('\n');
}


const bannerHTML = `
<div class="banner hcenter">
  <img class="banner-left" src="imagens/banner/bandeirasbanner.webp" alt="Bandeiras promocionais" loading="lazy" data-href="${BASE_URL}/produto/bandeiravela">
  <div class="banner-right">
    <img src="imagens/banner/tshirtbanner.webp" alt="T-shirt personalizada" loading="lazy" data-href="${BASE_URL}/produto/tshirtregent">
    <img src="imagens/banner/sacoskraftbanner.webp" alt="Saco kraft personalizado" loading="lazy" data-href="${BASE_URL}/produto/sacoskraft">
  </div>
</div>`;


function renderHome(topbarHTML, footerHTML, products) {
  const head = buildHeadHome();
  const cards = [...products]
    .sort((a,b)=>String(a.name||a.nome).localeCompare(String(b.name||b.nome)))
    .map(renderCard).join('\n');

  const cats = Array.from(new Set((products||[]).map(p => String(p.category || p.categoria || '').toLowerCase()).filter(Boolean))).sort();
  const catOptions = ['<option value="all">Todas</option>'].concat(cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`)).join('');

  const body = [
    '<div class="topbar" id="topbar">',
    topbarHTML,
    '</div>',
    '',
    bannerHTML,
    '',
    '<script>',
    "document.querySelectorAll('.banner img[data-href]').forEach(el=>{el.style.cursor='pointer';el.addEventListener('click',()=>location.href=el.dataset.href);});",
    '</script>',
    '' ,
    '<div id="products">',
    '  <a class="subtitle hcenter">Produtos Personalizáveis</a>',
    '  <div class="filter-sort">',
    '    <select id="filterCategory" onchange="location.hash = &quot;filter=&quot; + this.value">',
         catOptions,
    '    </select>',
    '    <select id="sortBy" onchange="applyFilters()">',
    '      <option value="default">Ordenar por</option>',
    '      <option value="az">Nome A-Z</option>',
    '      <option value="za">Nome Z-A</option>',
    '    </select>',
    '  </div>',
    '  <div id="products-grid" class="products-grid">',
         cards,
    '  </div>',
    '</div>',
    '',
    '<a class="overtitle hcenter">Não encontras o que precisas?</a>',
    '<form id="orcamentoForm" enctype="multipart/form-data" class="invoce hcenter">',
    '  <input required placeholder="Nome" type="text" name="name" class="name">',
    '  <input required placeholder="Email" type="email" name="email" class="email">',
    '  <input required placeholder="Telefone" type="text" name="phone" class="phone">',
    '  <input placeholder="Empresa" type="text" name="company" class="company">',
    '  <textarea required rows="5" placeholder="Descreve que produto procuras assim como qualquer outro detalhe relevante!" name="description" class="description"></textarea>',
    '  <input type="hidden" name="_captcha" value="false">',
    '  <input type="hidden" name="_next" value="https://graficapt.com">',
    '  <button type="submit" id="submit">ENVIAR</button>',
    '</form>',
    '',
    '<footer class="footer" id="footer">',
    footerHTML,
    '</footer>',
    '',
    '<script src="/js/env.js"></script>',
    '<script>',
    '(function(){',
    '  const grid = document.getElementById("products-grid");',
    '  const selCat = document.getElementById("filterCategory");',
    '  const selSort = document.getElementById("sortBy");',
    '  if (!grid) return;',
    '  function filterBy(cat){',
    '    const items = Array.from(grid.querySelectorAll(".cell"));',
    '    items.forEach(it => {',
    '      const ok = !cat || cat === "all" || it.dataset.categoria === cat;',
    '      it.style.display = ok ? "" : "none";',
    '    });',
    '  }',
    '  window.applyFilters = function(){',
    '    const dir = (selSort && selSort.value === "za") ? -1 : 1;',
    '    const items = Array.from(grid.querySelectorAll(".cell"));',
    '    items.sort((a,b)=> a.dataset.nome.localeCompare(b.dataset.nome) * dir);',
    '    items.forEach(it => grid.appendChild(it));',
    '    const cat = selCat ? selCat.value : "all";',
    '    filterBy(cat);',
    '  };',
    '  function readHash(){',
    '    const m = location.hash.match(/filter=([^&]+)/i);',
    '    return m ? decodeURIComponent(m[1]) : "all";',
    '  }',
    '  function init(){',
    '    const current = readHash();',
    '    if (selCat) selCat.value = current;',
    '    filterBy(current);',
    '  }',
    '  window.addEventListener("hashchange", init);',
    '  init();',
    '})();',
    '</script>',
    '<script src="/js/formSender.js" defer></script>'
  ].join('\n');

  return [
    '<!DOCTYPE html>',
    '<html lang="pt">',
    '<head>',
    head,
    '</head>',
    '<body>',
    body,
    '</body>',
    '</html>'
  ].join('\n');
}

// ---------- PRODUCT PAGE PARTS ----------
function criarCarrosselHTML(slug, imagens) {
  const imgs = (imagens || []).map(u => resolveImagePath(slug, u, STORAGE_PUBLIC)).filter(Boolean);
  if (!imgs.length) return '';
  return [
    '<div class="carrossel-container">',
    '  <button class="carrossel-btn prev" onclick="mudarImagem(-1)" aria-label="Anterior">&#10094;</button>',
    '  <div class="carrossel-imagens-wrapper">',
    '    <div class="carrossel-imagens" id="carrossel">',
         imgs.map((src, i)=>`      <img src="${esc(src)}" alt="Imagem ${i+1}" class="carrossel-img">`).join('\n'),
    '    </div>',
    '  </div>',
    '  <button class="carrossel-btn next" onclick="mudarImagem(1)" aria-label="Seguinte">&#10095;</button>',
    '</div>',
    '<div class="indicadores" id="indicadores"></div>'
  ].join('\n');
}

function renderOption(opt={}, index=0, preselect={}) {
  const tipoRaw = opt?.tipo || '';
  const tipo = String(tipoRaw).toLowerCase();
  const labelRaw = opt?.label || `${index+1}:`;
  const label = esc(labelRaw);
  const valores = Array.isArray(opt?.valores) ? opt.valores : [];
  const wanted = (preselect[labelRaw?.toLowerCase?.() || ''] || '').toLowerCase();

  const labelRow = `<div class="overcell"><label>${label}:</label></div>`;

  if (tipo === 'select') {
    const inputHTML = `<select name="${label}" required>
${valores.map((v,i)=>{
  const val = typeof v === 'object' ? (v.nome || v.name || v.label || '') : String(v||'');
  const sel = (val.toLowerCase() === wanted) ? ' selected' : (i===0 ? ' selected' : '');
  return `        <option value="${esc(val)}"${sel}>${esc(val)}</option>`;
}).join('\n')}
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
      const checked = (title.toLowerCase() === wanted) || (idx===0 && !wanted) ? ' checked' : '';
      return [
        '        <div class="overcell">',
        `          <input type="radio" id="${esc(id)}" name="${label}" value="${esc(title)}"${checked} required>`,
        `          <label class="color-circle" for="${esc(id)}" title="${esc(title)}" style="background:${esc(colorStyle)}"${imgAssoc ? ` onclick="selecionarCorEImagem('${esc(imgAssoc)}')"` : ''}></label>`,
        '        </div>'
      ].join('\n');
    }).join('\n');
    return `<div class="option-group">${labelRow}<div class="overcell"><div class="color-options">\n${cores}\n</div></div></div>`;
  }
  if (tipo === 'imagem-radio') {
    const blocks = valores.map((item, idx) => {
      const posID = `${label.replace(/\s+/g,'-').toLowerCase()}-pos-${idx}`;
      const nome = esc(item?.nome || '');
      const imgSrc = item?.imagem ? resolveImagePath('', item.imagem, STORAGE_PUBLIC) : '';
      const checked = (String(item?.nome || '').toLowerCase() === wanted) || (idx===0 && !wanted) ? ' checked' : '';
      return [
        '        <div class="overcell">',
        `          <input type="radio" id="${esc(posID)}" name="${label}" value="${nome}"${checked} required>`,
        `          <label class="posicionamento-label" for="${esc(posID)}">`,
        '            <div class="posicionamento-img-wrapper">',
        `              <img class="posicionamento-img" src="${esc(imgSrc)}" alt="${nome}" title="${nome}">`,
        `              <span class="posicionamento-nome">${nome}</span>`,
        '            </div>',
        '          </label>',
        '        </div>'
      ].join('\n');
    }).join('\n');
    return `<div class="option-group">${labelRow}<div class="overcell"><div class="posicionamento-options">\n${blocks}\n</div></div></div>`;
  }
  if (tipo === 'quantidade-por-tamanho') {
    const grid = valores.map((t) => {
      const id = `tamanho-${t}`;
      return [
        '        <div class="tamanho-input">',
        `          <label for="${esc(id)}">${esc(t)}:</label>`,
        `          <input type="number" id="${esc(id)}" name="Tamanho - ${esc(t)}" min="0" value="0">`,
        '        </div>'
      ].join('\n');
    }).join('\n');
    return `<div class="option-group">${labelRow}<div class="overcell"><div class="quantidades-tamanhos">\n${grid}\n</div></div></div>`;
  }
  return `<div class="option-group">${labelRow}<div class="overcell"></div></div>`;
}

function createStaticFields() {
  return [
    '  <div class="options-row">',
    '    <div class="form-group">',
    '      <div class="overcell">',
    '        <label for="detalhes">Detalhes:</label>',
    '        <textarea name="Detalhes" placeholder="Descreve todas as informações sobre como queres o design e atenções extras!" required></textarea>',
    '      </div>',
    '    </div>',
    '  </div>',
    '',
    '  <div class="options-row">',
    '    <div class="form-group">',
    '      <div class="overcell">',
    '        <label for="empresa">Empresa / Nome:</label>',
    '        <input type="text" name="Empresa" placeholder="Empresa ou Nome" required>',
    '      </div>',
    '    </div>',
    '    <div class="form-group">',
    '      <div class="overcell">',
    '        <label for="ficheiro">(Opcional) Logotipo:</label>',
    '        <input type="file" id="ficheiro" name="Ficheiro">',
    '        <input type="hidden" name="Logotipo" id="link_ficheiro">',
    '        <p id="uploadStatus" style="display:none"></p>',
    '      </div>',
    '    </div>',
    '  </div>',
    '',
    '  <div class="options-row">',
    '    <div class="form-group">',
    '      <div class="overcell">',
    '        <label for="email">Email:</label>',
    '        <input type="email" name="Email" placeholder="o.teu@email.com" required>',
    '      </div>',
    '    </div>',
    '    <div class="form-group">',
    '      <div class="overcell">',
    '        <label for="telemovel">Telemóvel:</label>',
    '        <input type="tel" name="Telemóvel" placeholder="+351 ..." required>',
    '      </div>',
    '    </div>',
    '  </div>',
    '',
    '  <input type="hidden" name="_captcha" value="false">',
    '  <input type="hidden" name="_next" value="https://graficapt.com">',
    '',
    '  <button id="submit" type="submit">Pedir Orçamento</button>'
  ].join('\n');
}

function inlineCarouselScript() {
  return [
    '<script>',
    '(function(){',
    '  window.imagemAtual = window.imagemAtual ?? 0;',
    '  function atualizarIndicadores(){',
    '    const dots = document.querySelectorAll(\'.indicador\');',
    '    dots.forEach((d,i)=>d.classList.toggle(\'ativo\', i===window.imagemAtual));',
    '  }',
    '  window.irParaImagem = function(i){',
    '    const imgs = document.querySelectorAll(\'.carrossel-img\');',
    '    const wrap = document.querySelector(\'.carrossel-imagens\');',
    '    if (!imgs.length || !wrap) return;',
    '    window.imagemAtual = (i + imgs.length) % imgs.length;',
    '    wrap.style.transform = \'translateX(\' + (-window.imagemAtual * 100) + \'%)\';',
    '    atualizarIndicadores();',
    '  };',
    '  window.mudarImagem = function(delta){ window.irParaImagem((window.imagemAtual||0) + (delta||1)); };',
    '  window.selecionarCorEImagem = function(imgPath){',
    '    if (!imgPath) return;',
    '    const imgs = Array.from(document.querySelectorAll(\'.carrossel-img\'));',
    '    const idx = imgs.findIndex(img => img.src.endsWith(imgPath) || img.src.includes(imgPath));',
    '    if (idx>=0) window.irParaImagem(idx);',
    '  };',
    '  const ind = document.getElementById(\'indicadores\');',
    '  const imgs = document.querySelectorAll(\'.carrossel-img\');',
    '  if (ind && imgs.length) {',
    '    ind.innerHTML = \'\';',
    '    imgs.forEach((_, idx) => {',
    '      const dot = document.createElement(\'div\');',
    '      dot.className = \'indicador\' + (idx===0 ? \' ativo\' : \'\');',
    '      dot.addEventListener(\'click\', ()=>window.irParaImagem(idx));',
    '      ind.appendChild(dot);',
    '    });',
    '  }',
    '  window.irParaImagem(window.imagemAtual||0);',
    '})();',
    '</script>'
  ].join('\n');
}

function inlineFormGuardScript() {
  return [
    '<script>',
    '(function(){',
    '  if (!window.__FORMSENDER_GUARD__) {',
    '    window.__FORMSENDER_GUARD__ = true;',
    '    const f = document.getElementById(\'orcamentoForm\');',
    '    if (f) {',
    '      f.addEventListener(\'submit\', function(e){',
    '        if (!window.formSenderInitialized) {',
    '          e.preventDefault();',
    '          alert(\'Não foi possível enviar agora. Verifica a ligação e tenta novamente.\');',
    '        }',
    '      }, { capture: true });',
    '    }',
    '  }',
    '})();',
    '</script>'
  ].join('\n');
}

function variantLinksHTML(slug, name, sizeGroups){
  if (!sizeGroups || !sizeGroups.length) return '';
  const links = [];
  for (const grp of sizeGroups) {
    for (const val of grp.values) {
      const vs = slugify(val);
      links.push(`<a class="variant-link" href="/produto/${esc(slug)}/${esc(vs)}">${esc(name)} — ${esc(val)}</a>`);
    }
  }
  return `<nav class="variant-links">${links.join('')}</nav>`;
}

// ---------- PRODUCT PAGE RENDER ----------
function renderProductPage(p, topbarHTML, footerHTML, allProducts, variant=null) {
  const slug = p.slug || p.Slug || p.name || p.nome;
  const baseName = p.name || p.nome || slug;
  const images = Array.isArray(p.images) ? p.images : safeJson(p.images);
  const og = resolveImagePath(slug, (images && images[0]) || p.og_image || '', STORAGE_PUBLIC);
  const keywords = asArray(p.metawords).join(', ');
  const sizeGroups = getSizeGroups(p.opcoes);

  // variant handling: keep H1/display name constant, use SEO title with size
  let displayName = baseName;
  let seoTitle = `${baseName} | GráficaPT`;
  let descr = p.shortdesc || p.descricao || `Compra ${baseName} personalizada na GráficaPT.`;
  let url = `${BASE_URL}/produto/${encodeURIComponent(slug)}`;
  let preselect = {};
  if (variant && variant.value) {
    seoTitle = `${baseName} — ${variant.value} | GráficaPT`;
    descr = `${baseName} no tamanho ${variant.value}. Personaliza e pede orçamento em segundos.`;
    url = `${BASE_URL}/produto/${encodeURIComponent(slug)}/${slugify(variant.value)}`;
    preselect = { [String(variant.label || '').toLowerCase()]: String(variant.value || '') };
  }

  const head = buildHead(url, seoTitle, descr, keywords, og);

  const carouselHTML = (images && images.length)
    ? ['<div class="product-image">', criarCarrosselHTML(slug, images), '</div>'].join('\n')
    : '';

  const optionsArr = [];
  if (Array.isArray(p.opcoes)) optionsArr.push(...p.opcoes);
  else if (p.opcoes && typeof p.opcoes === 'object') optionsArr.push(...Object.entries(p.opcoes).map(([label,op])=>({label, ...(op||{})})));

  const optionsHTML = (optionsArr||[]).map((opt,i)=>renderOption(opt,i,preselect)).join('\n');
  const staticFields = createStaticFields();

  const variantsNav = (!variant && sizeGroups.length) ? variantLinksHTML(slug, baseName, sizeGroups) : '';

  const body = [
    '<div class="topbar" id="topbar">',
    topbarHTML,
    '</div>',
    '',
    '<div class="productcontainer" id="produto-dinamico">',
    `  ${carouselHTML}`,
    '  <form class="product" id="orcamentoForm" method="POST" enctype="multipart/form-data">',
    `    <input type="text" class="productname" id="productname" name="Produto" value="${esc(displayName)}">`,
    '    <div class="product-details">',
    `      <h1>${esc(displayName)}</h1>`,
    `      ${optionsHTML}`,
    `      ${staticFields}`,
    '    </div>',
    '  </form>',
    variantsNav,
    renderRelated(p, allProducts),
    '</div>',
    '',
    '<footer class="footer" id="footer">',
    footerHTML,
    '</footer>',
    '',
    '<script src="/js/env.js"></script>',
    inlineCarouselScript(),
    '<script src="/js/formSender.js" defer></script>',
    inlineFormGuardScript()
  ].join('\n');

  return [
    '<!DOCTYPE html>',
    '<html lang="pt">',
    '<head>',
    head,
    '</head>',
    '<body>',
    body,
    '</body>',
    '</html>'
  ].join('\n');
}

// ---------- MAIN ----------
async function main() {
  log('start', new Date().toISOString());
  const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const tFetch = Date.now();
  const { data: products, error } = await supa.from('products').select('*');
  if (error) { console.error(error); process.exit(1); }
  log('fetched products:', products?.length ?? 0, 'in', (Date.now()-tFetch)+'ms');

  const { topbarHTML, footerHTML } = extractTopbarFooter();

  // Build product pages + variants
  ensureDir(OUT_ROOT);
  let count = 0, vcount = 0;
  const tGen = Date.now();
  for (const p of products) {
    const slug = p.slug || p.Slug || p.name || p.nome;
    if (!slug) continue;

    // base page
    {
      const html = renderProductPage(p, topbarHTML, footerHTML, products, null);
      const dir = path.join(OUT_ROOT, slug);
      ensureDir(dir);
      writeFileAtomic(path.join(dir, 'index.html'), html);
      count++;
      log('wrote', `/produto/${slug}/index.html`);
    }

    // variants by size
    const groups = getSizeGroups(p.opcoes);
    for (const grp of groups) {
      for (const val of grp.values) {
        const vs = slugify(val);
        const html = renderProductPage(p, topbarHTML, footerHTML, products, { label: grp.label, value: val });
        const dir = path.join(OUT_ROOT, slug, vs);
        ensureDir(dir);
        writeFileAtomic(path.join(dir, 'index.html'), html);
        vcount++;
        log('wrote', `/produto/${slug}/${vs}/index.html`);
      }
    }
  }

  // Build homepage
  const homeHTML = renderHome(topbarHTML, footerHTML, products || []);
  writeFileAtomic(path.join(ROOT, 'index.html'), homeHTML);
  log('wrote /index.html');

  log('generated all pages in', (Date.now()-tGen)+'ms');
  console.log(`✅ Built ${count} base product pages + ${vcount} variant pages + homepage (FULL STATIC)`);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
