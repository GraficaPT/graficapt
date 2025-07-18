const topbarHTML = `
    <div class="bar">
        <img src="../imagens/social/logo_minimal.svg" onclick="location.href = 'index.html'">
        <div class="tabs desktop-only">
            <a href="index.html#filter=rigidos">Suportes Rigídos</a>
            <a href="index.html#filter=bandeiras">Bandeiras Publicitárias</a>
            <a href="index.html#filter=sacos">Sacos</a>
            <a href="index.html#filter=vestuario">Vestuário</a>
            <a href="index.html#filter=all">Ver Tudo</a>
        </div>
        <div class="hamburger mobile-only" onclick="toggleSidebar()">☰</div>
    </div>

    <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <img src="../imagens/social/logo_minimal.svg" class="sidebar-logo" onclick="location.href = 'index.html'">
        </div>
        <a href="index.html#filter=Rigidos">Suportes Rigídos</a>
        <a href="index.html#filter=Bandeiras">Bandeiras Publicitárias</a>
        <a href="index.html#filter=Sacos">Sacos</a>
        <a href="index.html#filter=Vestuario">Vestuário</a>
        <a href="index.html#filter=all">Ver Tudo</a>
    </div>
    <div class="overlay" id="overlay" onclick="toggleSidebar()"></div>
`;


const footerHTML = ` 
        <div class="footer-columns">
            <div class="footer-column">
                <h4>Ajuda</h4>
                <a>comercial@graficapt.com</a>
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
                <a href="index.html#filter=all"">Todos os produtos</a>
                <a href="index.html#filter=Bandeiras">Bandeiras</a>
                <a href="index.html#filter=Sacos">Sacos</a>
            </div>
            <div class="footer-column">
                <h4>Subscreve a nossa newsletter</h4>
                <form class="newsletter-form">
                    <input type="email" placeholder="O teu email">
                    <button type="submit">Subscrever</button>
                </form>
                <div class="social-icons hcenter">
                    <img href="https://www.facebook.com/profile.php?id=61564124441415" src="../imagens/social/facebook.svg" alt="Facebook">
                    <img href="https://www.instagram.com/graficapt/" src="../imagens/social/instagram.svg" alt="Instagram">
                    <img href="https://wa.me/351969205741" src="../imagens/social/whatsapp.svg" alt="WhatsApp">
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
