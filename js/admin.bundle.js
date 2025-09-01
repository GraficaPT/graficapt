// /js/admin.bundle.js  (ESM-ready; can be loaded with <script type="module">)
/* global window, document */
const ENV = window.__ENV || {};
const SUPABASE_URL = ENV.SUPABASE_URL || 'https://nbcmqkcztuogflejswau.supabase.co';
const SUPABASE_KEY = ENV.SUPABASE_ANON_KEY || 'sb_publishable_co9n_L7O6rCcc9mb570Uhw_Bg8eqWIL';
const STORAGE_PUBLIC = `${SUPABASE_URL}/storage/v1/object/public/products/`;

// Get supabase client (prefer global UMD if present, else ESM CDN)
let supabaseClientFactory = window.supabase?.createClient;
if (!supabaseClientFactory) {
  const mod = await import('https://esm.sh/@supabase/supabase-js@2');
  supabaseClientFactory = mod.createClient;
}
const supabase = supabaseClientFactory(SUPABASE_URL, SUPABASE_KEY);

// ---- SESSION GUARD ----
{
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session) {
    alert('Sessão expirada ou não autenticado. A redirecionar...');
    window.location.href = 'login.html';
  }
}

// ---- STATE ----
let produtos = [];
let editingId = null;

// ---- UTIL ----
async function uploadImageToSupabase(file, slug) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
  const filePath = `${slug}/${fileName}`;
  const { error } = await supabase.storage.from('products').upload(filePath, file, { upsert: false });
  if (error) throw error;
  return filePath;
}

function showImagePreview(images, slug = '') {
  const container = document.getElementById('imagePreview');
  if (!container) return;
  container.innerHTML = '';

  images.forEach((src, idx) => {
    const clean = String(src).replace(/^.*[\\/]/, '');
    const url = src.startsWith('http') ? src : `${STORAGE_PUBLIC}${slug}/${clean}`;
    const img = document.createElement('img');
    img.src = url;
    img.draggable = true;
    img.className = 'img-preview-draggable';
    img.dataset.idx = idx;

    img.ondragstart = e => { e.dataTransfer.setData('text/plain', idx); img.classList.add('dragging'); };
    img.ondragend = () => {
      img.classList.remove('dragging');
      container.querySelectorAll('.img-preview-draggable').forEach(i => i.classList.remove('over'));
    };
    img.ondragover = e => e.preventDefault();
    img.ondragenter = () => img.classList.add('over');
    img.ondragleave = () => img.classList.remove('over');
    img.ondrop = e => {
      e.preventDefault();
      const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
      const toIdx = parseInt(img.dataset.idx, 10);
      if (fromIdx === toIdx) return;
      const arr = images.slice();
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      document.getElementById('inputImagesJson').value = JSON.stringify(arr);
      showImagePreview(arr, slug);
    };

    container.appendChild(img);
  });
}

function renderOpcoesList(opcoesArray, imagensProduto = []) {
  const list = document.getElementById('opcoesList');
  if (!list) return;
  list.innerHTML = '';
  (opcoesArray || []).forEach((op, idx, arr) => {
    list.appendChild(createOpcaoRow(op.label, op.tipo || 'number', op.valores, idx, arr.length, imagensProduto));
  });
}

