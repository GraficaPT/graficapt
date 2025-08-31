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
  // Remove all styles/scripts from the HTML we will execute, we'll inject CSS back later in the final HTML
  html = html
    .replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, '')
    .replace(/<link\b[^>]*loader\.css[^>]*>/gi, '');

  // Remove external Supabase/env and app bundle tags (we'll eval the bundle manually and inject client)
  html = html
    .replace(/<script\b[^>]*@supabase\/supabase-js[^>]*><\/script>/ig, '')
    .replace(/<script\b[^>]*\/js\/core\/supabase\.js[^>]*><\/script>/ig, '')
    .replace(/<script\b[^>]*\/js\/env\.js[^>]*><\/script>/ig, '')
    .replace(/<script\b[^>]*\/js\/app\.bundle\.js[^>]*><\/script>/ig, '');
  return html;
}

async function renderOne(client, slug) {
  const raw = loadFile('product.html');
  const cssLinks = extractStyles(raw);
  const base = sanitizeBaseHtml(raw);

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
  // Polyfills that client code may need
  window.IntersectionObserver = window.IntersectionObserver || function(){ return { observe(){}, unobserve(){}, disconnect(){} }; };
  window.ResizeObserver = window.ResizeObserver || function(){ return { observe(){}, unobserve(){}, disconnect(){} }; };
  window.requestAnimationFrame = window.requestAnimationFrame || ((cb)=>setTimeout(cb,16));

  // Provide Supabase client for your bundle
  window.Supa = { client };
  if (!('fetch' in window)) window.fetch = globalThis.fetch.bind(globalThis);

  // Fast readiness flag
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

  // Eval the real site bundle
  const appJs = loadFile('js/app.bundle.js');
  dom.getInternalVMContext();
  window.eval(appJs);

  // Fire DOM ready events
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  window.dispatchEvent(new window.Event('load'));

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

  // Inject canonical + CSS links back for the final HTML
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
  console.log('✅ All products prerendered (fast jsdom, CSS preserved).');
}

main().catch(e => { console.error(e); process.exit(1); });
