
/**
 * build-products.mjs — GráficaPT
 * - Organizado e normalizado
 * - Strings legíveis (template literals + arrays .join)
 * - Variáveis comuns no topo (timings, URLs, seletores)
 * - Comentários sucintos (uma linha) antes de cada função a descrever o que faz
 * - Correção: botão Ver mais/Ver menos agora anima tanto ao expandir como ao retrair (sem 'salto')
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

/* Constantes globais e helpers comuns */
const LOG = (...a) => console.log('[build-products]', ...a);
const ENV = {
  SUPABASE_URL      : process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY : process.env.SUPABASE_ANON_KEY || '',
  BASE_URL          : process.env.BASE_URL || 'https://graficapt.com'
};
const ROOT     = process.cwd();
const OUT_ROOT = path.join(ROOT, 'produto');
const PATHS = {
  BUNDLE: 'js/app.bundle.js',
  INDEX : 'index.html'
};
const TIMING = {
  POS_SPEED_S   : 1.1,              // velocidade de abrir/fechar posicionamento (segundos)
  POS_EXTRA_PX  : 24                // margem extra para colapso
};
const STORAGE_PUBLIC = process.env.STORAGE_PUBLIC
  || (ENV.SUPABASE_URL
      ? `${ENV.SUPABASE_URL}/storage/v1/object/public/products/`
      : `${ENV.BASE_URL}/imagens/produtos/`);

/* Parar se faltar env essencial */
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  console.error('[build-products] Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

/* Helper: escape HTML */
// → Escapa uma string para uso seguro em HTML.
const esc = (s='') => String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

/* Helper: normaliza lista */
// → Garante array a partir de string "a,b,c" ou array.
const asArray = (v) => Array.isArray(v) ? v : (v ? String(v).split(',').map(x=>x.trim()).filter(Boolean) : []);

/* Helper: JSON seguro */
// → Tenta parse, senão devolve [].
const safeJson = (v) => { try { return JSON.parse(v || '[]'); } catch { return []; } };

/* Helper: slugify simples PT */
// → Remove acentos e normaliza para slug.
const slugify = (s='') => String(s).normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,'-')
  .replace(/^-+|-+$/g,'').replace(/--+/g,'-');

/* Helper: log único por função */
// → Emite um log padronizado.
const logFn = (name, extra='') => LOG(`${name}${extra ? ' — '+extra : ''}`);

/* Helper: garantir diretório */
// → Cria pasta recursivamente.
const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });

/* Helper: escrita atómica */
// → Escreve para .tmp e faz rename.
const writeFileAtomic = (filePath, content) => {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, content, 'utf-8');
  fs.renameSync(tmp, filePath);
};

/* Helper: ler relativo à root */
// → Lê um ficheiro de texto relativo ao projeto.
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf-8');

/* Helper: OG image com proxy wsrv.nl */
// → Converte URL supabase para JPEG 1200x630 (q85) estável para OG.
function toOgJpeg(url) {
  logFn('toOgJpeg');
  if (!url) return url;
  try {
    const u = new URL(url);
    if (/\/storage\/v1\/object\/public\/products\//.test(u.pathname)) {
      const encoded = encodeURIComponent(u.toString());
      return `https://wsrv.nl/?url=${encoded}&w=1200&h=630&fit=cover&output=jpg&q=85`;
    }
  } catch {}
  return url;
}

/* Extrai topbar e footer do bundle JS */
// → Lê js/app.bundle.js e obtém as strings de topbar e footer.
function extractTopbarFooter() {
  logFn('extractTopbarFooter');
  const t = Date.now();
  const bundle = read(PATHS.BUNDLE);
  const mTop   = bundle.match(/const\s+topbarHTML\s*=\s*`([\s\S]*?)`;/);
  const mFoot  = bundle.match(/const\s+footerHTML\s*=\s*`([\s\S]*?)`;/);
  if (!mTop || !mFoot) throw new Error('Could not extract topbarHTML/footerHTML from js/app.bundle.js');
  LOG('nav extracted in', (Date.now()-t)+'ms');
  return { topbarHTML: mTop[1], footerHTML: mFoot[1] };
}

