document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById('orcamentoForm');
  const ficheiroInput = document.getElementById('ficheiro');
  const linkHidden = document.getElementById('link_ficheiro');
  const status = document.getElementById('uploadStatus');
  const btnSubmit = form.querySelector('button[type="submit"]');

  if (btnSubmit) btnSubmit.disabled = false; // Por padrão, permitir envio

  ficheiroInput.addEventListener('change', function () {
    const ficheiro = ficheiroInput.files[0];
    if (!ficheiro) return;

    status.style.display = 'block';
    status.textContent = "A enviar ficheiro...";
    ficheiroInput.style.display = 'none';

    if (btnSubmit) btnSubmit.disabled = true;

    const reader = new FileReader();

    reader.onload = async function () {
      const base64 = reader.result.split(',')[1];

      const formData = new FormData();
      formData.append("base64", base64);
      formData.append("type", ficheiro.type);
      formData.append("name", ficheiro.name);

      try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbze3L1NAp89zQsRXpC1e8Vw8527yuwPIqv7oSx-3RWI3oaNKCT8ldYPkoazegH4mzZgEQ/exec", {
          method: "POST",
          body: formData
        });

        const result = await response.text();
        console.log("📁 Link do ficheiro:", result);

        if (result.startsWith("http")) {
          linkHidden.value = result;
          status.innerHTML = `✅ <a href="${result}" target="_blank">Ficheiro carregado</a>`;
          if (btnSubmit) btnSubmit.disabled = false;
        } else {
          status.textContent = "❌ Erro ao carregar o ficheiro.";
          ficheiroInput.style.display = 'block';
        }
      } catch (erro) {
        status.textContent = "❌ Erro: " + erro.message;
        ficheiroInput.style.display = 'block';
      }
    };

    reader.readAsDataURL(ficheiro);
  });

  form.addEventListener('submit', function (e) {
    // Só bloqueia se houver ficheiro selecionado e link ainda não disponível
    if (ficheiroInput.files.length > 0 && !linkHidden.value) {
      e.preventDefault();
      alert("Por favor aguarde o carregamento do ficheiro.");
      return;
    }

    e.preventDefault();
    const formData = new FormData(form);

    fetch("https://script.google.com/macros/s/AKfycbyA2cuBpgSttDVGpwNMSHSIW5EKRCjufbJemKeiHIwnfcDbO7sNctzSdFg_a-1AjiS79w/exec", {
      method: "POST",
      body: formData
    })
    .then(response => {
      if (response.ok) {
        alert("Pedido de orçamento enviado com sucesso!");
        window.location.href = "https://graficapt.com";
      } else {
        alert("Erro ao enviar. Tente novamente.");
      }
    })
    .catch(error => {
      alert("Erro ao enviar: " + error.message);
    });
  });
});
