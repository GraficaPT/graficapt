document.addEventListener("DOMContentLoaded", () => {
  const ficheiroInput = document.getElementById('ficheiro');
  const linkHidden = document.getElementById('link_ficheiro');

  ficheiroInput.addEventListener('change', function () {
    const ficheiro = ficheiroInput.files[0];
    if (!ficheiro) return;

    const extensao = ficheiro.name.split('.').pop();
    const random = Math.floor(Math.random() * 10000);
    const nomeAleatorio = `logotipo_${random}.${extensao}`;
    const reader = new FileReader();

    reader.onload = async function () {
      const base64 = reader.result.split(',')[1];

      const formData = new FormData();
      formData.append("base64", base64);
      formData.append("type", ficheiro.type);
      formData.append("name", nomeAleatorio);

      try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbze3L1NAp89zQsRXpC1e8Vw8527yuwPIqv7oSx-3RWI3oaNKCT8ldYPkoazegH4mzZgEQ/exec", {
          method: "POST",
          body: formData
        });

        const result = await response.text();
        console.log("📁 ", result);
        if (linkHidden) {
          linkHidden.value = result;
        }
    

      } catch (erro) {
        console.error("❌ Erro ao enviar ficheiro:", erro.message);
      }
    };

    reader.readAsDataURL(ficheiro);
  });
});
