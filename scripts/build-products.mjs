import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

/* ---------------- ENV ---------------- */
const SUPABASE_URL     = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY= process.env.SUPABASE_ANON_KEY || '';
const BASE_URL         = process.env.BASE_URL || 'https://graficapt.com';
const STORAGE_PUBLIC   = process.env.STORAGE_PUBLIC ||
  (SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/products/` : `${BASE_URL}/imagens/produtos/`);

const OUT_ROOT = path.join(process.cwd(), 'produto');

/* -------------- HELPERS -------------- */
const esc = (s='') => String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

const asArray = (x) => Array.isArray(x) ? x : (x ? [x] : []);

const mkUrl = (x) => /^https?:\/\//.test(String(x||''))
  ? String(x)
  : `${STORAGE_PUBLIC}${String(x||'').replace(/^\//,'')}`;

const stripHead = (html) => html
  .replace(/<title>[\s\S]*?<\/title>/i,'')
  .replace(/<meta[^>]+name=["']description["'][^>]*>/gi,'')
  .replace(/<meta[^>]+name=["']keywords["'][^>]*>/gi,'')
  .replace(/<meta[^>]+name=["']twitter:card["'][^>]*>/gi,'')
  .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi,'')
  .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi,'');

const injectHead = (html, head) => html.replace(/<\/head>/i, `${head}\n</head>`);

// --- EXACTAMENTE como o teu JS antigo espera ---
function criarCarrosselHTML(imagens) {
  const imgs = (Array.isArray(imagens) ? imagens : [imagens]).filter(Boolean);
  const first = imgs[0] || '';
  const mk = (x) => /^https?:\/\//.test(String(x||'')) ? String(x) : `${STORAGE_PUBLIC}${String(x||'').replace(/^\//,'')}`;

  // 1) Um ÚNICO <img id="imagem-principal"> (o antigo JS troca o src aqui)
  const main = `
<div class="carrossel-container">
  <button class="carrossel-btn prev" onclick="window.mudarImagem && window.mudarImagem(-1)" aria-label="Anterior">&#10094;</button>
  <div class="carrossel-imagens-wrapper">
    <img id="imagem-principal" class="carrossel-img"
         src="${mk(first)}"
         alt="Imagem 1"
         onerror="this.onerror=null; this.style.opacity='0.4'; this.alt='Erro ao carregar imagem';">
  </div>
  <button class="carrossel-btn next" onclick="window.mudarImagem && window.mudarImagem(1)" aria-label="Próximo">&#10095;</button>
</div>`;

  // 2) Indicadores (o JS antigo preenche/usa este ID)
  const dots = `<div class="carrossel-indicadores" id="indicadores"></div>`;

  // 3) Miniaturas EXACTAS (o antigo JS lê #miniaturas e usa onclick irParaImagem)
  const thumbs = `
<div class="miniaturas" id="miniaturas">
  ${imgs.map((img, i) =>
    `<img class="miniatura"
          src="${mk(img)}"
          alt="Imagem ${i+1}"
          data-index="${i}"
          onclick="window.irParaImagem && window.irParaImagem(${i})">`
  ).join('')}
</div>`;

  return `${main}\n${dots}\n${thumbs}`;
}


function renderOptionSSR(opt, index){
  const tipo = String(opt?.tipo || '').toLowerCase();
  const label = esc(opt?.label || `${index+1}:`);
  const valores = Array.isArray(opt?.valores) ? opt.valores : [];

  // common wrappers (como no teu JS original)
  let inputHTML = '';

  if (tipo === 'select'){
    inputHTML = `<select name="${label}" required>
      ${valores.map((v,i)=>`<option value="${esc(v)}"${i===0?' selected':''}>${esc(v)}</option>`).join('')}
    </select>`;
  }
  else if (tipo === 'number'){
    inputHTML = `<input type="number" name="${label}" min="1" value="1" required>`;
  }
  else if (tipo === 'cores'){
    inputHTML = `<div class="color-options">
      ${valores.map((item,idx)=>{
        let title='', colorStyle='', imgAssoc='';
        if (typeof item === 'object'){
          title = item.nome || '';
          colorStyle = item.cor || '';
          imgAssoc = item.imagem || '';
        } else {
          title = item;
          colorStyle = item;
        }
        if (String(title).toLowerCase()==='multicolor' || String(title).toLowerCase()==='multicor'){
          colorStyle = 'linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet)';
          title = 'Multicor';
        }
        const id = `${label.replace(/\s+/g,'-').toLowerCase()}-color-${idx}`;
        return `<div class="overcell">
          <input type="radio" id="${id}" name="${label}" value="${esc(title)}"${idx===0?' checked':''} required>
          <label class="color-circle" for="${id}" title="${esc(title)}" style="background:${esc(colorStyle)}"></label>
        </div>`;
      }).join('')}
    </div>`;
  }
  else if (tipo === 'imagem-radio'){
    inputHTML = `<div class="posicionamento-options">
      ${valores.map((item,idx)=>{
        const nome   = esc(item?.nome || '');
        const imgSrc = item?.imagem ? mkUrl(item.imagem) : '';
        const posID  = `${label.replace(/\s+/g,'-').toLowerCase()}-pos-${idx}`;
        return `<div class="overcell">
          <input type="radio" id="${posID}" name="${label}" value="${nome}"${idx===0?' checked':''} required>
          <label class="posicionamento-label" for="${posID}">
            <div class="posicionamento-img-wrapper">
              ${imgSrc ? `<img class="posicionamento-img" src="${imgSrc}" alt="${nome}" title="${nome}">` : ''}
              <span class="posicionamento-nome">${nome}</span>
            </div>
          </label>
        </div>`;
      }).join('')}
    </div>`;
  }
  else if (tipo === 'quantidade-por-tamanho'){
    inputHTML = `<div class="quantidades-tamanhos">
      ${(valores||[]).map(t=>`
        <div class="tamanho-input">
          <label for="tamanho-${esc(t)}">${esc(t)}:</label>
          <input type="number" id="tamanho-${esc(t)}" name="Tamanho - ${esc(t)}" min="0" value="0">
        </div>
      `).join('')}
    </div>`;
  }
  else {
    inputHTML = '';
  }

  return `
<div class="option-group">
  <div class="overcell"><label>${label}</label></div>
  <div class="overcell">${inputHTML}</div>
</div>`;
}

function staticFieldsSSR(){
  // fiel à estrutura: options-row, form-group, overcell, labels etc.
  return `
<div class="options-row">
  <div class="form-group">
    <div class="overcell">
      <label for="detalhes">Detalhes:</label>
      <textarea name="Detalhes" placeholder="Descreve todas as informações sobre como queres o design e atenções extras!" required></textarea>
    </div>
  </div>
  <div class="form-group">
    <div class="overcell">
      <label for="empresa">Empresa / Nome:</label>
      <input type="text" name="Empresa" placeholder="Empresa ou nome pessoal" required>
    </div>
  </div>
</div>

<div class="options-row">
  <div class="form-group">
    <div class="overcell">
      <label for="ficheiro">(Opcional) Logotipo:</label>
      <input type="file" id="ficheiro">
      <input type="hidden" name="Logotipo" id="link_ficheiro">
      <p id="uploadStatus" style="display:none"></p>
    </div>
  </div>
  <div class="form-group">
    <div class="overcell">
      <label for="email">Email:</label>
      <input type="email" name="Email" placeholder="seu@email.com" required>
    </div>
  </div>
</div>

<div class="options-row">
  <div class="form-group">
    <div class="overcell">
      <label for="telemovel">Telemóvel:</label>
      <input type="tel" name="Telemovel" placeholder="Ex: 912 345 678" required>
    </div>
  </div>
</div>

<input type="hidden" name="_captcha" value="false">
<input type="hidden" name="_next" value="${BASE_URL}">

<div class="form-actions">
  <button id="submit" type="submit">Pedir Orçamento</button>
</div>`;
}

/* ----------------- MAIN ----------------- */
async function main(){
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY){
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const tplPath = path.join(process.cwd(),'product.html');
  if (!fs.existsSync(tplPath)){
    console.error('product.html not found');
    process.exit(1);
  }
  const tpl = fs.readFileSync(tplPath,'utf-8');

  const { data: products, error } = await supabase
    .from('products')
    .select('*');
  if (error){ console.error(error); process.exit(1); }

  for (const p of (products||[])){
    const slug = p.slug;
    const name = p.name || p.nome || 'Produto';
    const url  = `${BASE_URL}/produto/${encodeURIComponent(slug)}`;
    const desc = `Compra ${name} personalizada na GráficaPT. Impressão profissional, ideal para empresas e eventos.`;

    let images = [];
    try { images = Array.isArray(p.images) ? p.images : JSON.parse(p.images||'[]'); } catch {}
    const hero = mkUrl(images[0] || p.banner || 'logo_minimal.png');

    // opcoes em vários formatos
    let opcoes = [];
    if (Array.isArray(p.opcoes)) opcoes = p.opcoes;
    else if (p.opcoes && typeof p.opcoes === 'object') {
      opcoes = Object.entries(p.opcoes).map(([label,op])=>({label, ...op}));
    }

    // HEAD igual à lógica antiga
    const head = `
<title>${esc(name)} | GráficaPT</title>
<link rel="canonical" href="${url}">
<meta name="description" content="${esc(desc)}">
<meta name="keywords" content="${esc(asArray(p.metawords).join(', '))}">
<meta property="og:type" content="product">
<meta property="og:title" content="${esc(name)} | GráficaPT">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${hero}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
`;

    // body igual estrutura antiga
    const imagensHTML = criarCarrosselHTML(images.length ? images : [hero]);
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

    let html = stripHead(tpl);
    html = injectHead(html, head);
    html = html.replace(/<div\s+id=["']produto-dinamico["']><\/div>/i, `<div id="produto-dinamico">${body}</div>`);

    // bootstrap window.__PRODUCT__ (para JS antigo e analytics)
    const bootstrap = `<script>window.__PRODUCT__=${JSON.stringify({slug, name, desc, url, img: hero, keywords: asArray(p.metawords).join(', ')})};</script>`;
    html = html.replace(/<\/body>/i, `${bootstrap}\n</body>`);

    const outDir = path.join(OUT_ROOT, slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir,'index.html'), html, 'utf-8');
    console.log('✓ /produto/%s', slug);
  }

  console.log('✅ Static product pages built to match old layout.');
}

main().catch(e=>{ console.error(e); process.exit(1); });
