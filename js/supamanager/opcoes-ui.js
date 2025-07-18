import { supabase } from './supabase.js';

// ---- Mini Carrossel de Imagens para associação à cor ----
export function renderImageSelector(urls, selectedUrl = null, container = null) {
    container = container || document.querySelector('.seletor-imagens');
    container.innerHTML = '';
    // Adiciona sempre uma opção "sem imagem" no início
    const allUrls = ["", ...(urls || [])];
    allUrls.forEach(url => {
        const div = document.createElement('div');
        div.className = 'img-thumb' + (url === selectedUrl ? ' selected' : '');
        div.style.backgroundImage = url
            ? `url('${url.startsWith('http') ? url : 'https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/' + url}')`
            : '';
        div.style.backgroundColor = url ? '' : '#f6f6f6';
        div.innerHTML = url ? "" : `<svg width="38" height="38"><rect width="100%" height="100%" fill="#f7f7f7"/><text x="50%" y="55%" font-size="13" fill="#bbb" text-anchor="middle" alignment-baseline="middle">vazio</text></svg>`;
        div.dataset.img = url;
        div.tabIndex = 0;
        div.onclick = () => {
            container.querySelectorAll('.img-thumb').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            container.dispatchEvent(new CustomEvent('selectImagem', { detail: url }));
        };
        div.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') div.onclick();
        };
        container.appendChild(div);
    });
}

export function renderOpcoesList(opcoesArray, imagensProduto = []) {
    const list = document.getElementById('opcoesList');
    list.innerHTML = '';
    (opcoesArray || []).forEach((op, idx, arr) => {
        list.appendChild(createOpcaoRow(op.label, op.tipo || 'number', op.valores, idx, arr.length, imagensProduto));
    });
}

export function createValoresInputs(tipo, valores = [], slug = "", imagensProduto = []) {
    const wrapper = document.createElement('div');
    wrapper.className = 'valores-list';

    async function handleFileUpload(inputFile, hiddenPath, previewImg, spanNome) {
        const file = inputFile.files[0];
        if (!file || !slug) return;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
        const filePath = `${slug}/${fileName}`;
        const { error } = await supabase.storage.from('products').upload(filePath, file, { upsert: true });
        if (!error) {
            hiddenPath.value = filePath;
            previewImg.src = `https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/${filePath}`;
            spanNome.textContent = file.name;
        } else {
            alert('Erro ao carregar imagem: ' + error.message);
        }
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
            if (val && val.imagem)
                previewImg.src = val.imagem.startsWith('http') ? val.imagem :
                    `https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/${val.imagem}`;
            else
                previewImg.src = "";

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
            inputFile.onchange = async function () {
                await handleFileUpload(inputFile, hiddenPath, previewImg, spanNome);
            };
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

            // Carrossel de imagens associadas
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
                // Botão prev
                const btnPrev = document.createElement('button');
                btnPrev.type = 'button';
                btnPrev.innerHTML = '◀️';
                btnPrev.className = 'btn-mini';
                btnPrev.onclick = (e) => {
                    e.preventDefault();
                    if (imagens.length === 0) return;
                    if (idx > 0) idx--;
                    else idx = imagens.length - 1;
                    imagemSelecionada = imagens[idx];
                    inputImg.value = imagemSelecionada;
                    renderCarrossel();
                };
                carrosselDiv.appendChild(btnPrev);

                // Miniatura
                const img = document.createElement('img');
                img.className = 'img-thumb';
                img.style.width = '38px';
                img.style.height = '38px';
                img.style.borderRadius = '6px';
                img.style.border = imagemSelecionada ? '2px solid #2a77d3' : '2px dashed #bbb';
                img.style.margin = '0 8px';
                img.src = imagemSelecionada
                    ? (imagemSelecionada.startsWith('http')
                        ? imagemSelecionada
                        : `https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/${imagemSelecionada}`)
                    : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38"><rect width="100%" height="100%" fill="#f7f7f7"/><text x="50%" y="50%" font-size="13" fill="#bbb" text-anchor="middle" alignment-baseline="middle">vazio</text></svg>';
                carrosselDiv.appendChild(img);

                // Botão next
                const btnNext = document.createElement('button');
                btnNext.type = 'button';
                btnNext.innerHTML = '▶️';
                btnNext.className = 'btn-mini';
                btnNext.onclick = (e) => {
                    e.preventDefault();
                    if (imagens.length === 0) return;
                    if (idx < imagens.length - 1) idx++;
                    else idx = 0;
                    imagemSelecionada = imagens[idx];
                    inputImg.value = imagemSelecionada;
                    renderCarrossel();
                };
                carrosselDiv.appendChild(btnNext);

                // Botão limpar
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
            // Input escondido
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
            // Campo texto normal
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

    // Adiciona valores existentes ou pelo menos um campo vazio
    if (Array.isArray(valores) && valores.length) {
        valores.forEach(v => addInput(v));
    } else {
        addInput("");
    }

    // Adiciona UM ÚNICO botão + no final
    const btnAdd = document.createElement('button');
    btnAdd.type = 'button';
    btnAdd.className = 'btn btn-small btn-add-valor';
    btnAdd.textContent = '+';
    btnAdd.title = "Adicionar valor";
    btnAdd.onclick = e => {
        e.preventDefault();
        if (tipo === 'cores') {
            addInput({ nome: "", cor: "#000000", imagem: "" });
        } else if (tipo === 'imagem-radio') {
            addInput({ nome: "", imagem: "" });
        } else {
            addInput("");
        }
    };

    return { wrapper, addInput };
}

export function showImagePreview(images, slug = '') {
    const container = document.getElementById('imagePreview');
    container.innerHTML = '';

    images.forEach((src, idx) => {
        let url = src.startsWith('http')
            ? src
            : `https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/${slug}/${src.replace(/^.*[\\/]/, '')}`;
        const img = document.createElement('img');
        img.src = url;
        img.draggable = true;
        img.className = 'img-preview-draggable';
        img.dataset.idx = idx;

        // --- Drag events ---
        img.ondragstart = e => {
            e.dataTransfer.setData('text/plain', idx);
            img.classList.add('dragging');
        };
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
            reorderImages(fromIdx, toIdx);
        };

        container.appendChild(img);
    });

    function reorderImages(from, to) {
        if (from === to) return;
        const arr = images.slice();
        const [moved] = arr.splice(from, 1);
        arr.splice(to, 0, moved);
        document.getElementById('inputImagesJson').value = JSON.stringify(arr);
        showImagePreview(arr, slug);
    }
}

