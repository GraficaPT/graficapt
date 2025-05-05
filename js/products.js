document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("produto-dinamico");
  
  const urlParams = new URLSearchParams(window.location.search);
  const produtoID = urlParams.get("produto");
  
  
  const colorMap = {
    "Branco": "#ffffff",
    "Preto": "#000000",
    "Azul": "#007BFF",
    "Amarelo": "#FFFF00",
    "Magenta": "#FF00FF",
    "Azul Cian": "#00FFFF",
    "Azul Reflex": "#002366",
    "Vermelho": "#FF0000",
    "Verde Pistacho": "#A8C66C",
    "Laranja": "#FFA500",
  
    // Novas cores Pantone aproximadas
    "Preto - Pantone Process Black U": "#2D2926",
    "Azul Claro – Pantone Process Blue": "#0085CA",
    "Azul Médio – Pantone 300 U": "#0077C8",
    "Azul Escuro – Pantone Process Blue 072 U": "#10069F",
    "Castanho – Pantone 4635 U": "#996046",
    "Laranja – Pantone Orange 021 U": "#FE5000",
    "Verde Claro – Pantone 375 U": "#84BD00",
    "Verde Médio – Pantone 354 U": "#00B140",
    "Verde Escuro – Pantone 357 U": "#215732",
    "Vermelho – Pantone Warm Red U": "#F9423A",
    "Rosa – Pantone Rhodamine Red U": "#E10098",
    "Bordeaux – Pantone 188 U": "#7C2529",
    "Multiplas Cores": "linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet)"
  };
  
  
    const produtos = {
      "ardosia": {
        nome: "Ardosia Gravada Laser",
        imagem: "imagens/produtos/ardosia/mockup.png",
        descricao: "Placa de ardósia personalizada com gravação a laser. Ideal para restauração e decoração!<br>Dê ao seu espaço um toque especial.",
        opcoes: {
          "Tamanho": {
            tipo: "select",
            valores: ["25x30cm", "20x25cm"]
          },
          "Quantidade": {
            tipo: "number",
            min: 5
          },
          "Posicionamento": {
            tipo: "imagem-radio",
            valores: [
              {
                nome: "Pequeno no Canto",
                imagem: "imagens/produtos/ardosia/minimockup.png"
              },
              {
                nome: "Grande no Centro",
                imagem: "imagens/produtos/ardosia/midmockup.png"
              }
            ]
          }
        }
      },
      "portachaves": {
        nome: "Porta Chaves Acrílico",
        imagem: "imagens/produtos/portachaves/mockup.png",
        descricao: "Porta chaves de acrilico com dupla camada resistente, dê vida ao seu logotipo com um brinde extra!<br>Tamanho maximo 5x5cm",
        opcoes: {
          "Cor Primária": {
            tipo: "cores",
            valores: ["Branco", "Preto", "Azul"]
          },
          "Cor Secundária": {
            tipo: "cores",
            valores: ["Branco", "Preto", "Azul"]
          },
          "Quantidade": {
            tipo: "number",
            min: 10
          }
        }
      },
      "tshirt": {
        nome: "T-Shirt Personalizada",
        imagem: "imagens/produtos/tshirt/mockup.png",
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
                imagem: "imagens/produtos/tshirt/fv.png"
              },
              {
                nome: "Frente",
                imagem: "imagens/produtos/tshirt/f.png"
              },
              {
                nome: "Verso",
                imagem: "imagens/produtos/tshirt/v.png"
              }
            ]
          }
        }
      },
      "polo": {
        nome: "T-Shirt Polo Personalizado",
        imagem: "imagens/produtos/polo/mockup.png",
        descricao: "T-Shirt polos personalizados com DTF de alta qualidade para dar um toque extra profissional à sua empresa!<br><br>155-160gms",
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
                imagem: "imagens/produtos/tshirt/fv.png"
              },
              {
                nome: "Frente",
                imagem: "imagens/produtos/tshirt/f.png"
              },
              {
                nome: "Verso",
                imagem: "imagens/produtos/tshirt/v.png"
              }
            ]
          }
        }
      },
      "sacoskraft": {
        nome: "Sacos Kraft Personalizados",
        imagem: "imagens/produtos/sacoskraft/mockup.png",
        descricao: "Sacos kraft resistentes disponíveis em várias cores e tamanhos.<br>Ideal para branding e embalagens ecológicas.",
        opcoes: {
          "Tamanho (cm)": {
            tipo: "select",
            valores: [
              "18+8x24",
              "22+10x27",
              "24+11x32",
              "28+11x32",
              "32+11x42",
              "35+16x44",
              "42+16x49",
              "28+11x22",
              "32+11x28",
              "40+11x32",
              "42+16x34",
              "52+16x42",
              "52+16x49",
              "27+16x31",
              "31+20x32",
              "18+8x39"
            ]
          },
          "Cor do Saco": {
            tipo: "cores",
            valores: [
              "Branco",
              "Preto",
              "Azul",
              "Amarelo",
              "Magenta",
              "Azul Cian",
              "Azul Reflex",
              "Vermelho",
              "Verde Pistacho",
              "Laranja"
            ]
          },
          "Quantidade": {
            tipo: "select",
            valores: [
              "100",
              "125",
              "150",
              "200",
              "250",
              "300",
              "400",
              "500",
              "600",
              "700",
              "800",
              "1000",
              "1250",
              "2000",
              "3000",
              "Outras Quantidades"
            ]
            },
          "Cor da Personalização": {
            tipo: "cores",
            valores: [
              "Preto - Pantone Process Black U",
              "Azul Claro – Pantone Process Blue",
              "Azul Médio – Pantone 300 U",
              "Azul Escuro – Pantone Process Blue 072 U",
              "Castanho – Pantone 4635 U",
              "Laranja – Pantone Orange 021 U",
              "Verde Claro – Pantone 375 U",
              "Verde Médio – Pantone 354 U",
              "Verde Escuro – Pantone 357 U",
              "Vermelho – Pantone Warm Red U",
              "Rosa – Pantone Rhodamine Red U",
              "Bordeaux – Pantone 188 U",
              "Multiplas Cores"
            ]
          },
          "Posicionamento": {
            tipo: "imagem-radio",
            valores: [
              {
                nome: "1 Face",
                imagem: "imagens/produtos/sacoskraft/frente.png"
              },
              {
                nome: "2 Faces",
                imagem: "imagens/produtos/sacoskraft/frenteverso.png"
              }
            ]
          }
        }
      },
      "bandeiragota": {
        nome: "Kit Bandeira Comercial Gota",
        imagem: "imagens/produtos/bandeiragota/mockup.png",
        descricao: "Bandeiras promocionais em diversos tamanhos, ideais para destacar a sua marca em eventos e pontos de venda.<br>Este kit contem 1 base de fixacao, 1 mastro completo e 1 bandeira com o design que escolher.",
        opcoes: {
  
          "Tamanho": {
            tipo: "imagem-radio",
            valores: [
              {
                nome: "S Frente e Verso",
                imagem: "imagens/produtos/bandeiragota/sfv.png"
              },
              {
                nome: "S",
                imagem: "imagens/produtos/bandeiragota/s.png"
              },
              {
                nome: "M",
                imagem: "imagens/produtos/bandeiragota/m.png"
              },
              {
                nome: "L",
                imagem: "imagens/produtos/bandeiragota/l.png"
              },
              {
                nome: "XL",
                imagem: "imagens/produtos/bandeiragota/xl.png"
              },
              {
                nome: "XXL",
                imagem: "imagens/produtos/bandeiragota/xxl.png"
              },
            ]
          },
          "Quantidade": {
            tipo: "number",
            min: 1
          }
        }
      },
      "bandeiravela": {
        nome: "Kit Bandeira Comercial Vela",
        imagem: "imagens/produtos/bandeiravela/mockup.png",
        descricao: "Bandeiras promocionais em diversos tamanhos, ideais para destacar a sua marca em eventos e pontos de venda.<br>Este kit contem 1 base de fixacao, 1 mastro completo e 1 bandeira com o design que escolher.",
        opcoes: {
          "Tamanho": {
            tipo: "imagem-radio",
            valores: [
              {
                nome: "S",
                imagem: "imagens/produtos/bandeiravela/frente.svg"
              },
            ]
          },
          "Quantidade": {
            tipo: "number",
            min: 1
          }
        }
      },
      "rollup": {
        nome: "Roll-Up Comercial",
        imagem: "imagens/produtos/rollup/mockup.png",
        descricao: "Roll-up comercial portátil e prático para uso em eventos, feiras e promoções. Estrutura incluída.",
        opcoes: {
          "Quantidade": {
            tipo: "number",
            min: 1
          }
        }
      },
      "sacostecido": {
        nome: "Sacos de Tecido Coloridos",
        imagem: "imagens/produtos/sacostecido/mockup.png",
        descricao: "Sacos ecológicos em tecido com diversas cores e opções de posicionamento do design. Perfeitos para brindes e uso diário.",
        opcoes: {
          "Cor": {
            tipo: "cores",
            valores: ["Branco", "Preto", "Azul", "Verde", "Vermelho"]
          },
          "Quantidade": {
            tipo: "number",
            min: 20
          },
          "Posicionamento": {
            tipo: "imagem-radio",
            valores: [
              {
                nome: "Centro Pequeno",
                imagem: "imagens/produtos/sacostecido/pequeno.png"
              },
              {
                nome: "Centro Grande",
                imagem: "imagens/produtos/sacostecido/grande.png"
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
            const inputName = label.replace(/\s+/g, '-').toLowerCase(); 
            const colorID = `${inputName}-color-${index}`;
            const colorHex = colorMap[cor] || "#ccc";
            const isChecked = index === 0 ? "checked" : "";
            html += `
              <input type="radio" name="${label}" value="${cor}" id="${colorID}" ${isChecked} required>
              <label class="color-circle" for="${colorID}" style="background: ${colorHex};" title="${cor}"></label>
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
  