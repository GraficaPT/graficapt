import { supabase } from './supabase.js';

export let produtos = [];

export async function loadProdutos() {
    const { data, error } = await supabase.from('products').select('*');
    if (error) {
        alert("Erro ao carregar produtos: " + error.message);
        return;
    }
    produtos = data || [];
    renderProdutosList(produtos);
}

export function renderProdutosList(produtosArr) {
    const list = document.getElementById('produtosList');
    list.innerHTML = '';
    produtosArr.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'produto-card';
        card.innerHTML = `
            <b>${prod.name || ''}</b>
            <div>${prod.category || ''}</div>
            <img src="${prod.banner ? `https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/${prod.banner}` : ''}" alt="Banner" />
            <div class="produto-actions">
                <button class="btn btn-edit" onclick="editProduto(${prod.id})">Editar</button>
                <button class="btn btn-delete" onclick="deleteProduto(${prod.id})">Eliminar</button>
            </div>
        `;
        list.appendChild(card);
    });
}
