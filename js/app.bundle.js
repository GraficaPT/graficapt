;(function(window,document){'use strict';
const supabase = (window.Supa && window.Supa.client) || null;

/* ===== js/utils/slug.js ===== */
function getSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  let slug = params.get("slug");
  if (slug) return slug;
  const pathParts = window.location.pathname.split('/');
  return pathParts[pathParts.length - 1] || null;
}



/* ===== js/components/carousel.js ===== */
function criarCarrosselHTML(slug, imagens, storagePublic) {
  function getImageUrl(imagem) {
    if (!imagem) return '';
    if (imagem.startsWith('http')) return imagem;
    return storagePublic + imagem;
  }

  return `
    <div class="carrossel-container">
      <button class="carrossel-btn prev" onclick="mudarImagem(-1)" aria-label="Anterior">&#10094;</button>
      <div class="carrossel-imagens-wrapper">
        <div class="carrossel-imagens" id="carrossel">
          ${(imagens || []).map((imagem, index) => `
            <img src="${getImageUrl(imagem)}" alt="Imagem ${index + 1}" class="carrossel-img" loading="lazy" onerror="this.style.opacity='0.4'; this.alt='Erro ao carregar imagem';">
          `).join('')}
        </div>
      </div>
      <button class="carrossel-btn next" onclick="mudarImagem(1)" aria-label="Seguinte">&#10095;</button>
    </div>
    <div class="indicadores" id="indicadores"></div>
  `;
}

function initCarouselState() {
  // estado global
  window.imagemAtual = window.imagemAtual ?? 0;

  // helpers internos
  function atualizarIndicadores() {
    const indicadores = document.querySelectorAll('.indicador');
    indicadores.forEach((el, i) => {
      el.classList.toggle('ativo', i === window.imagemAtual);
    });
  }

  const wrapper = document.querySelector('.carrossel-imagens');
  if (!wrapper) return;

  // funções expostas
  window.mudarImagem = (incremento) => {
    const imagens = document.querySelectorAll('.carrossel-img');
    if (!wrapper || imagens.length === 0) return;
    const total = imagens.length;
    window.imagemAtual = (window.imagemAtual + incremento + total) % total;
    wrapper.style.transform = `translateX(-${window.imagemAtual * 100}%)`;
    atualizarIndicadores();
  };

  window.irParaImagem = (index) => {
    if (!wrapper) return;
    window.imagemAtual = index;
    wrapper.style.transform = `translateX(-${window.imagemAtual * 100}%)`;
    atualizarIndicadores();
  };

  window.selecionarCorEImagem = function (imgPath) {
    if (!imgPath) return;
    const imagens = document.querySelectorAll('.carrossel-img');
    let idx = Array.from(imagens).findIndex(img => {
      return img.src.endsWith(imgPath) || img.src.includes(imgPath);
    });
    if (idx >= 0) {
      window.irParaImagem(idx);
    }
  };

  // indicadores
  const criarIndicadores = () => {
    const imagens = document.querySelectorAll('.carrossel-img');
    const indicadoresContainer = document.getElementById('indicadores');
    if (!indicadoresContainer || imagens.length === 0) return;
    if (indicadoresContainer.children.length === imagens.length) {
      atualizarIndicadores();
      return;
    }
    indicadoresContainer.innerHTML = '';
    imagens.forEach((_, index) => {
      const dot = document.createElement('div');
      dot.classList.add('indicador');
      if (index === window.imagemAtual) dot.classList.add('ativo');
      dot.addEventListener('click', () => window.irParaImagem(index));
      indicadoresContainer.appendChild(dot);
    });
  };

  // swipe / drag support
  function setupSwipe() {
    const parent = document.querySelector('.carrossel-imagens-wrapper');
    if (!parent) return;

    let startX = 0;
    let isDown = false;
    let moved = false;

    const threshold = 50; // px mínimo para considerar swipe

    // pointer events cover mouse and touch
    parent.addEventListener('pointerdown', (e) => {
      isDown = true;
      startX = e.clientX;
      moved = false;
      parent.setPointerCapture(e.pointerId);
    });

    parent.addEventListener('pointermove', (e) => {
      if (!isDown) return;
      const deltaX = e.clientX - startX;
      if (Math.abs(deltaX) > 5) {
        moved = true;
      }
      // opcional: feedback visual durante arrasto (pode comentar se não quiser)
      // wrapper.style.transition = 'none';
      // wrapper.style.transform = `translateX(calc(-${window.imagemAtual * 100}% + ${deltaX}px))`;
    });

    parent.addEventListener('pointerup', (e) => {
      if (!isDown) return;
      isDown = false;
      const deltaX = e.clientX - startX;
      // restabelece transform fixo
      // wrapper.style.transition = '';
      if (Math.abs(deltaX) >= threshold) {
        if (deltaX > 0) {
          window.mudarImagem(-1);
        } else {
          window.mudarImagem(1);
        }
      } else if (!moved) {
        // clique curto sem arrasto: nada extra
      } else {
        // pequeno movimento, reposiciona
        window.irParaImagem(window.imagemAtual);
      }
    });

    parent.addEventListener('pointercancel', () => {
      isDown = false;
      window.irParaImagem(window.imagemAtual);
    });

    // Previne seleção indesejada durante swipe
    parent.addEventListener('dragstart', (e) => e.preventDefault());
  }

  // inicialização visual
  criarIndicadores();
  wrapper.style.transform = `translateX(-${window.imagemAtual * 100}%)`;

  // monta swipe
  setupSwipe();
}



/* ===== js/components/formFields.js ===== */
function createStaticFields() {
  const fragment = document.createDocumentFragment();

  // detalhes
  const detalhesGroup = document.createElement('div');
  detalhesGroup.className='form-group';
  const over1 = document.createElement('div');
  over1.className='overcell';
  const lblDetalhes = document.createElement('label');
  lblDetalhes.htmlFor='detalhes';
  lblDetalhes.textContent='Detalhes:';
  const textarea = document.createElement('textarea');
  textarea.name='Detalhes';
  textarea.placeholder='Descreve todas as informações sobre como queres o design e atenções extras!';
  textarea.required=true;
  over1.append(lblDetalhes, textarea);
  detalhesGroup.appendChild(over1);
  fragment.appendChild(detalhesGroup);

  // empresa / nome e logotipo
  const optionsRow1 = document.createElement('div');
  optionsRow1.className='options-row';

  const empresaGroup = document.createElement('div');
  empresaGroup.className='form-group';
  const over2 = document.createElement('div');
  over2.className='overcell';
  const lblEmpresa = document.createElement('label');
  lblEmpresa.htmlFor='empresa';
  lblEmpresa.textContent='Empresa / Nome:';
  const inputEmpresa = document.createElement('input');
  inputEmpresa.type='text';
  inputEmpresa.name='Empresa';
  inputEmpresa.placeholder='Empresa ou nome pessoal';
  inputEmpresa.required=true;
  over2.append(lblEmpresa, inputEmpresa);
  empresaGroup.appendChild(over2);

  const logoGroup = document.createElement('div');
  logoGroup.className='form-group';
  const over3 = document.createElement('div');
  over3.className='overcell';
  const lblLogo = document.createElement('label');
  lblLogo.htmlFor='ficheiro';
  lblLogo.textContent='(Opcional) Logotipo:';
  const inputFile = document.createElement('input');
  inputFile.type='file';
  inputFile.id='ficheiro';
  const hidden = document.createElement('input');
  hidden.type='hidden';
  hidden.name='Logotipo';
  hidden.id='link_ficheiro';
  const status = document.createElement('p');
  status.id='uploadStatus';
  status.style.display='none';
  over3.append(lblLogo, inputFile, hidden, status);
  logoGroup.appendChild(over3);

  optionsRow1.append(empresaGroup, logoGroup);
  fragment.appendChild(optionsRow1);

  // email / telemovel
  const optionsRow2 = document.createElement('div');
  optionsRow2.className='options-row';

  const emailGroup = document.createElement('div');
  emailGroup.className='form-group';
  const over4 = document.createElement('div');
  over4.className='overcell';
  const lblEmail = document.createElement('label');
  lblEmail.htmlFor='email';
  lblEmail.textContent='Email:';
  const inputEmail = document.createElement('input');
  inputEmail.type='email';
  inputEmail.name='Email';
  inputEmail.placeholder='seu@email.com';
  inputEmail.required=true;
  over4.append(lblEmail, inputEmail);
  emailGroup.appendChild(over4);

  const telGroup = document.createElement('div');
  telGroup.className='form-group';
  const over5 = document.createElement('div');
  over5.className='overcell';
  const lblTel = document.createElement('label');
  lblTel.htmlFor='telemovel';
  lblTel.textContent='Telemóvel:';
  const inputTel = document.createElement('input');
  inputTel.type='tel';
  inputTel.name='Telemovel';
  inputTel.placeholder='Ex: 912 345 678';
  inputTel.required=true;
  over5.append(lblTel, inputTel);
  telGroup.appendChild(over5);

  optionsRow2.append(emailGroup, telGroup);
  fragment.appendChild(optionsRow2);

  // hidden fields and submit
  const hiddenCaptcha = document.createElement('input');
  hiddenCaptcha.type='hidden';
  hiddenCaptcha.name='_captcha';
  hiddenCaptcha.value='false';
  fragment.appendChild(hiddenCaptcha);
  const hiddenNext = document.createElement('input');
  hiddenNext.type='hidden';
  hiddenNext.name='_next';
  hiddenNext.value='https://graficapt.com';
  fragment.appendChild(hiddenNext);
  const button = document.createElement('button');
  button.id='submit';
  button.type='submit';
  button.textContent='Pedir Orçamento';
  fragment.appendChild(button);
  return fragment;
}



/* ===== js/components/optionsRenderer.js ===== */
function renderOption(opt, index) {
  const wrapper = document.createElement('div');
  wrapper.className = 'option-group';

  const labelWrapper = document.createElement('div');
  labelWrapper.className = 'overcell';
  const label = document.createElement('label');
  label.textContent = opt.label || (index + 1) + ':';
  labelWrapper.appendChild(label);
  wrapper.appendChild(labelWrapper);

  let inputContainer = document.createElement('div');
  inputContainer.className = 'overcell';

  switch (opt.tipo) {
    case 'select':
      const select = document.createElement('select');
      select.name = opt.label || '';
      select.required = true;
      (opt.valores || []).forEach((v, i) => {
        const option = document.createElement('option');
        option.value = v;
        option.textContent = v;
        if (i === 0) option.selected = true;
        select.appendChild(option);
      });
      inputContainer.appendChild(select);
      break;
    case 'number':
      const num = document.createElement('input');
      num.type = 'number';
      num.name = opt.label || '';
      num.min = '1';
      num.value = '1';
      num.required = true;
      inputContainer.appendChild(num);
      break;
    case 'cores':
      const coresDiv = document.createElement('div');
      coresDiv.className = 'color-options';
      (opt.valores || []).forEach((item, idx) => {
        const over = document.createElement('div');
        over.className='overcell';
        const input = document.createElement('input');
        input.type='radio';
        input.name=opt.label||'';
        let title='', colorStyle='', imgAssoc='';
        if (typeof item === 'object') {
          title = item.nome || '';
          colorStyle = item.cor || '';
          imgAssoc = item.imagem || '';
        } else {
          title = item;
          colorStyle = item;
        }
        if (String(title).toLowerCase() === 'multicolor' || String(title).toLowerCase() === 'multicor') {
          colorStyle = 'linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet)';
          title = 'Multicor';
        }
        const id = `${(opt.label||'').replace(/\s+/g,'-').toLowerCase()}-color-${idx}`;
        input.id = id;
        input.value = title;
        if (idx === 0) input.checked = true;
        input.required = true;
        const labelC = document.createElement('label');
        labelC.className='color-circle';
        labelC.htmlFor=id;
        labelC.title=title;
        labelC.style.background = colorStyle;
        labelC.addEventListener('click', () => {
          if (imgAssoc) {
            window.selecionarCorEImagem(imgAssoc);
          }
        });
        over.append(input, labelC);
        coresDiv.appendChild(over);
      });
      inputContainer.appendChild(coresDiv);
      break;
    case 'imagem-radio':
      const imgDiv = document.createElement('div');
      imgDiv.className='posicionamento-options';
      (opt.valores || []).forEach((item, idx) => {
        const over = document.createElement('div');
        over.className='overcell';
        const posID = `${(opt.label||'').replace(/\s+/g,'-').toLowerCase()}-pos-${idx}`;
        const input = document.createElement('input');
        input.type='radio';
        input.name=opt.label||'';
        input.value=item.nome || '';
        input.id=posID;
        if (idx===0) input.checked=true;
        input.required=true;
        const labelR = document.createElement('label');
        labelR.className='posicionamento-label';
        labelR.htmlFor=posID;
        const wrapperImg = document.createElement('div');
        wrapperImg.className='posicionamento-img-wrapper';
        const img = document.createElement('img');
        img.className='posicionamento-img';
        img.title=item.nome||'';
        img.alt=item.nome||'';
        if (item.imagem && item.imagem.startsWith('http')) img.src=item.imagem;
        else if (item.imagem) img.src=`https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/${item.imagem}`;
        const span = document.createElement('span');
        span.className='posicionamento-nome';
        span.textContent=item.nome||'';
        wrapperImg.append(img, span);
        labelR.appendChild(wrapperImg);
        over.append(input, labelR);
        imgDiv.appendChild(over);
      });
      inputContainer.appendChild(imgDiv);
      break;
    case 'quantidade-por-tamanho':
      const qtDiv = document.createElement('div');
      qtDiv.className='quantidades-tamanhos';
      (opt.valores||[]).forEach(t => {
        const tWrapper = document.createElement('div');
        tWrapper.className='tamanho-input';
        const lbl = document.createElement('label');
        lbl.htmlFor=`tamanho-${t}`;
        lbl.textContent=`${t}:`;
        const inp = document.createElement('input');
        inp.type='number';
        inp.id=`tamanho-${t}`;
        inp.name=`Tamanho - ${t}`;
        inp.min='0';
        inp.value='0';
        tWrapper.append(lbl, inp);
        qtDiv.appendChild(tWrapper);
      });
      inputContainer.appendChild(qtDiv);
      break;
    default:
      inputContainer.textContent = '';
  }

  wrapper.appendChild(inputContainer);
  return wrapper;
}



/* ===== js/components/seo.js ===== */
function updateSEO(produto) {
  document.title = `${produto.name || produto.nome} | GráficaPT`;

  let metaDesc = document.querySelector('meta[name="description"]') 
    || createMeta('description');
  metaDesc.setAttribute(
    'content',
    `Compra ${produto.name || produto.nome} personalizada na GráficaPT. Impressão profissional, ideal para empresas e eventos.`
  );

  let metaKeywords = document.querySelector('meta[name="keywords"]') 
    || createMeta('keywords');
  const baseKeywords = metaKeywords.getAttribute('content') || '';
  const extraWords = (produto.metawords || []).filter(Boolean).join(', ');
  const combined = baseKeywords + (extraWords ? ', ' + extraWords : '');
  metaKeywords.setAttribute('content', combined);
}

function createMeta(name) {
  const m = document.createElement('meta');
  m.setAttribute('name', name);
  document.head.appendChild(m);
  return m;
}

function updateCanonicalAndOG(slug) {
  const href = `https://graficapt.com/produto/${encodeURIComponent(slug)}`;
  setLink('canonical', href);
  setMetaProperty('og:url', href);
}

function setLink(rel, href) {
  let link = document.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setMetaProperty(prop, content) {
  let meta = document.querySelector(`meta[property="${prop}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', prop);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}



/* ===== js/loader.js ===== */
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



/* ===== js/footerheader.js ===== */
const topbarHTML = `
    <div class="bar">
        <img src="https://graficapt.com/imagens/social/logo_minimal.svg" onclick="location.href = '/index.html'">
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
            <img src="https://graficapt.com/imagens/social/logo_minimal.svg" class="sidebar-logo" onclick="location.href = '/index.html'">
        </div>
        <a href="/index.html#filter=rigidos">Suportes Rigídos</a>
        <a href="/index.html#filter=bandeiras">Bandeiras Publicitárias</a>
        <a href="/index.html#filter=sacos">Sacos</a>
        <a href="/index.html#filter=vestuario">Vestuário</a>
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
                <a href="/index.html#filter=all">Todos os produtos</a>
                <a href="/index.html#filter=bandeiras">Bandeiras</a>
                <a href="/index.html#filter=sacos">Sacos</a>
            </div>
            <div class="footer-column">
                <h4>Subscreve a nossa newsletter</h4>
                <form class="newsletter-form">
                    <input type="email" placeholder="O teu email">
                    <button type="submit">Subscrever</button>
                </form>
                <div class="social-icons hcenter">
                    <a href="https://www.facebook.com/profile.php?id=61564124441415" aria-label="Facebook"><img src="https://graficapt.com/imagens/social/facebook.svg" alt="Facebook"></a>
                    <a href="https://www.instagram.com/graficapt/" aria-label="Instagram"><img src="https://graficapt.com/imagens/social/instagram.svg" alt="Instagram"></a>
                    <a href="https://wa.me/351969205741" aria-label="WhatsApp"><img src="https://graficapt.com/imagens/social/whatsapp.svg" alt="WhatsApp"></a>
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



/* ===== js/productsgrid.js ===== */

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




/* ===== js/formSender.js ===== */
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



/* ===== js/analytics.js ===== */
window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-V28GHLM5ZE');


/* ===== Safe implementations to avoid null DOM errors ===== */
function renderProdutos(){
  const host = document.getElementById('produto-dinamico');
  if (window.__PRODUCT__ || !host || !supabase) {
    // pre-rendered or not applicable
    return;
  }
  // If in future you want client-side render, implement here.
}

function applyFilters(){
  const root = document.querySelector('.filters');
  const grid = document.querySelector('[data-products-grid]');
  if (!root || !grid) return;

  // Minimal, generic filter: show/hide items by data-* attributes matching checked checkboxes
  const checks = Array.from(root.querySelectorAll('input[type="checkbox"]'));
  const active = checks.filter(c=>c.checked).map(c=>c.value.toLowerCase());
  const items = Array.from(grid.querySelectorAll('[data-item]'));

  if (!active.length){
    items.forEach(el=>{ el.style.display = ''; });
    return;
  }
  items.forEach(el=>{
    const tags = (el.getAttribute('data-tags')||'').toLowerCase().split(/\s*,\s*/);
    const ok = active.some(a=>tags.includes(a));
    el.style.display = ok ? '' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', function(){
  try { renderProdutos(); } catch(e){ console.error(e); }
  try { applyFilters(); } catch(e){ console.error(e); }
  try { console.log('Loaded'); } catch(e){}
});

})(window,document);

// === Mobile carousel enhancement for image-radio style option groups ===
(function(){
  try {
    var isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) return;
    var groups = document.querySelectorAll('.option-group .overcell');
    groups.forEach(function(oc){
      var radios = oc.querySelectorAll('input[type="radio"]');
      if (radios.length >= 3) {
        oc.classList.add('carousel-overcell');
      }
    });
  } catch(e) { /* no-op */ }
})();
