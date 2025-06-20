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
    "Rosa – Pantone Rhodamine Red U": "#E10098", "Bordeaux – Pantone 188 U": "#7C2529",
    "Cinza Puro": "#c0c0c0",
    "Preto": "#242021",
    "Cinza Puro": "#969791",
    "Cinzento matizado": "#96a7af",
    "Cinzento ratinho": "#41454e",
    "Off-white": "#f2efe6",
    "Linen": "#fff4d6",
    "Corda": "#cfbfb2",
    "Vermelho": "#f60001",
    "Bordeaux": "#902c44",
    "Cor-de-Rosa Doce": "#ffd6e2",
    "Azul céu": "#009ad0",
    "Verde garrafa": "#565040",
    "Rosa médio": "#cf6977",
    "Lilás": "#662c55",
    "Aqua": "#529eab",
    "Real": "#0057a4",
    "Denim": "#113c5e",
    "Azul profundo": "#002b46",
    "Verde dos prados": "#009c53"
  };

  const produtos = {
    "ardosia": {
      nome: "Ardosia Gravada Laser",
      imagens: [
        "../imagens/produtos/ardosia/mockup.webp"
      ],
      descricao: "Placa de ardósia personalizada com gravação a laser. Ideal para restauração e decoração!<br>Dê ao seu espaço um toque especial.",
      opcoes: {
        "Posicionamento": {
          tipo: "imagem-radio",
          valores: [
            {
              nome: "Pequeno no Canto",
              imagem: "../imagens/produtos/ardosia/minimockup.webp"
            },
            {
              nome: "Grande no Centro",
              imagem: "../imagens/produtos/ardosia/midmockup.webp"
            }
          ]
        },
        "Tamanho": {
          tipo: "select",
          valores: ["25x30cm", "20x25cm"]
        },
        "Quantidade": {
          tipo: "number",
          min: 5
        }
      }
    },
    "portachaves": {
      nome: "Porta Chaves Acrílico",
      imagens: [
        "../imagens/produtos/portachaves/mockup1.webp"
      ],
      descricao: "Porta chaves de acrilico com dupla camada resistente, dê vida ao seu logotipo com um brinde extra!<br>Tamanho maximo 5x5cm",
      opcoes: {
        "Cor Fundo": {
          tipo: "cores",
          valores: ["Branco", "Preto", "Azul jeans", "Verde Escuro – Pantone 357 U", "Rosa – Pantone Rhodamine Red U", "Vermelho", "Laranja – Pantone Orange 021 U", "Amarelo limão"]
        },
        "Cor Principal": {
          tipo: "cores",
          valores: ["Branco", "Preto", "Azul jeans", "Verde Escuro – Pantone 357 U", "Rosa – Pantone Rhodamine Red U", "Vermelho", "Laranja – Pantone Orange 021 U", "Amarelo limão"]
        },
        "Quantidade": {
          tipo: "select",
          valores: ["20 Unidades", "40 Unidades", "80 Unidades", "120 Unidades", "200 Unidades", "Outras Quantidades"]
        }
      }
    },
    "tshirt": {
      nome: "T-Shirt Personalizada",
      imagens: [
        "../imagens/produtos/tshirt/mockup1.webp",
        "../imagens/produtos/tshirt/mockup2.webp",
        "../imagens/produtos/tshirt/mockup3.webp"
      ],
      descricao: "",
      opcoes: {
        "Posicionamento": {
          tipo: "imagem-radio",
          valores: [
            {
              nome: "Frente e Verso",
              imagem: "../imagens/produtos/tshirt/fv.webp"
            },
            {
              nome: "Frente",
              imagem: "../imagens/produtos/tshirt/f.webp"
            },
            {
              nome: "Verso",
              imagem: "../imagens/produtos/tshirt/v.webp"
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
        }
      }
    },
    "polo": {
      nome: "T-Shirt Polo Personalizado",
      imagens: [
        "../imagens/produtos/polo/mockup1.webp",
        "../imagens/produtos/polo/mockup2.webp",
        "../imagens/produtos/polo/mockup3.webp"
      ],
      descricao: "T-Shirt polos personalizados com DTF de alta qualidade para dar um toque extra profissional à sua empresa!",
      opcoes: {
        "Cor": {
          tipo: "cores",
          valores: [
            "Branco", "Preto", "Azul",
            "Cinza Puro", "Cinzento matizado", "Cinzento ratinho",
            "Off-white", "Linen", "Corda", "Amarelo", "Laranja", "Vermelho",
            "Cor-de-Rosa Doce", "Lilás", "Azul céu", "Aqua", "Real", "Denim",
            "Azul profundo", "Verde dos prados", "Verde garrafa"
          ]
        }, 
        "Posicionamento": {
          tipo: "imagem-radio",
          valores: [
            {
              nome: "Frente e Verso",
              imagem: "../imagens/produtos/polo/fv.webp"
            },
            {
              nome: "Frente",
              imagem: "../imagens/produtos/polo/f.webp"
            },
            {
              nome: "Verso",
              imagem: "../imagens/produtos/polo/v.webp"
            }
          ]
        },
       "Gramagem": {
          tipo: "imagem-radio",
          valores: [
            {
              nome: "170 g/m²",
              imagem: "../imagens/produtos/polo/170.webp"
            },
            {
              nome: "210 g/m²",
              imagem: "../imagens/produtos/polo/210.webp"
            }
          ]
        },
        "Tamanho": {
          tipo: "select",
          valores: ["S até 2XL", "3XL até 5XL", "Outros Tamanhos"]
        },
        "Quantidade": {
          tipo: "number",
        }
      }
    },
    "sacoskraft": {
      nome: "Sacos Kraft Personalizados",
      imagens: [
        "../imagens/produtos/sacoskraft/mockup1.webp",
        "../imagens/produtos/sacoskraft/mockup2.webp"
      ],
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
              imagem: "../imagens/produtos/sacoskraft/frente.webp"
            },
            {
              nome: "1 Face Pequeno",
              imagem: "../imagens/produtos/sacoskraft/frentepequeno.webp"
            },
            {
              nome: "2 Faces",
              imagem: "../imagens/produtos/sacoskraft/frenteverso.webp"
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
      imagens: [
        "../imagens/produtos/bandeiragota/mockup1.webp",
        "../imagens/produtos/bandeiragota/mockup2.webp",
        "../imagens/produtos/bandeiragota/mockup3.webp",
        "../imagens/produtos/bandeiragota/mockup4.webp"
      ],
      descricao: "Bandeiras promocionais em diversos tamanhos, ideais para destacar a sua marca em eventos e pontos de venda.<br>Este kit contem 1 base de fixacao, 1 mastro completo e 1 bandeira com o design que escolher.",
      opcoes: {

        "Tamanho": {
          tipo: "imagem-radio",
          valores: [
            {
              nome: "S Frente e Verso",
              imagem: "../imagens/produtos/bandeiragota/sfv.webp"
            },
            {
              nome: "S",
              imagem: "../imagens/produtos/bandeiragota/s.webp"
            },
            {
              nome: "M",
              imagem: "../imagens/produtos/bandeiragota/m.webp"
            },
            {
              nome: "L",
              imagem: "../imagens/produtos/bandeiragota/l.webp"
            },
            {
              nome: "XL",
              imagem: "../imagens/produtos/bandeiragota/xl.webp"
            },
            {
              nome: "XXL",
              imagem: "../imagens/produtos/bandeiragota/xxl.webp"
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
      imagens: [
        "../imagens/produtos/bandeiravela/mockup1.webp",
        "../imagens/produtos/bandeiravela/mockup2.webp",
        "../imagens/produtos/bandeiravela/mockup3.webp",
        "../imagens/produtos/bandeiravela/mockup4.webp"
      ],
      descricao: "Bandeiras promocionais em diversos tamanhos, ideais para destacar a sua marca em eventos e pontos de venda.<br>Este kit contem 1 base de fixacao, 1 mastro completo e 1 bandeira com o design que escolher.",
      opcoes: {

        "Tamanho": {
          tipo: "imagem-radio",
          valores: [
            {
              nome: "S Frente e Verso",
              imagem: "../imagens/produtos/bandeiravela/sfv.webp"
            },
            {
              nome: "S",
              imagem: "../imagens/produtos/bandeiravela/s.webp"
            },
            {
              nome: "M",
              imagem: "../imagens/produtos/bandeiravela/m.webp"
            },
            {
              nome: "L",
              imagem: "../imagens/produtos/bandeiravela/l.webp"
            },
            {
              nome: "XL",
              imagem: "../imagens/produtos/bandeiravela/xl.webp"
            },
            {
              nome: "XXL",
              imagem: "../imagens/produtos/bandeiravela/xxl.webp"
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
      imagens: [
        "../imagens/produtos/rollup/mockup1.webp",
        "../imagens/produtos/rollup/mockup2.webp",
        "../imagens/produtos/rollup/mockup3.webp",
        "../imagens/produtos/rollup/mockup4.webp"
      ],
      descricao: "O Roll-Up 85x200 cm é uma solução fantástica para expor a publicidade do seu cliente. Graças à sua leveza e facilidade de montagem, é uma das opções mais versáteis para a publicidade em feiras, pontos de venda, recepções, centros comerciais, etc.<br><br>A impressão pode ser enrolada na estrutura inferior e é fornecida com uma mala de transporte para armazenamento e transporte. Pode ser montada em apenas alguns segundos.<br><br>O desenho é impresso em 340 g/m² e a Pet Banner oferece rigidez graças ao seu suporte cinzento, é totalmente opaca para não apresentar qualquer tipo de transparência.",
      opcoes: {
        "Tamanho": {
          tipo: "imagem-radio",
          valores: [
            {
              nome: "S",
              imagem: "../imagens/produtos/rollup/s.webp"
            }
          ]
        },
        "Quantidade": {
          tipo: "number",
          min: 1
        }
      }
    },
    "sacostecido": {
      nome: "Sacos de Tecido Coloridos",
      imagens: [
        "../imagens/produtos/sacostecido/mockup1.webp",
        "../imagens/produtos/sacostecido/mockup2.webp",
        "../imagens/produtos/sacostecido/mockup3.webp"
      ],
      descricao: "Sacos ecológicos em tecido com diversas cores e opções de posicionamento do design. Perfeitos para brindes e uso diário.",
      opcoes: {
        "Cor": {
          tipo: "cores",
          valores: [
            "Branco",                
            "Preto",                  
            "Cinza profundo",         
            "Areia",                 
            "Amarelo limão",          
            "Laranja",                 
            "Vermelho",               
            "Roxo escuro",             
            "Azul céu",              
            "Azul real",               
            "Azul escuro",       
            "Verde lima"  
          ]       
          
        },
        "Quantidade": {
          tipo: "select",
          valores: ["5 Unidades", "10 Unidades", "20 Unidades", "40 Unidades", "80 Unidades", "120 Unidades", "200 Unidades", "Outras Quantidades"]
        },
        "Posicionamento": {
          tipo: "imagem-radio",
          valores: [
            {
              nome: "1 Face Pequeno",
              imagem: "../imagens/produtos/sacostecido/frentepequeno.webp"
            },
            {
              nome: "1 Face Grande",
              imagem: "../imagens/produtos/sacostecido/frente.webp"
            },
            {
              nome: "2 Faces",
              imagem: "../imagens/produtos/sacostecido/frenteverso.webp"
            }
          ]
        },
        "Gramagem": {
          tipo: "imagem-radio",
          valores: [
            {
              nome: "140 g/m²",
              imagem: "../imagens/produtos/sacostecido/140.webp"
            },
            {
              nome: "180 g/m²",
              imagem: "../imagens/produtos/sacostecido/180.webp"
            },
            {
              nome: "270 g/m²",
              imagem: "../imagens/produtos/sacostecido/270.webp"
            }
          ]
        }
      }
    },
    "sacospano": {
      nome: "Sacos de Pano Estampados",
      imagens: [
        "../imagens/produtos/sacospano/mockup1.webp",
        "../imagens/produtos/sacospano/mockup2.webp",
        "../imagens/produtos/sacospano/mockup3.webp"
      ],
      descricao: "Sacos ecológicos em pano, várias opções de posicionamento do design. Perfeitos para brindes e uso diário.",
      opcoes: {
        "Quantidade": {
          tipo: "select",
          valores: ["5 Unidades", "10 Unidades", "20 Unidades", "40 Unidades", "80 Unidades", "120 Unidades", "200 Unidades", "Outras Quantidades"]
        },
        "Posicionamento": {
          tipo: "imagem-radio",
          valores: [
            {
              nome: "1 Face Pequeno",
              imagem: "../imagens/produtos/sacostecido/frentepequeno.webp"
            },
            {
              nome: "1 Face Grande",
              imagem: "../imagens/produtos/sacostecido/frente.webp"
            }
          ]
        },
        "Gramagem": {
          tipo: "imagem-radio",
          valores: [
            {
              nome: "140 g/m²",
              imagem: "../imagens/produtos/sacostecido/140.webp"
            },
            {
              nome: "180 g/m²",
              imagem: "../imagens/produtos/sacostecido/180.webp"
            },
            {
              nome: "270 g/m²",
              imagem: "../imagens/produtos/sacostecido/270.webp"
            }
          ]
        }
      }
    }
  };

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
          
        <input type="hidden" name="_captcha" value="false">
        <input type="hidden" name="_next" value="https://graficapt.com">

        <button type="submit">Pedir Orçamento</button><br>
        <p class="descricao">${produto.descricao}</p>
      </div>
      <input type="text" value="${produto.nome}" class="productname" id="productname" name="Produto">
    </form>
  `;
  
  container.innerHTML = html;
});