function createValoresInputs(tipo, valores = [], slug = "", imagensProduto = []) {
  const wrapper = document.createElement('div');
  wrapper.className = 'valores-list';

  async function handleFileUpload(inputFile, hiddenPath, previewImg, spanNome) {
    const file = inputFile.files[0];
    if (!file || !slug) return;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
    const filePath = `${slug}/${fileName}`;
    const { error } = await supabase.storage.from('products').upload(filePath, file, { upsert: true });
    if (error) {
      alert('Erro ao carregar imagem: ' + error.message);
      return;
    }
    hiddenPath.value = filePath;
    previewImg.src = `${STORAGE_PUBLIC}${filePath}`;
    spanNome.textContent = file.name;
  }

  function addInput(val) {
    const item = document.createElement('div');
    item.className = 'valor-item';

    if (tipo === 'imagem-radio') {
      const inputNome = document.createElement('input');
      inputNome.type = 'text';
      inputNome.placeholder = "Nome";
      inputNome.value = val && val.nome ? val.nome : "";
      inputNome.className = "input-valor-nome";

      const previewImg = document.createElement('img');
      previewImg.className = "img-preview-radio";
      if (val && val.imagem) previewImg.src = val.imagem.startsWith('http') ? val.imagem : `${STORAGE_PUBLIC}${val.imagem}`;

      const hiddenPath = document.createElement('input');
      hiddenPath.type = 'hidden';
      hiddenPath.value = val && val.imagem ? val.imagem : "";

      const labelBtn = document.createElement('label');
      labelBtn.className = 'custom-file-upload';

      const spanNome = document.createElement('span');
      spanNome.textContent = val && val.imagem ? (val.imagem.split('/').pop() || "Escolher ficheiro") : "Escolher ficheiro";

      const inputFile = document.createElement('input');
      inputFile.type = 'file';
      inputFile.accept = 'image/*';
      inputFile.style.display = 'none';
      inputFile.onchange = async function () { await handleFileUpload(inputFile, hiddenPath, previewImg, spanNome); };
      labelBtn.appendChild(inputFile);
      labelBtn.appendChild(spanNome);

      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.innerHTML = '🗑️';
      btnDel.className = "btn btn-small";
      btnDel.onclick = e => { e.preventDefault(); item.remove(); };

      item.appendChild(inputNome);
      item.appendChild(previewImg);
      item.appendChild(labelBtn);
      item.appendChild(hiddenPath);
      item.appendChild(btnDel);

    } else if (tipo === 'cores') {
      const nomeInput = document.createElement('input');
      nomeInput.type = 'text';
      nomeInput.className = 'cor-nome';
      nomeInput.value = val && val.nome ? val.nome : "";

      const corInput = document.createElement('input');
      corInput.type = 'color';
      corInput.className = 'cor-picker';
      corInput.value = val && val.cor ? val.cor : "#000000";

      // carrossel de img associadas
      const carrosselDiv = document.createElement('div');
      carrosselDiv.className = 'carrossel-img-cor';

      let imagens = imagensProduto && imagensProduto.length ? imagensProduto : [];
      let idx = 0;
      if (val && val.imagem) {
        idx = imagens.findIndex(img => img === val.imagem);
        if (idx < 0) idx = 0;
      }
      let imagemSelecionada = (val && val.imagem) ? val.imagem : "";

      function renderCarrossel() {
        carrosselDiv.innerHTML = '';
        const btnPrev = document.createElement('button');
        btnPrev.type = 'button';
        btnPrev.innerHTML = '◀️';
        btnPrev.className = 'btn-mini';
        btnPrev.onclick = (e) => {
          e.preventDefault();
          if (!imagens.length) return;
          idx = idx > 0 ? idx - 1 : imagens.length - 1;
          imagemSelecionada = imagens[idx];
          inputImg.value = imagemSelecionada;
          renderCarrossel();
        };
        carrosselDiv.appendChild(btnPrev);

        const img = document.createElement('img');
        img.className = 'img-thumb';
        img.style.width = '38px';
        img.style.height = '38px';
        img.style.borderRadius = '6px';
        img.style.border = imagemSelecionada ? '2px solid #2a77d3' : '2px dashed #bbb';
        img.style.margin = '0 8px';
        img.src = imagemSelecionada
          ? (imagemSelecionada.startsWith('http') ? imagemSelecionada : `${STORAGE_PUBLIC}${imagemSelecionada}`)
          : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38"><rect width="100%" height="100%" fill="#f7f7f7"/><text x="50%" y="50%" font-size="13" fill="#bbb" text-anchor="middle" alignment-baseline="middle">vazio</text></svg>';
        carrosselDiv.appendChild(img);

        const btnNext = document.createElement('button');
        btnNext.type = 'button';
        btnNext.innerHTML = '▶️';
        btnNext.className = 'btn-mini';
        btnNext.onclick = (e) => {
          e.preventDefault();
          if (!imagens.length) return;
          idx = idx < imagens.length - 1 ? idx + 1 : 0;
          imagemSelecionada = imagens[idx];
          inputImg.value = imagemSelecionada;
          renderCarrossel();
        };
        carrosselDiv.appendChild(btnNext);

        const btnClear = document.createElement('button');
        btnClear.type = 'button';
        btnClear.innerHTML = '❌';
        btnClear.className = 'btn-mini btn-clear';
        btnClear.title = 'Remover imagem';
        btnClear.onclick = (e) => {
          e.preventDefault();
          imagemSelecionada = '';
          idx = 0;
          inputImg.value = '';
          renderCarrossel();
        };
        carrosselDiv.appendChild(btnClear);
      }

      const inputImg = document.createElement('input');
      inputImg.type = 'hidden';
      inputImg.className = 'cor-imagem-associada';
      inputImg.value = imagemSelecionada;

      renderCarrossel();

      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.innerHTML = '🗑️';
      btnDel.className = "btn btn-small";
      btnDel.onclick = e => { e.preventDefault(); item.remove(); };

      item.appendChild(nomeInput);
      item.appendChild(corInput);
      item.appendChild(carrosselDiv);
      item.appendChild(inputImg);
      item.appendChild(btnDel);

    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = val || "";
      input.placeholder = "Valor";
      input.className = "input-valor-generico";
      const btnDel = document.createElement('button');
      btnDel.type = 'button';
      btnDel.innerHTML = '🗑️';
      btnDel.className = "btn btn-small";
      btnDel.onclick = e => { e.preventDefault(); item.remove(); };

      item.appendChild(input);
      item.appendChild(btnDel);
    }

    wrapper.appendChild(item);
  }

  if (Array.isArray(valores) && valores.length) {
    valores.forEach(v => addInput(v));
  } else {
    addInput("");
  }

  const btnAdd = document.createElement('button');
  btnAdd.type = 'button';
  btnAdd.className = 'btn btn-small btn-add-valor';
  btnAdd.textContent = '+';
  btnAdd.title = "Adicionar valor";
  btnAdd.onclick = e => {
    e.preventDefault();
    if (tipo === 'cores') addInput({ nome: "", cor: "#000000", imagem: "" });
    else if (tipo === 'imagem-radio') addInput({ nome: "", imagem: "" });
    else addInput("");
  };

  wrapper.appendChild(btnAdd);
  return { wrapper, addInput };
}