/* Constrói o <head> base para páginas de produto */
// → Meta tags, og/tw, fonts e CSS.
function buildHead(baseUrl, title, descr, keywords, og, ogType = 'website', preconnects = []) {
  logFn('buildHead');
  return [
    '<meta charset="utf-8">',
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    ` <title>${esc(title)}</title>`,
    `<link rel="canonical" href="${esc(baseUrl)}">`,
    `<meta name="description" content="${esc(descr)}">`,
    (keywords ? `<meta name="keywords" content="${esc(keywords)}">` : ''),
    '<meta name="robots" content="index, follow">',
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(descr)}">`,
    (og ? `<meta property="og:image" content="${esc(og)}">` : ''),
    `<meta property="og:type" content="${esc(ogType)}">`,
    `<meta property="og:url" content="${esc(baseUrl)}">`,
    (og ? '<meta property="og:image:width" content="1200">' : ''),
    (og ? '<meta property="og:image:height" content="630">' : ''),
    (og ? `<link rel="preload" as="image" href="${esc(og)}" fetchpriority="high">` : ''),
    '<meta name="twitter:card" content="summary_large_image">',
    (title ? `<meta name="twitter:title" content="${esc(title)}">` : ''),
    (descr ? `<meta name="twitter:description" content="${esc(descr)}">` : ''),
    (og ? `<meta name="twitter:image" content="${esc(og)}">` : ''),
    '<link rel="icon" href="https://graficapt.com/imagens/logo.ico">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=League+Spartan&display=swap" rel="stylesheet">',
    ...preconnects.map(o => `<link rel="preconnect" href="${esc(o)}" crossorigin>`),
    '<link rel="stylesheet" href="/css/index.css">',
    '<link rel="stylesheet" href="/css/product.css">'
  ].filter(Boolean).join('\n');
}

/* JSON-LD: Produto/Serviço */
// → Cria bloco schema.org Service para produto.
function buildProductJsonLd({ baseUrl, title, descr, images = [], sku = '', brand = 'GraficaPT', category = '' }) {
  logFn('buildProductJsonLd');
  const imgs = (images || []).filter(Boolean);
  const ld = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": title,
    "description": descr,
    "image": imgs,
    "sku": sku || undefined,
    "brand": brand ? { "@type": "Brand", "name": brand } : undefined,
    "category": category || undefined,
    "url": baseUrl
  };
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

/* JSON-LD: Breadcrumbs */
// → Cria BreadcrumbList a partir de items [{name,item}].
function buildBreadcrumbJsonLd(items=[]) {
  logFn('buildBreadcrumbJsonLd');
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((it, i) => ({
      "@type": "ListItem",
      "position": i+1,
      "name": it.name,
      "item": it.item
    }))
  };
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

/* JSON-LD: FAQ */
// → Cria bloco FAQPage a partir de [{q,a}].
function buildFaqJsonLd(faqItems=[]) {
  logFn('buildFaqJsonLd');
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(it => ({
      "@type": "Question",
      "name": it.q,
      "acceptedAnswer": { "@type": "Answer", "text": it.a }
    }))
  };
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

/* FAQ default por produto */
// → Gera 5 perguntas/respostas genéricas.
function defaultFaqForProduct(name='Produto') {
  logFn('defaultFaqForProduct');
  const n = String(name);
  return [
    { q: `Qual é o prazo de produção do ${n}?`, a: 'Normalmente 3-5 dias úteis após confirmação de arte final. Prazos urgentes podem ser possíveis mediante disponibilidade.' },
    { q: 'A arte/maquete está incluída?', a: 'Sim, ajustamos o teu logotipo e texto básico sem custos. Trabalhos de design avançado podem ter orçamento adicional.' },
    { q: 'Que ficheiros aceitam?', a: 'PDF, AI, SVG ou PNG/JPG de alta resolução. Se possível, envia em CMYK e com fontes convertidas em curvas.' },
    { q: 'Posso imprimir frente e verso?', a: 'Sim. Se aplicável ao produto, adiciona essa informação nos detalhes do pedido.' },
    { q: 'Como é o envio e prazos de entrega?', a: 'Expedimos por transportadora para todo o país. Após produção, a entrega habitual é 24-48h (dias úteis).' }
  ];
}

