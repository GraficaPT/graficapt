;(function(window,document){'use strict';
const supabase = (window.Supa && window.Supa.client) || null;

/* ===== encomendas/js/config.js ===== */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL  = 'https://nbcmqkcztuogflejswau.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iY21xa2N6dHVvZ2ZsZWpzd2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2ODY4OTMsImV4cCI6MjA2NTI2Mjg5M30.Rf4yHxgo_bh56tXwHn3jJgJQr0tOCbXc2rQU1R26tv8'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)



/* ===== encomendas/js/main.js ===== */
import { fetchColunas, fetchEncomendas, verifyPassword } from './supabase.js'
import { renderTabela, setColunas } from './tabela.js'

function showPasswordForm(msg = 'Acesso restrito') {
  const div = document.createElement('div')
  div.className = 'auth-wrapper'
  div.innerHTML = `
    <h2 class="auth-title">${msg}</h2>
    <form id="pwd-form" class="auth-form">
      <input type="password" id="master-pwd" placeholder="Password" required class="auth-input" />
      <button type="submit" class="auth-btn">Entrar</button>
    </form>
    <p id="pwd-status" class="auth-status"></p>
  `
  document.body.innerHTML = ''
  document.body.appendChild(div)

  document.getElementById('pwd-form').addEventListener('submit', async (e) => {
    e.preventDefault()
    const pwd = document.getElementById('master-pwd').value
    const status = document.getElementById('pwd-status')
    status.textContent = 'A validar…'
    try {
      const ok = await verifyPassword(pwd)
      if (!ok) throw new Error('Password inválida')
      sessionStorage.setItem('app_pwd', pwd)
      location.reload()
    } catch (err) {
      status.classList.add('error')
      status.textContent = err.message
    }
  })
}

async function garantirSessao() {
  const pwd = sessionStorage.getItem('app_pwd')
  if (!pwd) { showPasswordForm(); return false }
  const ok = await verifyPassword(pwd).catch(() => false)
  if (!ok) {
    sessionStorage.removeItem('app_pwd')
    showPasswordForm('Sessão expirada ou password inválida')
    return false
  }
  return true
}

async function carregarTudo() {
  const has = await garantirSessao()
  if (!has) return

  // layout base — mantém classes genéricas
  document.body.innerHTML = `
    <div id="status" class="status"></div>
    <div class="controls">
      <button id="btn-add" class="btn btn-add">➕ Adicionar</button>
      <button id="btn-del" class="btn btn-del">🗑️ Remover</button>
      <button id="btn-save" class="btn btn-save">🔄 Atualizar</button>
      <button id="btn-logout" class="btn btn-logout">🚪 Logout</button>
    </div>
    <div class="tabela-wrapper" id="tabela-wrapper"></div>
  `

  document.getElementById('btn-logout').onclick = () => { sessionStorage.removeItem('app_pwd'); location.reload() }

  const status = document.getElementById('status')
  status.textContent = 'A carregar…'
  try {
    const colunas = await fetchColunas()
    const dados = await fetchEncomendas()
    setColunas(colunas)
    // renderTabela liga automaticamente os botões pelos IDs acima
    renderTabela(colunas, dados)
    status.textContent = ''
  } catch (err) {
    status.textContent = 'Erro ao carregar dados.'
    console.error(err)
  }
}

carregarTudo()



/* ===== encomendas/js/script.js ===== */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// --------------------------------------------------
// Configurações Supabase & Google Apps Script
// --------------------------------------------------
const SUPABASE_URL  = 'https://nbcmqkcztuogflejswau.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iY21xa2N6dHVvZ2ZsZWpzd2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2ODY4OTMsImV4cCI6MjA2NTI2Mjg5M30.Rf4yHxgo_bh56tXwHn3jJgJQr0tOCbXc2rQU1R26tv8'
const GSCRIPT_URL   = 'https://script.google.com/macros/s/AKfycbwPUUtQZyrM7M17c5elXLDyqw1ZY_GznlmXH0BbUwruJBxxfSRh-apUqpQx0CA_x-m5/exec'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// --------------------------------------------------
// Estado global
// --------------------------------------------------
let colunas = []               // nomes de colunas vindas da view
const selectedIds = new Set()  // linhas actualmente seleccionadas

// --------------------------------------------------
// Estilo para realce e inputs
// --------------------------------------------------
;(function injectStyles () {
  const style = document.createElement('style')
  style.textContent = `
    tr.selected          { background:#d0ebff; }
    #tabela-wrapper button { margin:0 0.25rem 0.5rem 0; }
    input[type=file]     { width:100%; }
  `
  document.head.appendChild(style)
})()

// --------------------------------------------------
// Utilitário de upload para o Drive via Apps Script
// --------------------------------------------------
async function uploadFileToDrive (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)

    reader.onload = async () => {
      try {
        const base64 = reader.result.split(',')[1] // remove data URL prefix
        const body   = new URLSearchParams()
        body.append('base64', base64)
        body.append('type',   file.type || 'application/octet-stream')
        body.append('name',   file.name)

        const res  = await fetch(GSCRIPT_URL, { method:'POST', body })
        if (!res.ok) throw new Error('Falha no upload: ' + res.status)
        const link = (await res.text()).trim()
        resolve(link)
      } catch (err) {
        reject(err)
      }
    }

    reader.readAsDataURL(file)
  })
}

