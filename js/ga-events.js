// /js/ga-events.js — wire up site-specific events
document.addEventListener('DOMContentLoaded', function(){
  // Defensive wait for GA helper
  if (!window.GA) {
    console.warn('[GA] GA helper not loaded yet.');
  }

  // Generic: mark landing on important templates
  try {
    var path = location.pathname;
    if (/^\/produto\/[^\/]+/.test(path)) {
      // Send view_item for product pages
      var nameEl = document.querySelector('.productname');
      var item_name = (nameEl && nameEl.value) || document.title.replace(/\s*\|\s*GráficaPT\s*$/, '');
      var slug = path.split('/').filter(Boolean)[1] || item_name;
      window.GA && GA.event('view_item', {
        currency: 'EUR',
        value: 0,
        items: [{ item_id: slug, item_name: item_name }]
      });
    }
  } catch(e){}

  // Track logo/file upload
  var fileInput = document.getElementById('ficheiro');
  if (fileInput) {
    fileInput.addEventListener('change', function(ev){
      var file = (ev.target && ev.target.files && ev.target.files[0]) || null;
      var sizeKB = file ? Math.round(file.size/1024) : null;
      var ext = file ? (file.name.split('.').pop() || '').toLowerCase() : '';
      var path = location.pathname;
      var slug = path.split('/').filter(Boolean)[1] || '';
      window.GA && GA.event('logo_upload', {
        item_id: slug || undefined,
        file_ext: ext || undefined,
        file_kb: sizeKB || undefined
      });
    });
  }

  // Track "Pedir Orçamento" submit
  var form = document.getElementById('orcamentoForm');
  if (form) {
    form.addEventListener('submit', function(){
      try {
        var selName = (document.querySelector('.productname') || {}).value || '';
        var slug = location.pathname.split('/').filter(Boolean)[1] || '';
        // Gather selected options (radio/image-radio/buttons)
        var selected = {};
        document.querySelectorAll('.options input[type="radio"]:checked, .options .opt-label.selected input[type="radio"]').forEach(function(el){
          var label = (el.getAttribute('name') || '').toLowerCase();
          var val = el.value || '';
          if (label) selected[label] = val;
        });
        // Also try select dropdowns if any
        document.querySelectorAll('.options select').forEach(function(el){
          var label = (el.getAttribute('name') || el.id || '').toLowerCase();
          var val = el.value || '';
          if (label) selected[label] = val;
        });
        GA && GA.event('request_quote', {
          item_id: slug || undefined,
          item_name: selName || undefined,
          options: Object.keys(selected).length ? JSON.stringify(selected) : undefined
        });
      } catch(e){ console.warn('[GA] quote event error', e); }
    });
  }

  // Track clicks on primary CTA button id="submit" (redundant to submit)
  var btn = document.getElementById('submit');
  if (btn) {
    btn.addEventListener('click', function(){
      GA && GA.event('cta_click', { id: 'submit', page: location.pathname });
    });
  }

  // Track topbar nav clicks (basic)
  document.querySelectorAll('.topbar a[href]').forEach(function(a){
    a.addEventListener('click', function(){
      GA && GA.event('nav_click', { href: a.getAttribute('href') });
    });
  });
});