/* Renderiza HTML de FAQ (accordion) */
// → Constrói <section class="faq"> com <details>.
function renderFaqHTML(faqItems=[]) {
  logFn('renderFaqHTML');
  if (!faqItems.length) return '';
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

/* <head> da Home */
// → Meta base para homepage.
function buildHeadHome() {
  logFn('buildHeadHome');
  const url = `${ENV.BASE_URL}/`;
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

/* Agrupa tamanhos a partir de opcoes */
// → Deteta grupos de tamanho (para variantes e navegação).
function getSizeGroups(opcoes){
  logFn('getSizeGroups');
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

/* Junta paths públicos para imagens */
// → Normaliza URL de imagem com base em STORAGE_PUBLIC.
function joinPublicPath(prefix, pth) {
  logFn('joinPublicPath');
  const parts = String(pth).split('/').filter(Boolean).map(encodeURIComponent);
  return prefix + parts.join('/');
}

/* Resolve caminho de imagem (slug + raw) */
// → Aceita https, caminho com '/', ou ficheiro simples relativo ao slug.
function resolveImagePath(slug, raw, STORAGE_PUBLIC_ARG) {
  logFn('resolveImagePath');
  const base = STORAGE_PUBLIC_ARG || STORAGE_PUBLIC;
  if (!raw || typeof raw !== 'string') return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.includes('/')) return joinPublicPath(base, s);
  return joinPublicPath(base, `${slug}/${s}`);
}

/* URL de imagem para card Related */
// → Decide melhor imagem (images[0] → banner → placeholder).
function relatedImageUrl(prod, STORAGE_PUBLIC_ARG) {
  logFn('relatedImageUrl');
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

/* Render cards de Related */
// → Gera grelha de 4 produtos da mesma categoria.
function renderRelated(current, allProducts){
  logFn('renderRelated');
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
      `<a class="related__card" href="${ENV.BASE_URL}/produto/${esc(slug)}" aria-label="${esc(name)}">`,
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

/* Render card de produto (homepage) */
// → Card simples com imagem + CTA.
function renderCard(p){
  logFn('renderCard');
  const slug = p.slug || p.Slug || p.name || p.nome;
  const nome = p.name || p.nome || slug;
  const cat  = (p.category || p.categoria || '').toLowerCase();
  const tags = asArray(p.tags || p.metawords).join(',');
  const images = Array.isArray(p.images) ? p.images : safeJson(p.images);
  const img = resolveImagePath(slug, images[0] || '', STORAGE_PUBLIC);
  const href = `${ENV.BASE_URL}/produto/${encodeURIComponent(slug)}`;
  return [
    `<a class="cell" href="${esc(href)}" data-categoria="${esc(cat)}" data-nome="${esc(nome)}" data-item data-tags="${esc(tags)}">`,
    (img ? `  <img src="${esc(img)}" alt="${esc(nome)}">` : ''),
    `  <div class="cellText">${esc(nome)}</div>`,
    '  <div class="cellBtn">Ver Opções</div>',
    '</a>'
  ].join('\n');
}

/* HTML do banner da homepage */
// → Banner trio com deep-links.
const bannerHTML = [
  '<div class="banner hcenter">',
  `  <img class="banner-left" src="imagens/banner/bandeirasbanner.webp" alt="Bandeiras promocionais" loading="lazy" data-href="${ENV.BASE_URL}/produto/bandeiravela">`,
  '  <div class="banner-right">',
  `    <img src="imagens/banner/tshirtbanner.webp" alt="T-shirt personalizada" loading="lazy" data-href="${ENV.BASE_URL}/produto/tshirtregent">`,
  `    <img src="imagens/banner/sacoskraftbanner.webp" alt="Saco kraft personalizado" loading="lazy" data-href="${ENV.BASE_URL}/produto/sacoskraft">`,
  '  </div>',
  '</div>'
].join('\n');

/* Render da homepage completa */
// → Constrói index.html (cards + filtros + formulário).
function renderHome(topbarHTML, footerHTML, products) {
  logFn('renderHome');
  const head = buildHeadHome();
  const extraHead = [
    `<link rel="alternate" hreflang="pt-PT" href="${ENV.BASE_URL}/">`,
    `<link rel="alternate" hreflang="x-default" href="${ENV.BASE_URL}/">`,
    '<meta property="og:locale" content="pt_PT">',
    (()=>{ try { return `<link rel="preconnect" href="${new URL(STORAGE_PUBLIC).origin}" crossorigin>`; } catch { return ''; }})()
  ].join('\n');

  const itemListLd = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": products.map((p, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "url": `${ENV.BASE_URL}/produto/${p.slug}`
    })).slice(0, 20)
  })}</script>`;

  const webSiteLd = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "GráficaPT",
    "url": ENV.BASE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${ENV.BASE_URL}/index.html?query={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  })}</script>`;

  const orgLd = `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "GráficaPT",
    "url": ENV.BASE_URL,
    "logo": "https://graficapt.com/imagens/logo.ico",
    "sameAs": [
      "https://www.instagram.com/graficapt/",
      "https://www.facebook.com/profile.php?id=61564124441415"
    ]
  })}</script>`;

  const headWithLd = [head, webSiteLd, orgLd, extraHead, itemListLd].join('\n');
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
    '<script>document.querySelectorAll(".banner img[data-href]").forEach(el=>{el.style.cursor="pointer";el.addEventListener("click",()=>location.href=el.dataset.href);});</script>',
    '',
    '<div id="products">',
    '  <a class="subtitle hcenter">Produtos Personalizáveis</a>',
    '  <div class="filter-sort">',
    '    <select id="filterCategory" onchange="location.hash = \'filter=\' + this.value">',
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
    `  <input type="hidden" name="_next" value="${ENV.BASE_URL}">`,
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
    headWithLd,
    '</head>',
    '<body>',
    body,
    '</body>',
    '</html>'
  ].join('\n');
}

