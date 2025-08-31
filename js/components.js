// Merged bundle: auto-generated
;(function(){

/* ===== File: js/components/carousel.js ===== */
const supabase = (window.Supa && window.Supa.client) || null;
export function criarCarrosselHTML(slug, imagens, storagePublic) {
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

export function initCarouselState() {
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


/* ===== File: js/components/formFields.js ===== */
const supabase = (window.Supa && window.Supa.client) || null;
export function createStaticFields() {
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


/* ===== File: js/components/optionsRenderer.js ===== */
const supabase = (window.Supa && window.Supa.client) || null;
export function renderOption(opt, index) {
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


/* ===== File: js/components/seo.js ===== */
const supabase = (window.Supa && window.Supa.client) || null;
export function updateSEO(produto) {
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

export function updateCanonicalAndOG(slug) {
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


/* ===== File: js/utils/slug.js ===== */
const supabase = (window.Supa && window.Supa.client) || null;
export function getSlugFromUrl() {
  const params = new URLSearchParams(window.location.search);
  let slug = params.get("slug");
  if (slug) return slug;
  const pathParts = window.location.pathname.split('/');
  return pathParts[pathParts.length - 1] || null;
}

})();
