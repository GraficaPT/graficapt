function inicializarForm() {
  const form = document.getElementById('orcamentoForm');
  const ficheiroInput = document.getElementById('ficheiro'); // Pode não existir
  const linkHidden = document.getElementById('link_ficheiro'); // Pode não existir
  const status = document.getElementById('uploadStatus'); // Pode não existir
  const btnSubmit = document.getElementById('submit');

  let ficheiroEmUpload = false;

  // 🔹 SUBMISSÃO DO FORMULÁRIO
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Se existir upload e ainda estiver a ser carregado
    if (ficheiroInput && ficheiroEmUpload) {
      alert("Por favor aguarde o carregamento do ficheiro.");
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.style.backgroundColor = '#191919';

    const formData = new FormData(form);
    fetch(
      "https://script.google.com/macros/s/AKfycbyZo3TNBoxKVHGgP_J1rKX1C3fEcD79i7VyUpMHV9J7gjJlmHQrD3Cm0l_i5fMllJnH/exec",
      { method: "POST", body: formData }
    )
    .then(response => {
      if (response.ok) {
        alert("Pedido de orçamento enviado com sucesso!\nIremos contactá-lo em breve.");
        window.location.href = "https://graficapt.com";
      } else {
        throw new Error("Erro ao enviar formulário");
      }
    })
    .catch(error => {
      alert("Erro ao enviar: " + error.message);
      btnSubmit.disabled = false;
      btnSubmit.style.backgroundColor = '';
    });
  });

  // 🔹 UPLOAD (só corre se existir campo de ficheiro)
  if (ficheiroInput && linkHidden && status) {
    ficheiroInput.addEventListener('change', function () {
      const ficheiro = ficheiroInput.files[0];
      if (!ficheiro) return;

      ficheiroEmUpload = true;
      status.style.display = 'block';
      status.textContent = "A enviar ficheiro...";
      ficheiroInput.style.display = 'none';
      btnSubmit.disabled = true;
      btnSubmit.style.backgroundColor = '#191919';

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        const formData = new FormData();
        formData.append("base64", base64);
        formData.append("type", ficheiro.type);
        formData.append("name", ficheiro.name);

        try {
          const response = await fetch(
            "https://script.google.com/macros/s/AKfycbze3L1NAp89zQsRXpC1e8Vw8527yuwPIqv7oSx-3RWI3oaNKCT8ldYPkoazegH4mzZgEQ/exec",
            { method: "POST", body: formData }
          );
          const result = await response.text();
          if (result.startsWith("http")) {
            linkHidden.value = result;
            ficheiroEmUpload = false;
            status.innerHTML = `✅ <a href="${result}" target="_blank">Ficheiro carregado</a>`;
            btnSubmit.disabled = false;
            ficheiroInput.style.display = 'block';
          } else {
            throw new Error("Resposta inesperada: " + result);
          }
        } catch (erro) {
          status.textContent = "❌ Erro: " + erro.message;
          ficheiroInput.style.display = 'block';
        }
      };
      reader.readAsDataURL(ficheiro);
    });
  }
}

document.addEventListener("DOMContentLoaded", inicializarForm);
