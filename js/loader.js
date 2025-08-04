// loader.js
(function () {
  const OVERLAY_ID = 'loader-overlay';
  const TARGET_ID = 'produto-dinamico';
  const MAX_TIMEOUT_MS = 10000; // tempo máximo de espera
  const DEBOUNCE_AFTER_LAST_LOAD_MS = 150; // espera breve depois da última imagem carregada

  // Cria overlay
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-label', 'A carregar conteúdo da página');
  overlay.innerHTML = `
    <div class="logo-wrapper">
      <img src="../imagens/social/logo_minimal.svg" alt="Logotipo GráficaPT">
    </div>
    <div class="spinner" aria-hidden="true"></div>
    <div class="sr-only" aria-live="polite">Carregando…</div>
  `;

  document.documentElement.classList.add('loading');
  document.body.classList.add('loading');
  document.body.appendChild(overlay);

  // Função que esconde o loader com slide-up
  function hideLoader() {
    if (!overlay) return;
    document.body.classList.remove('loading');
    overlay.classList.add('loaded');
    overlay.addEventListener('transitionend', () => {
      overlay.remove();
    }, { once: true });
  }

  // Observa e espera todas as imagens dentro de target carregarem
  function waitForAllImages(target) {
    return new Promise((resolve) => {
      const pending = new Set(); // imgs ainda por carregar
      let debounceTimer = null;
      let finished = false;

      const checkIfDone = () => {
        if (pending.size === 0) {
          // debounce para ver se não aparecem novas imagens imediatamente
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

      const monitorImage = (img) => {
        // Se já carregada com sucesso, ignora
        if (img.complete && img.naturalWidth !== 0) return;

        if (pending.has(img)) return; // já observado

        pending.add(img);
        const onEvent = () => {
          img.removeEventListener('load', onEvent);
          img.removeEventListener('error', onEvent);
          pending.delete(img);
          checkIfDone();
        };
        img.addEventListener('load', onEvent);
        img.addEventListener('error', onEvent);
      };

      // Inicial: pega imagens já presentes
      const scanExisting = () => {
        target.querySelectorAll('img').forEach(monitorImage);
      };

      // Observer para novas imagens ou mudanças de atributos relevantes
      const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
          if (m.type === 'childList') {
            m.addedNodes.forEach(node => {
              if (node.nodeName === 'IMG') monitorImage(node);
              else if (node.querySelectorAll) {
                node.querySelectorAll('img').forEach(monitorImage);
              }
            });
          }
          if (m.type === 'attributes' && m.target.nodeName === 'IMG') {
            const attr = m.attributeName;
            if (attr === 'src' || attr === 'srcset') {
              monitorImage(m.target);
            }
          }
        });
        checkIfDone();
      });

      mutationObserver.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'srcset'],
      });

      // Timeout fallback
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
        mutationObserver.disconnect();
      };

      // Start scan
      scanExisting();
      checkIfDone();
    });
  }

  // Inicia a lógica: espera que o conteúdo e imagens estejam prontos
  function init() {
    const target = document.getElementById(TARGET_ID);
    if (!target) {
      // fallback simples
      window.addEventListener('load', hideLoader);
      return;
    }

    // Escuta evento customizado de que o produto foi inserido
    const onProductReady = async () => {
      // Espera todas as imagens internas carregarem (ou timeout)
      await waitForAllImages(target);
      hideLoader();
    };

    document.addEventListener('product:ready', onProductReady, { once: true });

    // Caso o conteúdo já esteja lá (renderizado rápido), dispara manualmente
    if ((target.children.length > 0 || target.innerHTML.trim() !== '')) {
      // delay breve para garantir que o evento product:ready seja o gatilho
      setTimeout(() => {
        document.dispatchEvent(new Event('product:ready'));
      }, 0);
    }

    // Safety fallback: se nem o event nem nada acontecer em X, esconde
    setTimeout(() => {
      hideLoader();
    }, MAX_TIMEOUT_MS + 500); // um pouco além do timeout interno
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
