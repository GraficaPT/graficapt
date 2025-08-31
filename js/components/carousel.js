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
