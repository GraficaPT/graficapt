// /js/app.guards.js — safe guards to avoid null DOM errors and skip duplicate product rendering
;(function(){
  function noOp(){}
  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  ready(function(){
    const prodHost   = document.getElementById('produto-dinamico');
    const hasGrid    = !!document.querySelector('[data-products-grid]');
    const hasFilters = !!document.querySelector('.filters');
    const preRendered = !!window.__PRODUCT__;

    // If page is pre-rendered product OR no product host exists, prevent client re-render
    if (preRendered || !prodHost) {
      if (typeof window.renderProdutos === 'function') {
        try { console.debug('[guards] disabling renderProdutos (pre-render or no host)'); } catch {}
        window.renderProdutos = noOp;
      }
    }

    // If filters/grid are missing on this page, prevent filter logic from running
    if (!hasFilters || !hasGrid) {
      if (typeof window.applyFilters === 'function') {
        try { console.debug('[guards] disabling applyFilters (no filters/grid)'); } catch {}
        window.applyFilters = noOp;
      }
    }
  });
})();