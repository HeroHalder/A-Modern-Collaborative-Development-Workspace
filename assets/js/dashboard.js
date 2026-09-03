"use strict";


/*
|--------------------------------------------------------------------------
| HERO WORKSPACE
| Dashboard Controller
|--------------------------------------------------------------------------
*/


const API = {

    session:
        "../php/auth/session.php",

    projects:
        "../php/projects/list.php",

    create:
        "../php/projects/create.php",

    delete:
        "../php/projects/delete.php",

    logout:
        "../php/auth/logout.php"

};


const state = {

    user: null,

    projects: [],

    loading: false

};


/*
|--------------------------------------------------------------------------
| DOM Helper
|--------------------------------------------------------------------------
*/

function $(selector) {

    return document.querySelector(selector);

}


/*
|--------------------------------------------------------------------------
| INITIALIZE
|--------------------------------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeDashboard();

    }
);


async function initializeDashboard() {

    bindEvents();

    await loadUser();

    await loadProjects();

}


/*
|--------------------------------------------------------------------------
| EVENTS
|--------------------------------------------------------------------------
*/

function bindEvents() {


    /* Create Project */

    const createButton =
        $("#createProjectBtn");


    if (createButton) {

        createButton.addEventListener(
            "click",
            openProjectModal
        );

    }


    const newProjectButton =
        $("#newProjectBtn");


    if (newProjectButton) {

        newProjectButton.addEventListener(
            "click",
            openProjectModal
        );

    }


    /* Create Form */

    const form =
        $("#createProjectForm");


    if (form) {

        form.addEventListener(
            "submit",
            handleCreateProject
        );

    }


    /* Cancel */

    const cancelButton =
        $("#cancelCreateProject");


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeProjectModal
        );

    }


    /* Logout */

    const logoutButton =
        $("#logoutBtn");


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            handleLogout
        );

    }


    /* Close modal by clicking outside */

    const modal =
        $("#createProjectModal");


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeProjectModal();

                }

            }
        );

    }

}


/*
|--------------------------------------------------------------------------
| LOAD USER
|--------------------------------------------------------------------------
*/

async function loadUser() {

    try {

        const response =
            await fetch(
                API.session,
                {
                    credentials: "include"
                }
            );


        const result =
            await response.json();


        if (!result.success) {

            window.location.href =
                "login.html";

            return false;

        }


        state.user =
            result.data;


        updateUserUI();


        return true;

    } catch (error) {

        console.error(
            "Session error:",
            error
        );


        window.location.href =
            "login.html";


        return false;

    }

}


/*
|--------------------------------------------------------------------------
| USER UI
|--------------------------------------------------------------------------
*/

function updateUserUI() {

    if (!state.user) {

        return;

    }


    const name =
        state.user.name ||
        "User";


    const email =
        state.user.email ||
        "";


    const initial =
        name
            .charAt(0)
            .toUpperCase();


    const nameElement =
        $("#userName");


    if (nameElement) {

        nameElement.textContent =
            name;

    }


    const emailElement =
        $("#userEmail");


    if (emailElement) {

        emailElement.textContent =
            email;

    }


    const welcomeElement =
        $("#welcomeName");


    if (welcomeElement) {

        welcomeElement.textContent =
            name;

    }


    const avatar =
        $("#userAvatar");


    if (avatar) {

        avatar.textContent =
            initial;

    }

}


/*
|--------------------------------------------------------------------------
| LOAD PROJECTS
|--------------------------------------------------------------------------
*/

async function loadProjects() {

    const container =
        $("#projectsContainer");


    if (!container) {

        return;

    }


    state.loading = true;


    container.innerHTML = `

        <div class="project-loading">

            Loading projects...

        </div>

    `;


    try {

        const response =
            await fetch(
                API.projects,
                {
                    credentials: "include"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to load projects."
            );

        }


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to load projects."
            );

        }


        state.projects =
            Array.isArray(result.data)
                ? result.data
                : [];


        renderProjects();

        updateProjectCount();


    } catch (error) {

        console.error(
            "Project loading error:",
            error
        );


        container.innerHTML = `

            <div class="project-empty">

                <h3>
                    Unable to load projects
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

                <button
                    type="button"
                    class="primary-btn"
                    id="retryProjectsBtn"
                >
                    Try Again
                </button>

            </div>

        `;


        const retry =
            $("#retryProjectsBtn");


        if (retry) {

            retry.addEventListener(
                "click",
                loadProjects
            );

        }

    } finally {

        state.loading = false;

    }

}


