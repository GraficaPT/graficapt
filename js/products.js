document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("produto-dinamico");

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
        valores: [
          "#ffffff",
          "#0b0b0b",
          "#1560bd",
          "#215732",
          "#E10098",
          "#ff0000",
          "#FE5000",
          "#f4f91e"
        ]
      },
      "Cor Principal": {
        tipo: "cores",
        valores: [
          "#ffffff",
          "#0b0b0b",
          "#1560bd",
          "#215732",
          "#E10098",
          "#ff0000",
          "#FE5000",
          "#f4f91e"
        ]
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
        "../imagens/produtos/tshirt/mockup.webp",
        "../imagens/produtos/tshirt/mockup2.webp",
        "../imagens/produtos/tshirt/mockup3.webp"
      ],
      descricao: "",
      opcoes: {
        "Posicionamento da Personalização": {
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
        "Cor da T-Shirt": {
          tipo: "cores",
          valores: [
            "#f7f7f7",
            "#000000",
            "#53565b",
            "#9c9b96",
            "#fe883e",
            "#de5060",
            "#3155a6",
            "#061b2d",
            "#4ea94e",
            "#163f35"
          ]
        },
        "Tamanhos": {
          tipo: "quantidade-por-tamanho",
          valores: ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"]
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
            "#ffffff",
            "#242021",
            "#96a7af",
            "#999993",
            "#41454e",
            "#f2efe6",
            "#cfbfb2",
            "#dad3c0",
            "#ffc100",
            "#fe8d00",
            "#f60001",
            "#fb97a7",
            "#e1c6e7",
            "#75c0e8",
            "#009ad0",
            "#0057a4",
            "#113c5e",
            "#002b46",
            "#009c53",
            "#01452c"
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
        "Tamanhos": {
          tipo: "quantidade-por-tamanho",
          valores: ["S", "M", "L", "XL", "XXL", "Outro"]
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
            "#b89b72", // Kraft
            "#ffffff", // Branco
            "#0b0b0b", // Preto
            "#1560bd", // Azul jeans
            "#ffff00", // Amarelo
            "#ff00ff", // Magenta
            "#00ffff", // Azul Cian
            "#001489", // Azul Reflex
            "#ff0000", // Vermelho
            "#a8c256", // Verde Pistacho
            "#ffa500"  // Laranja
          ]
        },
       "Cor da Personalização": {
          tipo: "cores",
          valores: [
            "#2D2926", // Preto - Pantone Process Black U
            "#0085CA", // Azul Claro – Pantone Process Blue
            "#0077C8", // Azul Médio – Pantone 300 U
            "#10069F", // Azul Escuro – Pantone Process Blue 072 U
            "#996046", // Castanho – Pantone 4635 U
            "#FE5000", // Laranja – Pantone Orange 021 U
            "#84BD00", // Verde Claro – Pantone 375 U
            "#00B140", // Verde Médio – Pantone 354 U
            "#215732", // Verde Escuro – Pantone 357 U
            "#F9423A", // Vermelho – Pantone Warm Red U
            "#E10098", // Rosa – Pantone Rhodamine Red U
            "#7C2529", // Bordeaux – Pantone 188 U
            "linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet)" // Multiplas Cores
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
      descricao: "",
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
      descricao: "",
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
      descricao: "",
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
            "#ffffff",
            "#0b0b0b",
            "#4f4f4f",
            "#e9d8a6",
            "#f4f91e",
            "#ffa500",
            "#ff0000",
            "#4b0082",
            "#009ad0",
            "#4169e1",
            "#002366",
            "#caff70"
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


