const SUPABASE_URL = 'https://nbcmqkcztuogflejswau.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_co9n_L7O6rCcc9mb570Uhw_Bg8eqWIL';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function carregarProdutos() {
  const { data, error } = await supabase.from('products').select('*').order('id');
  if (error) {
    document.getElementById('produtos-lista').innerHTML = `<p>Erro: ${error.message}</p>`;
    return;
  }
  let html = '<table border="1"><tr><th>ID</th><th>Slug</th><th>Nome</th><th>Categoria</th><th>Ações</th></tr>';
  for (const p of data) {
    html += `<tr>
      <td>${p.id}</td>
      <td>${p.slug}</td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>
        <button onclick="editarProduto(${p.id})">Editar</button>
        <button onclick="apagarProduto(${p.id})">Apagar</button>
      </td>
    </tr>`;
  }
  html += '</table>';
  document.getElementById('produtos-lista').innerHTML = html;
}

function mostrarFormularioAdicionar() {
  document.getElementById('produto-formulario').style.display = 'block';
  document.getElementById('produto-formulario').innerHTML = `
    <h3>Adicionar Produto</h3>
    <form onsubmit="guardarProduto(event)">
      <input type="text" name="slug" placeholder="Slug" required><br>
      <input type="text" name="name" placeholder="Nome" required><br>
      <input type="text" name="category" placeholder="Categoria" required><br>
      <input type="text" name="images" placeholder="Imagens (["img1.webp","img2.webp"])" required><br>
      <textarea name="opcoes" placeholder='Opções JSON (ex: {"Tamanho":{...}})' required></textarea><br>
      <button type="submit">Guardar</button>
      <button type="button" onclick="fecharFormulario()">Cancelar</button>
    </form>
  `;
}

function fecharFormulario() {
  document.getElementById('produto-formulario').style.display = 'none';
  document.getElementById('produto-formulario').innerHTML = '';
}

async function guardarProduto(event) {
  event.preventDefault();
  const form = event.target;
  const slug = form.slug.value;
  const name = form.name.value;
  const category = form.category.value;
  const images = JSON.parse(form.images.value);
  const opcoes = JSON.parse(form.opcoes.value);
  const { error } = await supabase.from('products').insert([{ slug, name, category, images, opcoes }]);
  if (error) {
    alert('Erro ao guardar: ' + error.message);
  } else {
    alert('Produto guardado com sucesso!');
    fecharFormulario();
    carregarProdutos();
  }
}

async function editarProduto(id) {
  // Carrega produto e mostra form (podes adaptar como o de adicionar)
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error || !data) {
    alert('Erro a carregar produto');
    return;
  }
  document.getElementById('produto-formulario').style.display = 'block';
  document.getElementById('produto-formulario').innerHTML = `
    <h3>Editar Produto</h3>
    <form onsubmit="atualizarProduto(event, ${id})">
      <input type="text" name="slug" value="${data.slug}" required><br>
      <input type="text" name="name" value="${data.name}" required><br>
      <input type="text" name="category" value="${data.category}" required><br>
      <input type="text" name="images" value='${JSON.stringify(data.images)}' required><br>
      <textarea name="opcoes" required>${JSON.stringify(data.opcoes, null, 2)}</textarea><br>
      <button type="submit">Atualizar</button>
      <button type="button" onclick="fecharFormulario()">Cancelar</button>
    </form>
  `;
}

async function atualizarProduto(event, id) {
  event.preventDefault();
  const form = event.target;
  const slug = form.slug.value;
  const name = form.name.value;
  const category = form.category.value;
  const images = JSON.parse(form.images.value);
  const opcoes = JSON.parse(form.opcoes.value);
  const { error } = await supabase.from('products').update({ slug, name, category, images, opcoes }).eq('id', id);
  if (error) {
    alert('Erro ao atualizar: ' + error.message);
  } else {
    alert('Produto atualizado!');
    fecharFormulario();
    carregarProdutos();
  }
}

async function apagarProduto(id) {
  if (!confirm('Tem a certeza que quer apagar este produto?')) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) alert('Erro ao apagar: ' + error.message);
  else carregarProdutos();
}

// Carregar à entrada
carregarProdutos();