function createOpcaoRow(label = '', tipo = 'number', valores = [], idx = 0, total = 1, imagensProduto = []) {
  const row = document.createElement('div');
  row.className = 'opcao-row';

  const mainDiv = document.createElement('div');
  mainDiv.className = 'opcao-main';

  const labelInput = document.createElement('input');
  labelInput.placeholder = "Label (ex: Cor, Tamanho)";
  labelInput.value = label;

  const tipoSelect = document.createElement('select');
  ['number', 'cores', 'imagem-radio', 'select', 'quantidade-por-tamanho'].forEach(tp => {
    const opt = document.createElement('option');
    opt.value = tp; opt.textContent = tp;
    if (tp === tipo) opt.selected = true;
    tipoSelect.appendChild(opt);
  });

  let { wrapper: valoresContainer, addInput } = createValoresInputs(
    tipo, valores, document.getElementById('inputSlug')?.value.trim() || '', imagensProduto
  );

  tipoSelect.onchange = () => {
    const novo = createValoresInputs(
      tipoSelect.value, [], document.getElementById('inputSlug')?.value.trim() || '', imagensProduto
    );
    valoresContainer.replaceWith(novo.wrapper);
    valoresContainer = novo.wrapper;
    addInput = novo.addInput;
    row.valoresContainer = valoresContainer;
  };

  const btnAddValor = document.createElement('button');
  btnAddValor.type = 'button';
  btnAddValor.className = 'btn btn-small btn-add-valor';
  btnAddValor.textContent = '+';
  btnAddValor.title = "Adicionar valor";
  btnAddValor.onclick = e => {
    e.preventDefault();
    if (tipoSelect.value === 'imagem-radio') addInput({ nome: "", imagem: "" });
    else if (tipoSelect.value === 'cores') addInput({ nome: "", cor: "#000000", imagem: "" });
    else addInput("");
  };

  const btnUp = document.createElement('button');
  btnUp.className = 'btn btn-small';
  btnUp.innerHTML = '↑';
  btnUp.title = 'Mover para cima';
  btnUp.onclick = e => { e.preventDefault(); const parent = row.parentNode; if (row.previousElementSibling) parent.insertBefore(row, row.previousElementSibling); };

  const btnDown = document.createElement('button');
  btnDown.className = 'btn btn-small';
  btnDown.innerHTML = '↓';
  btnDown.title = 'Mover para baixo';
  btnDown.onclick = e => { e.preventDefault(); const parent = row.parentNode; if (row.nextElementSibling) parent.insertBefore(row.nextElementSibling, row); };

  const btnDel = document.createElement('button');
  btnDel.className = 'btn btn-delete btn-small';
  btnDel.textContent = 'Remover';
  btnDel.onclick = e => { e.preventDefault(); row.remove(); };

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'opcao-actions';
  actionsDiv.appendChild(btnAddValor);
  actionsDiv.appendChild(btnUp);
  actionsDiv.appendChild(btnDown);
  actionsDiv.appendChild(btnDel);

  mainDiv.appendChild(labelInput);
  mainDiv.appendChild(tipoSelect);
  mainDiv.appendChild(actionsDiv);

  row.appendChild(mainDiv);
  row.appendChild(valoresContainer);
  row.valoresContainer = valoresContainer;

  return row;
}

