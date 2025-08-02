import { fetchProductBySlug } from './services/productService.js';
import { getSlugFromUrl } from './utils/slug.js';
import { updateSEO, updateCanonicalAndOG } from './components/seo.js';
import { createCarousel } from './components/carousel.js';
import { renderOption } from './components/optionsRenderer.js';
import { createStaticFields } from './components/formFields.js';

document.addEventListener("DOMContentLoaded", async function () {
  const STORAGE_PUBLIC = 'https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/';
  let slug = getSlugFromUrl();

  if (!slug) {
    document.getElementById("produto-dinamico").innerHTML = "<p>Produto não especificado.</p>";
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
    return;
  }

  console.log("Slug:", slug);
console.log("Produto.images:", produto.images);
if (produto.images && produto.images.length) {
  produto.images.forEach((img, i) => {
    let url = img.startsWith("http")
      ? img
      : `https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/${img}`;
    console.log(`Imagem ${i}:`, url);
  });
}


  // normalizar opcoes
  let opcoes = [];
  if (Array.isArray(produto.opcoes)) opcoes = produto.opcoes;
  else if (typeof produto.opcoes === 'object' && produto.opcoes !== null) {
    opcoes = Object.entries(produto.opcoes).map(([label, op]) => ({ label, ...op }));
  }

  const container = document.getElementById('produto-dinamico');
  container.innerHTML = '';

  // produto name hidden input
  const form = document.createElement('form');
  form.className='product';
  form.id='orcamentoForm';
  form.method='POST';
  form.enctype='multipart/form-data';

  const productNameInput = document.createElement('input');
  productNameInput.type='text';
  productNameInput.value=produto.name || produto.nome;
  productNameInput.className='productname';
  productNameInput.id='productname';
  productNameInput.name='Produto';
  form.appendChild(productNameInput);

  const detailsDiv = document.createElement('div');
  detailsDiv.className='product-details';

  const h1 = document.createElement('h1');
  h1.textContent=produto.name || produto.nome;
  detailsDiv.appendChild(h1);

  // opções dinamicas
  (opcoes || []).forEach((opt, idx) => {
    const optWrapper = document.createElement('div');
    optWrapper.className='option-group';
    const rendered = renderOption(opt, idx);
    optWrapper.appendChild(rendered);
    detailsDiv.appendChild(optWrapper);
  });

  // campos fixos
  detailsDiv.appendChild(createStaticFields());

  form.appendChild(detailsDiv);
  container.appendChild(form);

  // SEO e canonical
  updateSEO(produto);
  updateCanonicalAndOG(slug);

  // carregar script externo
  setTimeout(() => {
    const script = document.createElement('script');
    script.src = 'https://graficapt.com/js/formSender.js';
    document.body.appendChild(script);
  }, 100);
});
