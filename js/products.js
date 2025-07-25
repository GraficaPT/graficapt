import { supabase } from './supamanager/supabase.js';

document.addEventListener("DOMContentLoaded", async function () {
  const STORAGE_PUBLIC = 'https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/';

let slug = null;
const params = new URLSearchParams(window.location.search);
slug = params.get("slug");

if (!slug) {
  const pathParts = window.location.pathname.split("/");
  const last = pathParts[pathParts.length - 1];
  if (last && last !== "produto") {
    slug = decodeURIComponent(last);
  }
}

if (!slug) {
  document.getElementById("produto-dinamico").textContent = "Produto não especificado.";
} 

  let { data: produto, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !produto) {
    document.getElementById("produto-dinamico").innerHTML = "<p>Produto não encontrado.</p>";
    return;
  }

  // Garante que opções é sempre array
  let opcoes = [];
  if (Array.isArray(produto.opcoes)) {
    opcoes = produto.opcoes;
  } else if (typeof produto.opcoes === 'object' && produto.opcoes !== null) {
    opcoes = Object.entries(produto.opcoes).map(([label, op]) => ({
      label, ...op
    }));
  }

  function getImageUrl(slug, imagem) {
    if (!imagem) return '';
    if (imagem.startsWith('http')) return imagem;
    return STORAGE_PUBLIC + `${imagem}`;
  }

  let imagensCarrossel = produto.images || [];
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
      if (indicadoresContainer) {
        indicadoresContainer.innerHTML = '';
        imagens.forEach((_, index) => {
          const dot = document.createElement('div');
          dot.classList.add('indicador');
          if (index === 0) dot.classList.add('ativo');
          dot.addEventListener('click', () => irParaImagem(index));
          indicadoresContainer.appendChild(dot);
        });
      }
    }, 0);

    return `
      <div class="carrossel-container">
        <button class="carrossel-btn prev" onclick="mudarImagem(-1)">&#10094;</button>
        <div class="carrossel-imagens-wrapper">
          <div class="carrossel-imagens" id="carrossel">
            ${(imagens || []).map((imagem, index) => `
              <img src="${getImageUrl(slug, imagem)}" alt="Imagem ${index + 1}" class="carrossel-img">
            `).join('')}
          </div>
        </div>
        <button class="carrossel-btn next" onclick="mudarImagem(1)">&#10095;</button>
      </div>
      <div class="indicadores" id="indicadores"></div>
    `;
  };

  window.selecionarCorEImagem = function(imgPath) {
    if (!imgPath) return;
    const imagens = document.querySelectorAll('.carrossel-img');
    let idx = Array.from(imagens).findIndex(img => {
      return img.src.endsWith(imgPath) || img.src.includes(imgPath);
    });
    if (idx >= 0) {
      const wrapper = document.querySelector('.carrossel-imagens');
      wrapper.style.transform = `translateX(-${idx * 100}%)`;
      imagemAtual = idx;
      atualizarIndicadores();
    }
  };
  

  function renderOption(label, tipo, valores) {
    switch (tipo) {
      case "imagem-radio":
        return `
        <div class="posicionamento-options">
          ${(valores || []).map((item, idx) => {
            const posID = `${label.replace(/\s+/g, '-').toLowerCase()}-pos-${idx}`;
            let imgUrl = (item.imagem || '').startsWith('http')
              ? item.imagem
              : `https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/${item.imagem}`;
            return `
              <div class="overcell">
                <input type="radio" name="${label}" value="${item.nome}" id="${posID}" ${idx === 0 ? "checked" : ""} required>
                <label class="posicionamento-label" for="${posID}">
                  <div class="posicionamento-img-wrapper">
                    <img src="${imgUrl}" alt="${item.nome}" title="${item.nome}" class="posicionamento-img">
                    <span class="posicionamento-nome">${item.nome}</span>
                  </div>
                </label>
              </div>
            `;
          }).join('')}
        </div>
      `;
      case "number":
        return `
          <div class="overcell">
            <input type="number" name="${label}" min="1" value="1" required>
          </div>
        `;
      case "cores":
      return `
        <div class="color-options">
          ${(valores || []).map((item, index) => {
            let colorStyle = (typeof item === "object" && item.cor) ? item.cor : (item || "");
            let colorTitle = (typeof item === "object" && item.nome) ? item.nome : (item || "");
            let imgAssoc = (typeof item === "object" && item.imagem) ? item.imagem : null;
            if (String(colorTitle).toLowerCase() === "multicolor" || String(colorTitle).toLowerCase() === "multicor") {
              colorStyle = "linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet)";
              colorTitle = "Multicor";
            }
            const colorID = `${label.replace(/\s+/g, '-').toLowerCase()}-color-${index}`;
            return `
              <div class="overcell">
                <input type="radio" name="${label}" value="${colorTitle}" id="${colorID}" ${index === 0 ? "checked" : ""} required>
                <label class="color-circle" for="${colorID}" style="background: ${colorStyle};" title="${colorTitle}"
                  onclick="selecionarCorEImagem('${imgAssoc ? imgAssoc : ''}')">
                </label>
              </div>
            `;
          }).join('')}
        </div>
      `;
      case "quantidade-por-tamanho":
        return `
          <div class="quantidades-tamanhos">
            ${(valores || []).map(t => `
              <div class="tamanho-input">
                <label for="tamanho-${t}">${t}:</label>
                <input type="number" id="tamanho-${t}" name="Tamanho - ${t}" min="0" value="0">
              </div>
            `).join('')}
          </div>
        `;
      case "select":
        return `
          <div class="overcell">
            <select name="${label}" required>
              ${(valores || []).map((opt, idx) => `
                <option value="${opt}" ${idx === 0 ? "selected" : ""}>${opt}</option>
              `).join('')}
            </select>
          </div>
        `;
      default:
        return '';
    }
  }

  // --- Renderização principal ---
  let html = `
  <div class="product-image">
    ${produto.images && produto.images.length > 0 ? criarCarrossel(produto.images) : ""}
  </div>
  <form class="product" id="orcamentoForm" method="POST" enctype="multipart/form-data">
    <input type="text" value="${produto.name || produto.nome}" class="productname" id="productname" name="Produto">
    <div class="product-details">
      <h1>${produto.name || produto.nome}</h1><br>
      ${(opcoes || []).map((opt, idx) => `
        <div class="option-group">
          <div class="overcell">
            <label for="${opt.label || idx}">${opt.label ? opt.label : (idx + 1) + ':'}</label>
          </div>
          ${renderOption(opt.label || '', opt.tipo, opt.valores)}
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
              <label for="email">(Opcional) Logotipo:</label>
              <input type="file" id="ficheiro">
              <input type="hidden" name="Logotipo" id="link_ficheiro">
              <p id="uploadStatus" style="display: none;"></p>
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
              <label for="telemovel">Telemóvel:</label>
              <input type="tel" name="Telemovel" placeholder="Ex: 912 345 678" required>
            </div>
          </div>
        </div>
        <input type="hidden" name="_captcha" value="false">
        <input type="hidden" name="_next" value="https://graficapt.com">
        <button id="submit" type="submit">Pedir Orçamento</button><br>
      </div>
    </form>
  `;
 
  document.getElementById("produto-dinamico").innerHTML = html;

function atualizarSEO(produto) {
  document.title = `${produto.name || produto.nome} | GráficaPT`;

  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute(
    'content',
    `Compra ${produto.name || produto.nome} personalizada na GráficaPT. Impressão profissional, ideal para empresas e eventos.`
  );

  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }

  const baseKeywords = metaKeywords.getAttribute('content') || '';
  const extraWords = (produto.metawords || []).filter(Boolean).join(', ');
  const combined = baseKeywords + (extraWords ? ', ' + extraWords : '');
  metaKeywords.setAttribute('content', combined);
}

atualizarSEO(produto);


  setTimeout(() => {
    const script = document.createElement('script');
    script.src = 'js/formSender.js';
    document.body.appendChild(script);
  }, 100);
  

  imagemAtual = 0;
  setTimeout(() => atualizarIndicadores(), 20);
});
