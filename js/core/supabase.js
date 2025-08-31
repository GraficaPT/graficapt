// Global Supabase singleton without ES modules
;(function(){
  function ensureEnv(){
    if (!window.__ENV || !window.__ENV.SUPABASE_URL || !window.__ENV.SUPABASE_ANON_KEY) {
      console.error('[Supa] Faltam variáveis no window.__ENV (SUPABASE_URL, SUPABASE_ANON_KEY).');
      return false;
    }
    return true;
  }
  async function load(){
    if (!ensureEnv()) return;
    const src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
    const { createClient } = await import(src);
    const client = createClient(window.__ENV.SUPABASE_URL, window.__ENV.SUPABASE_ANON_KEY);
    window.Supa = {
      client,
      getClient(){ return client; },
      publicUrl(bucket, path){
        const { data } = client.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
      }
    };
    console.log('[Supa] pronto');
  }
  load();
})();