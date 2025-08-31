import fs from 'fs';
import path from 'path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { createClient } from '@supabase/supabase-js';

/**
 * Pre-render com JSDOM sem depender do UMD da Supabase nem de js/core/supabase.js.
 * - Avalia js/env.js para manter as mesmas variáveis globais do site.
 * - Injeta o cliente Supabase nativo do pacote (@supabase/supabase-js) como:
 *     window.Supa = { client }
 *     window.supabase = client     (compatibilidade com UMD)
 * - Avalia js/app.bundle.js e espera pelo conteúdo do produto.
 * - Remove CSS durante a execução para acelerar, mas re-injeta no HTML final.
 */

const ROOT = process.cwd();
const OUT_ROOT = path.join(ROOT, 'produto');

const SUPABASE_URL      = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Faltam SUPABASE_URL / SUPABASE_ANON_KEY no ambiente.');
  process.exit(1);
}

function loadFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}

function extractStyles(html) {
  const links = [];
  const re = /<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    if (/loader\.css/i.test(tag)) continue; // não precisamos
    links.push(tag);
  }
  return links.join('\n');
}

function sanitizeBaseHtml(html) {
  // tira folhas de estilo e scripts externos do HTML de execução
  return html
    .replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, '')
    .replace(/<link\b[^>]*loader\.css[^>]*>/gi, '')
    .replace(/<script\b[^>]*@supabase\/supabase-js[^>]*><\/script>/ig, '')
    .replace(/<script\b[^>]*\/js\/core\/supabase\.js[^>]*><\/script>/ig, '')
    .replace(/<script\b[^>]*\/js\/env\.js[^>]*><\/script>/ig, '')
    .replace(/<script\b[^>]*\/js\/app\.bundle\.js[^>]*><\/script>/ig, '');
}

async function renderOne(slug) {
  const raw = loadFile('product.html');
  const cssLinks = extractStyles(raw);
  const base = sanitizeBaseHtml(raw);

  const vc = new VirtualConsole();
  vc.on('jsdomError', () => {});

  const dom = new JSDOM(base, {
    url: `https://graficapt.com/product.html?slug=${encodeURIComponent(slug)}`,
    runScripts: "outside-only",
    resources: "usable",
    pretendToBeVisual: true,
    contentType: "text/html",
    virtualConsole: vc,
  });

  const { window } = dom;
  // polyfills
  window.IntersectionObserver = window.IntersectionObserver || function(){ return { observe(){}, unobserve(){}, disconnect(){} }; };
  window.ResizeObserver = window.ResizeObserver || function(){ return { observe(){}, unobserve(){}, disconnect(){} }; };
  window.requestAnimationFrame = window.requestAnimationFrame || ((cb)=>setTimeout(cb,16));
  if (!('fetch' in window)) window.fetch = globalThis.fetch.bind(globalThis);

  // sinal de pronto
  Object.defineProperty(window, 'prerenderReady', {
    get() { return this.__ready || false; },
    set(v) { this.__ready = v; },
    configurable: true
  });
  window.__ready = false;
  const mo = new window.MutationObserver(() => {
    const el = window.document.getElementById('produto-dinamico');
    if (el && el.children && el.children.length > 0) window.__ready = true;
  });
  mo.observe(window.document.documentElement, { childList: true, subtree: true });

  // Avaliar env.js para popular variáveis globais que o bundle usa
  try {
    const envJs = loadFile('js/env.js');
    dom.getInternalVMContext();
    window.eval(envJs);
  } catch {}

  // Injetar cliente Supabase nativo (sem UMD)
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.Supa = { client };
  window.supabase = client; // compatibilidade UMD

  // Executar o bundle real
  const appJs = loadFile('js/app.bundle.js');
  window.eval(appJs);

  // Disparar eventos de carregamento
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  window.dispatchEvent(new window.Event('load'));

  // espera curta
  const waitFor = (cond, timeout=8000, step=40) => new Promise((resolve, reject) => {
    const t0 = Date.now();
    (function tick(){
      try { if (cond()) return resolve(); } catch {}
      if (Date.now() - t0 > timeout) return reject(new Error('timeout'));
      setTimeout(tick, step);
    })();
  });

  try { await waitFor(() => window.prerenderReady === true, 8000, 40); }
  catch {
    try {
      await waitFor(() => {
        const el = window.document.getElementById('produto-dinamico');
        return el && el.children && el.children.length > 0;
      }, 6000, 40);
    } catch {}
  }

  // re-injetar CSS + canonical
  const head = window.document.head;
  const linkCanon = window.document.createElement('link');
  linkCanon.setAttribute('rel','canonical');
  linkCanon.setAttribute('href', `https://graficapt.com/produto/${slug}`);
  head.appendChild(linkCanon);

  if (cssLinks) {
    const frag = JSDOM.fragment(cssLinks);
    head.appendChild(frag);
  }

  const final = "<!DOCTYPE html>\n" + window.document.documentElement.outerHTML;
  return final;
}

async function main() {
  // Obter slugs diretamente da BD usando o cliente nativo
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client.from('products').select('slug');
  if (error) throw error;
  const slugs = (data || []).map(r => r.slug).filter(Boolean);

  if (!slugs.length) {
    console.warn('No products found');
    return;
  }

  fs.mkdirSync(OUT_ROOT, { recursive: true });

  for (const slug of slugs) {
    const html = await renderOne(slug);
    const dir = path.join(OUT_ROOT, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
    console.log('✓ prerendered /produto/%s', slug);
  }
  console.log('✅ All products prerendered (fast jsdom, client injected).');
}

main().catch(e => { console.error(e); process.exit(1); });
