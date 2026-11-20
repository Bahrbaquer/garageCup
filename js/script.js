const menuToggle = document.querySelector(".menuToggle");
const mobileMenu = document.querySelector("#mobileMenu");

if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        menuToggle.setAttribute("aria-expanded", String(!isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
        mobileMenu.classList.toggle("isOpen", !isOpen);
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");
            mobileMenu.classList.remove("isOpen");
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");
            mobileMenu.classList.remove("isOpen");
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation menu");
            mobileMenu.classList.remove("isOpen");
        }
    });
}