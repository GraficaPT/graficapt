export function renderOption(opt, index) {
  const wrapper = document.createElement('div');
  wrapper.className = 'option-group';

  const labelWrapper = document.createElement('div');
  labelWrapper.className = 'overcell';
  const label = document.createElement('label');
  label.textContent = opt.label || (index + 1) + ':';
  labelWrapper.appendChild(label);
  wrapper.appendChild(labelWrapper);

  let inputContainer = document.createElement('div');
  inputContainer.className = 'overcell';

  switch (opt.tipo) {
    case 'select':
      const select = document.createElement('select');
      select.name = opt.label || '';
      select.required = true;
      (opt.valores || []).forEach((v, i) => {
        const option = document.createElement('option');
        option.value = v;
        option.textContent = v;
        if (i === 0) option.selected = true;
        select.appendChild(option);
      });
      inputContainer.appendChild(select);
      break;
    case 'number':
      const num = document.createElement('input');
      num.type = 'number';
      num.name = opt.label || '';
      num.min = '1';
      num.value = '1';
      num.required = true;
      inputContainer.appendChild(num);
      break;
    case 'cores':
      const coresDiv = document.createElement('div');
      coresDiv.className = 'color-options';
      (opt.valores || []).forEach((item, idx) => {
        const over = document.createElement('div');
        over.className='overcell';
        const input = document.createElement('input');
        input.type='radio';
        input.name=opt.label||'';
        let title='', colorStyle='', imgAssoc='';
        if (typeof item === 'object') {
          title = item.nome || '';
          colorStyle = item.cor || '';
          imgAssoc = item.imagem || '';
        } else {
          title = item;
          colorStyle = item;
        }
        if (String(title).toLowerCase() === 'multicolor' || String(title).toLowerCase() === 'multicor') {
          colorStyle = 'linear-gradient(90deg, red, orange, yellow, green, cyan, blue, violet)';
          title = 'Multicor';
        }
        const id = `${(opt.label||'').replace(/\s+/g,'-').toLowerCase()}-color-${idx}`;
        input.id = id;
        input.value = title;
        if (idx === 0) input.checked = true;
        input.required = true;
        const labelC = document.createElement('label');
        labelC.className='color-circle';
        labelC.htmlFor=id;
        labelC.title=title;
        labelC.style.background = colorStyle;
        labelC.addEventListener('click', () => {
          if (imgAssoc) {
            window.selecionarCorEImagem(imgAssoc);
          }
        });
        over.append(input, labelC);
        coresDiv.appendChild(over);
      });
      inputContainer.appendChild(coresDiv);
      break;
    case 'imagem-radio':
      const imgDiv = document.createElement('div');
      imgDiv.className='posicionamento-options';
      (opt.valores || []).forEach((item, idx) => {
        const over = document.createElement('div');
        over.className='overcell';
        const posID = `${(opt.label||'').replace(/\s+/g,'-').toLowerCase()}-pos-${idx}`;
        const input = document.createElement('input');
        input.type='radio';
        input.name=opt.label||'';
        input.value=item.nome || '';
        input.id=posID;
        if (idx===0) input.checked=true;
        input.required=true;
        const labelR = document.createElement('label');
        labelR.className='posicionamento-label';
        labelR.htmlFor=posID;
        const wrapperImg = document.createElement('div');
        wrapperImg.className='posicionamento-img-wrapper';
        const img = document.createElement('img');
        img.className='posicionamento-img';
        img.title=item.nome||'';
        img.alt=item.nome||'';
        if (item.imagem && item.imagem.startsWith('http')) img.src=item.imagem;
        else if (item.imagem) img.src=`https://nbcmqkcztuogflejswau.supabase.co/storage/v1/object/public/products/${item.imagem}`;
        const span = document.createElement('span');
        span.className='posicionamento-nome';
        span.textContent=item.nome||'';
        wrapperImg.append(img, span);
        labelR.appendChild(wrapperImg);
        over.append(input, labelR);
        imgDiv.appendChild(over);
      });
      inputContainer.appendChild(imgDiv);
      break;
    case 'quantidade-por-tamanho':
      const qtDiv = document.createElement('div');
      qtDiv.className='quantidades-tamanhos';
      (opt.valores||[]).forEach(t => {
        const tWrapper = document.createElement('div');
        tWrapper.className='tamanho-input';
        const lbl = document.createElement('label');
        lbl.htmlFor=`tamanho-${t}`;
        lbl.textContent=`${t}:`;
        const inp = document.createElement('input');
        inp.type='number';
        inp.id=`tamanho-${t}`;
        inp.name=`Tamanho - ${t}`;
        inp.min='0';
        inp.value='0';
        tWrapper.append(lbl, inp);
        qtDiv.appendChild(tWrapper);
      });
      inputContainer.appendChild(qtDiv);
      break;
    default:
      inputContainer.textContent = '';
  }

  wrapper.appendChild(inputContainer);
  return wrapper;
}