// --------------------------------------------------
// Funções de fetch
// --------------------------------------------------
async function fetchColunas () {
  const { data, error } = await supabase
    .from('view_colunas_encomendas')
    .select('*')
  if (error) throw error
  return data.map(c => c.column_name)
}

async function fetchEncomendas () {
  const { data, error } = await supabase
    .from('Encomendas')
    .select('*')
    .order('id', { ascending:true })
  if (error) throw error
  return data
}

// --------------------------------------------------
// Selecção e remoção de linhas
// --------------------------------------------------
function toggleSelecaoLinha (tr, id) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id)
    tr.classList.remove('selected')
  } else {
    selectedIds.add(id)
    tr.classList.add('selected')
  }
}

async function removerSelecionadas () {
  if (!selectedIds.size) {
    alert('Seleccione pelo menos uma linha!')
    return
  }

  const idsArray = [...selectedIds]
  const { error } = await supabase.from('Encomendas').delete().in('id', idsArray)
  if (error) {
    alert('Erro ao remover: ' + error.message)
    return
  }
  selectedIds.clear()
  carregarTudo()
}

// --------------------------------------------------
// Criação de nova linha editável
// --------------------------------------------------
function criarLinhaEditavel (tbody) {
  const linha = document.createElement('tr')

  for (const nomeColuna of colunas) {
    const td = document.createElement('td')

    // Coluna ID (auto-gerada)
    if (nomeColuna === 'id') {
      td.textContent = '(auto)'
      linha.appendChild(td)
      continue
    }

    // Coluna Ficheiros – input file + upload automático
    if (nomeColuna === 'ficheiros') {
      const input = document.createElement('input')
      input.type  = 'file'
      input.name  = nomeColuna
      input.accept = '*/*'

      input.onchange = async e => {
        const file = e.target.files[0]
        if (!file) return
        td.innerHTML = '⏳ a enviar…'
        try {
          const link = await uploadFileToDrive(file)

          // Guardar link para posterior insert
          input.dataset.link = link

          // Render âncora
          td.innerHTML = ''
          const a   = document.createElement('a')
          a.href    = link
          a.target  = '_blank'
          a.textContent = file.name
          td.appendChild(a)
        } catch (err) {
          td.textContent = 'Erro'
          alert('Erro ao enviar ficheiro: ' + err.message)
        }
      }

      td.appendChild(input)
      linha.appendChild(td)
      continue
    }

    // Coluna Data – input date
    if (nomeColuna === 'data') {
      const input = document.createElement('input')
      input.type  = 'date'
      input.name  = nomeColuna
      input.valueAsDate = new Date()
      td.appendChild(input)
      linha.appendChild(td)
      continue
    }

    // Campos texto/numéricos genéricos
    const input = document.createElement('input')
    input.type  = 'text'
    input.name  = nomeColuna
    td.appendChild(input)
    linha.appendChild(td)
  }

  // Botão Guardar
  const tdBtn = document.createElement('td')
  const btnGuardar = document.createElement('button')
  btnGuardar.textContent = 'Guardar'
  btnGuardar.onclick = async () => {
    const novaEncomenda = {}

    linha.querySelectorAll('input').forEach(input => {
      let valor = null
      if (input.type === 'file') {
        valor = input.dataset.link || null
      } else if (input.type === 'number') {
        valor = parseInt(input.value) || null
      } else {
        valor = input.value || null
      }
      novaEncomenda[input.name] = valor
    })

    const { error } = await supabase.from('Encomendas').insert([novaEncomenda])
    if (error) {
      alert('Erro ao guardar: ' + error.message)
    } else {
      carregarTudo()
    }
  }

  tdBtn.appendChild(btnGuardar)
  linha.appendChild(tdBtn)
  tbody.appendChild(linha)
}