// ---- CRUD ----
async function loadProdutos() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) { alert("Erro ao carregar produtos: " + error.message); return; }
  produtos = data || [];
  renderProdutosList(produtos);
}

function renderProdutosList(produtosArr) {
  const list = document.getElementById('produtosList');
  if (!list) return;
  list.innerHTML = '';
  produtosArr.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'produto-card';
    const bannerUrl = prod.banner ? `${STORAGE_PUBLIC}${prod.banner}` : '';
    card.innerHTML = `
      <b>${prod.name || ''}</b>
      <div>${prod.category || ''}</div>
      <img src="${bannerUrl}" alt="Banner" />
      <div class="produto-actions">
        <button class="btn btn-edit" data-id="${prod.id}">Editar</button>
        <button class="btn btn-delete" data-id="${prod.id}">Eliminar</button>
      </div>
    `;
    list.appendChild(card);
  });

  // bind actions
  list.querySelectorAll('.btn-edit').forEach(btn => btn.addEventListener('click', () => editProduto(Number(btn.dataset.id))));
  list.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', () => deleteProduto(Number(btn.dataset.id))));
}

// ---- UI actions ----
function editProduto(id) {
  const prod = produtos.find(p => p.id === id);
  if (!prod) return;
  editingId = id;
  document.getElementById('inputBannerJson').value = prod.banner || '';
  document.getElementById('bannerPreview').innerHTML = prod.banner
    ? `<img src="${STORAGE_PUBLIC}${prod.banner}" style="max-width:100%;height:60px;">`
    : '';
  document.getElementById('inputMetawords').value = (prod.metawords || []).join(', ');
  document.getElementById('formContainer').style.display = 'block';
  document.getElementById('inputName').value = prod.name || '';
  document.getElementById('inputSlug').value = prod.slug || '';
  document.getElementById('inputCategory').value = prod.category || '';
  document.getElementById('inputImagesJson').value = JSON.stringify(prod.images || []);
  showImagePreview(prod.images || [], prod.slug || "");
  renderOpcoesList(prod.opcoes || [], prod.images || []);
  window.scrollTo(0, 0);
}

async function deleteProduto(id) {
  if (!confirm('Eliminar este produto?')) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return alert('Erro ao eliminar: ' + error.message);
  await loadProdutos();
}

// ---- DOM bindings ----
document.getElementById('addProductBtn')?.addEventListener('click', () => {
  editingId = null;
  document.getElementById('formContainer').style.display = 'block';
  document.getElementById('produtoForm').reset();
  document.getElementById('inputImagesJson').value = '[]';
  showImagePreview([]);
  renderOpcoesList([{ label: '', tipo: 'number', valores: [] }], []);
  window.scrollTo(0, 0);
});

document.getElementById('cancelBtn')?.addEventListener('click', () => {
  document.getElementById('formContainer').style.display = 'none';
});

