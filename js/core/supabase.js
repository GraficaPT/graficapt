// Global Supabase singleton (no modules)
(function(){
  const src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
  function ensureEnv(){
    if (!window.__ENV || !window.__ENV.SUPABASE_URL || !window.__ENV.SUPABASE_ANON_KEY) {
      console.error('[Supa] Faltam variáveis no window.__ENV (SUPABASE_URL, SUPABASE_ANON_KEY).');
      return false;
    }
    return true;
  }
  async function load(){
    if (!ensureEnv()) return;
    const { createClient } = await import(src);
    const client = createClient(window.__ENV.SUPABASE_URL, window.__ENV.SUPABASE_ANON_KEY);
    window.Supa = {
      client,
      getClient(){ return client; },
      async uploadPublic(bucket, path, file){
        const { data, error } = await client.storage.from(bucket).upload(path, file, { upsert: true });
        if (error) throw error;
        return data;
      },
      publicUrl(bucket, path){
        const { data } = client.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
      }
    };
    console.log('[Supa] pronto');
  }
  load();
})();
