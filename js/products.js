document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("produto-dinamico");

  const path = window.location.pathname;
  const produtoID = path.substring(path.lastIndexOf("/") + 1).replace(".html", "");
  console.log(produtoID);

  const produto = produtos[produtoID];

  if (!produto) {
    container.innerHTML = "<p>Produto não encontrado.</p>";
    return;
  }

  const gerarOpcoes = (label, op) => {
    switch (op.tipo) {
      case "quantidade-por-tamanho":
      return `
        <div class="quantidades-tamanhos">
          ${op.valores.map(t => `
            <div class="tamanho-input">
              <label for="tamanho-${t}">${t}:</label>
              <input type="number" id="tamanho-${t}" name="Tamanho - ${t}" min="0" value="0">
            </div>
          `).join('')}
        </div>
      `;
      case "cores":
        return `
          <div class="color-options">
            ${op.valores.map((hex, index) => {
              const colorID = `${label.replace(/\s+/g, '-').toLowerCase()}-color-${index}`;
              return `
                <div class="overcell">
                  <input type="radio" name="${label}" value="${hex}" id="${colorID}" ${index === 0 ? "checked" : ""} required>
                  <label class="color-circle" for="${colorID}" style="background: ${hex};" title="${hex}"></label>
                </div>
              `;
            }).join('')}
          </div>
        `;
        case "imagem-radio":
          return `
            <div class="posicionamento-options">
              ${op.valores.map((item, index) => {
                const posID = `${label.replace(/\s+/g, '-').toLowerCase()}-pos-${index}`;
                return `
                  <div class="overcell">
                    <input type="radio" name="${label}" value="${item.nome}" id="${posID}" ${index === 0 ? "checked" : ""} required>
                    <label class="posicionamento-label" for="${posID}">
                      <img src="${item.imagem}" alt="${item.nome}" title="${item.nome}" class="posicionamento-img">
                    </label>
                  </div>
                `;
              }).join('')}
            </div>
          `;
        
      case "select":
        return `
          <div class="overcell">
            <select name="${label}" required>
              ${op.valores.map((opt, index) => `
                <option value="${opt}" ${index === 0 ? "selected" : ""}>${opt}</option>
              `).join('')}
            </select>
          </div>
        `;
      case "number":
        return `
          <div class="overcell">
            <input type="number" name="${label}" min="${op.min}" value="${op.min}" required>
          </div>
        `;
      default:
        return '';
    }
  };
  
  let imagemAtual = 0;

window.mudarImagem = (incremento) => {
const imagens = document.querySelectorAll('.carrossel-img');
const wrapper = document.querySelector('.carrossel-imagens');
const total = imagens.length;

imagemAtual = (imagemAtual + incremento + total) % total;
wrapper.style.transform = `translateX(-${imagemAtual * 100}%)`;
atualizarIndicadores();
};

const irParaImagem = (index) => {
const wrapper = document.querySelector('.carrossel-imagens');
imagemAtual = index;
wrapper.style.transform = `translateX(-${imagemAtual * 100}%)`;
atualizarIndicadores();
};

const atualizarIndicadores = () => {
const indicadores = document.querySelectorAll('.indicador');
indicadores.forEach((el, i) => {
el.classList.toggle('ativo', i === imagemAtual);
});
};

const criarCarrossel = (imagens) => {
setTimeout(() => {
const indicadoresContainer = document.getElementById('indicadores');
indicadoresContainer.innerHTML = '';
imagens.forEach((_, index) => {
  const dot = document.createElement('div');
  dot.classList.add('indicador');
  if (index === 0) dot.classList.add('ativo');
  dot.addEventListener('click', () => irParaImagem(index));
  indicadoresContainer.appendChild(dot);
});
}, 0);

return `
<div class="carrossel-container">
  <button class="carrossel-btn prev" onclick="mudarImagem(-1)">&#10094;</button>
  <div class="carrossel-imagens-wrapper">
    <div class="carrossel-imagens" id="carrossel">
      ${imagens.map((imagem, index) => `
        <img src="${imagem}" alt="Imagem ${index + 1}" class="carrossel-img">
      `).join('')}
    </div>
  </div>
  <button class="carrossel-btn next" onclick="mudarImagem(1)">&#10095;</button>
</div>
<div class="indicadores" id="indicadores"></div>
`;
};
  let html = `
    
      <div class="product-image">
        ${criarCarrossel(produto.imagens)}
      </div>
      <form class="product" id="orcamentoForm" method="POST" enctype="multipart/form-data">
      <input type="text" value="${produto.nome}" class="productname" id="productname" name="Produto">
      <div class="product-details">
        <h1>${produto.nome}</h1><br>
        ${Object.entries(produto.opcoes).map(([label, op]) => `
          <div class="option-group">
            <div class="overcell">
              <label for="${label}">${label}:</label>
            </div>
            ${gerarOpcoes(label, op)}
          </div>
        `).join('')}
        <div class="form-group">
          <div class="overcell">
            <label for="detalhes">Detalhes:</label>
            <textarea name="Detalhes" placeholder="Descreve todas as informações sobre como queres o design e atenções extras!" required></textarea>
          </div>
        </div>
  
        <div class="options-row">
          <div class="form-group">
            <div class="overcell">
              <label for="empresa">Empresa / Nome:</label>
              <input type="text" name="Empresa" placeholder="Empresa ou nome pessoal" required>
            </div>
          </div>
          <div class="form-group">
            <div class="overcell">
              <label for="telemovel">Telemóvel:</label>
              <input type="tel" name="Telemovel" placeholder="Ex: 912 345 678" required>
            </div>
          </div>
        </div>
        <div class="options-row">
          <div class="form-group">
            <div class="overcell">
              <label for="email">Email:</label>
              <input type="email" name="Email" placeholder="seu@email.com" required>
            </div>
          </div>
          <div class="form-group">
            <div class="overcell">
            <label for="email">(Opcional) Logotipo:</label>
              <input type="file" id="ficheiro">
              <input type="hidden" name="Logotipo" id="link_ficheiro">
              <p id="uploadStatus" style="display: none;"></p>
            </div>
          </div>
        </div>
          
        <input type="hidden" name="_captcha" value="false">
        <input type="hidden" name="_next" value="https://graficapt.com">

        <button id="submit" type="submit">Pedir Orçamento</button><br>
      </div>
      
    </form>
  `;
  
  container.innerHTML = html;
});


