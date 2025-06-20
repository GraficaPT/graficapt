document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('orcamentoForm');
    const ficheiroInput = document.getElementById('ficheiro'); // input type="file"
    const linkHidden = document.getElementById('link_ficheiro'); // input hidden
    const status = document.getElementById('uploadStatus'); // parágrafo com feedback
    const btnSubmit = form.querySelector('button[type="submit"]');
  
    // Inicialmente desativa o botão de envio
    if (btnSubmit) btnSubmit.disabled = true;
  
    // ⬆️ Upload automático ao escolher ficheiro
    ficheiroInput.addEventListener('change', async function () {
      const ficheiro = ficheiroInput.files[0];
      if (!ficheiro) return;
  
      status.textContent = "A enviar ficheiro...";
      if (btnSubmit) btnSubmit.disabled = true;
  
      const reader = new FileReader();
  
      reader.onload = async function () {
        const base64 = reader.result.split(',')[1];
  
        const uploadFormData = new FormData();
        uploadFormData.append("base64", base64);
        uploadFormData.append("type", ficheiro.type);
        uploadFormData.append("name", ficheiro.name);
  
        try {
          const res = await fetch("https://script.google.com/macros/s/AKfycbwALvmtB1RzY3xKAlECemjWh91PxyDoARXiI9CU-7fdGezjuo25G2kX12yQuwZc-pJ-7A/exec", {
            method: "POST",
            body: uploadFormData
          });
  
          const link = await res.text();
  
          if (link.startsWith("http")) {
            linkHidden.value = link;
            status.innerHTML = `✅ <a href="${link}" target="_blank">Ficheiro carregado</a>`;
            if (btnSubmit) btnSubmit.disabled = false;
          } else {
            status.textContent = "❌ Erro ao carregar ficheiro: " + link;
          }
        } catch (erro) {
          status.textContent = "❌ Erro: " + erro.message;
        }
      };
  
      reader.readAsDataURL(ficheiro);
    });
  
    // 📤 Envio do formulário após upload
    form.addEventListener('submit', function (e) {
      // Verificação de segurança
      if (!linkHidden.value) {
        e.preventDefault();
        alert("Por favor aguarde o carregamento do ficheiro.");
        return;
      }
  
      // Envio automático como antes
      const formData = new FormData(form);
      formData.delete("ficheiro");
  
      e.preventDefault(); // Impede o envio padrão
      fetch("https://formsubmit.co/orcamentos@graficapt.com", {
        method: "POST",
        body: formData
      })
      .then(response => {
        if (response.ok) {
          alert("Pedido de orçamento enviado com sucesso! Iremos responder com a maior brevidade possível!");
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
  