/*
|--------------------------------------------------------------------------
| RENDER PROJECTS
|--------------------------------------------------------------------------
*/

function renderProjects() {

    const container =
        $("#projectsContainer");


    if (!container) {

        return;

    }


    container.innerHTML = "";


    /*
    |--------------------------------------------------------------------------
    | Empty
    |--------------------------------------------------------------------------
    */

    if (
        state.projects.length === 0
    ) {

        container.innerHTML = `

            <div class="project-empty">

                <div class="empty-project-icon">
                    +
                </div>

                <h3>
                    No projects yet
                </h3>

                <p>
                    Create your first project
                    to start coding.
                </p>

                <button
                    type="button"
                    class="primary-btn"
                    id="emptyCreateBtn"
                >
                    Create Project
                </button>

            </div>

        `;


        const button =
            $("#emptyCreateBtn");


        if (button) {

            button.addEventListener(
                "click",
                openProjectModal
            );

        }


        return;

    }


    /*
    |--------------------------------------------------------------------------
    | Project Cards
    |--------------------------------------------------------------------------
    */

    state.projects.forEach(
        project => {

            const card =
                createProjectCard(
                    project
                );


            container.appendChild(
                card
            );

        }
    );

}


/*
|--------------------------------------------------------------------------
| CREATE PROJECT CARD
|--------------------------------------------------------------------------
*/

function createProjectCard(
    project
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "project-card";


    const language =
        formatLanguage(
            project.language
        );


    const date =
        formatDate(
            project.updated_at ||
            project.created_at
        );


    card.innerHTML = `

        <div class="project-card-top">

            <div class="project-language-icon">

                ${getLanguageShortName(
                    project.language
                )}

            </div>


            <span class="project-language">

                ${escapeHTML(
                    language
                )}

            </span>

        </div>


        <div class="project-card-content">

            <h3>

                ${escapeHTML(
                    project.name
                )}

            </h3>


            <p>

                ${escapeHTML(
                    project.description ||
                    "No description provided."
                )}

            </p>

        </div>


        <div class="project-card-bottom">

            <span class="project-date">

                Updated ${date}

            </span>


            <div class="project-actions">

                <button
                    type="button"
                    class="open-project-btn"
                >
                    Open
                </button>


                <button
                    type="button"
                    class="delete-project-btn"
                >
                    Delete
                </button>

            </div>

        </div>

    `;


    /*
    |--------------------------------------------------------------------------
    | Open
    |--------------------------------------------------------------------------
    */

    const openButton =
        card.querySelector(
            ".open-project-btn"
        );


    openButton.addEventListener(
        "click",
        () => {

            openWorkspace(
                project.id
            );

        }
    );


    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    const deleteButton =
        card.querySelector(
            ".delete-project-btn"
        );


    deleteButton.addEventListener(
        "click",
        () => {

            deleteProject(
                project
            );

        }
    );


    return card;

}


/*
|--------------------------------------------------------------------------
| OPEN WORKSPACE
|--------------------------------------------------------------------------
*/

function openWorkspace(
    projectId
) {

    if (!projectId) {

        return;

    }


    localStorage.setItem(
        "hero_workspace_project_id",
        String(projectId)
    );


    window.location.href =
        `workspace.html?project_id=${encodeURIComponent(
            projectId
        )}`;

}


/*
|--------------------------------------------------------------------------
| OPEN CREATE MODAL
|--------------------------------------------------------------------------
*/

function openProjectModal() {

    const modal =
        $("#createProjectModal");


    if (!modal) {

        console.error(
            "Create project modal not found."
        );

        return;

    }


    modal.style.display =
        "flex";


    requestAnimationFrame(
        () => {

            modal.classList.add(
                "active"
            );

        }
    );


    const form =
        $("#createProjectForm");


    if (form) {

        form.reset();

    }


    const nameInput =
        $("#projectName");


    if (nameInput) {

        setTimeout(
            () => {

                nameInput.focus();

            },
            100
        );

    }

}


/*
|--------------------------------------------------------------------------
| CLOSE MODAL
|--------------------------------------------------------------------------
*/

function closeProjectModal() {

    const modal =
        $("#createProjectModal");


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "active"
    );


    setTimeout(
        () => {

            modal.style.display =
                "none";

        },
        150
    );

}


/*
|--------------------------------------------------------------------------
| CREATE PROJECT
|--------------------------------------------------------------------------
*/

