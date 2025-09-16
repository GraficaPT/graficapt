// /js/ga.js — GA4 bootstrap + lightweight helper
(function(){
  // Ensure env present
  var MID = (window.__ENV && window.__ENV.GA_MEASUREMENT_ID) || 'G-XXXXXXXXXX';
  if (!MID) {
    console.warn('[GA] Missing GA_MEASUREMENT_ID in window.__ENV; using placeholder.');
    MID = 'G-XXXXXXXXXX';
  }
  // Inject gtag loader if not present
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MID);
    document.head.appendChild(s);
  }
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  // Initialize GA
  gtag('js', new Date());
  gtag('config', MID, { send_page_view: true });

  // Small helper namespace
  window.GA = {
    id: MID,
    event: function(name, params){
      try {
        window.gtag('event', name, params || {});
      } catch(e){ console.warn('[GA] event failed', e); }
    }
  };
})();