/* Carrossel do produto (HTML) */
// → Constrói estrutura do carrossel com botões e indicadores.
function criarCarrosselHTML(slug, imagens) {
  logFn('criarCarrosselHTML');
  const imgs = (imagens || []).map(u => resolveImagePath(slug, u, STORAGE_PUBLIC)).filter(Boolean);
  if (!imgs.length) return '';
  return [
    '<div class="carrossel-container">',
    '  <button class="carrossel-btn prev" onclick="mudarImagem(-1)" aria-label="Anterior">&#10094;</button>',
    '  <div class="carrossel-imagens-wrapper">',
    '    <div class="carrossel-imagens" id="carrossel">',
         imgs.map((src, i)=>`      <img src="${esc(src)}" alt="Imagem ${i+1}" class="carrossel-img" ${i===0?'fetchpriority="high"':'loading="lazy"'} decoding="async">`).join('\n'),
    '    </div>',
    '  </div>',
    '  <button class="carrossel-btn next" onclick="mudarImagem(1)" aria-label="Seguinte">&#10095;</button>',
    '</div>',
    '<div class="indicadores" id="indicadores"></div>'
  ].join('\n');
}

/* Render de um grupo de opções */
// → Constrói inputs/labels para cada tipo de opção.
function renderOption(opt={}, index=0, preselect={}) {
  logFn('renderOption', String(opt?.label||index));
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
    // cards
    const blocks = valores.map((item, idx) => {
      const posID = `${label.replace(/\s+/g,'-').toLowerCase()}-pos-${idx}`;
      const nome = esc(item?.nome || '');
      const imgSrc = item?.imagem ? resolveImagePath('', item.imagem, STORAGE_PUBLIC) : '';
      const checked = (String(item?.nome || '').toLowerCase() === wanted) || (idx===0 && !wanted) ? ' checked' : '';
      return [
        '        <div class="overcell">',
        `          <input type="radio" id="${esc(posID)}" name="${label}" value="${nome}"${checked} required>`,
        '          <label class="posicionamento-label" for="${esc(posID)}">',
        '            <div class="posicionamento-img-wrapper">',
        `              <img class="posicionamento-img" src="${esc(imgSrc)}" alt="${nome}" title="${nome}">`,
        `              <span class="posicionamento-nome">${nome}</span>`,
        '            </div>',
        '          </label>',
        '        </div>'
      ].join('\n');
    }).join('\n');

    // IDs por grupo
    const baseId = label.replace(/\s+/g,'-').toLowerCase();
    const wrapId = `${baseId}-wrap`;
    const chkId  = `${baseId}-chk`;
    const listId = `${baseId}-opts`;

    // HTML + script (animação simétrica abrir/fechar)
    const html = [
      '<div class="option-group">',
      labelRow,
      '<div class="overcell">',
      `<div class="posicionamento-wrapper" id="${wrapId}" style="--pos-speed:${TIMING.POS_SPEED_S}s; --pos-collapsed-extra:${TIMING.POS_EXTRA_PX}px">`,
      `<input type="checkbox" id="${chkId}" class="pos-toggle-check" hidden>`,
      `<div class="posicionamento-options" id="${listId}">`,
           blocks,
      '</div>',
      `<label class="pos-toggle" for="${chkId}" aria-controls="${listId}" aria-expanded="false">`,
      '  <span class="texto-mais">Ver mais</span>',
      '  <span class="texto-menos">Ver menos</span>',
      '  <span class="seta" aria-hidden="true">▾</span>',
      '</label>',
      '</div>',
      '</div>',
      '</div>',
      `<script>(function(){`,
      `var wrap = document.getElementById('${wrapId}');`,
      `var chk  = document.getElementById('${chkId}');`,
      `var list = document.getElementById('${listId}');`,
      `var lbl  = document.querySelector('label[for="${chkId}"]');`,
      `if(!wrap||!chk||!list||!lbl) return;`,
      ``,
      `// Desativa o max-height do CSS para evitar "salto" ao retrair`,
      `list.style.maxHeight = 'none';`,
      `list.style.overflow  = 'hidden';`,
      ``,
      `function getSpeedMs(){`,
      `  var v = getComputedStyle(wrap).getPropertyValue('--pos-speed')||'';`,
      `  var n = parseFloat(v.replace(/[^\\d.]/g,''));`,
      `  var pr = matchMedia('(prefers-reduced-motion: reduce)').matches;`,
      `  return Math.round((isFinite(n)&&n>0?(pr?0:n):(pr?0:${TIMING.POS_SPEED_S}))*1000);`,
      `}`,
      ``,
      `function rowsInfo(){`,
      `  var items = list.querySelectorAll('.overcell');`,
      `  if(!items.length) return {rows:0, firstRowH:0};`,
      `  var top0 = items[0].offsetTop, maxBottom = 0, rows = 1;`,
      `  for (var i=0;i<items.length;i++){`,
      `    var el = items[i];`,
      `    if (el.offsetTop===top0){`,
      `      var b = el.offsetTop + el.offsetHeight;`,
      `      if (b>maxBottom) maxBottom = b;`,
      `    } else { rows = 2; break; }`,
      `  }`,
      `  var gap = parseFloat(getComputedStyle(list).gap)||0;`,
      `  var extra = parseFloat(getComputedStyle(wrap).getPropertyValue('--pos-collapsed-extra'))||${TIMING.POS_EXTRA_PX};`,
      `  var h = Math.max(80, Math.ceil((maxBottom - top0) + gap*0.5 + extra));`,
      `  return {rows:rows, firstRowH:h};`,
      `}`,
      ``,
      `var anim=null;`,
      `function animateTo(px){`,
      `  if(anim){ anim.cancel(); anim=null; }`,
      `  var from = list.getBoundingClientRect().height;`,
      `  var dur = getSpeedMs();`,
      `  if(dur<=0 || Math.abs(from-px)<1){ list.style.height = px+'px'; return; }`,
      `  list.style.height = from+'px'; void list.offsetHeight;`,
      `  anim = list.animate([{height: from+'px'}, {height: px+'px'}], {duration: dur, easing:'cubic-bezier(.25,.8,.25,1)'});`,
      `  anim.onfinish = anim.oncancel = function(){ list.style.height = px+'px'; anim=null; };`,
      `}`,
      ``,
      `function applyInitial(){`,
      `  var info = rowsInfo();`,
      `  var full = list.scrollHeight;`,
      `  lbl.style.display = info.rows>1 ? 'inline-flex' : 'none';`,
      `  if(info.rows>1){`,
      `    list.style.height = (chk.checked ? full : info.firstRowH) + 'px';`,
      `  } else {`,
      `    chk.checked = true;`,
      `    list.style.height = full + 'px';`,
      `  }`,
      `  lbl.classList.toggle('open', chk.checked);`,
      `  lbl.setAttribute('aria-expanded', chk.checked?'true':'false');`,
      `}`,
      ``,
      `applyInitial();`,
      ``,
      `chk.addEventListener('change', function(){`,
      `  var info = rowsInfo();`,
      `  var full = list.scrollHeight;`,
      `  animateTo(chk.checked ? full : info.firstRowH);`,
      `  lbl.classList.toggle('open', chk.checked);`,
      `  lbl.setAttribute('aria-expanded', chk.checked?'true':'false');`,
      `});`,
      ``,
      `var raf=0; function schedule(){ cancelAnimationFrame(raf); raf=requestAnimationFrame(applyInitial); }`,
      `window.addEventListener('resize', schedule);`,
      `Array.prototype.forEach.call(list.querySelectorAll('img'), function(img){`,
      `  if(!img.complete) img.addEventListener('load', schedule, {once:true});`,
      `  if(img.decode) img.decode().then(schedule).catch(function(){});`,
      `});`,
      `if('ResizeObserver' in window){ new ResizeObserver(schedule).observe(list); }`,
      `setTimeout(schedule,300); setTimeout(schedule,1200);`,
      `})();</script>`
    ].join('\n');
    return html;
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

/* Campos estáticos do formulário */
// → Detalhes, upload logo, empresa, email e telemóvel.
function createStaticFields() {
  logFn('createStaticFields');
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
    `  <input type="hidden" name="_next" value="${ENV.BASE_URL}">`,
    '',
    '  <button id="submit" type="submit">Pedir Orçamento</button>'
  ].join('\n');
}

