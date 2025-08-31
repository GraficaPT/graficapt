import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

/* =========================
   ENV & CONSTANTES
========================= */
const SUPABASE_URL       = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY  = process.env.SUPABASE_ANON_KEY || '';
const BASE_URL           = process.env.BASE_URL || 'https://graficapt.com';
const STORAGE_PUBLIC     = process.env.STORAGE_PUBLIC ||
  (SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/products/` : `${BASE_URL}/imagens/produtos/`);

const OUT_ROOT = path.join(process.cwd(), 'produto');

const supa = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/* =========================
   HELPERS
========================= */
const esc = (s='') => String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

const asArray = (v) => Array.isArray(v) ? v : (v ? String(v).split(',').map(x=>x.trim()).filter(Boolean) : []);

function buildImageCandidates(slug, produto) {
  const imgs = [];
  const fromField = produto?.images;
  if (Array.isArray(fromField)) {
    for (const f of fromField) {
      imgs.push(STORAGE_PUBLIC + String(f).replace(/^\/+/, ''));
    }
  } else {
    const candidates = ['banner.webp','1.webp','2.webp','3.webp','4.webp','5.webp'];
    for (const name of candidates) {
      imgs.push(`${STORAGE_PUBLIC}${slug}/${name}`);
    }
  }
  return [...new Set(imgs)];
}

function buildPriceBlock(produto) {
  const pt = Array.isArray(produto?.price_table) ? produto.price_table : null;
  const opts = Array.isArray(produto?.options) ? produto.options : null;

  if (pt && pt.length) {
    const rows = pt.map(r => `
      <tr>
        <td>${esc(r.label || r.nome || '')}</td>
        <td>${esc(r.spec || r.descricao || '')}</td>
        <td>${esc(r.price || r.preco || '')}</td>
      </tr>`).join('');
    return `
      <div class="price-table">
        <h3>Tabela de preços</h3>
        <table>
          <thead><tr><th>Opção</th><th>Descrição</th><th>Preço</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }
  if (opts && opts.length) {
    const li = opts.map(o => `<li>${esc(o.label || o)}</li>`).join('');
    return `<div class="options"><h3>Opções</h3><ul>${li}</ul></div>`;
  }
  return '';
}

function buildHead(slug, produto) {
  const title = produto?.title || produto?.name || produto?.nome || (slug + ' | GraficaPT');
  const descr = produto?.shortdesc || produto?.descricao || 'Produto personalizado GraficaPT.';
  const keywords = asArray(produto?.metawords).join(', ');
  const ogImg = produto?.og_image || produto?.hero || `${STORAGE_PUBLIC}${slug}/og/index.png`;

  return `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <link rel="canonical" href="${BASE_URL}/produto/${slug}" />
  <meta name="description" content="${esc(descr)}">
  <meta name="keywords" content="${esc(keywords)}">
  <meta name="robots" content="index, follow">

  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(descr)}">
  <meta property="og:image" content="${esc(ogImg)}">
  <meta property="og:type" content="product">
  <meta property="og:url" content="${BASE_URL}/produto/${slug}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(descr)}">
  <meta name="twitter:image" content="${esc(ogImg)}">

  <link rel="icon" href="/imagens/logo.ico">
  <link rel="stylesheet" href="/css/index.css">
  <link rel="stylesheet" href="/css/product.css">
  <link href="https://fonts.googleapis.com/css2?family=League+Spartan&display=swap" rel="stylesheet">
  `;
}

const TOPBAR_HTML = `
  <div class="bar">
    <img src="/imagens/social/logo_minimal.svg" onclick="location.href = '/index.html'">
    <div class="tabs desktop-only">
      <a href="/index.html#filter=rigidos">Suportes Rigídos</a>
      <a href="/index.html#filter=bandeiras">Bandeiras Publicitárias</a>
      <a href="/index.html#filter=sacos">Sacos</a>
      <a href="/index.html#filter=vestuario">Vestuário</a>
      <a href="/index.html#filter=all">Ver Tudo</a>
    </div>
    <div class="hamburger mobile-only" onclick="toggleSidebar()">☰</div>
  </div>
  <div class="sidebar" id="sidebar">
    <div class="sidebar-header">
      <img src="/imagens/social/logo_minimal.svg" class="sidebar-logo" onclick="location.href = '/index.html'">
    </div>
    <a href="/index.html#filter=Rigidos">Suportes Rigídos</a>
    <a href="/index.html#filter=Bandeiras">Bandeiras Publicitárias</a>
    <a href="/index.html#filter=Sacos">Sacos</a>
    <a href="/index.html#filter=Vestuario">Vestuário</a>
    <a href="/index.html#filter=all">Ver Tudo</a>
  </div>
  <div class="overlay" id="overlay" onclick="toggleSidebar()"></div>
`;

