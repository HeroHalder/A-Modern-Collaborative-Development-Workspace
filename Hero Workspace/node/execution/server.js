"use strict";

const express =
    require("express");

const cors =
    require("cors");

const {
    executeCode
} =
    require("./executor");


const app =
    express();


const PORT =
    3001;


app.use(
    cors()
);


app.use(
    express.json({
        limit: "100kb"
    })
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
    "/",
    (req, res) => {

        res.json({

            success: true,

            service:
                "Hero Workspace Execution Engine",

            status:
                "online",

            version:
                "1.0.0"

        });

    }
);


/* =========================================================
   EXECUTE
========================================================= */

app.post(
    "/execute",
    async (req, res) => {

        try {

            const {
                language,
                code
            } = req.body;


            if (
                !language ||
                typeof language !== "string"
            ) {

                return res.status(400)
                    .json({

                        success: false,

                        message:
                            "Language is required."

                    });

            }


            if (
                typeof code !== "string"
            ) {

                return res.status(400)
                    .json({

                        success: false,

                        message:
                            "Source code is required."

                    });

            }


            if (
                code.length > 50000
            ) {

                return res.status(413)
                    .json({

                        success: false,

                        message:
                            "Source code is too large."

                    });

            }


            const result =
                await executeCode(
                    language,
                    code
                );


            res.json(
                result
            );


        } catch (error) {

            console.error(
                error
            );


            res.status(500)
                .json({

                    success: false,

                    status: "failed",

                    output: "",

                    error:
                        "Execution engine error."

                });

        }

    }
);


/* =========================================================
   SERVER
========================================================= */

app.listen(
    PORT,
    () => {

        console.log(
            "========================================"
        );

        console.log(
            " Hero Workspace Execution Engine"
        );

        console.log(
            "========================================"
        );

        console.log(
            `Server: http://localhost:${PORT}`
        );

        console.log(
            "Status: ONLINE"
        );

        console.log(
            "========================================"
        );

    }
);