/* Script inline do carrossel */
// → Controla navegação pelas imagens e indicadores.
function inlineCarouselScript() {
  logFn('inlineCarouselScript');
  return [
    '<script>',
    '(function(){',
    '  window.imagemAtual = window.imagemAtual ?? 0;',
    '  function atualizarIndicadores(){',
    '    const dots = document.querySelectorAll(".indicador");',
    '    dots.forEach((d,i)=>d.classList.toggle("ativo", i===window.imagemAtual));',
    '  }',
    '  window.irParaImagem = function(i){',
    '    const imgs = document.querySelectorAll(".carrossel-img");',
    '    const wrap = document.querySelector(".carrossel-imagens");',
    '    if (!imgs.length || !wrap) return;',
    '    window.imagemAtual = (i + imgs.length) % imgs.length;',
    '    wrap.style.transform = "translateX(" + (-window.imagemAtual * 100) + "%)";',
    '    atualizarIndicadores();',
    '  };',
    '  window.mudarImagem = function(delta){ window.irParaImagem((window.imagemAtual||0) + (delta||1)); };',
    '  window.selecionarCorEImagem = function(imgPath){',
    '    if (!imgPath) return;',
    '    const imgs = Array.from(document.querySelectorAll(".carrossel-img"));',
    '    const idx = imgs.findIndex(img => img.src.endsWith(imgPath) || img.src.includes(imgPath));',
    '    if (idx>=0) window.irParaImagem(idx);',
    '  };',
    '  const ind = document.getElementById("indicadores");',
    '  const imgs = document.querySelectorAll(".carrossel-img");',
    '  if (ind && imgs.length) {',
    '    ind.innerHTML = "";',
    '    imgs.forEach((_, idx) => {',
    '      const dot = document.createElement("div");',
    '      dot.className = "indicador" + (idx===0 ? " ativo" : "");',
    '      dot.addEventListener("click", ()=>window.irParaImagem(idx));',
    '      ind.appendChild(dot);',
    '    });',
    '  }',
    '  window.irParaImagem(window.imagemAtual||0);',
    '})();',
    '</script>'
  ].join('\n');
}

