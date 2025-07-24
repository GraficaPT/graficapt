import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://nbcmqkcztuogflejswau.supabase.co'
const SUPABASE_KEY = 'sb_publishable_co9n_L7O6rCcc9mb570Uhw_Bg8eqWIL' // podes usar esta chave SE os slugs forem públicos

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default async function handler(req, res) {
  const { data: products, error } = await supabase
    .from('products')
    .select('slug, updated_at')

  if (error) {
    res.status(500).send('Erro a gerar sitemap')
    return
  }

  const baseUrl = 'https://graficapt.com'

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${products
  .map(({ slug, updated_at }) => {
    const date = updated_at ? new Date(updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    return `<url>
  <loc>${baseUrl}/product.html?slug=${slug}</loc>
  <lastmod>${date}</lastmod>
</url>`
  })
  .join('\n')}
</urlset>`

  res.setHeader('Content-Type', 'application/xml')
  res.status(200).send(xml)
}
