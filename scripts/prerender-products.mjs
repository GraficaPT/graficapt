import fs from 'fs';
import path from 'path';
import http from 'http';
import handler from 'serve-handler';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

/**
 * Pre-render products by loading the real client page (product.html)
 * with each slug and saving the fully rendered HTML into /produto/<slug>/index.html
 * — before deploy — so bots get static pages.
 */

const ROOT = process.cwd();
const OUT_ROOT = path.join(ROOT, 'produto');

const SUPABASE_URL       = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY  = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supa = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Minimal static server to serve current workspace during prerender
async function startServer(port=0) {
  const server = http.createServer((request, response) => {
    return handler(request, response, {
      public: ROOT,
      cleanUrls: false,
      rewrites: [
        // allow /produto/<slug> to map to /product.html?slug=<slug>
        { source: '/produto/:slug', destination: '/product.html?slug=:slug' },
        { source: '/produto/:slug/', destination: '/product.html?slug=:slug' },
      ],
    });
  });
  await new Promise(res => server.listen(port, res));
  const address = server.address();
  const actualPort = typeof address === 'object' ? address.port : port;
  return { server, url: `http://localhost:${actualPort}` };
}

async function fetchProducts() {
  const { data, error } = await supa.from('products').select('slug');
  if (error) throw error;
  return (data || []).map(r => r.slug).filter(Boolean);
}

// Wait for page to be fully rendered: either a sentinel on window or selector present
async function waitReady(page) {
  // mark prerenderReady true in app if available; fallback to selector
  await page.waitForFunction(() => {
    if (window.prerenderReady === true) return true;
    const el = document.getElementById('produto-dinamico');
    return !!(el && el.children && el.children.length > 0);
  }, { timeout: 25000 }).catch(() => {});

  // brief settle for images
  await page.waitForTimeout(400);
}

// Strip loader overlay if present
function stripLoader(html) {
  return html
    .replace(/<link[^>]+loader\.css[^>]*>\s*/gi, '')
    .replace(/<script>\s*window\.prerenderReady\s*=\s*false;\s*<\/script>/gi, '')
    .replace(/<div[^>]+id=["']loader-overlay["'][\s\S]*?<\/div>/gi, '');
}

async function prerenderOne(baseUrl, slug) {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  const url = `${baseUrl}/produto/${encodeURIComponent(slug)}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitReady(page);

  // ensure meta tags up to date (some scripts set them dynamically)
  // then get full HTML
  const html = await page.content();
  await browser.close();

  const finalHtml = stripLoader(html);
  const outDir = path.join(OUT_ROOT, slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), finalHtml, 'utf-8');
  console.log('✓ prerendered /produto/%s', slug);
}

async function main() {
  const { server, url } = await startServer(0);
  try {
    const slugs = await fetchProducts();
    if (!slugs.length) {
      console.warn('No products found');
      return;
    }
    fs.mkdirSync(OUT_ROOT, { recursive: true });
    for (const slug of slugs) {
      await prerenderOne(url, slug);
    }
    console.log('✅ All products prerendered to /produto/<slug>/index.html');
  } finally {
    server.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
