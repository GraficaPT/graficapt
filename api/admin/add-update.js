
/**
 * POST /api/admin/add-update { url, title?, summary? }
 * Headers: x-admin-key: <ADMIN_API_KEY>
 */
const fetch = global.fetch || require('node-fetch');

module.exports = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-key');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Use POST' });

    const adminKey = req.headers['x-admin-key'];
    if (!process.env.ADMIN_API_KEY || adminKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ ok:false, error:'Unauthorized' });
    }

    let body = '';
    await new Promise((resolve)=>{ req.on('data', c=> body+=c); req.on('end', resolve); });
    try { body = JSON.parse(body || '{}'); } catch { body = {}; }
    const { url, title, summary } = body || {};
    if (!url) return res.status(400).json({ ok:false, error:'Missing url' });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE;
    if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ ok:false, error:'Missing Supabase env' });

    const payload = { url, title: title || url, summary: summary || null };
    const r = await fetch(`${SUPABASE_URL}/rest/v1/web_updates`, {
      method:'POST',
      headers:{
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type':'application/json'
      },
      body: JSON.stringify(payload)
    });
    const txt = await r.text();
    return res.status(r.ok ? 200 : r.status).json({ ok:r.ok, status:r.status, body: txt });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
};
