/* ============================================
   Navbar
============================================ */

(function () {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

    document.querySelectorAll(".nav-links a")
        .forEach(link => {

            const page = link.dataset.page;

            if (
                (page === "jobs" &&
                    (currentPage.includes("job")
                    || currentPage.includes("upload")
                    || currentPage.includes("review")
                    || currentPage.includes("table")))
                ||

                (page === "schemas" &&
                    currentPage.includes("schema"))

                ||

                (page === "settings" &&
                    (currentPage.includes("setting")
                    || currentPage.includes("purchase")))
            ) {

                link.classList.add("active");

            }

        });

    const menuButton =
        document.getElementById("menuButton");

    const navLinks =
        document.getElementById("navLinks");

    if (menuButton && navLinks) {

        menuButton.addEventListener("click", () => {

            navLinks.classList.toggle("open");

            menuButton.textContent =
                navLinks.classList.contains("open")
                    ? "✕"
                    : "☰";

        });

        document.addEventListener("click", event => {

            if (
                !navLinks.contains(event.target) &&
                !menuButton.contains(event.target)
            ) {

                navLinks.classList.remove("open");

                menuButton.textContent = "☰";

            }

        });

    }

})();