document.getElementById('inputBanner')?.addEventListener('change', async function() {
  const file = this.files[0];
  if (!file) return;
  const prodSlug = document.getElementById('inputSlug').value.trim();
  const fileExt = file.name.split('.').pop();
  const fileName = `banner.${fileExt}`;
  const filePath = `${prodSlug}/${fileName}`;
  const { error } = await supabase.storage.from('products').upload(filePath, file, { upsert: true });
  if (error) return alert('Erro ao fazer upload do banner: ' + error.message);
  document.getElementById('inputBannerJson').value = filePath;
  document.getElementById('bannerPreview').innerHTML = `<img src="${STORAGE_PUBLIC}${filePath}" style="max-width:100%;height:60px;">`;
});

document.getElementById('inputImages')?.addEventListener('change', async function() {
  const files = Array.from(this.files);
  const prodSlug = document.getElementById('inputSlug').value.trim();
  const imgNames = [];
  for (const file of files) {
    const path = await uploadImageToSupabase(file, prodSlug);
    imgNames.push(path);
  }
  showImagePreview(imgNames, prodSlug);
  document.getElementById('inputImagesJson').value = JSON.stringify(imgNames);
});

document.getElementById('addOpcaoBtn')?.addEventListener('click', () => {
  const imgs = [];
  try { imgs.push(...JSON.parse(document.getElementById('inputImagesJson').value)); } catch {}
  const list = document.getElementById('opcoesList');
  list.appendChild(createOpcaoRow('', 'number', [], list.children.length, list.children.length + 1, imgs));
  list.appendChild(document.createElement('hr'));
});

document.getElementById('produtoForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const name = document.getElementById('inputName').value.trim();
  const slug = document.getElementById('inputSlug').value.trim();
  const category = document.getElementById('inputCategory').value.trim();
  let images = [];
  try { images = JSON.parse(document.getElementById('inputImagesJson').value); } catch {}

  const opcoes = [];
  document.querySelectorAll('#opcoesList .opcao-row').forEach(row => {
    const label = row.querySelector('.opcao-main input').value.trim();
    const tipo = row.querySelector('select').value.trim();
    let valores = [];
    if (tipo === 'imagem-radio') {
      row.valoresContainer.querySelectorAll('.valor-item').forEach(item => {
        const nomeInput = item.querySelector('input[type="text"]');
        const hiddenImg = item.querySelector('input[type="hidden"]');
        if ((nomeInput?.value || '').trim() && (hiddenImg?.value || '').trim())
          valores.push({ nome: nomeInput.value.trim(), imagem: hiddenImg.value.trim() });
      });
    } else if (tipo === 'cores') {
      row.valoresContainer.querySelectorAll('.valor-item').forEach(item => {
        const nomeInput = item.querySelector('input.cor-nome');
        const corInput = item.querySelector('input.cor-picker');
        const imgInput = item.querySelector('input.cor-imagem-associada');
        if ((nomeInput?.value || '').trim() && (corInput?.value || '').trim())
          valores.push({ nome: nomeInput.value.trim(), cor: corInput.value.trim(), imagem: imgInput.value });
      });
    } else {
      row.valoresContainer.querySelectorAll('.valor-item input[type="text"]').forEach(input => {
        if ((input.value || '').trim()) valores.push(input.value.trim());
      });
    }
    opcoes.push({ label, tipo, valores });
  });

  const metawordsRaw = document.getElementById('inputMetawords').value.trim();
  const metawords = metawordsRaw ? metawordsRaw.split(',').map(w => w.trim()).filter(Boolean) : [];
  const banner = document.getElementById('inputBannerJson').value || '';
  const body = { name, slug, category, images, opcoes, banner, metawords };

  let result;
  if (editingId) result = await supabase.from('products').update(body).eq('id', editingId);
  else result = await supabase.from('products').insert([body]);

  if (result.error) return alert('Erro ao gravar: ' + result.error.message);
  document.getElementById('formContainer').style.display = 'none';
  await loadProdutos();
});

// ---- INIT ----
await loadProdutos();

// expose a few for inline handlers if exist
window.editProduto = editProduto;
window.deleteProduto = deleteProduto;


