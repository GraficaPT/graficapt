import fs from 'fs';
import path from 'path';
import { JSDOM, VirtualConsole } from 'jsdom';

/**
 * Fast pre-render for product pages using JSDOM.
 * Key fix: we execute env.js and js/core/supabase.js BEFORE app.bundle.js,
 * exactly como no browser, para que o bundle encontre o cliente Supabase
 * e helpers globais que usa hoje.
 */

const ROOT = process.cwd();
const OUT_ROOT = path.join(ROOT, 'produto');

function loadFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}

function extractStyles(html) {
  const links = [];
  const re = /<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    if (/loader\.css/i.test(tag)) continue; // drop loader
    links.push(tag);
  }
  return links.join('\n');
}

function sanitizeBaseHtml(html) {
  // Remove all external styles/scripts from the HTML we will execute (we'll eval scripts manually and re-inject CSS later)
  html = html
    .replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, '')
    .replace(/<link\b[^>]*loader\.css[^>]*>/gi, '')
    .replace(/<script\b[^>]*\/js\/env\.js[^>]*><\/script>/ig, '')
    .replace(/<script\b[^>]*\/js\/core\/supabase\.js[^>]*><\/script>/ig, '')
    .replace(/<script\b[^>]*\/js\/app\.bundle\.js[^>]*><\/script>/ig, '');
  return html;
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

  // Polyfills comuns
  window.IntersectionObserver = window.IntersectionObserver || function(){ return { observe(){}, unobserve(){}, disconnect(){} }; };
  window.ResizeObserver = window.ResizeObserver || function(){ return { observe(){}, unobserve(){}, disconnect(){} }; };
  window.requestAnimationFrame = window.requestAnimationFrame || ((cb)=>setTimeout(cb,16));
  if (!('fetch' in window)) window.fetch = globalThis.fetch.bind(globalThis);

  // Sinal de pronto
  Object.defineProperty(window, 'prerenderReady', {
    get() { return this.__ready || false; },
    set(v) { this.__ready = v; },
    configurable: true
  });
  window.__ready = false;
  const ob = new window.MutationObserver(() => {
    const el = window.document.getElementById('produto-dinamico');
    if (el && el.children && el.children.length > 0) window.__ready = true;
  });
  ob.observe(window.document.documentElement, { childList: true, subtree: true });

  // Executar os MESMOS scripts e na MESMA ordem do site
  const envJs = loadFile('js/env.js');                  // define window.__ENV (ou similar)
  const supaCore = loadFile('js/core/supabase.js');     // cria window.Supa, etc.
  const appJs = loadFile('js/app.bundle.js');           // monta a página

  dom.getInternalVMContext();
  window.eval(envJs);
  window.eval(supaCore);
  window.eval(appJs);

  // Disparar eventos de carregamento
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  window.dispatchEvent(new window.Event('load'));

  // Esperar pronto (teto curto)
  const waitFor = (cond, timeout=8000, step=40) => new Promise((resolve, reject) => {
    const start = Date.now();
    (function tick(){
      try { if (cond()) return resolve(); } catch {}
      if (Date.now() - start > timeout) return reject(new Error('timeout'));
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

  // Injetar canonical + CSS (para o HTML final)
  const head = window.document.head;
  const linkCanon = window.document.createElement('link');
  linkCanon.setAttribute('rel','canonical');
  linkCanon.setAttribute('href', `https://graficapt.com/produto/${slug}`);
  head.appendChild(linkCanon);

  if (cssLinks) {
    const frag = JSDOM.fragment(cssLinks);
    head.appendChild(frag);
  }

  // HTML final
  const final = "<!DOCTYPE html>\n" + window.document.documentElement.outerHTML;
  return final;
}

async function main() {
  // Obter slugs diretamente do ficheiro de sitemap de produtos (se existir) ou da pasta /produto criada previamente
  // Como fallback, vamos ler da BD via o teu supabase core (que já usa env.js)
  let slugs = [];
  try {
    const data = JSON.parse(loadFile('scripts/product-slugs.json'));
    if (Array.isArray(data)) slugs = data;
  } catch {}

  if (!slugs.length) {
    // Usa o supabase já configurado pelo core
    const envJs = loadFile('js/env.js');
    const supaCore = loadFile('js/core/supabase.js');
    const dom = new JSDOM(`<!doctype html><html><head></head><body></body></html>`, { runScripts: 'outside-only' });
    dom.getInternalVMContext();
    dom.window.eval(envJs);
    dom.window.eval(supaCore);
    const client = dom.window.Supa?.client;
    if (!client) {
      console.error('Supabase client not initialized by core/supabase.js');
      process.exit(1);
    }
    const { data, error } = await client.from('products').select('slug');
    if (error) throw error;
    slugs = (data || []).map(r => r.slug).filter(Boolean);
  }

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
  console.log('✅ All products prerendered (fast jsdom, css preserved, env/core executed).');
}

main().catch(e => { console.error(e); process.exit(1); });
