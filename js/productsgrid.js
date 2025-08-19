import { supabase } from './supamanager/supabase.js';
const STORAGE_PUBLIC = 'https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/';

function getBannerUrl(prod) {
  if (prod.banner) {
    // Caso seja só o nome, monta caminho completo
    return prod.banner.startsWith('http')
      ? prod.banner
      : STORAGE_PUBLIC + prod.banner;
  }
  if (prod.images && prod.images.length > 0) {
    // Se for um array de strings (caminhos das imagens)
    return prod.images[0].startsWith('http')
      ? prod.images[0]
      : STORAGE_PUBLIC + prod.images[0];
  }
  return "https://via.placeholder.com/400x300?text=Sem+Imagem";
}

async function renderProdutos() {

  const { data: produtos, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    document.getElementById("products-grid").innerHTML = "<p>Erro a carregar produtos.</p>";
    return;
  }

  const categorias = Array.from(new Set(produtos.map(p => p.category))).filter(Boolean);

  const filterCategory = document.getElementById("filterCategory");
  filterCategory.innerHTML = `<option value="all">Todos os Produtos</option>` +
    categorias.map(cat => `<option value="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`).join('');

  const productsGrid = document.getElementById("products-grid");

  function showProdutos(category) {
    let lista = produtos;
    if (category && category !== "all") {
      lista = lista.filter(p => p.category === category);
    }
    productsGrid.innerHTML = lista.map(prod => {
      const imgSrc = getBannerUrl(prod);
      let href = `/produto/${prod.slug}`;
      return `
        <div class="cell" data-categoria="${prod.category}" data-nome="${prod.slug}" onclick="location.href = '${href}'">
          <img src="${imgSrc}" alt="${prod.name}" loading="lazy">
          <div class="cellText">${prod.name}</div>
          <div class="cellBtn">Ver Opções</div>
        </div>
      `;
    }).join('');
    console.log("Loaded")
  window.prerenderReady = true;
  }

  filterCategory.onchange = function() {
    showProdutos(this.value);
  };

  showProdutos("all");
}

renderProdutos();
