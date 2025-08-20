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
    dispatchReady();
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

  let opcoes = [];
  if (Array.isArray(produto.opcoes)) opcoes = produto.opcoes;
  else if (typeof produto.opcoes === 'object' && produto.opcoes !== null) {
    opcoes = Object.entries(produto.opcoes).map(([label, op]) => ({ label, ...op }));
  }

  const container = document.getElementById("produto-dinamico");
  container.innerHTML = '';

  let carouselImageElements = [];
  if (produto.images && produto.images.length > 0) {
    const imageSection = document.createElement('div');
    imageSection.className = 'product-image';
    imageSection.innerHTML = criarCarrosselHTML(slug, produto.images, STORAGE_PUBLIC);
    container.appendChild(imageSection);
    initCarouselState();
    carouselImageElements = Array.from(imageSection.querySelectorAll('img'));
  }

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

  const relatedSection = buildRelatedSection();
  container.appendChild(relatedSection);
  try { await loadRelatedProducts({ category: produto.category, currentSlug: slug, STORAGE_PUBLIC }); } catch(e) {}

  updateSEO({
    title: `${produto.name || produto.nome} | GráficaPT`,
    description: produto.descricao || produto.description || 'Produto personalizado da GráficaPT.'
  });
  updateCanonicalAndOG({
    url: `${location.origin}/produto/${encodeURIComponent(slug)}`,
    image: (produto.images && produto.images[0]) ? `${STORAGE_PUBLIC}${slug}/${produto.images[0]}` : undefined
  });

  await waitForImages(carouselImageElements, 5000);
  dispatchReady();
});

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

function relatedImageUrl(p, STORAGE_PUBLIC) {
  if (Array.isArray(p.images) && p.images.length > 0 && p.images[0]) {
    return `${STORAGE_PUBLIC}${encodeURIComponent(p.slug)}/${encodeURIComponent(p.images[0])}`;
  }
  if (p.banner) {
    return `${STORAGE_PUBLIC}${encodeURIComponent(p.slug)}/${encodeURIComponent(p.banner)}`;
  }
  return 'https://placehold.co/800x600?text=Produto';
}

function renderRelatedCard(p, STORAGE_PUBLIC){
  const img = relatedImageUrl(p, STORAGE_PUBLIC);
  const name = p.name || 'Produto';
  return `
    <a class="related__card" href="/produto/${encodeURIComponent(p.slug)}" aria-label="${name}">
      <div class="related__thumbwrap">
        <img class="related__thumb" src="${img}" alt="${name}" loading="lazy">
      </div>
      <div class="related__body">
        <h3 class="related__title">${name}</h3>
      </div>
    </a>
  `;
}

async function loadRelatedProducts({ category, currentSlug, limit = 4, STORAGE_PUBLIC }){
  const grid  = document.getElementById('related-grid');
  const empty = document.getElementById('related-empty');
  const more  = document.getElementById('related-more');

  if (!category){
    empty.classList.remove('hidden');
    return;
  }

  grid.innerHTML = `<div class="related__empty">A carregar…</div>`;

  let { data, error } = await supabase
    .from('products')
    .select('id, slug, name, images, banner, category')
    .eq('category', category)
    .neq('slug', currentSlug)
    .order('id', { ascending: false })
    .limit(limit + 1);

  if (error) {
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

  empty.classList.add('hidden');

  const hasMore = data.length > limit;
  const show = data.slice(0, limit);
  grid.innerHTML = show.map(p => renderRelatedCard(p, STORAGE_PUBLIC)).join('');

  if (hasMore) {
    more.href = `/categoria/${encodeURIComponent(category)}`;
    more.classList.remove('hidden');
  } else {
    more.classList.add('hidden');
  }
}

function dispatchReady() {
  document.dispatchEvent(new Event('product:ready'));
  window.prerenderReady = true;
}

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
