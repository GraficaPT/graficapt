

    document.addEventListener("DOMContentLoaded", () => {
      const container = document.getElementById("produto-dinamico");
      
      const colorMap = {
        "Branco": "#ffffff", "Branco absoluto": "#fefefe", "Branco suave": "#f4f4f4", "Bege claro": "#fdf7e4", 
        "Areia": "#e9d8a6", "Amarelo claro": "#fff7b2", "Amarelo limão": "#f4f91e", "Amarelo": "#ffff00", 
        "Pêssego": "#ffcba4", "Laranja": "#ffa500", "Vermelho": "#ff0000", "Vermelho vivo": "#e94b3c", 
        "Bordeaux": "#800000", "Rosa claro": "#ffdbe5", "Rosa médio": "#f28db3", "Orquídea": "#da70d6", 
        "Fúcsia": "#ff00ff", "Magenta": "#ff00ff", "Violeta claro": "#c8a2c8", "Roxo escuro": "#4b0082", 
        "Azul céu": "#87ceeb", "Azul claro": "#00bcd4", "Ciano": "#00ffff", "Azul Cian": "#00ffff", 
        "Azul real": "#4169e1", "Azul petróleo": "#008b8b", "Azul jeans": "#1560bd", "Azul marinho": "#000080", 
        "Azul escuro": "#002366", "Azul Reflex": "#001489", "Preto": "#0b0b0b", 
        "Cinza médio": "#a9a9a9", "Cinza claro": "#d3d3d3", "Cinza suave": "#bfbfbf", 
        "Cinza escuro": "#999999", "Cinza profundo": "#4f4f4f", 
        "Verde suave": "#c7dd64", "Verde maçã": "#8db600", "Verde lima": "#caff70", 
        "Esmeralda": "#50c878", "Verde prado": "#66bb66", "Verde escuro": "#006400", 
        "Verde Pistacho": "#a8c256", "Khaki": "#c3b091", "Cinza zinco": "#7f7f7f", 
        "Verde tropa": "#556b2f", "Chocolate": "#7b3f00", "Terra": "#a0522d", "Kraft": "#b89b72", 
        "Multiplas Cores": "linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet)", 
        "Preto - Pantone Process Black U": "#2D2926", "Azul Claro – Pantone Process Blue": "#0085CA", 
        "Azul Médio – Pantone 300 U": "#0077C8", "Azul Escuro – Pantone Process Blue 072 U": "#10069F", 
        "Castanho – Pantone 4635 U": "#996046", "Laranja – Pantone Orange 021 U": "#FE5000", 
        "Verde Claro – Pantone 375 U": "#84BD00", "Verde Médio – Pantone 354 U": "#00B140", 
        "Verde Escuro – Pantone 357 U": "#215732", "Vermelho – Pantone Warm Red U": "#F9423A", 
        "Rosa – Pantone Rhodamine Red U": "#E10098", "Bordeaux – Pantone 188 U": "#7C2529"
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
            },
            "Cor": {
              tipo: "cores",
              valores: [
                "Branco",
                "Branco absoluto",
                "Branco suave",
                "Bege claro",
                "Areia",
                "Amarelo claro",
                "Amarelo limão",
                "Amarelo",
                "Pêssego",
                "Laranja",
                "Vermelho",
                "Vermelho vivo",
                "Bordeaux",
                "Rosa claro",
                "Rosa médio",
                "Orquídea",
                "Fúcsia",
                "Violeta claro",
                "Roxo escuro",
                "Azul céu",
                "Azul claro",
                "Ciano",
                "Azul real",
                "Azul petróleo",
                "Azul jeans",
                "Azul marinho",
                "Azul escuro",
                "Preto",
                "Cinza médio",
                "Cinza claro",
                "Cinza suave",
                "Cinza escuro",
                "Cinza profundo",
                "Verde suave",
                "Verde maçã",
                "Verde lima",
                "Esmeralda",
                "Verde prado",
                "Verde escuro",
                "Khaki",
                "Cinza zinco",
                "Verde tropa",
                "Chocolate",
                "Terra"
              ] 
            },
            "Tamanho": {
              tipo: "select",
              valores: ["S até 2XL", "3XL até 5XL", "Outros Tamanhos"]
            },
            "Quantidade": {
              tipo: "number",
              min: 10
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
            "Cor do Saco": {
              tipo: "cores",
              valores: [
                "Kraft",
                "Branco",
                "Preto",
                "Azul jeans",
                "Amarelo",
                "Magenta",
                "Azul Cian",
                "Azul Reflex",
                "Vermelho",
                "Verde Pistacho",
                "Laranja"
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
                  nome: "1 Face Grande",
                  imagem: "imagens/produtos/sacoskraft/frente.png"
                },
                {
                  nome: "1 Face Pequeno",
                  imagem: "imagens/produtos/sacoskraft/frentepequeno.png"
                },
                {
                  nome: "2 Faces",
                  imagem: "imagens/produtos/sacoskraft/frenteverso.png"
                }
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
  
    
      const produtoID = new URLSearchParams(window.location.search).get("produto");
      const produto = produtos[produtoID];
    
      if (!produto) {
        container.innerHTML = "<p>Produto não encontrado.</p>";
        return;
      }
    
      const gerarOpcoes = (label, op) => {
        switch (op.tipo) {
          case "cores":
            return `
              <div class="color-options">
                ${op.valores.map((cor, index) => {
                  const colorID = `${label.replace(/\s+/g, '-').toLowerCase()}-color-${index}`;
                  const colorHex = colorMap[cor] || "#ccc";
                  return `
                    <div class="overcell">
                      <input type="radio" name="${label}" value="${cor}" id="${colorID}" ${index === 0 ? "checked" : ""} required>
                      <label class="color-circle" for="${colorID}" style="background: ${colorHex};" title="${cor}"></label>
                    </div>
                  `;
                }).join('')}
              </div>
            `;
          case "imagem-radio":
            return `
              <div class="posicionamento-options">
                ${op.valores.map((item, index) => `
                  <div class="overcell">
                    <input type="radio" name="${label}" value="${item.nome}" id="pos-${index}" ${index === 0 ? "checked" : ""} required>
                    <label class="posicionamento-label" for="pos-${index}">
                      <img src="${item.imagem}" alt="${item.nome}" title="${item.nome}" class="posicionamento-img">
                    </label>
                  </div>
                `).join('')}
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
      
      let html = `
        <form class="product" method="POST" action="https://script.google.com/macros/s/AKfycbyxjTNPl660oUcdbr4QKInd-Y1j4e9hpuWyCcjdmqumJ8fHYqLIqhdwhQGyIirXZsqC/exec">
          <div class="product-image">
            <img src="${produto.imagem}" alt="${produto.nome}">
          </div>
          <div class="product-details">
            <h1>${produto.nome}</h1>
            <p class="descricao">${produto.descricao}</p>
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
                <textarea name="detalhes" placeholder="Descreve todas as informações sobre a tua encomenda!" required></textarea>
              </div>
            </div>
      
            <div class="options-row">
              <div class="form-group">
                <div class="overcell">
                  <label for="empresa">Empresa / Nome:</label>
                  <input type="text" name="empresa" placeholder="Empresa ou nome pessoal" required>
                </div>
              </div>
              <div class="form-group">
                <div class="overcell">
                  <label for="telemovel">Telemóvel:</label>
                  <input type="tel" name="telemovel" placeholder="Ex: 912 345 678" required>
                </div>
              </div>
            </div>
      
            <div class="form-row">
              <div class="form-group">
                <div class="overcell">
                  <label for="email">Email:</label>
                  <input type="email" name="email" placeholder="seu@email.com" required>
                </div>
              </div>
            </div>
      
            <button type="submit">Pedir Orçamento</button>
          </div>
        </form>
      `;
      
      container.innerHTML = html;
      
    });
    