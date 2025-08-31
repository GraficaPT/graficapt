// Merged bundle: auto-generated
;(function(){

/* ===== File: js/products.js ===== */
const supabase = (window.Supa && window.Supa.client) || null;
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

  updateSEO(produto);
  updateCanonicalAndOG(slug);

  setTimeout(() => {
    const script = document.createElement('script');
    script.src = 'https://graficapt.com/js/formSender.js';
    document.body.appendChild(script);
  }, 100);

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
  console.log("Loaded");
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


/* ===== File: js/productsgrid.js ===== */
const supabase = (window.Supa && window.Supa.client) || null;
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
  }

  filterCategory.onchange = function() {
    showProdutos(this.value);
  };

  showProdutos("all");
  console.log("Loaded..");
  window.prerenderReady = true;
}

renderProdutos();



/* ===== File: js/filter.js ===== */
const supabase = (window.Supa && window.Supa.client) || null;
let shouldScrollToProducts = false;

function applyFilters(scroll = false) {
    const hash = window.location.hash;
    const filter = hash.startsWith("#filter=") ? hash.replace("#filter=", "") : "all";
    const sort = document.getElementById("sortBy")?.value || "default";

    const dropdown = document.getElementById("filterCategory");
    if (dropdown) dropdown.value = filter;

    const grid = document.querySelector(".products-grid");
    const cells = Array.from(grid.querySelectorAll(".cell"));

    // Filter
    cells.forEach(cell => {
        const categoria = cell.dataset.categoria;
        const show = (filter === "all" || categoria === filter);
        cell.style.display = show ? "flex" : "none";
    });

    // Sort
    if (sort !== "default") {
        const visibleCells = cells.filter(cell => cell.style.display !== "none");
        visibleCells.sort((a, b) => {
            const aName = a.dataset.nome.toLowerCase();
            const bName = b.dataset.nome.toLowerCase();
            return sort === "az" ? aName.localeCompare(bName) : bName.localeCompare(aName);
        });
        visibleCells.forEach(cell => grid.appendChild(cell));
    }

    // Scroll
    if (scroll) {
        const gridSection = document.getElementById("products");
        if (gridSection) {
            setTimeout(() => {
                gridSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }

    // Reset scroll flag
    shouldScrollToProducts = false;
}

// Triggered when hash changes (even first time)
window.addEventListener("hashchange", () => {
    applyFilters(shouldScrollToProducts); // now uses correct flag
});

document.addEventListener("DOMContentLoaded", () => {
    // Detect if coming in with a filter in URL
    if (window.location.hash.startsWith("#filter=")) {
        shouldScrollToProducts = true;
    }

    applyFilters(shouldScrollToProducts);

    // Dropdown
    const filterDropdown = document.getElementById("filterCategory");
    if (filterDropdown) {
        filterDropdown.addEventListener("change", function () {
            shouldScrollToProducts = true;
            const newHash = "#filter=" + this.value;
            if (window.location.hash !== newHash) {
                location.hash = newHash;
            } else {
                applyFilters(true);
            }
        });
    }

    // Topbar filter links
    document.querySelectorAll('a[href*="#filter="]').forEach(link => {
        link.addEventListener("click", (e) => {
            const href = link.getAttribute("href");
            const url = new URL(href, window.location.href);
            const hash = url.hash;

            if (hash.startsWith("#filter=")) {
                e.preventDefault();
                shouldScrollToProducts = true;

                if (window.location.hash !== hash) {
                    window.location.hash = hash;
                } else {
                    applyFilters(true);
                }
            }
        });
    });
});


/* ===== File: js/footerheader.js ===== */
const supabase = (window.Supa && window.Supa.client) || null;
const topbarHTML = `
    <div class="bar">
        <img src="../imagens/social/logo_minimal.svg" onclick="location.href = '/index.html'">
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
            <img src="../imagens/social/logo_minimal.svg" class="sidebar-logo" onclick="location.href = '/index.html'">
        </div>
        <a href="/index.html#filter=Rigidos">Suportes Rigídos</a>
        <a href="/index.html#filter=Bandeiras">Bandeiras Publicitárias</a>
        <a href="/index.html#filter=Sacos">Sacos</a>
        <a href="/index.html#filter=Vestuario">Vestuário</a>
        <a href="/index.html#filter=all">Ver Tudo</a>
    </div>
    <div class="overlay" id="overlay" onclick="toggleSidebar()"></div>
`;


const footerHTML = ` 
        <div class="footer-columns">
            <div class="footer-column">
                <h4>Ajuda</h4>
                <a>comercial@graficapt.com</a>
                <a href="https://www.instagram.com/graficapt/">@graficapt</a>
            </div>
            <div class="footer-column">
                <h4>Empresa</h4>
                <a href="aboutus.html">Sobre nós</a>
                <a href="#">Trabalha connosco</a>
                <a href="https://www.instagram.com/graficapt/">Segue-nos</a>
            </div>
            <div class="footer-column">
                <h4>Produtos</h4>
                <a href="/index.html#filter=all"">Todos os produtos</a>
                <a href="/index.html#filter=Bandeiras">Bandeiras</a>
                <a href="/index.html#filter=Sacos">Sacos</a>
            </div>
            <div class="footer-column">
                <h4>Subscreve a nossa newsletter</h4>
                <form class="newsletter-form">
                    <input type="email" placeholder="O teu email">
                    <button type="submit">Subscrever</button>
                </form>
                <div class="social-icons hcenter">
                    <img href="https://www.facebook.com/profile.php?id=61564124441415" src="../imagens/social/facebook.svg" alt="Facebook">
                    <img href="https://www.instagram.com/graficapt/" src="../imagens/social/instagram.svg" alt="Instagram">
                    <img href="https://wa.me/351969205741" src="../imagens/social/whatsapp.svg" alt="WhatsApp">
                </div>
            </div>
        </div>
        <div class="footer-bottom">
            © 2025 GraficaPT. Todos os direitos reservados.
        </div>
`;

function insertComponents() {
    document.getElementById('topbar').innerHTML = topbarHTML;
    document.getElementById('footer').innerHTML = footerHTML;
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const isOpen = sidebar.style.left === "0%";
    sidebar.style.left = isOpen ? "-100%" : "0%";
    overlay.style.display = isOpen ? "none" : "block";
}

document.addEventListener('DOMContentLoaded', insertComponents);


/* ===== File: js/formSender.js ===== */
const supabase = (window.Supa && window.Supa.client) || null;
// Garante que só corre uma vez
if (!window.formSenderInitialized) {
  window.formSenderInitialized = true;

  function inicializarForm() {
    const form = document.getElementById('orcamentoForm');
    if (!form) return; // Se o form ainda não existir, sai

    const ficheiroInput = document.getElementById('ficheiro');
    const linkHidden = document.getElementById('link_ficheiro');
    const status = document.getElementById('uploadStatus');
    const btnSubmit = document.getElementById('submit');
    let ficheiroEmUpload = false;

    // 🔹 SUBMISSÃO DO FORMULÁRIO
    form.addEventListener('submit', function (e) {
      e.preventDefault(); // Impede envio nativo

      if (ficheiroInput && ficheiroEmUpload) {
        alert("Por favor aguarde o carregamento do ficheiro.");
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.style.backgroundColor = '#191919';

      const formData = new FormData(form);
      fetch(
        "https://script.google.com/macros/s/AKfycbyZo3TNBoxKVHGgP_J1rKX1C3fEcD79i7VyUpMHV9J7gjJlmHQrD3Cm0l_i5fMllJnH/exec",
        { method: "POST", body: formData }
      )
        .then(response => {
          if (response.ok) {
            alert("Pedido de orçamento enviado com sucesso!\nIremos contactá-lo em breve.");
            window.location.href = "https://graficapt.com";
          } else {
            throw new Error("Erro ao enviar formulário");
          }
        })
        .catch(error => {
          alert("Erro ao enviar: " + error.message);
          btnSubmit.disabled = false;
          btnSubmit.style.backgroundColor = '';
        });
    });

    // 🔹 UPLOAD DE FICHEIRO
    if (ficheiroInput && linkHidden && status) {
      ficheiroInput.addEventListener('change', function () {
        const ficheiro = ficheiroInput.files[0];
        if (!ficheiro) return;
        
        ficheiroEmUpload = true;
        status.style.display = 'block';
        status.textContent = "A enviar ficheiro...";
        ficheiroInput.display = 'none';
        btnSubmit.disabled = true;
        btnSubmit.style.backgroundColor = '#191919';

        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result.split(',')[1];
          const formData = new FormData();
          formData.append("base64", base64);
          formData.append("type", ficheiro.type);
          formData.append("name", ficheiro.name);

          try {
            const response = await fetch(
              "https://script.google.com/macros/s/AKfycbze3L1NAp89zQsRXpC1e8Vw8527yuwPIqv7oSx-3RWI3oaNKCT8ldYPkoazegH4mzZgEQ/exec",
              { method: "POST", body: formData }
            );
            const result = await response.text();
            if (result.startsWith("http")) {
              linkHidden.value = result;
              ficheiroEmUpload = false;
              status.innerHTML = `✅ <a href="${result}" target="_blank">Ficheiro carregado</a>`;
              ficheiroInput.style.disabled = true;
              btnSubmit.disabled = false;
              btnSubmit.style.backgroundColor = '';
            } else {
              throw new Error("Resposta inesperada: " + result);
            }
          } catch (erro) {
            status.textContent = "❌ Erro: " + erro.message;
            ficheiroInput.disabled = false;
          }
        };
        reader.readAsDataURL(ficheiro);
      });
    }
  }

  const observer = new MutationObserver(() => {
    if (document.getElementById('orcamentoForm')) {
      observer.disconnect();
      inicializarForm();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}


/* ===== File: js/loader.js ===== */
const supabase = (window.Supa && window.Supa.client) || null;
// loader.js
(function () {
  const OVERLAY_ID = 'loader-overlay';
  const TARGET_ID_PRODUCT = 'produto-dinamico';
  const TARGET_ID_GRID = 'products-grid';
  const MAX_TIMEOUT_MS = 12000;
  const DEBOUNCE_AFTER_LAST_LOAD_MS = 300;

  // cria overlay
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-label', 'A carregar conteúdo da página');
  overlay.innerHTML = `
    <div class="logo-wrapper">
      <img src="/imagens/social/logo_minimal.svg" alt="Logotipo GráficaPT">
    </div>
    <div class="spinner" aria-hidden="true"></div>
    <div class="sr-only" aria-live="polite">Carregando…</div>
  `;

  document.documentElement.classList.add('loading');
  document.body.classList.add('loading');
  document.body.appendChild(overlay);

  function hideLoader() {
    if (!overlay) return;
    document.body.classList.remove('loading');
    overlay.classList.add('loaded');
    overlay.addEventListener('transitionend', () => {
      overlay.remove();
    }, { once: true });
  }

  // observa imagens dentro de um container e resolve quando todas carregam (com debounce)
  function waitForImagesWithDebounce(container, signalDone) {
    return new Promise((resolve) => {
      const pending = new Set();
      let debounceTimer = null;
      let finished = false;

      const checkDone = () => {
        if (pending.size === 0) {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            if (pending.size === 0 && !finished) {
              finished = true;
              cleanup();
              resolve();
            }
          }, DEBOUNCE_AFTER_LAST_LOAD_MS);
        }
      };

      const monitorImg = (img) => {
        if (img.complete && img.naturalWidth !== 0) return;
        if (pending.has(img)) return;
        pending.add(img);
        const onEvent = () => {
          img.removeEventListener('load', onEvent);
          img.removeEventListener('error', onEvent);
          pending.delete(img);
          checkDone();
        };
        img.addEventListener('load', onEvent);
        img.addEventListener('error', onEvent);
      };

      const scan = () => {
        container.querySelectorAll('img').forEach(monitorImg);
        checkDone();
      };

      const mo = new MutationObserver(() => {
        scan();
      });

      mo.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset'] });

      // inicial
      scan();

      const timeout = setTimeout(() => {
        if (!finished) {
          finished = true;
          cleanup();
          resolve();
        }
      }, MAX_TIMEOUT_MS);

      const cleanup = () => {
        clearTimeout(timeout);
        clearTimeout(debounceTimer);
        mo.disconnect();
      };
    });
  }

  // lógica principal para index (grid) ou product
  async function init() {
    const targetProduct = document.getElementById(TARGET_ID_PRODUCT);
    const targetGrid = document.getElementById(TARGET_ID_GRID);

    let used = false;

    // Handler comum: espera imagens e esconde
    const finalize = async (container) => {
      if (used) return;
      used = true;
      await waitForImagesWithDebounce(container);
      hideLoader();
    };

    // 1. Se for product.html e receber event
    document.addEventListener('product:ready', () => {
      if (targetProduct) finalize(targetProduct);
    }, { once: true });

    // 2. Se for index.html: observa o grid até ter filhos e depois espera imagens
    if (targetGrid) {
      const observer = new MutationObserver((mutations, obs) => {
        if (targetGrid.children.length > 0) {
          // Há conteúdo — parar observer e finalizar
          obs.disconnect();
          finalize(targetGrid);
        }
      });
      observer.observe(targetGrid, { childList: true, subtree: false });

      // Caso já esteja preenchido rápido
      if (targetGrid.children.length > 0) {
        finalize(targetGrid);
      }
    }

    // 3. Fallback absoluto
    setTimeout(() => {
      hideLoader();
    }, MAX_TIMEOUT_MS + 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


/* ===== File: js/analytics.js ===== */
const supabase = (window.Supa && window.Supa.client) || null;
window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-V28GHLM5ZE');
})();
