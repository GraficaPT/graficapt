// loader.js
(function () {
  // Cria overlay
  const overlay = document.createElement('div');
  overlay.id = 'loader-overlay';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-label', 'A carregar conteúdo da página');

  overlay.innerHTML = `
    <div class="logo-wrapper">
      <img src="/imagens/logo_og.jpg" alt="Logotipo GráficaPT">
    </div>
    <div class="spinner" aria-hidden="true"></div>
    <div class="sr-only" aria-live="polite">Carregando…</div>
  `;

  document.documentElement.classList.add('loading');
  document.body.appendChild(overlay);
  document.body.classList.add('loading');

  // Função para esconder loader
  function hideLoader() {
    if (!overlay) return;
    document.body.classList.remove('loading');
    overlay.classList.add('loaded');

    overlay.addEventListener('transitionend', () => {
      overlay.remove();
    }, { once: true });
  }

  // Observa #produto-dinamico para detetar quando tem conteúdo
  function waitForDynamicContent() {
    const target = document.getElementById('produto-dinamico');
    if (!target) {
      // se não existir, fallback para onload
      window.addEventListener('load', hideLoader);
      return;
    }

    // Se já tiver filhos (renderizado rapidamente)
    if (target.children.length > 0 || target.innerHTML.trim() !== '') {
      hideLoader();
      return;
    }

    // Escuta evento customizado (caso o teu products.js dispare)
    document.addEventListener('product:ready', () => {
      hideLoader();
    }, { once: true });

    // MutationObserver como fallback
    const observer = new MutationObserver((mutations, obs) => {
      if (target.children.length > 0 || target.innerHTML.trim() !== '') {
        hideLoader();
        obs.disconnect();
      }
    });
    observer.observe(target, { childList: true, subtree: true, characterData: true });

    // Timeout máximo (ex: 10s) para evitar loader preso
    setTimeout(() => {
      hideLoader();
      observer.disconnect();
      console.warn('Loader: timeout de espera pelo conteúdo dinâmico.');
    }, 10000);
  }

  // Inicia após DOM pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForDynamicContent);
  } else {
    waitForDynamicContent();
  }
})();
