import { fetchProductBySlug } from './services/productService.js';
import { supabase } from './supamanager/supabase.js';
import { getSlugFromUrl } from './utils/slug.js';
import { updateSEO, updateCanonicalAndOG } from './components/seo.js';
import { criarCarrosselHTML, initCarouselState } from './components/carousel.js';
import { renderOption } from './components/optionsRenderer.js';
import { createStaticFields } from './components/formFields.js';

document.addEventListener("DOMContentLoaded", async function () {
  const STORAGE_PUBLIC = 'https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/';
  let slug = getSlugFromUrl();

  if (!slug) {
    document.getElementById("produto-dinamico").innerHTML = "<p>Produto não especificado.</p>";
    dispatchReady(); // garante que o loader some mesmo em erro
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const isOnProductHtml = window.location.pathname.endsWith('product.html');
  const prettyPath = `/produto/${encodeURIComponent(slug)}`;

  if (isOnProductHtml && params.get('slug') && window.location.pathname + window.location.search !== prettyPath) {
    window.location.replace(prettyPath);
    return;
  }

  let produto;
  try {
    produto = await fetchProductBySlug(slug);
  } catch (e) {
    document.getElementById("produto-dinamico").innerHTML = "<p>Produto não encontrado.</p>";
    dispatchReady();
    return;
  }

  // normalizar opcoes
  let opcoes = [];
  if (Array.isArray(produto.opcoes)) opcoes = produto.opcoes;
  else if (typeof produto.opcoes === 'object' && produto.opcoes !== null) {
    opcoes = Object.entries(produto.opcoes).map(([label, op]) => ({ label, ...op }));
  }

  const container = document.getElementById("produto-dinamico");
  container.innerHTML = '';

  // carrossel de imagens (se existir)
  let carouselImageElements = [];
  if (produto.images && produto.images.length > 0) {
    const imageSection = document.createElement('div');
    imageSection.className = 'product-image';
    imageSection.innerHTML = criarCarrosselHTML(slug, produto.images, STORAGE_PUBLIC);
    container.appendChild(imageSection);

    // inicializa o estado global do carrossel (indicadores, transform, etc)
    initCarouselState();

    // captura imagens do carrossel para esperar pelo carregamento
    carouselImageElements = Array.from(imageSection.querySelectorAll('img'));
  }

  // formulário
  const form = document.createElement('form');
  form.className = 'product';
  form.id = 'orcamentoForm';
  form.method = 'POST';
  form.enctype = 'multipart/form-data';

  const productNameInput = document.createElement('input');
  productNameInput.type = 'text';
  productNameInput.value = produto.name || produto.nome;
  productNameInput.className = 'productname';
  productNameInput.id = 'productname';
  productNameInput.name = 'Produto';
  form.appendChild(productNameInput);

  const detailsDiv = document.createElement('div');
  detailsDiv.className = 'product-details';

  const h1 = document.createElement('h1');
  h1.textContent = produto.name || produto.nome;
  detailsDiv.appendChild(h1);

  (opcoes || []).forEach((opt, idx) => {
    const optGroup = document.createElement('div');
    optGroup.className = 'option-group';
    const rendered = renderOption(opt, idx);
    optGroup.appendChild(rendered);
    detailsDiv.appendChild(optGroup);
  });

  detailsDiv.appendChild(createStaticFields());
  form.appendChild(detailsDiv);
  container.appendChild(form);

  // --- Bloco Produtos Relacionados ---
  const relatedSection = buildRelatedSection();
  container.appendChild(relatedSection);
  try { await loadRelatedProducts({ category: produto.category, currentSlug: slug }); } catch(e) { console.error(e); }
  // --- fim relacionados ---

  // SEO e canonical
  updateSEO({
    title: `${produto.name || produto.nome} | GráficaPT`,
    description: produto.descricao || produto.description || 'Produto personalizado da GráficaPT.'
  });
  updateCanonicalAndOG({
    url: `${location.origin}/produto/${encodeURIComponent(slug)}`,
    image: (produto.images && produto.images[0]) ? `${STORAGE_PUBLIC}${slug}/${produto.images[0]}` : undefined
  });

  // espera imagens do carrossel carregarem (se houver), com timeout de segurança
  await waitForImages(carouselImageElements, 5000);

  // finalmente dispara o evento que o loader ouve
  dispatchReady();
});


// ====== Produtos Relacionados (mesma categoria) ======
function buildRelatedSection(){
  const section = document.createElement('section');
  section.id = 'related-products';
  section.className = 'related';
  section.innerHTML = `
    <div class="related__head">
      <h2>Produtos relacionados</h2>
      <a id="related-more" class="related__more hidden" href="#">Ver mais</a>
    </div>
    <div id="related-grid" class="related__grid"></div>
    <div id="related-empty" class="related__empty hidden">Sem produtos relacionados.</div>
  `;
  return section;
}

// ====== Produtos Relacionados (robusto a 400) ======
function renderRelatedCard(p){
  const img =
    p.cover_image_url ||
    p.image_url ||
    (Array.isArray(p.images) && p.images[0]) ||
    'https://placehold.co/600x400?text=Produto';

  const name = p.name || p.nome || 'Produto';

  // aceita price_cents OU price (número) OU price (string)
  let priceStr = '';
  if (Number.isFinite(p.price_cents)) {
    priceStr = (p.price_cents / 100).toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
  } else if (Number.isFinite(p.price)) {
    priceStr = p.price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' });
  } else if (typeof p.price === 'string' && p.price.trim()) {
    priceStr = p.price;
  }

  return `
    <a class="related__card" href="/produto/${encodeURIComponent(p.slug)}" aria-label="${name}">
      <div class="related__thumbwrap">
        <img class="related__thumb" src="${img}" alt="${name}" loading="lazy">
      </div>
      <div class="related__body">
        <h3 class="related__title">${name}</h3>
        ${priceStr ? `<p class="related__price">${priceStr}</p>` : ``}
      </div>
    </a>
  `;
}

/**
 * Tenta obter uma amostra de colunas disponíveis. Se falhar (400),
 * devolve um conjunto mínimo conhecido para evitar o erro.
 */
async function detectProductColumns(){
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (error) throw error;

    const row = Array.isArray(data) && data[0] ? data[0] : {};
    const cols = new Set(Object.keys(row));

    return cols; // Set com nomes de colunas reais
  } catch (e) {
    console.warn('detectProductColumns falhou, a usar colunas mínimas.', e);
    // fallback minimal (muito provável existirem)
    return new Set(['slug','name','category']);
  }
}

