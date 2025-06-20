document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('orcamentoForm');
    const ficheiroInput = document.getElementById('ficheiro');
    const linkHidden = document.getElementById('link_ficheiro');
  
    // 🟢 Upload do ficheiro para Google Drive
    ficheiroInput.addEventListener('change', function () {
      const ficheiro = ficheiroInput.files[0];
      if (!ficheiro) return;
  
      const reader = new FileReader();
  
      reader.onload = async function () {
        const base64 = reader.result.split(',')[1];
  
        const formData = new FormData();
        formData.append("base64", base64);
        formData.append("type", ficheiro.type);
        formData.append("name", ficheiro.name); // Nome original mantido
  
        try {
          const response = await fetch("https://script.google.com/macros/s/AKfycbze3L1NAp89zQsRXpC1e8Vw8527yuwPIqv7oSx-3RWI3oaNKCT8ldYPkoazegH4mzZgEQ/exec", {
            method: "POST",
            body: formData
          });
  
          const result = await response.text();
          console.log("📁 Link do ficheiro:", result);
  
          if (linkHidden) {
            linkHidden.value = result;
          }
        } catch (erro) {
          console.error("❌ Erro ao enviar ficheiro:", erro.message);
        }
      };
  
      reader.readAsDataURL(ficheiro);
    });
  
    // 📨 Envio do formulário para o FormSubmit
    form.addEventListener('submit', function (e) {
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
  