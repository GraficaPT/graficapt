export function createCarousel(slug, imagens, storagePublic) {
  const container = document.createElement('div');
  container.className = 'carrossel-container';

  let imagemAtual = 0;

  const prev = document.createElement('button');
  prev.className = 'carrossel-btn prev';
  prev.setAttribute('aria-label', 'Anterior');
  prev.innerHTML = '&#10094;'; // ❮

  const next = document.createElement('button');
  next.className = 'carrossel-btn next';
  next.setAttribute('aria-label', 'Seguinte');
  next.innerHTML = '&#10095;'; // ❯

  const wrapper = document.createElement('div');
  wrapper.className = 'carrossel-imagens-wrapper';

  const inner = document.createElement('div');
  inner.className = 'carrossel-imagens';

  // helper
  const getImageUrl = (imagem) => {
    if (!imagem) {
      console.warn('Imagem vazia recebida para o carrossel:', imagem);
      return '';
    }
    if (imagem.startsWith('http')) return imagem;
    return storagePublic + imagem;
  };

  if (!imagens || imagens.length === 0) {
    const noImg = document.createElement('div');
    noImg.className = 'no-images';
    noImg.textContent = 'Sem imagens disponíveis';
    container.appendChild(noImg);
    return {
      element: container,
      indicadoresElement: document.createElement('div'),
      mudarImagem: () => {},
      irParaImagem: () => {},
      selecionarPorCaminho: () => {},
    };
  }

  imagens.forEach((imagem, idx) => {
    const img = document.createElement('img');
    img.src = getImageUrl(imagem);
    img.alt = `Imagem ${idx + 1}`;
    img.className = 'carrossel-img';
    img.loading = 'lazy';
    img.onerror = () => {
      img.style.opacity = '0.4';
      img.alt = 'Erro ao carregar imagem';
    };
    inner.appendChild(img);
  });

  wrapper.appendChild(inner);
  container.append(prev, wrapper, next);

  // indicadores internos
  const indicadores = document.createElement('div');
  indicadores.className = 'indicadores';
  indicadores.id = `indicadores-${Math.random().toString(36).slice(2)}`;

  function atualizarIndicadores() {
    Array.from(indicadores.children).forEach((el, i) => {
      el.classList.toggle('ativo', i === imagemAtual);
    });
  }

  function irParaImagem(index) {
    imagemAtual = index;
    inner.style.transform = `translateX(-${imagemAtual * 100}%)`;
    atualizarIndicadores();
  }

  function mudarImagem(incremento) {
    const total = imagens.length;
    imagemAtual = (imagemAtual + incremento + total) % total;
    inner.style.transform = `translateX(-${imagemAtual * 100}%)`;
    atualizarIndicadores();
  }

  imagens.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'indicador' + (i === 0 ? ' ativo' : '');
    dot.setAttribute('aria-label', `Ir para imagem ${i + 1}`);
    dot.addEventListener('click', () => irParaImagem(i));
    indicadores.appendChild(dot);
  });

  // eventos nos botões
  prev.addEventListener('click', () => mudarImagem(-1));
  next.addEventListener('click', () => mudarImagem(1));

  // inicializa visual
  inner.style.transform = `translateX(0%)`;
  atualizarIndicadores();

  // anexa indicadores abaixo do wrapper
  container.appendChild(indicadores);

  return {
    element: container,
    indicadoresElement: indicadores,
    mudarImagem,
    irParaImagem,
    selecionarPorCaminho: (imgPath) => {
      const imgs = inner.querySelectorAll('.carrossel-img');
      const idx = Array.from(imgs).findIndex(img => img.src.endsWith(imgPath) || img.src.includes(imgPath));
      if (idx >= 0) irParaImagem(idx);
    }
  };
}
