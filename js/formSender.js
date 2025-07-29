// Garante que só corre uma vez
if (!window.formSenderInitialized) {
  window.formSenderInitialized = true;

  function inicializarForm() {
    const form = document.getElementById('orcamentoForm');
    if (!form) return; // Se o form ainda não existir, sai

    const ficheiroInput = document.getElementById('ficheiro');
    const linkHidden = document.getElementById('link_ficheiro');
    const status = document.getElementById('uploadStatus');
    const btnSubmit = document.getElementById('submit');
    let ficheiroEmUpload = false;

    // 🔹 SUBMISSÃO DO FORMULÁRIO
    form.addEventListener('submit', function (e) {
      e.preventDefault(); // Impede envio nativo

      if (ficheiroInput && ficheiroEmUpload) {
        alert("Por favor aguarde o carregamento do ficheiro.");
        return;
      }

      btnSubmit.disabled = true;
      btnSubmit.style.backgroundColor = '#191919';

      const formData = new FormData(form);
      fetch(
        "https://script.google.com/macros/s/AKfycbyZo3TNBoxKVHGgP_J1rKX1C3fEcD79i7VyUpMHV9J7gjJlmHQrD3Cm0l_i5fMllJnH/exec",
        { method: "POST", body: formData }
      )
        .then(response => {
          if (response.ok) {
            alert("Pedido de orçamento enviado com sucesso!\nIremos contactá-lo em breve.");
            window.location.href = "https://graficapt.com";
          } else {
            throw new Error("Erro ao enviar formulário");
          }
        })
        .catch(error => {
          alert("Erro ao enviar: " + error.message);
          btnSubmit.disabled = false;
          btnSubmit.style.backgroundColor = '';
        });
    });

    // 🔹 UPLOAD DE FICHEIRO
    if (ficheiroInput && linkHidden && status) {
      ficheiroInput.addEventListener('change', function () {
        const ficheiro = ficheiroInput.files[0];
        if (!ficheiro) return;
        
        ficheiroEmUpload = true;
        status.style.display = 'block';
        status.textContent = "A enviar ficheiro...";
        ficheiroInput.display = 'none';
        btnSubmit.disabled = true;
        btnSubmit.style.backgroundColor = '#191919';

        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result.split(',')[1];
          const formData = new FormData();
          formData.append("base64", base64);
          formData.append("type", ficheiro.type);
          formData.append("name", ficheiro.name);

          try {
            const response = await fetch(
              "https://script.google.com/macros/s/AKfycbze3L1NAp89zQsRXpC1e8Vw8527yuwPIqv7oSx-3RWI3oaNKCT8ldYPkoazegH4mzZgEQ/exec",
              { method: "POST", body: formData }
            );
            const result = await response.text();
            if (result.startsWith("http")) {
              linkHidden.value = result;
              ficheiroEmUpload = false;
              status.innerHTML = `✅ <a href="${result}" target="_blank">Ficheiro carregado</a>`;
              ficheiroInput.disabled = false;
              btnSubmit.disabled = false;
              btnSubmit.style.backgroundColor = '';
            } else {
              throw new Error("Resposta inesperada: " + result);
            }
          } catch (erro) {
            status.textContent = "❌ Erro: " + erro.message;
            ficheiroInput.disabled = false;
          }
        };
        reader.readAsDataURL(ficheiro);
      });
    }
  }

  const observer = new MutationObserver(() => {
    if (document.getElementById('orcamentoForm')) {
      observer.disconnect();
      inicializarForm();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
