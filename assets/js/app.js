document.addEventListener("DOMContentLoaded", () => {

    console.log("Hero Workspace v1.0.0");

    const buttons =
        document.querySelectorAll(".primary-btn");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            console.log(
                "Hero Workspace navigation:"
                + " " +
                button.textContent.trim()
            );

        });

    });

});