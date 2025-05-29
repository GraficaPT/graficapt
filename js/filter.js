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
            gridSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    shouldScrollToProducts = false;
}

window.addEventListener("hashchange", applyFilters);

document.addEventListener("DOMContentLoaded", () => {
    // Apply filters initially
    applyFilters();

    // Handle select dropdown
    const filterDropdown = document.getElementById("filterCategory");
    if (filterDropdown) {
        filterDropdown.addEventListener("change", function () {
            shouldScrollToProducts = false;
            const newHash = "#filter=" + this.value;
            if (window.location.hash !== newHash) {
                location.hash = newHash;
            } else {
                applyFilters(); // trigger manually
            }
        });
    }

    document.addEventListener("load", () => {
        // Verifica se veio com hash de filtro (ex: index.html#filter=something)
        if (window.location.hash.startsWith("#filter=")) {
            shouldScrollToProducts = true;
        }
    
        // Aplica filtros (e faz scroll se necessário)
        applyFilters();
    
        // Handle select dropdown
        const filterDropdown = document.getElementById("filterCategory");
        if (filterDropdown) {
            filterDropdown.addEventListener("change", function () {
                shouldScrollToProducts = true;
                const newHash = "#filter=" + this.value;
                if (window.location.hash !== newHash) {
                    location.hash = newHash;
                } else {
                    applyFilters(); // trigger manually
                }
            });
        }
    
        // Handle topbar links
        document.querySelectorAll('a[href^="#filter="]').forEach(link => {
            link.addEventListener("click", (e) => {
                const href = link.getAttribute("href");
                shouldScrollToProducts = true;
                if (window.location.hash !== href) {
                    window.location.hash = href;
                } else {
                    applyFilters(); // force reapply with scroll
                }
            });
        });
    });
});
 