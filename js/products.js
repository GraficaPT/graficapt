
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");
  const container = document.getElementById("produto-dinamico");

  fetch('produtos.json')
    .then(res => res.json())
    .then(produtos => {
      const produto = produtos.find(p => p.id === productId);
      if (!produto) {
        container.innerHTML = "<p>Produto não encontrado.</p>";
        return;
      }

      container.innerHTML = `
        <h2>${produto.nome}</h2>
        <img src="${produto.imagem}" alt="${produto.nome}" style="max-width:300px" />
        <p><strong>Preço:</strong> €${produto.preco}</p>
        <p><strong>Cores disponíveis:</strong> ${produto.cores.join(', ')}</p>
        <p>${produto.descricao}</p>
      `;
    })
    .catch(error => {
      container.innerHTML = "<p>Erro ao carregar produto.</p>";
      console.error(error);
    });
});
