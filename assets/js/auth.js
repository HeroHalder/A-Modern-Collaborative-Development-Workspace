"use strict";


document.addEventListener(
    "DOMContentLoaded",
    function () {

        const loginForm =
            document.getElementById(
                "loginForm"
            );


        if (loginForm) {

            setupLogin(
                loginForm
            );

            return;

        }


        const registerForm =
            document.querySelector(
                "form"
            );


        if (registerForm) {

            setupRegister(
                registerForm
            );

        }

    }
);



/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

function setupLogin(form) {

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            try {

                const response =
                    await fetch(
                        "../php/auth/login.php",
                        {

                            method: "POST",

                            credentials:
                                "include",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    email,

                                    password

                                })

                        }
                    );


                const result =
                    await response.json();


                if (!result.success) {

                    alert(
                        result.message
                    );

                    return;

                }


                window.location.href =
                    "dashboard.html";


            } catch (error) {

                console.error(error);

                alert(
                    "Unable to connect to server."
                );

            }

        }
    );

}



/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

function setupRegister(form) {

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const inputs =
                form.querySelectorAll(
                    "input"
                );


            const name =
                inputs[0]
                    .value
                    .trim();


            const email =
                inputs[1]
                    .value
                    .trim();


            const password =
                inputs[2]
                    .value;


            const confirmPassword =
                inputs[3]
                    .value;


            if (
                password !==
                confirmPassword
            ) {

                alert(
                    "Passwords do not match."
                );

                return;

            }


            try {

                const response =
                    await fetch(
                        "../php/auth/register.php",
                        {

                            method: "POST",

                            credentials:
                                "include",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    name,

                                    email,

                                    password

                                })

                        }
                    );


                const result =
                    await response.json();


                if (!result.success) {

                    alert(
                        result.message
                    );

                    return;

                }


                window.location.href =
                    "dashboard.html";


            } catch (error) {

                console.error(error);

                alert(
                    "Unable to connect to server."
                );

            }

        }
    );

}