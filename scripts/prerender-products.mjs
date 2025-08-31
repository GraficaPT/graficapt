import fs from 'fs';
import path from 'path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { createClient } from '@supabase/supabase-js';

const ROOT = process.cwd();
const OUT_ROOT = path.join(ROOT, 'produto');

const SUPABASE_URL       = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY  = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const productsTable = 'products';

function loadFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf-8');
}

async function fetchSlugs(client) {
  const { data, error } = await client.from(productsTable).select('slug');
  if (error) throw error;
  return (data || []).map(r => r.slug).filter(Boolean);
}

function sanitizeBaseHtml(html) {
  html = html
    .replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, '')
    .replace(/<link\b[^>]*loader\.css[^>]*>/gi, '');
  html = html
    .replace(/<script\b[^>]*@supabase\/supabase-js[^>]*><\/script>/i, '')
    .replace(/<script\b[^>]*\/js\/core\/supabase\.js[^>]*><\/script>/i, '')
    .replace(/<script\b[^>]*\/js\/env\.js[^>]*><\/script>/i, '')
    .replace(/<script\b[^>]*\/js\/app\.bundle\.js[^>]*><\/script>/i, '');
  return html;
}

async function renderOne(client, slug) {
  const base = sanitizeBaseHtml(loadFile('product.html'));

  const vc = new VirtualConsole();
  vc.on('jsdomError', () => {}); // silence resource errors

  const dom = new JSDOM(base, {
    url: `https://graficapt.com/produto/${encodeURIComponent(slug)}`,
    runScripts: "outside-only",
    resources: "usable",
    pretendToBeVisual: true,
    contentType: "text/html",
    virtualConsole: vc,
  });

  const { window } = dom;
  window.Supa = { client };
  if (!('fetch' in window)) window.fetch = globalThis.fetch.bind(globalThis);

  Object.defineProperty(window, 'prerenderReady', {
    get() { return this.__ready || false; },
    set(v) { this.__ready = v; },
    configurable: true
  });
  window.__ready = false;

  const observer = new window.MutationObserver(() => {
    const el = window.document.getElementById('produto-dinamico');
    if (el && el.children && el.children.length > 0) {
      window.__ready = true;
    }
  });
  observer.observe(window.document.documentElement, { childList: true, subtree: true });

  const appJs = loadFile('js/app.bundle.js');
  dom.getInternalVMContext();
  window.eval(appJs);

  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));

  const waitFor = (cond, timeout=6000, step=40) => new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      try { if (cond()) return resolve(); } catch {}
      if (Date.now() - start > timeout) return reject(new Error('timeout'));
      setTimeout(tick, step);
    };
    tick();
  });

  try {
    await waitFor(() => window.prerenderReady === true, 6000, 40);
  } catch {
    try {
      await waitFor(() => {
        const el = window.document.getElementById('produto-dinamico');
        return el && el.children && el.children.length > 0;
      }, 4000, 40);
    } catch {}
  }

  const linkCanon = window.document.createElement('link');
  linkCanon.setAttribute('rel','canonical');
  linkCanon.setAttribute('href', `https://graficapt.com/produto/${slug}`);
  window.document.head.appendChild(linkCanon);

  const final = "<!DOCTYPE html>\n" + window.document.documentElement.outerHTML;
  return final;
}

async function main() {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const slugs = await fetchSlugs(client);
  if (!slugs.length) {
    console.warn('No products found');
    return;
  }
  fs.mkdirSync(OUT_ROOT, { recursive: true });
  for (const slug of slugs) {
    const html = await renderOne(client, slug);
    const dir = path.join(OUT_ROOT, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf-8');
    console.log('✓ prerendered /produto/%s', slug);
  }
  console.log('✅ All products prerendered (fast jsdom).');
}

main().catch(e => { console.error(e); process.exit(1); });
