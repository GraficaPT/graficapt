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
    image: primaryImageUrl(produto, STORAGE_PUBLIC)
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
    </div>
    <div id="related-grid" class="related__grid"></div>
  `;
  return section;
}

function joinPublicPath(prefix, path) {
  const parts = String(path).split('/').filter(Boolean).map(encodeURIComponent);
  return prefix + parts.join('/');
}

function resolveImagePath(slug, raw, STORAGE_PUBLIC) {
  if (!raw || typeof raw !== 'string') return undefined;
  const s = raw.trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.includes('/')) return joinPublicPath(STORAGE_PUBLIC, s);
  return joinPublicPath(STORAGE_PUBLIC, `${slug}/${s}`);
}

function primaryImageUrl(prod, STORAGE_PUBLIC) {
  const cands = [];
  if (Array.isArray(prod.images) && prod.images[0]) cands.push(prod.images[0]);
  if (prod.banner) cands.push(prod.banner);
  for (const c of cands) {
    const u = resolveImagePath(prod.slug, c, STORAGE_PUBLIC);
    if (u) return u;
  }
  return undefined;
}

function relatedImageUrl(p, STORAGE_PUBLIC) {
  if (Array.isArray(p.images) && p.images[0]) {
    const u = resolveImagePath(p.slug, p.images[0], STORAGE_PUBLIC);
    if (u) return u;
  }
  if (p.banner) {
    const u = resolveImagePath(p.slug, p.banner, STORAGE_PUBLIC);
    if (u) return u;
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

  if (!category){
    grid.innerHTML = '';
    return;
  }

  let { data, error } = await supabase
    .from('products')
    .select('id, slug, name, images, banner, category')
    .eq('category', category)
    .neq('slug', currentSlug)
    .order('id', { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) {
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = data.map(p => renderRelatedCard(p, STORAGE_PUBLIC)).join('');
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
