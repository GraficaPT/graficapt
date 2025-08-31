
const SITE_ORIGIN = 'https://graficapt.com';

export default async function handler(req, res) {
  try {
    const path = (req.query.path || '/').toString().replace(/^\//, '');
    const targetUrl = `https://service.prerender.io/${SITE_ORIGIN}/${path}`;
    const ua = req.headers['user-agent'] || '';

    const upstream = await fetch(targetUrl, {
      headers: {
        'X-Prerender-Token': process.env.prerender_token,
        'User-Agent': ua
      }
    });

    // cabeçalhos úteis e sinal de debug
    res.status(upstream.status);
    const ctype = upstream.headers.get('content-type');
    if (ctype) res.setHeader('content-type', ctype);
    const cache = upstream.headers.get('cache-control');
    if (cache) res.setHeader('cache-control', cache);
    res.setHeader('x-from-prerender', '1');

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (e) {
    res.status(500).send('Prerender proxy error');
  }
}
