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

function renderRelatedCard(p){
  const img = p.cover_image_url || 'https://placehold.co/600x400?text=Produto';
  const name = p.name || 'Produto';
  const price = Number.isFinite(p.price_cents) ? (p.price_cents/100).toLocaleString('pt-PT',{style:'currency','currency':'EUR'}) : '';
  return `
    <a class="related__card" href="/produto/${encodeURIComponent(p.slug)}" aria-label="${name}">
      <div class="related__thumbwrap">
        <img class="related__thumb" src="${img}" alt="${name}" loading="lazy">
      </div>
      <div class="related__body">
        <h3 class="related__title">${name}</h3>
        ${price ? `<p class="related__price">${price}</p>` : ``}
      </div>
    </a>
  `;
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

  // 1ª tentativa: ordenar por id desc (coluna quase garantida)
  let { data, error } = await supabase
    .from('products')
    .select('id,slug,name,price_cents,cover_image_url,category,status') // sem updated_at
    .eq('category', category)
    .eq('status', 'published')
    .neq('slug', currentSlug)
    .order('id', { ascending: false }) // sem updated_at
    .limit(limit + 1);

  // Se ainda assim der erro, faz uma tentativa sem order (alguns esquemas usam uuid sem ordem natural)
  if (error) {
    console.warn('loadRelatedProducts: fallback sem ORDER. Detalhes:', error);
    ({ data, error } = await supabase
      .from('products')
      .select('id,slug,name,price_cents,cover_image_url,category,status')
      .eq('category', category)
      .eq('status', 'published')
      .neq('slug', currentSlug)
      .limit(limit + 1)
    );
  }

  if (error) {
    console.error('Erro a carregar relacionados:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
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