// --------------------------------------------------
// Renderização da tabela
// --------------------------------------------------
function renderTabela (dados) {
  const wrapper = document.getElementById('tabela-wrapper')
  wrapper.innerHTML = ''

  // Controles
  const controles = document.createElement('div')
  const btnAdd   = document.createElement('button')
  btnAdd.textContent = '➕ Adicionar'
  btnAdd.onclick     = () => criarLinhaEditavel(tbody)
  const btnRem   = document.createElement('button')
  btnRem.textContent = '🗑️ Remover'
  btnRem.onclick     = removerSelecionadas
  controles.appendChild(btnAdd)
  controles.appendChild(btnRem)

  // Tabela
  const tabela = document.createElement('table')
  const thead  = document.createElement('thead')
  const tbody  = document.createElement('tbody')

  // Cabeçalhos
  const trHead = document.createElement('tr')
  for (const nome of colunas) {
    const th = document.createElement('th')
    th.textContent = nome
    trHead.appendChild(th)
  }
  trHead.appendChild(document.createElement('th')).textContent = 'Ações'
  thead.appendChild(trHead)

  // Linhas de dados
  for (const item of dados) {
    const tr = document.createElement('tr')
    tr.dataset.id = item.id

    for (const nome of colunas) {
      const td = document.createElement('td')

      if (nome === 'id') {
        td.textContent = item[nome]
        td.style.cursor = 'pointer'
        td.onclick = () => toggleSelecaoLinha(tr, item.id)
      } else if (nome === 'ficheiros' && item[nome]) {
        const a = document.createElement('a')
        a.href = item[nome]
        a.target = '_blank'
        a.textContent = 'ficheiro'
        td.appendChild(a)
      } else {
        td.textContent = item[nome] ?? ''
      }
      tr.appendChild(td)
    }

    tr.appendChild(document.createElement('td')) // coluna vazia
    tbody.appendChild(tr)
  }

  tabela.appendChild(thead)
  tabela.appendChild(tbody)

  // Ordem no DOM
  wrapper.appendChild(controles)
  wrapper.appendChild(tabela)
}

// --------------------------------------------------
// Carregamento inicial
// --------------------------------------------------
async function carregarTudo () {
  document.getElementById('status').textContent = 'A carregar…'
  try {
    colunas = await fetchColunas()
    const dados = await fetchEncomendas()
    renderTabela(dados)
    document.getElementById('status').textContent = ''
  } catch (err) {
    console.error(err)
    document.getElementById('status').textContent = 'Erro ao carregar dados.'
  }
}

carregarTudo()


/* ===== encomendas/js/supabase.js ===== */
import { supabase } from './config.js'

function getPwd() {
  return sessionStorage.getItem('app_pwd') || ''
}

export async function verifyPassword(pwd) {
  const { data, error } = await supabase.rpc('verify_master_password', { pwd })
  if (error) throw error
  return !!data
}

/** Fallback fixo com as colunas reais da tua tabela Encomendas */
const FALLBACK_COLS = [
  { nome: 'id',        tipo: 'bigint' },
  { nome: 'data',      tipo: 'date' },
  { nome: 'cliente',   tipo: 'character varying' },
  { nome: 'morada',    tipo: 'character varying' },
  { nome: 'nif',       tipo: 'bigint' },
  { nome: 'produto',   tipo: 'character varying' },
  { nome: 'detalhes',  tipo: 'character varying' },
  { nome: 'ficheiros', tipo: 'character varying' },
  { nome: 'maquete',   tipo: 'character varying' },
  { nome: 'valor',     tipo: 'real' },
  { nome: 'executado', tipo: 'boolean' },
]

