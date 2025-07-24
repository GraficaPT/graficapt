
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://nbcmqkcztuogflejswau.supabase.co";
const SUPABASE_KEY = "sb_publishable_co9n_L7O6rCcc9mb570Uhw_Bg8eqWIL";
const BASE_URL = "https://graficapt.com";
const OUTPUT_PATH = "./sitemap.xml"; // ou "./public/sitemap.xml" se usares pasta pública

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function gerarSitemap() {
  const { data: products, error } = await supabase
    .from("products")
    .select("slug");

  if (error || !products) {
    console.error("Erro ao obter produtos:", error);
    process.exit(1);
  }

  const today = new Date().toISOString().split("T")[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    products.map(p => `
  <url>
    <loc>${BASE_URL}/product.html?slug=${p.slug}</loc>
    <lastmod>${today}</lastmod>
  </url>`).join("\n") +
    "\n</urlset>";

  fs.writeFileSync(OUTPUT_PATH, xml, "utf-8");
  console.log("✅ sitemap.xml gerado em:", OUTPUT_PATH);
}

gerarSitemap();