async function loadRelatedProducts({ category, currentSlug, limit = 4 }){
  const grid  = document.getElementById('related-grid');
  const empty = document.getElementById('related-empty');
  const more  = document.getElementById('related-more');

  if (!category){
    empty.classList.remove('hidden');
    return;
  }

  grid.innerHTML = `<div class="related__empty">A carregar…</div>`;

  // 1) detetar colunas disponíveis
  const cols = await detectProductColumns();

  // 2) montar select só com colunas existentes
  const wanted = ['id','slug','name','nome','price_cents','price','cover_image_url','image_url','images','category','status','updated_at'];
  const selectCols = wanted.filter(c => cols.has(c));
  // garante pelo menos slug/name/category
  if (!selectCols.includes('slug')) selectCols.push('slug');
  if (!selectCols.includes('name') && !selectCols.includes('nome')) selectCols.push('name');
  if (!selectCols.includes('category')) selectCols.push('category');

  // 3) construir query passo a passo para evitar 400
  let q = supabase
    .from('products')
    .select(selectCols.join(','))
    .eq('category', category)
    .neq('slug', currentSlug)
    .limit(limit + 1);

  // filtro status se existir
  if (cols.has('status')) {
    q = q.eq('status', 'published');
  }

  // ordenação se existir updated_at ou id
  if (cols.has('updated_at')) {
    q = q.order('updated_at', { ascending: false });
  } else if (cols.has('id')) {
    q = q.order('id', { ascending: false });
  }

  // 4) executar com fallback: se der 400, vai retirando ordenação/filtros até funcionar
  let data, error;

  // tentativa 1 (com tudo)
  ({ data, error } = await q);

  // tentativa 2: sem order
  if (error && (error.code === 'PGRST102' || error.code === 'PGRST204' || error.status === 400)) {
    try {
      let q2 = supabase
        .from('products')
        .select(selectCols.join(','))
        .eq('category', category)
        .neq('slug', currentSlug)
        .limit(limit + 1);
      if (cols.has('status')) q2 = q2.eq('status', 'published');
      ({ data, error } = await q2);
    } catch(e){ error = e; }
  }

  // tentativa 3: sem status
  if (error && (error.code === 'PGRST102' || error.code === 'PGRST204' || error.status === 400)) {
    try {
      let q3 = supabase
        .from('products')
        .select(selectCols.join(','))
        .eq('category', category)
        .neq('slug', currentSlug)
        .limit(limit + 1);
      ({ data, error } = await q3);
    } catch(e){ error = e; }
  }

  // tentativa 4: select mínimo mesmo (slug,name/nome,category)
  if (error && (error.code === 'PGRST102' || error.code === 'PGRST204' || error.status === 400)) {
    const minimalSelect = ['slug', cols.has('name') ? 'name' : (cols.has('nome') ? 'nome' : 'name'), 'category']
      .filter(Boolean)
      .join(',');
    try {
      let q4 = supabase
        .from('products')
        .select(minimalSelect)
        .eq('category', category)
        .neq('slug', currentSlug)
        .limit(limit + 1);
      ({ data, error } = await q4);
    } catch(e){ error = e; }
  }

  if (error) {
    console.error('Erro a carregar relacionados:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      status: error.status
    });
    grid.innerHTML = `<div class="related__empty error">Erro ao carregar.</div>`;
    more.classList.add('hidden');
    return;
  }

  if (!data || data.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    more.classList.add('hidden');
    return;
  }

  const hasMore = data.length > limit;
  const show = data.slice(0, limit);
  grid.innerHTML = show.map(renderRelatedCard).join('');

  if (hasMore) {
    more.href = `/categoria/${encodeURIComponent(category)}`;
    more.classList.remove('hidden');
  } else {
    more.classList.add('hidden');
  }
}
// ====== /Produtos Relacionados ======


function dispatchReady() {
  document.dispatchEvent(new Event('product:ready'));
  console.log("Loaded")
  window.prerenderReady = true;
}

/**
 * Espera pelo carregamento de todas as imagens ou timeout
 * @param {HTMLImageElement[]} imgs
 * @param {number} timeoutMs
 * @returns {Promise<void>}
 */
function waitForImages(imgs, timeoutMs = 5000) {
  if (!imgs || imgs.length === 0) return Promise.resolve();

  const promises = imgs.map(img => {
    if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
    return new Promise(res => {
      const onLoadOrError = () => {
        img.removeEventListener('load', onLoadOrError);
        img.removeEventListener('error', onLoadOrError);
        res();
      };
      img.addEventListener('load', onLoadOrError);
      img.addEventListener('error', onLoadOrError);
    });
  });

  const timeout = new Promise(res => setTimeout(res, timeoutMs));
  return Promise.race([Promise.all(promises), timeout]).then(() => {});
}
