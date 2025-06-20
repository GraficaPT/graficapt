document.addEventListener("DOMContentLoaded", () => {
  const ficheiroInput = document.getElementById('ficheiro');
  const linkHidden = document.getElementById('link_ficheiro');
  const status = document.getElementById('uploadStatus');

  ficheiroInput.addEventListener('change', function () {
    const ficheiro = ficheiroInput.files[0];
    if (!ficheiro) return;

    // Simulação: troca por um valor genérico qualquer
    const textoFake = "https://exemplo.com/ficheiro-enviado";

    linkHidden.value = textoFake;
    if (status) status.innerHTML = `✅ Link atribuído: <a href="${textoFake}" target="_blank">${textoFake}</a>`;
  });
});
