function applyFilters(scroll = false) {
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

    // Scroll to products section if requested
    if (scroll) {
        const gridSection = document.getElementById("products");
        if (gridSection) {
            setTimeout(() => {
                gridSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }
}

window.addEventListener("hashchange", () => applyFilters());

document.addEventListener("DOMContentLoaded", () => {
    const initialScroll = window.location.hash.startsWith("#filter=");
    applyFilters(initialScroll); // scroll only if hash present at load

    // Dropdown filter
    const filterDropdown = document.getElementById("filterCategory");
    if (filterDropdown) {
        filterDropdown.addEventListener("change", function () {
            const newHash = "#filter=" + this.value;
            if (window.location.hash !== newHash) {
                location.hash = newHash;
            } else {
                applyFilters(true); // force apply with scroll
            }
        });
    }

    // Topbar filter links
    document.querySelectorAll('a[href^="#filter="]').forEach(link => {
        link.addEventListener("click", (e) => {
            const href = link.getAttribute("href");
            if (window.location.hash !== href) {
                window.location.hash = href;
            } else {
                applyFilters(true); // force apply with scroll
            }
        });
    });
});