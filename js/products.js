document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("produto-dinamico");
  const produtoID = container.dataset.produto;

  const colorMap = {
    "Branco": "#ffffff",
    "Preto": "#000000",
    "Azul": "#007BFF"
  };

  const produtos = {
    "ardosia": {
      nome: "Ardosia Gravada Laser",
      imagem: "../imagens/produtos/ardosia/mockup.png",
      descricao: "Placa de ardósia personalizada com gravação a laser. Ideal para restauração e decoração!<br>Dê ao seu espaço um toque especial.",
      opcoes: {
        "Tamanho": {
          tipo: "select",
          valores: ["25x30cm", "20x25cm"]
        },
        "Quantidade": {
          tipo: "number",
          min: 10
        },
        "Posicionamento": {
          tipo: "imagem-radio",
          valores: [
            {
              nome: "Pequeno no Canto",
              imagem: "../imagens/produtos/ardosia/minimockup.png"
            },
            {
              nome: "Grande no Centro",
              imagem: "../imagens/produtos/ardosia/midmockup.png"
            }
          ]
        }
      }
    },
    "tshirt": {
      nome: "T-Shirt Personalizada",
      imagem: "../imagens/produtos/tshirt/mockup.png",
      descricao: "T-Shirts personalizadas com DTF de alta qualidade para dar um toque extra profissional à sua empresa!<br><br>155-160gms",
      opcoes: {
        "Tamanho": {
          tipo: "select",
          valores: ["S até 2XL", "3XL até 5XL", "Outros Tamanhos"]
        },
        "Cor": {
          tipo: "cores",
          valores: ["Branco", "Preto", "Azul"]
        },
        "Quantidade": {
          tipo: "number",
          min: 10
        },
        "Posicionamento": {
          tipo: "imagem-radio",
          valores: [
            {
              nome: "Frente e Verso",
              imagem: "../imagens/produtos/tshirt/fv.png"
            },
            {
              nome: "Frente",
              imagem: "../imagens/produtos/tshirt/f.png"
            },
            {
              nome: "Verso",
              imagem: "../imagens/produtos/tshirt/v.png"
            }
          ]
        }
      }
    }
  };

  const produto = produtos[produtoID];
  if (!produto) {
    container.innerHTML = "<p>Produto não encontrado.</p>";
    return;
  }

  let html = `
    <form class="product" method="POST" action="/orcamento">
      <div class="product-image">
        <img src="${produto.imagem}" alt="${produto.nome}">
      </div>

      <div class="product-details">
        <h1>${produto.nome}</h1>
        <p class="descricao">${produto.descricao}</p>
  `;

  // Agrupar 'Quantidade', 'Cor' e 'Posicionamento' lado a lado
  html += `<div class="options-row">`;

  for (let [label, op] of Object.entries(produto.opcoes)) {
    html += `<div class="option-group">`; // Início do agrupamento

    html += `<label for="${label}">${label}:</label>`;

    switch (op.tipo) {

      case "cores":
        html += `<div class="color-options">`;
        op.valores.forEach((cor, index) => {
          const colorID = `color-${index}`;
          const colorHex = colorMap[cor] || "#ccc";
          const isChecked = index === 0 ? "checked" : "";
          html += `
            <input type="radio" name="${label}" value="${cor}" id="${colorID}" ${isChecked} required>
            <label class="color-circle" for="${colorID}" style="background-color: ${colorHex};" title="${cor}"></label>
          `;
        });
        html += `</div>`;
        break;

      case "imagem-radio":
        html += `<div class="posicionamento-options">`;
        op.valores.forEach((item, index) => {
          const posID = `pos-${index}`;
          html += `
            <input type="radio" name="${label}" value="${item.nome}" id="${posID}" required>
            <label class="posicionamento-label" for="${posID}">
              <img src="${item.imagem}" alt="${item.nome}" title="${item.nome}" class="posicionamento-img">
            </label>
          `;
        });
        html += `</div>`;
        break;

      case "select":
        html += `<select name="${label}" required>`;
        op.valores.forEach(opt => {
          html += `<option value="${opt}">${opt}</option>`;
        });
        html += `</select>`;
        break;

      case "number":
        html += `<input type="number" name="${label}" min="${op.min}" value="${op.min}" required>`;
        break;
    }

    html += `</div>`; // Fim do agrupamento
  }

  html += `</div>`; // Fim do contêiner 'options-row'

  html += `
  <div class="form-group">
    <label for="detalhes">Detalhes:</label>
    <textarea type="detalhes" name="detalhes" placeholder="Descreve todas as informações sobre a tua encomenda!" required></textarea>
  </div>
  <div class="options-row">
  <div class="form-group">
    <label for="empresa">Empresa / Nome:</label>
    <input type="text" name="empresa" placeholder="Empresa ou nome pessoal" required>
  </div>

  <div class="form-group">
    <label for="telemovel">Telemóvel:</label>
    <input type="tel" name="telemovel" placeholder="Ex: 912 345 678" required>
  </div>
</div>
    <div class="form-row">
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" name="email" placeholder="seu@email.com" required>
      </div>
    </div>

    <button type="submit">Pedir Orçamento</button>
  </div>
  </form>
  `;

  container.innerHTML = html;
});