async function handleCreateProject(
    event
) {

    event.preventDefault();


    const nameInput =
        $("#projectName");


    const descriptionInput =
        $("#projectDescription");


    const languageInput =
        $("#projectLanguage");


    const name =
        nameInput
            ? nameInput.value.trim()
            : "";


    const description =
        descriptionInput
            ? descriptionInput.value.trim()
            : "";


    const language =
        languageInput
            ? languageInput.value
            : "javascript";


    if (!name) {

        alert(
            "Please enter a project name."
        );

        return;

    }


    const submitButton =
        event.target.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Creating...";

    }


    try {

        const response =
            await fetch(
                API.create,
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

                            name:
                                name,

                            description:
                                description,

                            language:
                                language

                        })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Project creation failed."
            );

        }


        if (!result.success) {

            throw new Error(
                result.message ||
                "Project creation failed."
            );

        }


        const project =
            result.data;


        closeProjectModal();


        /*
        |--------------------------------------------------------------------------
        | Reload projects
        |--------------------------------------------------------------------------
        */

        await loadProjects();

        updateProjectCount();


        /*
        |--------------------------------------------------------------------------
        | Open newly created project
        |--------------------------------------------------------------------------
        */

        if (
            project &&
            project.id
        ) {

            openWorkspace(
                project.id
            );

        }


    } catch (error) {

        console.error(
            "Create project error:",
            error
        );


        alert(
            error.message ||
            "Unable to create project."
        );

    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Create Project";

        }

    }

}


/*
|--------------------------------------------------------------------------
| DELETE PROJECT
|--------------------------------------------------------------------------
*/

async function deleteProject(
    project
) {

    if (!project) {

        return;

    }


    const confirmed =
        confirm(
            `Are you sure you want to delete "${project.name}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                API.delete,
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

                            project_id:
                                project.id

                        })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Delete failed."
            );

        }


        if (!result.success) {

            throw new Error(
                result.message ||
                "Delete failed."
            );

        }


        await loadProjects();


        updateProjectCount();


    } catch (error) {

        console.error(
            "Delete project error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete project."
        );

    }

}


/*
|--------------------------------------------------------------------------
| UPDATE PROJECT COUNT
|--------------------------------------------------------------------------
*/

function updateProjectCount() {

    const countElement =
        $("#projectCount");


    if (countElement) {

        countElement.textContent =
            state.projects.length;

    }

}


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

async function handleLogout(
    event
) {

    if (event) {

        event.preventDefault();

    }


    try {

        await fetch(
            API.logout,
            {

                method: "POST",

                credentials:
                    "include"

            }
        );

    } catch (error) {

        console.error(
            error
        );

    }


    localStorage.removeItem(
        "hero_workspace_project_id"
    );


    window.location.href =
        "login.html";

}


/*
|--------------------------------------------------------------------------
| LANGUAGE FORMAT
|--------------------------------------------------------------------------
*/

function formatLanguage(
    language
) {

    const languages = {

        javascript:
            "JavaScript",

        python:
            "Python",

        cpp:
            "C++",

        php:
            "PHP"

    };


    return (
        languages[language] ||
        language ||
        "Unknown"
    );

}


/*
|--------------------------------------------------------------------------
| LANGUAGE SHORT NAME
|--------------------------------------------------------------------------
*/

function getLanguageShortName(
    language
) {

    const names = {

        javascript:
            "JS",

        python:
            "PY",

        cpp:
            "C++",

        php:
            "PHP"

    };


    return (
        names[language] ||
        "CODE"
    );

}


/*
|--------------------------------------------------------------------------
| DATE FORMAT
|--------------------------------------------------------------------------
*/

function formatDate(
    date
) {

    if (!date) {

        return "recently";

    }


    const parsed =
        new Date(date);


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return "recently";

    }


    return parsed.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );

}


/*
|--------------------------------------------------------------------------
| HTML ESCAPE
|--------------------------------------------------------------------------
*/

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
    .replaceAll(
        "&",
        "&amp;"
    )
    .replaceAll(
        "<",
        "&lt;"
    )
    .replaceAll(
        ">",
        "&gt;"
    )
    .replaceAll(
        '"',
        "&quot;"
    )
    .replaceAll(
        "'",
        "&#039;"
    );

}


/*
|--------------------------------------------------------------------------
| DEBUG
|--------------------------------------------------------------------------
*/

window.HeroWorkspaceDashboard = {

    state,

    loadProjects,

    openWorkspace

};