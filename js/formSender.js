document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('orcamentoForm');
    const ficheiroInput = document.getElementById('ficheiro');
    const linkHidden = document.getElementById('link_ficheiro');
    const status = document.getElementById('uploadStatus');
    const btnSubmit = form.querySelector('button[type="submit"]');
  
    if (btnSubmit) btnSubmit.disabled = true;
  
    // 🟢 Quando muda o ficheiro
    ficheiroInput.addEventListener('change', function () {
      const ficheiro = ficheiroInput.files[0];
      if (!ficheiro) return;
  
      if (status) status.textContent = "A enviar ficheiro...";
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
            if (status) status.innerHTML = `✅ <a href="${result}" target="_blank">Ficheiro carregado</a>`;
            if (btnSubmit) btnSubmit.disabled = false;
          } else {
            if (status) status.textContent = "❌ Erro ao carregar o ficheiro.";
          }
        } catch (erro) {
          if (status) status.textContent = "❌ Erro: " + erro.message;
        }
      };
  
      reader.readAsDataURL(ficheiro);
    });
  
    // 📨 Envio do formulário
    form.addEventListener('submit', function (e) {
      if (!linkHidden.value) {
        e.preventDefault();
        alert("Por favor aguarde o carregamento do ficheiro.");
        return;
      }
  
      e.preventDefault();
      const formData = new FormData(form);
  
      fetch("https://formsubmit.co/orcamentos@graficapt.com", {
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
  