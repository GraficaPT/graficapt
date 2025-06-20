document.addEventListener("DOMContentLoaded", () => {
  const ficheiroInput = document.getElementById('ficheiro');

  ficheiroInput.addEventListener('change', function () {
    const ficheiro = ficheiroInput.files[0];
    if (!ficheiro) return;

    const reader = new FileReader();

    reader.onload = async function () {
      const base64 = reader.result.split(',')[1];

      const formData = new FormData();
      formData.append("base64", base64);
      formData.append("type", ficheiro.type);
      formData.append("name", ficheiro.name);

      try {
        await fetch("https://script.google.com/macros/s/AKfycbyIEbcsFJvpM5GPico5d2g_CXpHD1OzkTDaSeWj37n_N5lzxc7xagVQfdRqAHSFCtmD2g/exec", {
          method: "POST",
          body: formData
        });

        // Resultado ignorado intencionalmente

      } catch (erro) {
        console.error("Erro ao enviar ficheiro:", erro.message);
      }
    };

    reader.readAsDataURL(ficheiro);
  });
});
