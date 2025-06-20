document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('orcamentoForm');
    const ficheiroInput = document.getElementById('ficheiro'); // input type="file" (sem name!)
    const linkHidden = document.getElementById('link_ficheiro'); // input type="hidden" com name="link_ficheiro"
  
    form.addEventListener('submit', async function (e) {
      e.preventDefault(); // Impede envio imediato
  
      // Se houver ficheiro para enviar primeiro
      if (ficheiroInput && ficheiroInput.files.length > 0) {
        const ficheiro = ficheiroInput.files[0];
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
              enviarFormulario(); // envia agora com o link preenchido
            } else {
              alert("Erro ao enviar ficheiro: " + link);
            }
  
          } catch (erro) {
            alert("Erro ao carregar ficheiro: " + erro.message);
          }
        };
  
        reader.readAsDataURL(ficheiro);
      } else {
        enviarFormulario(); // não há ficheiro, envia já
      }
    });
  
    function enviarFormulario() {
      const formData = new FormData(form);
  
      // ⚠️ Remove o ficheiro real se por acaso tiver name definido (evita erro no FormSubmit)
      formData.delete("ficheiro");
  
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
    }
  });
  