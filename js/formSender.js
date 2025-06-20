document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('orcamentoForm');
  
    form.addEventListener('submit', function (e) {
      e.preventDefault(); // Impede envio imediato
  
      const ficheiroInput = document.getElementById('ficheiro');
      const linkHidden = document.getElementById('link_ficheiro');
  
      // 🚫 Garante que o link foi gerado
      if (!linkHidden.value || !linkHidden.value.startsWith("http")) {
        alert("Por favor aguarde o carregamento do ficheiro.");
        return;
      }
  
      // ✅ Criar FormData e remover o input file
      const formData = new FormData(form);
      formData.delete("ficheiro"); // mesmo que não tenha name, é precaução
  
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
  