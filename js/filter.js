let shouldScrollToProducts = false;

function applyFilters() {
    const hash = window.location.hash;
    const filter = hash.startsWith("#filter=") ? hash.replace("#filter=", "") : "all";
    const sort = document.getElementById("sortBy")?.value || "default";

    const dropdown = document.getElementById("filterCategory");
    if (dropdown) dropdown.value = filter;

    const grid = document.querySelector(".products-grid");
    const cells = Array.from(grid.querySelectorAll(".cell"));

    // Filter
    cells.forEach(cell => {
        const categoria = cell.dataset.categoria;
        const show = (filter === "all" || categoria === filter);
        cell.style.display = show ? "flex" : "none";
    });

    // Sort
    if (sort !== "default") {
        const visibleCells = cells.filter(cell => cell.style.display !== "none");
        visibleCells.sort((a, b) => {
            const aName = a.dataset.nome.toLowerCase();
            const bName = b.dataset.nome.toLowerCase();
            return sort === "az" ? aName.localeCompare(bName) : bName.localeCompare(aName);
        });
        visibleCells.forEach(cell => grid.appendChild(cell));
    }

    // Scroll
    if (shouldScrollToProducts) {
        const gridSection = document.getElementById("products");
        if (gridSection) {
            setTimeout(() => {
                gridSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100); // espera para garantir renderização completa
        }
    }

    shouldScrollToProducts = false;
}

window.addEventListener("hashchange", applyFilters);

document.addEventListener("DOMContentLoaded", () => {
    // Detecta se a URL já veio com um filtro (ex: index.html#filter=abc)
    if (window.location.hash.startsWith("#filter=")) {
        shouldScrollToProducts = true;
    }

    // Aguarda o carregamento completo antes de aplicar filtros e scroll
    window.requestAnimationFrame(() => {
        setTimeout(() => {
            applyFilters();
        }, 50); // aguarda um pouco para garantir que DOM está pronto
    });

    // Dropdown
    const filterDropdown = document.getElementById("filterCategory");
    if (filterDropdown) {
        filterDropdown.addEventListener("change", function () {
            shouldScrollToProducts = true;
            const newHash = "#filter=" + this.value;
            if (window.location.hash !== newHash) {
                location.hash = newHash;
            } else {
                applyFilters();
            }
        });
    }

    // Topbar filter links
    document.querySelectorAll('a[href^="#filter="]').forEach(link => {
        link.addEventListener("click", (e) => {
            shouldScrollToProducts = true;
            const href = link.getAttribute("href");
            if (window.location.hash !== href) {
                window.location.hash = href;
            } else {
                applyFilters();
            }
        });
    });
});
