import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL='', SUPABASE_ANON_KEY='', BASE_URL='https://graficapt.com', STORAGE_PUBLIC='' } = process.env;
const OUT = path.join(process.cwd(),'produto');
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const mkUrl = x => /^https?:\/\//.test(String(x||'')) ? String(x) : `${(STORAGE_PUBLIC||BASE_URL+'/imagens/produtos/')}${String(x||'').replace(/^\//,'')}`;
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

async function main(){
  const tpl = fs.readFileSync(path.join(process.cwd(),'product.html'),'utf-8');
  const { data } = await supabase.from('products').select('slug,name,images,banner,metawords');
  for (const p of (data||[])) {
    const url = `${BASE_URL}/produto/${encodeURIComponent(p.slug)}`;
    let imgs = []; try{ imgs = Array.isArray(p.images)?p.images:JSON.parse(p.images||'[]'); }catch{}
    const hero = mkUrl(imgs[0] || p.banner || 'logo_minimal.png');
    const thumbs = imgs.slice(1).map(mkUrl);
    const head = `
<title>${esc(p.name)} | GráficaPT</title>
<link rel="canonical" href="${url}">
<meta name="description" content="Compra ${esc(p.name)} personalizada na GráficaPT. Impressão profissional, ideal para empresas e eventos.">
<meta property="og:type" content="product">
<meta property="og:title" content="${esc(p.name)} | GráficaPT">
<meta property="og:image" content="${hero}">
<meta property="og:url" content="${url}">`;
    const body = `
<article class="product"><header class="product-header"><h1>${esc(p.name)}</h1></header>
<figure class="product-hero"><img src="${hero}" alt="${esc(p.name)}"></figure>
${thumbs.length?`<div class="product-thumbs">${thumbs.map((t,i)=>`<img src="${t}" alt="${esc(p.name)} — imagem ${i+2}">`).join('')}</div>`:''}
</article>`;
    let html = tpl.replace(/<\/head>/i, `${head}\n</head>`);
    html = html.replace(/<div\s+id=["']produto-dinamico["']><\/div>/i, `<div id="produto-dinamico">${body}</div>`);
    const dir = path.join(OUT, p.slug); fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'index.html'), html, 'utf-8');
  }
}
main().catch(e=>{console.error(e);process.exit(1)});
