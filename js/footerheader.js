const topbarHTML = `
        <div class="bar">
            <img src="../imagens/logo_minimal.svg" onclick="location.href = 'index.html'">
            <div class="tabs desktop-only">
                <a href="#filter=promo">Suportes Rigídos</a>
                <a href="#filter=promo">Bandeiras Publicitárias</a>
                <a href="#filter=promo">Sacos</a>
                <a href="#filter=promo">Vestuário</a>
                <a href="#filter=promo">Ver Tudo</a>
            </div>
            <div class="hamburger mobile-only" onclick="toggleSidebar()">☰</div>
        </div>

        <div class="sidebar" id="sidebar">
            <a href="#filter=rigidos">Suportes Rigídos</a>
            <a href="#filter=bandeiras">Bandeiras Publicitárias</a>
            <a href="#filter=sacos">Sacos</a>
            <a href="#filter=vestuario">Vestuário</a>
            <a href="#filter=all">Ver Tudo</a>
        </div>
        <div class="overlay" id="overlay" onclick="toggleSidebar()"></div>            
`;

const footerHTML = ` 
        <div class="footer-columns">
            <div class="footer-column">
                <h4>Ajuda</h4>
                <a>graficapt.comercial@gmail.com</a>
                <a href="https://www.instagram.com/graficapt/">@graficapt</a>
            </div>
            <div class="footer-column">
                <h4>Empresa</h4>
                <a href="aboutus.html">Sobre nós</a>
                <a href="#">Trabalha connosco</a>
                <a href="https://www.instagram.com/graficapt/">Segue-nos</a>
            </div>
            <div class="footer-column">
                <h4>Produtos</h4>
                <a href="https://graficapt.com/index.html">Todos os produtos</a>
                <a href="https://graficapt.com/index.html#filter=bandeiras">Bandeiras</a>
                <a href="https://graficapt.com/index.html#filter=sacos">Sacos</a>
            </div>
            <div class="footer-column">
                <h4>Subscreve a nossa newsletter</h4>
                <form class="newsletter-form">
                    <input type="email" placeholder="O teu email">
                    <button type="submit">Subscrever</button>
                </form>
                <div class="social-icons hcenter">
                    <img src="../imagens/facebook.svg" alt="Facebook">
                    <img src="../imagens/instagram.svg" alt="Instagram">
                    <img src="../imagens/whatsapp.svg" alt="WhatsApp">
                </div>
            </div>
        </div>
        <div class="footer-bottom">
            © 2025 GraficaPT. Todos os direitos reservados.
        </div>
`;

function insertComponents() {
    document.getElementById('topbar').innerHTML = topbarHTML;
    document.getElementById('footer').innerHTML = footerHTML;
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");
    const isOpen = sidebar.style.left === "0%";
    sidebar.style.left = isOpen ? "-100%" : "0%";
    overlay.style.display = isOpen ? "none" : "block";
}

document.addEventListener('DOMContentLoaded', insertComponents);