/** Busca colunas via RPC (se existir); caso contrário usa fallback */
export async function fetchColunas() {
  // tenta RPC opcional
  const rpc = await supabase.rpc('get_encomendas_columns')
  if (!rpc.error && Array.isArray(rpc.data) && rpc.data.length) {
    return rpc.data.map(c => ({ nome: c.column_name, tipo: c.data_type }))
  }
  // tenta a view (se existir)
  const view = await supabase.from('view_colunas_encomendas').select('*')
  if (!view.error && Array.isArray(view.data) && view.data.length) {
    return view.data.map(c => ({ nome: c.column_name, tipo: c.data_type }))
  }
  // fallback
  return FALLBACK_COLS
}

export async function fetchEncomendas() {
  const { data, error } = await supabase.rpc('list_encomendas', { pwd: getPwd() })
  if (error) throw error
  return data
}

/** Storage */
export async function uploadFileToSupabase(file) {
  const timestamp = Date.now()
  const filePath = `${timestamp}_${file.name}`
  const { error } = await supabase.storage.from('ficheirosencomendas').upload(filePath, file)
  if (error) throw error
  const { data } = supabase.storage.from('ficheirosencomendas').getPublicUrl(filePath)
  return data.publicUrl
}

/** CRUD via RPCs (se quiseres usar já) */
export async function updateEncomendas(updates) {
  const { error } = await supabase.rpc('update_encomendas', { pwd: getPwd(), rows: updates })
  if (error) throw error
}
export async function insertEncomendas(inserts) {
  const { error } = await supabase.rpc('insert_encomendas', { pwd: getPwd(), rows: inserts })
  if (error) throw error
}
export async function deleteEncomendas(ids) {
  const { error } = await supabase.rpc('delete_encomendas', { pwd: getPwd(), ids })
  if (error) throw error
}



/* ===== encomendas/js/tabela.js ===== */
import { uploadFileToSupabase, updateEncomendas, insertEncomendas, deleteEncomendas } from './supabase.js'

let selectedIds = new Set()
let colunas = []
const FILE_FIELDS = ['ficheiros', 'maquete']

function setColunas(lista) { colunas = lista }

