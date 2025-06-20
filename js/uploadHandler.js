document.addEventListener("DOMContentLoaded", () => {
  const ficheiroInput = document.getElementById('ficheiro');
  const linkHidden = document.getElementById('link_ficheiro');

  ficheiroInput.addEventListener('change', function () {
    const ficheiro = ficheiroInput.files[0];
    if (!ficheiro) return;

    // Gerar nome aleatório com prefixo e extensão original
    const extensao = ficheiro.name.split('.').pop();
    const random = Math.floor(Math.random() * 10000);
    const nomeAleatorio = `logotipo_${random}.${extensao}`;

    // Atualizar o valor do input hidden
    if (linkHidden) {
      linkHidden.value = nomeAleatorio;
    }

    const reader = new FileReader();

    reader.onload = async function () {
      const base64 = reader.result.split(',')[1];

      const formData = new FormData();
      formData.append("base64", base64);
      formData.append("type", ficheiro.type);
      formData.append("name", nomeAleatorio); // usa o nome aleatório aqui também

      try {
        await fetch("https://script.google.com/macros/s/AKfycbyIEbcsFJvpM5GPico5d2g_CXpHD1OzkTDaSeWj37n_N5lzxc7xagVQfdRqAHSFCtmD2g/exec", {
          method: "POST",
          body: formData
        });

        // Não faz mais nada com a resposta

      } catch (erro) {
        console.error("Erro ao enviar ficheiro:", erro.message);
      }
    };

    reader.readAsDataURL(ficheiro);
  });
});
