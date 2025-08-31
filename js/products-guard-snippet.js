const supabase = (window.Supa && window.Supa.client) || null;
(function(){
  const container = document.getElementById('produto-dinamico');
  if (container && container.children && container.children.length) {
    // Já está renderizado; podes aqui só ligar eventos/analytics usando window.__PRODUCT__
    return;
  }
})();