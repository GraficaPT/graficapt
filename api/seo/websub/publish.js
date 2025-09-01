
/**
 * POST /api/seo/websub/publish  { topic: "https://.../api/updates.atom", hub? }
 * Default hub: Google PubSubHubbub
 */
const fetch = global.fetch || require('node-fetch');
const DEFAULT_HUB = 'https://pubsubhubbub.appspot.com';

module.exports = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Use POST' });

    let body = '';
    await new Promise((resolve)=>{ req.on('data', c=> body+=c); req.on('end', resolve); });
    try { body = JSON.parse(body || '{}'); } catch { body = {}; }

    const urlObj = new URL(req.url, 'http://localhost');
    const topic = body.topic || urlObj.searchParams.get('topic');
    const hub = body.hub || urlObj.searchParams.get('hub') || DEFAULT_HUB;
    if (!topic) return res.status(400).json({ ok:false, error:'Missing topic' });

    const form = new URLSearchParams();
    form.set('hub.mode', 'publish');
    form.set('hub.url', topic);

    const r = await fetch(hub, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body: form.toString() });
    const text = await r.text();
    return res.status(r.ok ? 200 : r.status).json({ ok:r.ok, status:r.status, hub, topic, body:text });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
};
