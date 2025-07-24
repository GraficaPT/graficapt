// /api/sitemap.xml.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://nbcmqkcztuogflejswau.supabase.co'
const SUPABASE_KEY = 'sb_publishable_co9n_L7O6rCcc9mb570Uhw_Bg8eqWIL'
const BASE_URL = 'https://graficapt.com'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default async function handler(req, res) {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('slug, updated_at')

    if (error) throw error

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${products
  .map(({ slug, updated_at }) => {
    const lastmod = updated_at
      ? new Date(updated_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
    return `<url>
  <loc>${BASE_URL}/product.html?slug=${slug}</loc>
  <lastmod>${lastmod}</lastmod>
</url>`
  })
  .join('\n')}
</urlset>`

    res.setHeader('Content-Type', 'application/xml')
    res.status(200).send(xml)
  } catch (err) {
    console.error('Erro ao gerar sitemap:', err)
    res.status(500).send('Erro ao gerar o sitemap')
  }
}
