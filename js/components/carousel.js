export function criarCarrosselHTML(slug, imagens, storagePublic) {
  function getImageUrl(imagem) {
    if (!imagem) return '';
    if (imagem.startsWith('http')) return imagem;
    return storagePublic + imagem;
  }

  // monta o HTML (mesma estrutura de antes, mas sem depender de setTimeout para os indicadores)
  const html = `
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

  // depois de injetar no DOM, é preciso inicializar os indicadores/estado
  // Para facilitar, expõe uma função que faz essa inicialização
  return html;
}

export function initCarouselState() {
  // estado global igual ao original
  window.imagemAtual = window.imagemAtual ?? 0;

  window.mudarImagem = (incremento) => {
    const imagens = document.querySelectorAll('.carrossel-img');
    const wrapper = document.querySelector('.carrossel-imagens');
    if (!wrapper || imagens.length === 0) return;
    const total = imagens.length;
    window.imagemAtual = (window.imagemAtual + incremento + total) % total;
    wrapper.style.transform = `translateX(-${window.imagemAtual * 100}%)`;
    atualizarIndicadores();
  };

  window.irParaImagem = (index) => {
    const wrapper = document.querySelector('.carrossel-imagens');
    if (!wrapper) return;
    window.imagemAtual = index;
    wrapper.style.transform = `translateX(-${window.imagemAtual * 100}%)`;
    atualizarIndicadores();
  };

  function atualizarIndicadores() {
    const indicadores = document.querySelectorAll('.indicador');
    indicadores.forEach((el, i) => {
      el.classList.toggle('ativo', i === window.imagemAtual);
    });
  }

  // cria pontos se ainda não existirem
  const criarIndicadores = () => {
    const imagens = document.querySelectorAll('.carrossel-img');
    const indicadoresContainer = document.getElementById('indicadores');
    if (!indicadoresContainer || imagens.length === 0) return;
    // se já preenchido, não recriar
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

  // expõe seleção por caminho
  window.selecionarCorEImagem = function(imgPath) {
    if (!imgPath) return;
    const imagens = document.querySelectorAll('.carrossel-img');
    let idx = Array.from(imagens).findIndex(img => {
      return img.src.endsWith(imgPath) || img.src.includes(imgPath);
    });
    if (idx >= 0) {
      const wrapper = document.querySelector('.carrossel-imagens');
      wrapper.style.transform = `translateX(-${idx * 100}%)`;
      window.imagemAtual = idx;
      atualizarIndicadores();
    }
  };

  // inicializa
  criarIndicadores();
  // garanta que o transform inicial está aplicado
  const wrapper = document.querySelector('.carrossel-imagens');
  if (wrapper) wrapper.style.transform = `translateX(-${window.imagemAtual * 100}%)`;
}