const FOOTER_HTML = `
  <div class="footer-columns">
    <div class="footer-column">
      <h4>Ajuda</h4>
      <a href="mailto:comercial@graficapt.com">comercial@graficapt.com</a>
      <a href="https://www.instagram.com/graficapt/">@graficapt</a>
    </div>
    <div class="footer-column">
      <h4>Empresa</h4>
      <a href="/aboutus.html">Sobre nós</a>
      <a href="#">Trabalha connosco</a>
      <a href="https://www.instagram.com/graficapt/">Segue-nos</a>
    </div>
    <div class="footer-column">
      <h4>Produtos</h4>
      <a href="/index.html#filter=all">Todos os produtos</a>
      <a href="/index.html#filter=Bandeiras">Bandeiras</a>
      <a href="/index.html#filter=Sacos">Sacos</a>
    </div>
    <div class="footer-column">
      <h4>Contactos</h4>
      <div class="payment-methods">
        <img src="/imagens/payments/visa.svg" alt="VISA">
        <img src="/imagens/payments/mbway.svg" alt="MB Way">
        <img src="/imagens/payments/paypal.svg" alt="PayPal">
      </div>
      <div class="social-icons">
        <img src="/imagens/social/facebook.svg" alt="Facebook">
        <img src="/imagens/social/instagram.svg" alt="Instagram">
        <img src="/imagens/social/whatsapp.svg" alt="WhatsApp">
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    © 2025 GraficaPT. Todos os direitos reservados.
  </div>
`;

function buildCarousel(slug, imagens) {
  if (!imagens || !imagens.length) return '';
  const indicadores = imagens.map((_,i)=>`<span class="indicador ${i===0?'ativo':''}" data-index="${i}"></span>`).join('');
  const imgs = imagens.map((src,i)=>`<img class="carrossel-img ${i===0?'visivel':''}" src="${src}" alt="${esc(slug)} imagem ${i+1}" loading="lazy">`).join('');
  return `
  <div class="carrossel">
    <button class="nav prev" aria-label="Imagem anterior">&#10094;</button>
    <div class="carrossel-imagens">
      ${imgs}
    </div>
    <button class="nav next" aria-label="Próxima imagem">&#10095;</button>
    <div class="indicadores">${indicadores}</div>
  </div>`;
}

function buildBody(slug, produto) {
  const nome = produto?.title || produto?.name || produto?.nome || slug;
  const descr = produto?.descricao || produto?.shortdesc || '';
  const imagens = buildImageCandidates(slug, produto);
  const price = buildPriceBlock(produto);
  const carouselHTML = buildCarousel(slug, imagens);

  return `
  <div class="topbar" id="topbar">${TOPBAR_HTML}</div>

  <div class="productcontainer">
    <div class="produto">
      <h1 class="produto-titulo">${esc(nome)}</h1>
      ${carouselHTML}
    </div>
    <div class="produto-descricao">
      <p>${esc(descr)}</p>
      ${price}
    </div>
  </div>

  <footer class="footer" id="footer">${FOOTER_HTML}</footer>

  <script>
  function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const isOpen = sidebar.style.left === "0%";
    sidebar.style.left = isOpen ? "-100%" : "0%";
    overlay.style.display = isOpen ? "none" : "block";
  }

  (function() {
    const wrapper = document.querySelector('.carrossel-imagens');
    if (!wrapper) return;
    const imgs = Array.from(wrapper.querySelectorAll('.carrossel-img'));
    const indicators = Array.from(document.querySelectorAll('.indicador'));
    let idx = 0;
    function show(i) {
      idx = (i + imgs.length) % imgs.length;
      imgs.forEach((img, k) => img.classList.toggle('visivel', k === idx));
      indicators.forEach((el, k) => el.classList.toggle('ativo', k === idx));
    }
    document.querySelector('.nav.prev')?.addEventListener('click', ()=>show(idx-1));
    document.querySelector('.nav.next')?.addEventListener('click', ()=>show(idx+1));
    indicators.forEach((el,i)=>el.addEventListener('click',()=>show(i)));
  })();
  </script>
  `;
}

/* =========================
   TEMPLATE HTML
========================= */
function renderHTML(slug, produto) {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
${buildHead(slug, produto)}
</head>
<body>
${buildBody(slug, produto)}
</body>
</html>`;
}

/* =========================
   MAIN
========================= */
async function getProducts() {
  if (!supa) throw new Error('Definir SUPABASE_URL e SUPABASE_ANON_KEY para carregar produtos.');
  const { data, error } = await supa.from('products').select('*');
  if (error) throw error;
  return data || [];
}

async function main() {
  const produtos = await getProducts();
  if (!produtos.length) throw new Error('Nenhum produto encontrado.');

  fs.mkdirSync(OUT_ROOT, { recursive: true });

  for (const p of produtos) {
    const slug = p.slug || p.Slug || p.nome || p.name;
    if (!slug) continue;
    const html = renderHTML(slug, p);
    const outDir = path.join(OUT_ROOT, slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
    console.log('✓ /produto/%s', slug);
  }
  console.log('✅ Páginas de produto geradas estaticamente (sem template base / sem replaces).');
}

main().catch(e => { console.error(e); process.exit(1); });
