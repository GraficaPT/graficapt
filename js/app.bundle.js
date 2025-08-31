;(function(window,document){
'use strict';

// Supabase client shortcut
const supabase = (window.Supa && window.Supa.client) || null;

/* ===== app.bundle.js (simplified with guards) ===== */

// Example renderProdutos implementation with guard
function renderProdutos() {
  const host = document.getElementById('produto-dinamico');
  if (window.__PRODUCT__ || !host || !supabase) {
    console.debug('[app.bundle] renderProdutos skipped');
    return;
  }
  // ... your existing rendering logic here ...
  host.innerHTML = "<p>Produto carregado dinamicamente</p>";
}

// Example applyFilters implementation with guard
function applyFilters() {
  const root = document.querySelector('.filters');
  const grid = document.querySelector('[data-products-grid]');
  if (!root || !grid) {
    console.debug('[app.bundle] applyFilters skipped');
    return;
  }
  const checks = root.querySelectorAll('input[type="checkbox"]');
  // ... your existing filter logic here ...
  console.debug('[app.bundle] applyFilters found %d checks', checks.length);
}

// Hook on DOMContentLoaded to call functions safely
document.addEventListener('DOMContentLoaded', ()=>{
  try { renderProdutos(); } catch(e){ console.error(e); }
  try { applyFilters(); } catch(e){ console.error(e); }
  console.log("Loaded");
});

})(window,document);
