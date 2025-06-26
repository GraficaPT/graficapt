document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('orcamentoForm');
  const ficheiroInput = document.getElementById('ficheiro');
  const linkHidden = document.getElementById('link_ficheiro');
  const status = document.getElementById('uploadStatus');
  const btnSubmit = document.getElementById('submit');

  let ficheiroEmUpload = false;

  // Garante que o botão começa ativo
  if (btnSubmit) {
    btnSubmit.disabled = false;
    btnSubmit.style.backgroundColor = '';
  }

  // Só ativa o listener de upload se existir o input de ficheiro
  if (ficheiroInput && status && linkHidden) {
    ficheiroInput.addEventListener('change', function () {
      const ficheiro = ficheiroInput.files[0];
      if (!ficheiro) return;

      ficheiroEmUpload = true;
      status.style.display = 'block';
      status.textContent = "A enviar ficheiro...";
      ficheiroInput.style.display = 'none';
      if (btnSubmit) btnSubmit.style.backgroundColor = '#191919';

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
            if (btnSubmit) {
              btnSubmit.disabled = false;
              btnSubmit.style.backgroundColor = '';
            }
          } else {
            throw new Error("Resposta inesperada: " + result);
          }
        } catch (erro) {
          status.textContent = "❌ Erro: " + erro.message;
          ficheiroInput.style.display = 'block';
        }
      };
      reader.readAsDataURL(ficheiro);
    });
  }

  // Listener de submit — funciona sempre, independentemente do upload
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (ficheiroEmUpload) {
        alert("Por favor aguarde o carregamento do ficheiro.");
        return;
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.style.backgroundColor = '#191919';
      }

      const formData = new FormData(form);
      fetch(
        "https://script.google.com/macros/s/AKfycbyZo3TNBoxKVHGgP_J1rKX1C3fEcD79i7VyUpMHV9J7gjJlmHQrD3Cm0l_i5fMllJnH/exec",
        { method: "POST", body: formData }
      )
      .then(response => {
        if (response.ok) {
          alert("Pedido de orçamento enviado com sucesso! Iremos contactá-lo em breve.");
          window.location.href = "https://graficapt.com";
        } else {
          throw new Error("Resposta não OK");
        }
      })
      .catch(error => {
        alert("Erro ao enviar: " + error.message);
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.style.backgroundColor = '';
        }
      });
    });
  }
});
