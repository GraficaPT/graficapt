
/**
 * GET /api/seo/ping?sitemap=https://example.com/sitemap.xml&engine=all|google|bing
 * POST /api/seo/ping  -> IndexNow { urls: ["https://..."] }  (requires INDEXNOW_KEY)
 */
const fetch = global.fetch || require('node-fetch');

module.exports = async (req, res) => {
  try {
    const method = (req.method || 'GET').toUpperCase();
    const urlObj = new URL(req.url, 'http://localhost');
    const engine = (urlObj.searchParams.get('engine') || 'all').toLowerCase();
    const sitemap = urlObj.searchParams.get('sitemap');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (method === 'OPTIONS') return res.status(204).end();

    if (method === 'GET') {
      if (!sitemap) return res.status(400).json({ ok:false, error: 'Missing ?sitemap=' });
      const targets = [];
      if (engine === 'google' || engine === 'all') {
        targets.push({ name: 'google', url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}` });
      }
      if (engine === 'bing' || engine === 'all') {
        targets.push({ name: 'bing', url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemap)}` });
      }
      const engines = {};
      for (const t of targets) {
        try {
          const r = await fetch(t.url, { method: 'GET' });
          engines[t.name] = { status: r.status, statusText: r.statusText };
        } catch (e) {
          engines[t.name] = { error: String(e) };
        }
      }
      return res.status(200).json({ ok: true, engines });
    }

    if (method === 'POST') {
      // IndexNow submission
      const INDEXNOW_KEY = process.env.INDEXNOW_KEY;
      let body = '';
      await new Promise((resolve)=>{ req.on('data', c=> body+=c); req.on('end', resolve); });
      try { body = JSON.parse(body || '{}'); } catch { body = {}; }
      const urls = Array.isArray(body.urls) ? body.urls : [];
      if (!INDEXNOW_KEY) return res.status(400).json({ ok:false, error:'INDEXNOW_KEY not configured' });
      if (!urls.length) return res.status(400).json({ ok:false, error:'Body must include { "urls": ["https://..."] }' });
      const host = process.env.INDEXNOW_HOST || (process.env.SITE_ORIGIN || 'https://graficapt.com').replace(/^https?:\/\//,'');
      const payload = {
        host,
        key: INDEXNOW_KEY,
        keyLocation: process.env.INDEXNOW_KEY_LOCATION || `https://${host}/${INDEXNOW_KEY}.txt`,
        urlList: urls
      };
      const r = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const text = await r.text();
      return res.status(r.ok ? 200 : r.status).json({ ok: r.ok, status: r.status, body: text });
    }

    return res.status(405).json({ ok:false, error:'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ ok:false, error: String(e) });
  }
};
