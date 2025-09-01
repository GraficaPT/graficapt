
/**
 * GET /api/updates.atom  -> Atom feed listing recent updated URLs
 * Requires env: SUPABASE_URL, and SUPABASE_SERVICE_ROLE or SUPABASE_ANON_KEY
 * Table: public.web_updates (id, url, title, summary, updated_at timestamptz default now())
 */
const fetch = global.fetch || require('node-fetch');

function escapeXml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

module.exports = async (req, res) => {
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;
    const site = process.env.SITE_ORIGIN || 'https://graficapt.com';
    const limit = Number(new URL(req.url, 'http://localhost').searchParams.get('limit') || '25');
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      res.statusCode = 500;
      res.setHeader('Content-Type','text/plain; charset=utf-8');
      return res.end('Feed not configured. Missing Supabase env.');
    }
    const r = await fetch(`${SUPABASE_URL}/rest/v1/web_updates?select=*&order=updated_at.desc&limit=${limit}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const items = await r.json();
    const updated = items[0]?.updated_at || new Date().toISOString();
    const topic = `${site}/api/updates.atom`;

    const entries = items.map(row => `
  <entry>
    <id>tag:${site.replace(/^https?:\/\//,'')},2025:webupdate:${row.id}</id>
    <title>${escapeXml(row.title || row.url)}</title>
    <link rel="alternate" href="${escapeXml(row.url)}"/>
    <updated>${escapeXml(row.updated_at)}</updated>
    <summary>${escapeXml(row.summary || '')}</summary>
  </entry>`).join('\n');

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atualizações</title>
  <id>tag:${site.replace(/^https?:\/\//,'')},2025:webupdates</id>
  <link rel="self" href="${topic}"/>
  <link rel="hub" href="https://pubsubhubbub.appspot.com"/>
  <updated>${escapeXml(updated)}</updated>
  ${entries}
</feed>`;

    res.setHeader('Content-Type','application/atom+xml; charset=utf-8');
    return res.status(200).end(xml);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type','text/plain; charset=utf-8');
    return res.end('Error: ' + String(e));
  }
};
