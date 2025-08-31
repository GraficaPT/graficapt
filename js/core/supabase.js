// Supabase singleton (UMD) — sync
;(function () {
  if (!window.__ENV) { console.error('[Supa] window.__ENV em falta'); return; }
  if (!window.supabase || !window.supabase.createClient) {
    console.error('[Supa] SDK UMD não carregou'); return;
  }
  window.Supa = {
    client: window.supabase.createClient(
      window.__ENV.SUPABASE_URL,
      window.__ENV.SUPABASE_ANON_KEY
    )
  };
  console.log('[Supa] ready (UMD)');
})();