export function createStaticFields() {
  const fragment = document.createDocumentFragment();

  // detalhes
  const detalhesGroup = document.createElement('div');
  detalhesGroup.className='form-group';
  const over1 = document.createElement('div');
  over1.className='overcell';
  const lblDetalhes = document.createElement('label');
  lblDetalhes.htmlFor='detalhes';
  lblDetalhes.textContent='Detalhes:';
  const textarea = document.createElement('textarea');
  textarea.name='Detalhes';
  textarea.placeholder='Descreve todas as informações sobre como queres o design e atenções extras!';
  textarea.required=true;
  over1.append(lblDetalhes, textarea);
  detalhesGroup.appendChild(over1);
  fragment.appendChild(detalhesGroup);

  // empresa / nome e logotipo
  const optionsRow1 = document.createElement('div');
  optionsRow1.className='options-row';

  const empresaGroup = document.createElement('div');
  empresaGroup.className='form-group';
  const over2 = document.createElement('div');
  over2.className='overcell';
  const lblEmpresa = document.createElement('label');
  lblEmpresa.htmlFor='empresa';
  lblEmpresa.textContent='Empresa / Nome:';
  const inputEmpresa = document.createElement('input');
  inputEmpresa.type='text';
  inputEmpresa.name='Empresa';
  inputEmpresa.placeholder='Empresa ou nome pessoal';
  inputEmpresa.required=true;
  over2.append(lblEmpresa, inputEmpresa);
  empresaGroup.appendChild(over2);

  const logoGroup = document.createElement('div');
  logoGroup.className='form-group';
  const over3 = document.createElement('div');
  over3.className='overcell';
  const lblLogo = document.createElement('label');
  lblLogo.htmlFor='ficheiro';
  lblLogo.textContent='(Opcional) Logotipo:';
  const inputFile = document.createElement('input');
  inputFile.type='file';
  inputFile.id='ficheiro';
  const hidden = document.createElement('input');
  hidden.type='hidden';
  hidden.name='Logotipo';
  hidden.id='link_ficheiro';
  const status = document.createElement('p');
  status.id='uploadStatus';
  status.style.display='none';
  over3.append(lblLogo, inputFile, hidden, status);
  logoGroup.appendChild(over3);

  optionsRow1.append(empresaGroup, logoGroup);
  fragment.appendChild(optionsRow1);

  // email / telemovel
  const optionsRow2 = document.createElement('div');
  optionsRow2.className='options-row';

  const emailGroup = document.createElement('div');
  emailGroup.className='form-group';
  const over4 = document.createElement('div');
  over4.className='overcell';
  const lblEmail = document.createElement('label');
  lblEmail.htmlFor='email';
  lblEmail.textContent='Email:';
  const inputEmail = document.createElement('input');
  inputEmail.type='email';
  inputEmail.name='Email';
  inputEmail.placeholder='seu@email.com';
  inputEmail.required=true;
  over4.append(lblEmail, inputEmail);
  emailGroup.appendChild(over4);

  const telGroup = document.createElement('div');
  telGroup.className='form-group';
  const over5 = document.createElement('div');
  over5.className='overcell';
  const lblTel = document.createElement('label');
  lblTel.htmlFor='telemovel';
  lblTel.textContent='Telemóvel:';
  const inputTel = document.createElement('input');
  inputTel.type='tel';
  inputTel.name='Telemovel';
  inputTel.placeholder='Ex: 912 345 678';
  inputTel.required=true;
  over5.append(lblTel, inputTel);
  telGroup.appendChild(over5);

  optionsRow2.append(emailGroup, telGroup);
  fragment.appendChild(optionsRow2);

  // hidden fields and submit
  const hiddenCaptcha = document.createElement('input');
  hiddenCaptcha.type='hidden';
  hiddenCaptcha.name='_captcha';
  hiddenCaptcha.value='false';
  fragment.appendChild(hiddenCaptcha);
  const hiddenNext = document.createElement('input');
  hiddenNext.type='hidden';
  hiddenNext.name='_next';
  hiddenNext.value='https://graficapt.com';
  fragment.appendChild(hiddenNext);
  const button = document.createElement('button');
  button.id='submit';
  button.type='submit';
  button.textContent='Pedir Orçamento';
  fragment.appendChild(button);
  return fragment;
}