/* Guarda de submissão do formulário */
// → Bloqueia submit se formSender não inicializou.
function inlineFormGuardScript() {
  logFn('inlineFormGuardScript');
  return [
    '<script>',
    '(function(){',
    '  if (!window.__FORMSENDER_GUARD__) {',
    '    window.__FORMSENDER_GUARD__ = true;',
    '    const f = document.getElementById("orcamentoForm");',
    '    if (f) {',
    '      f.addEventListener("submit", function(e){',
    '        if (!window.formSenderInitialized) {',
    '          e.preventDefault();',
    '          alert("Não foi possível enviar agora. Verifica a ligação e tenta novamente.");',
    '        }',
    '      }, { capture: true });',
    '    }',
    '  }',
    '})();',
    '</script>'
  ].join('\n');
}

/* Links de variantes por tamanho */
// → Gera navegação oculta para variantes (SEO).
function variantLinksHTML(slug, name, sizeGroups){
  logFn('variantLinksHTML');
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

/* Render da página de produto */
// → Constrói página completa de um produto (com variantes, related e FAQ).
function renderProductPage(p, topbarHTML, footerHTML, allProducts, variant=null) {
  logFn('renderProductPage', String(p?.slug||p?.nome||''));
  const slug = p.slug || p.Slug || p.name || p.nome;
  const baseName = p.name || p.nome || slug;
  const images = Array.isArray(p.images) ? p.images : safeJson(p.images);
  const og = resolveImagePath(slug, (images && images[0]) || p.og_image || '', STORAGE_PUBLIC);
  const keywords = asArray(p.metawords).join(', ');
  const sizeGroups = getSizeGroups(p.opcoes);

  // SEO + variant
  let displayName = baseName;
  let seoTitle = `${baseName} | GráficaPT`;
  let descr = p.shortdesc || p.descricao || `Compra ${baseName} personalizada na GráficaPT.`;
  let url = `${ENV.BASE_URL}/produto/${encodeURIComponent(slug)}`;
  let preselect = {};
  if (variant && variant.value) {
    seoTitle = `${baseName} — ${variant.value} | GráficaPT`;
    descr = `${baseName} no tamanho ${variant.value}. Personaliza e pede orçamento em segundos.`;
    url = `${ENV.BASE_URL}/produto/${encodeURIComponent(slug)}/${slugify(variant.value)}`;
    preselect = { [String(variant.label || '').toLowerCase()]: String(variant.value || '') };
  }

  let supaOrigin = ''; try { supaOrigin = new URL(STORAGE_PUBLIC || '').origin; } catch {}
  const ogForShare = toOgJpeg(og);
  const head = buildHead(url, seoTitle, descr, keywords, ogForShare, 'product', supaOrigin ? [supaOrigin] : []);
  const resolvedImages = (images || []).map(u => resolveImagePath(slug, u, STORAGE_PUBLIC)).filter(Boolean);
  const productLd = buildProductJsonLd({ baseUrl: url, title: baseName, descr, images: resolvedImages, brand: 'GraficaPT', category: p.categoria || '' });
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: 'Início', item: ENV.BASE_URL + '/' },
    { name: 'Produtos', item: ENV.BASE_URL + '/#filter=all' },
    { name: baseName, item: url }
  ]);
  const faqItems = defaultFaqForProduct(baseName);
  const faqLd = buildFaqJsonLd(faqItems);
  const headWithLd = [head, productLd, breadcrumbLd, faqLd].join('\n');

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
    renderFaqHTML(faqItems),
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
    headWithLd,
    '</head>',
    '<body>',
    body,
    '</body>',
    '</html>'
  ].join('\n');
}

