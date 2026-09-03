"use strict";

const {
    spawn,
    execFile
} = require("child_process");

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const languages = require("./languages");


const TIMEOUT = 5000;


function executeCode(
    language,
    code
) {

    return new Promise(
        (resolve) => {

            if (
                !languages[language]
            ) {

                return resolve({

                    success: false,

                    status: "failed",

                    output: "",

                    error:
                        `Unsupported language: ${language}`

                });

            }


            const jobId =
                crypto.randomUUID();


            const tempDirectory =
                fs.mkdtempSync(
                    path.join(
                        os.tmpdir(),
                        "hero-workspace-"
                    )
                );


            let sourceFile;


            if (language === "python") {

                sourceFile =
                    path.join(
                        tempDirectory,
                        `${jobId}.py`
                    );

            }

            else if (language === "javascript") {

                sourceFile =
                    path.join(
                        tempDirectory,
                        `${jobId}.js`
                    );

            }

            else if (language === "cpp") {

                sourceFile =
                    path.join(
                        tempDirectory,
                        `${jobId}.cpp`
                    );

            }


            fs.writeFileSync(
                sourceFile,
                code,
                "utf8"
            );


            if (
                language === "cpp"
            ) {

                compileCpp(
                    sourceFile,
                    tempDirectory,
                    resolve
                );

                return;

            }


            runProcess(
                language,
                sourceFile,
                resolve
            );

        }
    );

}


/* =========================================================
   C++
========================================================= */

function compileCpp(
    sourceFile,
    directory,
    resolve
) {

    const executable =
        path.join(
            directory,
            "program.exe"
        );


    execFile(
        "g++",
        [
            sourceFile,
            "-o",
            executable
        ],
        {
            timeout: TIMEOUT
        },
        (
            error,
            stdout,
            stderr
        ) => {

            if (error) {

                cleanup(
                    directory
                );


                resolve({

                    success: false,

                    status: "failed",

                    output:
                        stdout || "",

                    error:
                        stderr ||
                        error.message

                });

                return;

            }


            runExecutable(
                executable,
                directory,
                resolve
            );

        }
    );

}


/* =========================================================
   RUN EXECUTABLE
========================================================= */

function runExecutable(
    executable,
    directory,
    resolve
) {

    runCommand(
        executable,
        [],
        directory,
        resolve
    );

}


/* =========================================================
   PYTHON / JAVASCRIPT
========================================================= */

function runProcess(
    language,
    sourceFile,
    resolve
) {

    const command =
        languages[language].command;


    runCommand(
        command,
        [sourceFile],
        path.dirname(sourceFile),
        resolve
    );

}


/* =========================================================
   GENERIC PROCESS
========================================================= */

function runCommand(
    command,
    args,
    cwd,
    resolve
) {

    const start =
        process.hrtime.bigint();


    const child =
        spawn(
            command,
            args,
            {
                cwd,
                windowsHide: true
            }
        );


    let stdout = "";
    let stderr = "";
    let finished = false;


    const timer =
        setTimeout(
            () => {

                if (finished) {
                    return;
                }


                finished = true;


                child.kill(
                    "SIGTERM"
                );


                resolve({

                    success: false,

                    status: "timeout",

                    output:
                        stdout,

                    error:
                        "Execution timed out after 5 seconds."

                });

            },
            TIMEOUT
        );


    child.stdout.on(
        "data",
        data => {

            stdout +=
                data.toString();

        }
    );


    child.stderr.on(
        "data",
        data => {

            stderr +=
                data.toString();

        }
    );


    child.on(
        "error",
        error => {

            if (finished) {
                return;
            }


            finished = true;

            clearTimeout(
                timer
            );


            cleanup(
                cwd
            );


            resolve({

                success: false,

                status: "failed",

                output:
                    stdout,

                error:
                    error.message

            });

        }
    );


    child.on(
        "close",
        code => {

            if (finished) {
                return;
            }


            finished = true;

            clearTimeout(
                timer
            );


            const end =
                process.hrtime.bigint();


            const executionTime =
                Number(
                    end - start
                ) / 1e6;


            cleanup(
                cwd
            );


            resolve({

                success:
                    code === 0,

                status:
                    code === 0
                        ? "success"
                        : "failed",

                output:
                    stdout,

                error:
                    stderr,

                execution_time:
                    executionTime

            });

        }
    );

}


/* =========================================================
   CLEANUP
========================================================= */

function cleanup(
    directory
) {

    try {

        fs.rmSync(
            directory,
            {
                recursive: true,
                force: true
            }
        );

    } catch (error) {

        console.error(
            "Cleanup error:",
            error.message
        );

    }

}


module.exports = {
    executeCode
};