function renderTabela(colunasInput, dados) {
  colunas = colunasInput
  const wrapper = document.getElementById('tabela-wrapper')
  wrapper.innerHTML = ''

  const tabela = document.createElement('table')
  tabela.className = 'encomendas-table'

  const thead = document.createElement('thead')
  const trHead = document.createElement('tr')
  for (const col of colunas) {
    const th = document.createElement('th')
    if (col.nome.toLowerCase() === 'valor') {
      const total = (dados || []).reduce((acc, r) => acc + (Number(r[col.nome]) || 0), 0)
      th.textContent = `${col.nome.toUpperCase()} (${total.toFixed(2).replace('.', ',')})`
    } else {
      th.textContent = col.nome.toUpperCase()
    }
    trHead.appendChild(th)
  }
  thead.appendChild(trHead)
  tabela.appendChild(thead)

  const tbody = document.createElement('tbody')

  ;(dados || []).forEach(item => {
    const tr = document.createElement('tr')
    tr.dataset.id = item.id

    for (const col of colunas) {
      const nome = col.nome
      const td = document.createElement('td')

      if (nome === 'id') {
        td.textContent = item[nome]
        td.className = 'cell-id'
        td.onclick = () => toggleSelecaoLinha(tr, item.id)
      }
      else if (FILE_FIELDS.includes(nome)) {
        if (item[nome]) {
          const links = String(item[nome]).split(',').filter(Boolean)
          links.forEach(link => {
            const a = document.createElement('a')
            a.href = link
            a.target = '_blank'
            a.textContent = link.split('/').pop().split('_').slice(1).join('_') || 'ficheiro'
            a.className = 'file-link'
            a.style.display = 'block'
            td.appendChild(a)
          })
        }
      }
      else if (col.tipo === 'boolean') {
        const input = document.createElement('input')
        input.type = 'checkbox'
        input.checked = !!item[nome]
        td.appendChild(input)
      }
      else if (col.tipo === 'timestamp with time zone' || col.tipo === 'timestamp without time zone') {
        const input = document.createElement('input')
        input.type = 'datetime-local'
        if (item[nome]) {
          const dt = new Date(item[nome])
          const iso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
          input.value = iso
        }
        td.appendChild(input)
      }
      else if (col.tipo === 'date') {
        const input = document.createElement('input')
        input.type = 'date'
        if (item[nome]) input.value = new Date(item[nome]).toISOString().slice(0, 10)
        td.appendChild(input)
      }
      else if (['numeric','integer','bigint','double precision','real'].includes(col.tipo)) {
        const input = document.createElement('input')
        input.type = 'number'
        input.value = item[nome] ?? ''
        td.appendChild(input)
      }
      else {
        const input = document.createElement('input')
        input.type = 'text'
        input.value = item[nome] ?? ''
        td.appendChild(input)
      }

      tr.appendChild(td)
    }

    tbody.appendChild(tr)
  })

  tabela.appendChild(tbody)
  wrapper.appendChild(tabela)

  // ligar botões globais já existentes no layout
  const btnAdd = document.getElementById('btn-add')
  const btnDel = document.getElementById('btn-del')
  const btnSave = document.getElementById('btn-save')

  if (btnAdd) btnAdd.onclick = () => criarLinhaEditavel(tbody)
  if (btnDel) btnDel.onclick = removerSelecionadas
  if (btnSave) btnSave.onclick = atualizarTudo

  // helpers -------------
  function toggleSelecaoLinha(tr, id) {
    if (selectedIds.has(id)) {
      selectedIds.delete(id)
      tr.classList.remove('selected')
    } else {
      selectedIds.add(id)
      tr.classList.add('selected')
    }
  }

  function criarLinhaEditavel(tbody) {
    const tr = document.createElement('tr')
    tr.dataset.id = ''
    for (const col of colunas) {
      const nome = col.nome
      const td = document.createElement('td')

      if (nome === 'id') {
        td.textContent = 'novo'
      }
      else if (FILE_FIELDS.includes(nome)) {
        const input = document.createElement('input')
        input.type = 'file'
        input.multiple = true
        input.onchange = async e => {
          const files = Array.from(e.target.files)
          if (!files.length) return
          td.innerHTML = '⏳ a enviar…'
          try {
            const links = []
            for (const f of files) links.push(await uploadFileToSupabase(f))
            td.innerHTML = ''
            links.forEach(link => {
              const a = document.createElement('a')
              a.href = link
              a.target = '_blank'
              a.textContent = link.split('/').pop().split('_').slice(1).join('_') || 'ficheiro'
              a.style.display = 'block'
              td.appendChild(a)
            })
            td.setAttribute('data-links', links.join(','))
          } catch (err) {
            td.textContent = 'Erro'
            alert('Erro ao enviar ficheiros: ' + err.message)
          }
        }
        td.appendChild(input)
      }
      else {
        const input = document.createElement('input')
        input.type = ['numeric','integer','bigint','double precision','real'].includes(col.tipo) ? 'number' : 'text'
        td.appendChild(input)
      }

      tr.appendChild(td)
    }
    tbody.appendChild(tr)
  }
}

async function atualizarTudo() {
  const tbody = document.querySelector('tbody')
  const rows = Array.from(tbody.querySelectorAll('tr'))

  const updates = []
  const inserts = []

  rows.forEach(linha => {
    const id = linha.dataset.id ? Number(linha.dataset.id) : null
    const tds = Array.from(linha.children)
    const obj = {}

    for (let i = 0; i < tds.length; i++) {
      const col = colunas[i]
      const nome = col.nome
      const td = tds[i]

      if (nome === 'id') continue

      if (td.hasAttribute('data-links')) {
        obj[nome] = td.getAttribute('data-links')
      } else {
        const input = td.querySelector('input')
        let valor = input ? (input.type === 'checkbox' ? input.checked : input.value) : td.textContent

        if ((col.tipo || '').startsWith('timestamp') && valor) valor = new Date(valor).toISOString()
        if (['numeric','integer','bigint','double precision','real'].includes(col.tipo) && valor !== '') valor = Number(valor)

        obj[nome] = valor === '' ? null : valor
      }
    }

    if (id) updates.push({ id, ...obj })
    else inserts.push(obj)
  })

  try {
    if (updates.length) await updateEncomendas(updates)
    if (inserts.length) await insertEncomendas(inserts)
    location.reload()
  } catch (err) {
    alert('Erro ao gravar: ' + err.message)
  }
}

async function removerSelecionadas() {
  if (!selectedIds.size) { alert('Seleccione pelo menos uma linha!'); return }
  try { await deleteEncomendas([...selectedIds]); location.reload() }
  catch (e) { alert('Erro ao remover: ' + e.message) }
}


})(window,document);