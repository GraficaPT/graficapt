document.addEventListener("DOMContentLoaded", () => {

  
const form = document.getElementById('orcamentoForm');
          
form.addEventListener('submit', function (e) {
    e.preventDefault(); // Impede envio imediato

    const formData = new FormData(form);

    fetch("https://formsubmit.co/orcamentos@graficapt.com", {
    method: "POST",
    body: formData
    })
    .then(response => {
    if (response.ok) {
        alert("Pedido de orçamento enviado com sucesso! Iremos responder com a maior breviedade possível!");
        window.location.href = "https://graficapt.com";
    } else {
        alert("Erro ao enviar. Tente novamente.");
    }
    })
    .catch(error => {
    alert("Erro ao enviar: " + error.message);
    });
})});