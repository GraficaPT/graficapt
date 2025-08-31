// js/formSender.js
// Mantém SUBMIT "como antes" (POST para FORM_ACTION_URL/action + redirect) e
// substitui apenas o upload do logotipo por Supabase Storage.
// Requer /js/env.js carregado antes deste ficheiro.

(function(){
  if (window.formSenderInitialized) return;
  window.formSenderInitialized = true;

  const ENV = window.__ENV || {};

  // ---------- Helpers ----------
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

  function setBtnLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = !!loading;
    btn.style.backgroundColor = loading ? '#191919' : '';
  }

  async function uploadToSupabase(file, statusEl, btnSubmit) {
    if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_URL / SUPABASE_ANON_KEY não definidos em window.__ENV');
    }
    await ensureSupabaseLoaded();
    const supa = window.supabase.createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
    const bucket = ENV.SUPABASE_UPLOAD_BUCKET || 'uploads';
    const slug = getSlug();
    const path = `logos/${slug}/${Date.now()}_${safeName(file.name)}`;

    setBtnLoading(btnSubmit, true);
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
    setBtnLoading(btnSubmit, false);
    return publicUrl;
  }

  // ---------- Init ----------
  const form = document.getElementById('orcamentoForm');
  const fileInput = document.getElementById('ficheiro');
  const linkHidden = document.getElementById('link_ficheiro');
  const statusEl = document.getElementById('uploadStatus');
  const btnSubmit = document.getElementById('submit');

  let ficheiroEmUpload = false;

  if (fileInput && linkHidden && statusEl) {
    fileInput.addEventListener('change', async function(){
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      try {
        ficheiroEmUpload = true;
        const url = await uploadToSupabase(file, statusEl, btnSubmit);
        linkHidden.value = url;
        // esconder o input de ficheiro após upload concluído
        fileInput.style.display = 'none';
        ficheiroEmUpload = false;
      } catch (err) {
        console.error('[logo-upload] erro', err);
        ficheiroEmUpload = false;
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.textContent = 'Erro ao enviar ficheiro. Tenta novamente.';
        }
        setBtnLoading(btnSubmit, false);
      }
    }, { passive: true });
  }

  if (form) {
    // Se o form não tiver action e existir ENV.FORM_ACTION_URL, aplica-o
    if (!form.getAttribute('action') && ENV.FORM_ACTION_URL) {
      form.setAttribute('action', ENV.FORM_ACTION_URL);
    }

    form.addEventListener('submit', async function(e){
      // Mantém o comportamento "como antes": POST para o action (ou ENV.FORM_ACTION_URL) e redirect.
      e.preventDefault();

      if (ficheiroEmUpload) {
        alert('Por favor aguarde o carregamento do ficheiro.');
        return;
      }

      const actionUrl = ENV.FORM_ACTION_URL || form.getAttribute('action');
      if (!actionUrl) {
        alert('O formulário não tem ACTION definido (FORM_ACTION_URL/env). Não é possível enviar.');
        return;
      }

      try {
        setBtnLoading(btnSubmit, true);
        const fd = new FormData(form);
        // já temos o link no hidden, não precisamos enviar o binário
        fd.delete('Ficheiro');

        // Apps Script normalmente requer no-cors para não bloquear
        await fetch(actionUrl, { method: 'POST', body: fd, mode: 'no-cors' });

        const next =
          (form.querySelector('input[name=\"_next\"]')?.value) ||
          ENV.FORM_NEXT_URL ||
          'https://graficapt.com';

        window.location.href = next;
      } catch (err) {
        console.error('[form submit] erro', err);
        setBtnLoading(btnSubmit, false);
        alert('Erro ao enviar. Tenta novamente dentro de instantes.');
      }
    });
  }
})();