// js/filter.js
// Filtros/ordenação simples para a homepage estática.

(function(){
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  // Exemplo: se tiveres tabs por categoria, dá para ligar assim:
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-filter');
      const items = Array.from(grid.querySelectorAll('.cell'));
      items.forEach(it => {
        const ok = !cat || cat === 'all' || it.dataset.categoria === cat;
        it.style.display = ok ? '' : 'none';
      });
    });
  });
})();