export function createOpcaoRow(label = '', tipo = 'number', valores = [], idx = 0, total = 1, imagensProduto = []) {
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

    // Obtém addInput, que será usado pelo botão "+"
    let { wrapper: valoresContainer, addInput } = createValoresInputs(
        tipo, valores, document.getElementById('inputSlug').value.trim(), imagensProduto
    );

    tipoSelect.onchange = () => {
        const novo = createValoresInputs(
            tipoSelect.value, [], document.getElementById('inputSlug').value.trim(), imagensProduto
        );
        valoresContainer.replaceWith(novo.wrapper);
        valoresContainer = novo.wrapper;
        addInput = novo.addInput;
        row.valoresContainer = valoresContainer;
    };

    // BOTÃO + (adicionar valor à opção)
    const btnAddValor = document.createElement('button');
    btnAddValor.type = 'button';
    btnAddValor.className = 'btn btn-small btn-add-valor';
    btnAddValor.textContent = '+';
    btnAddValor.title = "Adicionar valor";
    btnAddValor.onclick = e => {
        e.preventDefault();
        if (tipoSelect.value === 'imagem-radio') {
            addInput({ nome: "", imagem: "" });
        } else if (tipoSelect.value === 'cores') {
            addInput({ nome: "", cor: "#000000", imagem: "" });
        } else {
            addInput("");
        }
    };

    const btnUp = document.createElement('button');
    btnUp.className = 'btn btn-small';
    btnUp.innerHTML = '↑';
    btnUp.title = 'Mover para cima';
    btnUp.onclick = e => {
        e.preventDefault();
        const parent = row.parentNode;
        if (row.previousElementSibling) {
            parent.insertBefore(row, row.previousElementSibling);
        }
    };

    const btnDown = document.createElement('button');
    btnDown.className = 'btn btn-small';
    btnDown.innerHTML = '↓';
    btnDown.title = 'Mover para baixo';
    btnDown.onclick = e => {
        e.preventDefault();
        const parent = row.parentNode;
        if (row.nextElementSibling) {
            parent.insertBefore(row.nextElementSibling, row);
        }
    };

    const btnDel = document.createElement('button');
    btnDel.className = 'btn btn-delete btn-small';
    btnDel.textContent = 'Remover';
    btnDel.onclick = e => { e.preventDefault(); row.remove(); };

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'opcao-actions';
    actionsDiv.appendChild(btnAddValor); // botão "+" para adicionar valor
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
