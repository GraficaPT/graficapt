export function updateSEO(produto) {
  document.title = `${produto.name || produto.nome} | GráficaPT`;

  let metaDesc = document.querySelector('meta[name="description"]') 
    || createMeta('description');
  metaDesc.setAttribute(
    'content',
    `Compra ${produto.name || produto.nome} personalizada na GráficaPT. Impressão profissional, ideal para empresas e eventos.`
  );

  let metaKeywords = document.querySelector('meta[name="keywords"]') 
    || createMeta('keywords');
  const baseKeywords = metaKeywords.getAttribute('content') || '';
  const extraWords = (produto.metawords || []).filter(Boolean).join(', ');
  const combined = baseKeywords + (extraWords ? ', ' + extraWords : '');
  metaKeywords.setAttribute('content', combined);
}

function createMeta(name) {
  const m = document.createElement('meta');
  m.setAttribute('name', name);
  document.head.appendChild(m);
  return m;
}

export function updateCanonicalAndOG(slug) {
  const href = `https://graficapt.com/produto/${encodeURIComponent(slug)}`;
  setLink('canonical', href);
  setMetaProperty('og:url', href);
}

function setLink(rel, href) {
  let link = document.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', rel);
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setMetaProperty(prop, content) {
  let meta = document.querySelector(`meta[property="${prop}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', prop);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}
