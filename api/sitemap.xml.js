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
      .select('slug')

    if (error || !products) {
      console.error('Erro ao obter produtos:', error)
      return res.status(500).send('Erro ao gerar sitemap.')
    }

    const today = new Date().toISOString().split('T')[0]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${products.map(p => `
  <url>
    <loc>${BASE_URL}/product.html?slug=${p.slug}</loc>
    <lastmod>${today}</lastmod>
  </url>
`).join('')}
</urlset>`

    res.setHeader('Content-Type', 'application/xml')
    res.status(200).send(xml)
  } catch (err) {
    console.error('Erro inesperado:', err)
    res.status(500).send('Erro ao gerar o sitemap')
  }
}
