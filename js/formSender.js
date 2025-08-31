// formSender.js — versão só para upload do logotipo via Supabase
// Mantém a submissão do formulário EXACTAMENTE como tens (action/JS antigo).
// Apenas substitui o fluxo de upload do ficheiro para Supabase Storage
// e preenche o input hidden #link_ficheiro com o URL público.

(function(){
  if (window.__FORM_LOGO_UPLOADER__) return;
  window.__FORM_LOGO_UPLOADER__ = true;
  window.formSenderInitialized = true;

  // Carrega supabase-js se não existir
  function ensureSupabaseLoaded() {
    return new Promise((resolve, reject) => {
      if (window.supabase) return resolve();
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Falha a carregar supabase-js'));
      document.head.appendChild(s);
    });
  }

  function getSlug() {
    try {
      const parts = location.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || 'produto';
    } catch(e) { return 'produto'; }
  }

  function safeName(name) {
    return String(name||'ficheiro').replace(/[^A-Za-z0-9._-]+/g, '_');
  }

  async function uploadToSupabase(file, statusEl, btnSubmit) {
    const ENV = window.__ENV || {};
    if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_URL / SUPABASE_ANON_KEY não definidos em window.__ENV');
    }
    await ensureSupabaseLoaded();
    const supa = window.supabase.createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
    const bucket = ENV.SUPABASE_UPLOAD_BUCKET || 'uploads'; // cria este bucket
    const slug = getSlug();
    const path = `logos/${slug}/${Date.now()}_${safeName(file.name)}`;

    if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.style.backgroundColor = '#191919'; }
    if (statusEl) { statusEl.style.display = 'block'; statusEl.textContent = 'A enviar ficheiro...'; }

    const { data, error } = await supa.storage.from(bucket).upload(path, file, {
      upsert: false,
      cacheControl: '3600',
      contentType: file.type || 'application/octet-stream'
    });
    if (error) throw error;

    const { data: pub } = supa.storage.from(bucket).getPublicUrl(path);
    const publicUrl = pub?.publicUrl || null;
    if (!publicUrl) throw new Error('Não foi possível obter URL público');

    if (statusEl) {
      statusEl.innerHTML = `✅ <a href="${publicUrl}" target="_blank" rel="noopener">Ficheiro carregado</a>`;
    }
    if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.style.backgroundColor = ''; }
    return publicUrl;
  }

  function initOnce() {
    const fileInput = document.getElementById('ficheiro');
    const linkHidden = document.getElementById('link_ficheiro');
    const statusEl = document.getElementById('uploadStatus');
    const btnSubmit = document.getElementById('submit');

    if (!fileInput || !linkHidden || !statusEl) return false;

    fileInput.addEventListener('change', async function(){
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      try {
        const url = await uploadToSupabase(file, statusEl, btnSubmit);
        linkHidden.value = url; // <- isto garante que a SUBMISSÃO (a mesma de antes) leva o link correto
      } catch (err) {
        console.error('[logo-upload] erro', err);
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.textContent = 'Erro ao enviar ficheiro. Tenta novamente.';
        }
        if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.style.backgroundColor = ''; }
      }
    }, { passive: true });

    return true;
  }

  // Tenta imediatamente e também observa o DOM (caso o form entre depois)
  if (!initOnce()) {
    const obs = new MutationObserver(() => {
      if (initOnce()) obs.disconnect();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