/* MAIN */
// → Busca produtos no Supabase e gera homepage + páginas de produto/variantes.
async function main() {
  logFn('main:start', new Date().toISOString());
  const supa = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);

  const tFetch = Date.now();
  const { data: products, error } = await supa.from('products').select('*');
  if (error) { console.error(error); process.exit(1); }
  LOG('fetched products:', products?.length ?? 0, 'in', (Date.now()-tFetch)+'ms');

  const { topbarHTML, footerHTML } = extractTopbarFooter();

  // Build product pages + variants
  ensureDir(OUT_ROOT);
  let count = 0, vcount = 0;
  const tGen = Date.now();
  for (const p of (products || [])) {
    const slug = p.slug || p.Slug || p.name || p.nome;
    if (!slug) continue;

    // base page
    {
      const html = renderProductPage(p, topbarHTML, footerHTML, products, null);
      const dir = path.join(OUT_ROOT, slug);
      ensureDir(dir);
      writeFileAtomic(path.join(dir, 'index.html'), html);
      count++;
      LOG('wrote', `/produto/${slug}/index.html`);
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
        LOG('wrote', `/produto/${slug}/${vs}/index.html`);
      }
    }
  }

  // Build homepage
  const homeHTML = renderHome(topbarHTML, footerHTML, products || []);
  writeFileAtomic(path.join(ROOT, PATHS.INDEX), homeHTML);
  LOG('wrote /index.html');

  LOG('generated all pages in', (Date.now()-tGen)+'ms');
  console.log(`✅ Built ${count} base product pages + ${vcount} variant pages + homepage (FULL STATIC)`);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
