import { supabase, uploadImageToSupabase } from './supabase.js';
import { loadProdutos, renderProdutosList, produtos } from './produtos-ui.js';
import { renderOpcoesList, showImagePreview, createValoresInputs, createOpcaoRow } from './opcoes-ui.js';

const { data: session } = await supabase.auth.getSession();
if (!session.session) {
  alert('Sessão expirada ou não autenticado. A redirecionar...');
  window.location.href = 'login.html';
}

let editingId = null;

window.editProduto = function(id) {
    const prod = produtos.find(p => p.id === id);
    if (!prod) return;
    editingId = id;
    document.getElementById('inputBannerJson').value = prod.banner || '';
    if (prod.banner) {
      document.getElementById('bannerPreview').innerHTML = 
        `<img src="https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/${prod.banner}" style="max-width:100%;height:60px;">`;
    } else {
      document.getElementById('bannerPreview').innerHTML = '';
    }

    document.getElementById('formContainer').style.display = 'block';
    document.getElementById('inputName').value = prod.name || '';
    document.getElementById('inputSlug').value = prod.slug || '';
    document.getElementById('inputCategory').value = prod.category || '';
    document.getElementById('inputImagesJson').value = JSON.stringify(prod.images || []);
    showImagePreview(prod.images || [], prod.slug || "");
    renderOpcoesList(prod.opcoes || [], prod.images || []);
    window.scrollTo(0, 0);
};

window.deleteProduto = async function(id) {
    if (!confirm('Eliminar este produto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return alert('Erro ao eliminar: ' + error.message);
    await loadProdutos();
};

document.getElementById('addProductBtn').onclick = () => {
    editingId = null;
    document.getElementById('formContainer').style.display = 'block';
    document.getElementById('produtoForm').reset();
    document.getElementById('inputImagesJson').value = '[]';
    showImagePreview([]);
    // Inicializa sempre com 1 linha de opção vazia (ex: tipo number)
    renderOpcoesList([{ label: '', tipo: 'number', valores: [] }], []);
    window.scrollTo(0, 0);
};

document.getElementById('cancelBtn').onclick = () => {
    document.getElementById('formContainer').style.display = 'none';
};

document.getElementById('inputBanner').onchange = async function() {
    const file = this.files[0];
    if (!file) return;
    const prodSlug = document.getElementById('inputSlug').value.trim();
    const fileExt = file.name.split('.').pop();
    const fileName = `banner.${fileExt}`;
    const filePath = `${prodSlug}/${fileName}`;
    const { error } = await supabase.storage.from('products').upload(filePath, file, { upsert: true });
    if (error) return alert('Erro ao fazer upload do banner: ' + error.message);

    document.getElementById('inputBannerJson').value = filePath;
    document.getElementById('bannerPreview').innerHTML = 
      `<img src="https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/${filePath}" style="max-width:100%;height:60px;">`;
};

document.getElementById('inputImages').onchange = async function() {
    const files = Array.from(this.files);
    const prodSlug = document.getElementById('inputSlug').value.trim();
    const imgNames = [];
    for (const file of files) {
        const path = await uploadImageToSupabase(file, prodSlug);
        imgNames.push(path);
    }
    showImagePreview(imgNames);
    document.getElementById('inputImagesJson').value = JSON.stringify(imgNames);
};

document.getElementById('addOpcaoBtn').onclick = () => {
    const imgs = [];
    try { imgs.push(...JSON.parse(document.getElementById('inputImagesJson').value)); } catch {}
    const list = document.getElementById('opcoesList');
    list.appendChild(createOpcaoRow('', 'number', [], list.children.length, list.children.length + 1, imgs));
    list.appendChild(document.createElement('hr'));
};

document.getElementById('produtoForm').onsubmit = async function (e) {
    e.preventDefault();
    const name = document.getElementById('inputName').value.trim();
    const slug = document.getElementById('inputSlug').value.trim();
    const category = document.getElementById('inputCategory').value.trim();
    let images = [];
    try { images = JSON.parse(document.getElementById('inputImagesJson').value); } catch { }
    // Opções
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
        }  else if (tipo === 'cores') {
            row.valoresContainer.querySelectorAll('.valor-item').forEach(item => {
                const nomeInput = item.querySelector('input.cor-nome');
                const corInput = item.querySelector('input.cor-picker');
                const imgInput = item.querySelector('input.cor-imagem-associada');
                if ((nomeInput?.value || '').trim() && (corInput?.value || '').trim())
                    valores.push({ nome: nomeInput.value.trim(), cor: corInput.value.trim(), imagem: imgInput.value });
            });
        }             
         else {
            row.valoresContainer.querySelectorAll('.valor-item input[type="text"]').forEach(input => {
                if ((input.value || '').trim()) valores.push(input.value.trim());
            });
        }
        opcoes.push({ label, tipo, valores });
    });

    const banner = document.getElementById('inputBannerJson').value || '';
    const body = { name, slug, category, images, opcoes, banner };
    let result;
    if (editingId) {
        result = await supabase.from('products').update(body).eq('id', editingId);
    } else {
        result = await supabase.from('products').insert([body]);
    }
    if (result.error) return alert('Erro ao gravar: ' + result.error.message);

    document.getElementById('formContainer').style.display = 'none';
    await loadProdutos();
};

// Inicializar
loadProdutos();
