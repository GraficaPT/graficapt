// loader.js
(function () {
  const OVERLAY_ID = 'loader-overlay';
  const TARGET_ID_PRODUCT = 'produto-dinamico';
  const TARGET_ID_GRID = 'products-grid';
  const MAX_TIMEOUT_MS = 12000;
  const DEBOUNCE_AFTER_LAST_LOAD_MS = 300;

  // cria overlay
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-label', 'A carregar conteúdo da página');
  overlay.innerHTML = `
    <div class="logo-wrapper">
      <img src="/imagens/social/logo_minimal.svg" alt="Logotipo GráficaPT">
    </div>
    <div class="spinner" aria-hidden="true"></div>
    <div class="sr-only" aria-live="polite">Carregando…</div>
  `;

  document.documentElement.classList.add('loading');
  document.body.classList.add('loading');
  document.body.appendChild(overlay);

  function hideLoader() {
    if (!overlay) return;
    document.body.classList.remove('loading');
    overlay.classList.add('loaded');
    overlay.addEventListener('transitionend', () => {
      overlay.remove();
    }, { once: true });
  }

  // observa imagens dentro de um container e resolve quando todas carregam (com debounce)
  function waitForImagesWithDebounce(container, signalDone) {
    return new Promise((resolve) => {
      const pending = new Set();
      let debounceTimer = null;
      let finished = false;

      const checkDone = () => {
        if (pending.size === 0) {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            if (pending.size === 0 && !finished) {
              finished = true;
              cleanup();
              resolve();
            }
          }, DEBOUNCE_AFTER_LAST_LOAD_MS);
        }
      };

      const monitorImg = (img) => {
        if (img.complete && img.naturalWidth !== 0) return;
        if (pending.has(img)) return;
        pending.add(img);
        const onEvent = () => {
          img.removeEventListener('load', onEvent);
          img.removeEventListener('error', onEvent);
          pending.delete(img);
          checkDone();
        };
        img.addEventListener('load', onEvent);
        img.addEventListener('error', onEvent);
      };

      const scan = () => {
        container.querySelectorAll('img').forEach(monitorImg);
        checkDone();
      };

      const mo = new MutationObserver(() => {
        scan();
      });

      mo.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset'] });

      // inicial
      scan();

      const timeout = setTimeout(() => {
        if (!finished) {
          finished = true;
          cleanup();
          resolve();
        }
      }, MAX_TIMEOUT_MS);

      const cleanup = () => {
        clearTimeout(timeout);
        clearTimeout(debounceTimer);
        mo.disconnect();
      };
    });
  }

  // lógica principal para index (grid) ou product
  async function init() {
    const targetProduct = document.getElementById(TARGET_ID_PRODUCT);
    const targetGrid = document.getElementById(TARGET_ID_GRID);

    let used = false;

    // Handler comum: espera imagens e esconde
    const finalize = async (container) => {
      if (used) return;
      used = true;
      await waitForImagesWithDebounce(container);
      hideLoader();
    };

    // 1. Se for product.html e receber event
    document.addEventListener('product:ready', () => {
      if (targetProduct) finalize(targetProduct);
    }, { once: true });

    // 2. Se for index.html: observa o grid até ter filhos e depois espera imagens
    if (targetGrid) {
      const observer = new MutationObserver((mutations, obs) => {
        if (targetGrid.children.length > 0) {
          // Há conteúdo — parar observer e finalizar
          obs.disconnect();
          finalize(targetGrid);
        }
      });
      observer.observe(targetGrid, { childList: true, subtree: false });

      // Caso já esteja preenchido rápido
      if (targetGrid.children.length > 0) {
        finalize(targetGrid);
      }
    }

    // 3. Fallback absoluto
    setTimeout(() => {
      hideLoader();
    }, MAX_TIMEOUT_MS + 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
