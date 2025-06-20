document.addEventListener("DOMContentLoaded", () => {
  const ficheiroInput = document.getElementById('ficheiro');
  const linkHidden = document.getElementById('link_ficheiro');
  const status = document.getElementById('uploadStatus');

  ficheiroInput.addEventListener('change', async function () {
    const ficheiro = ficheiroInput.files[0];
    if (!ficheiro) return;

    if (status) status.textContent = "A enviar ficheiro...";

    const reader = new FileReader();

    reader.onload = async function () {
      const base64 = reader.result.split(',')[1];

      const formData = new FormData();
      formData.append("base64", base64);
      formData.append("type", ficheiro.type);
      formData.append("name", ficheiro.name);

      try {
        const res = await fetch("https://script.google.com/macros/s/AKfycbwALvmtB1RzY3xKAlECemjWh91PxyDoARXiI9CU-7fdGezjuo25G2kX12yQuwZc-pJ-7A/exec", {
          method: "POST",
          body: formData
        });

        const link = await res.text();

        if (link.startsWith("http")) {
          linkHidden.value = link;
          if (status) status.innerHTML = `✅ <a href="${link}" target="_blank">Ficheiro carregado</a>`;
          
          ficheiroInput.style.display = "none";
          ficheiroInput.disabled = true;

        } else {
          if (status) status.textContent = "❌ Erro ao carregar: " + link;
        }
      } catch (erro) {
        if (status) status.textContent = "❌ Erro: " + erro.message;
      }
    };

    reader.readAsDataURL(ficheiro);
  });
});
