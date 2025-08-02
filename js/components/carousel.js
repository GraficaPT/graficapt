export function createCarousel(slug, imagens, storagePublic) {
  const container = document.createElement('div');
  container.className = 'carrossel-container';

  let imagemAtual = 0;

  const prev = document.createElement('button');
  prev.className = 'carrossel-btn prev';
  prev.innerHTML = '\u276E'; // ❮
  const next = document.createElement('button');
  next.className = 'carrossel-btn next';
  next.innerHTML = '\u276F'; // ❯

  const wrapper = document.createElement('div');
  wrapper.className = 'carrossel-imagens-wrapper';

  const inner = document.createElement('div');
  inner.className = 'carrossel-imagens';

  const getImageUrl = (imagem) => {
    if (!imagem) return '';
    if (imagem.startsWith('http')) return imagem;
    return storagePublic + imagem;
  };

  imagens.forEach((imagem, idx) => {
    const img = document.createElement('img');
    img.src = getImageUrl(imagem);
    img.alt = `Imagem ${idx + 1}`;
    img.className = 'carrossel-img';
    inner.appendChild(img);
  });

  wrapper.appendChild(inner);
  container.append(prev, wrapper, next);

  const indicadores = document.createElement('div');
  indicadores.className = 'indicadores';
  indicadores.id = 'indicadores';

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
    dot.addEventListener('click', () => irParaImagem(i));
    indicadores.appendChild(dot);
  });

  prev.addEventListener('click', () => mudarImagem(-1));
  next.addEventListener('click', () => mudarImagem(1));

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
