const themeButton = document.getElementById("themeToggle");

if (themeButton) {

    const savedTheme = localStorage.getItem("heroTheme");

    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
        themeButton.textContent = "☀";
    }

    themeButton.addEventListener("click", () => {

        document.body.classList.toggle("light-mode");

        const isLight =
            document.body.classList.contains("light-mode");

        localStorage.setItem(
            "heroTheme",
            isLight ? "light" : "dark"
        );

        themeButton.textContent =
            isLight ? "☀" : "☾";
    });
}