// Supabase singleton, classic script
;(function(){
  if (!window.__ENV) { console.error('[Supa] missing window.__ENV'); return; }
  const src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
  import(src).then(({ createClient }) => {
    window.Supa = { client: createClient(window.__ENV.SUPABASE_URL, window.__ENV.SUPABASE_ANON_KEY) };
    console.log('[Supa] ready');
  }).catch(e => console.error('[Supa] load error', e));
})();