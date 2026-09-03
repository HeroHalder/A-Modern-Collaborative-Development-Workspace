"use strict";

/*
|--------------------------------------------------------------------------
| HERO WORKSPACE
| Workspace Frontend Controller
|--------------------------------------------------------------------------
|
| Handles:
| - Current user
| - Project loading
| - File loading
| - File switching
| - Code editing
| - Save
| - New file
| - Delete file
| - Tabs
| - Bottom panels
| - Share link
| - Code execution
|
|--------------------------------------------------------------------------
*/


/* =========================================================
   API CONFIG
========================================================= */

const API = {

    session:
        "../php/auth/session.php",

    projects:
        "../php/projects/list.php",

    projectFiles:
        "../php/projects/files/list.php",

    getFile:
        "../php/projects/files/get.php",

    saveFile:
        "../php/projects/files/save.php",

    createFile:
        "../php/projects/files/create.php",

    deleteFile:
        "../php/projects/files/delete.php"

};


/* =========================================================
   NODE EXECUTION ENGINE
========================================================= */

const EXECUTION_ENGINE =
    "http://localhost:3001";


let executionController =
    null;

let executionRunning =
    false;


/* =========================================================
   APPLICATION STATE
========================================================= */

const state = {

    user: null,

    project: null,

    files: [],

    activeFile: null,

    isSaving: false,

    isDirty: false,

    history: [],

    historyIndex: -1

};


/* =========================================================
   DOM HELPERS
========================================================= */

function $(selector) {

    return document.querySelector(
        selector
    );

}


function $$(selector) {

    return document.querySelectorAll(
        selector
    );

}


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initWorkspace
);


async function initWorkspace() {

    try {

        bindEvents();

        await loadCurrentUser();

        await loadProject();

    }

    catch (error) {

        console.error(
            "Workspace initialization failed:",
            error
        );

        showEditorStatus(
            "Unable to initialize workspace.",
            "error"
        );

    }

}


/* =========================================================
   EVENT BINDINGS
========================================================= */

function bindEvents() {


    /* SAVE */

    const saveButton =
        $("#saveCode");

    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveActiveFile
        );

    }


    /* RUN */

    const runButton =
        $("#runCode");

    if (runButton) {

        runButton.addEventListener(
            "click",
            runCode
        );

    }


    /* STOP */

    const stopButton =
        $("#stopCode");

    if (stopButton) {

        stopButton.addEventListener(
            "click",
            stopExecution
        );

        stopButton.disabled =
            true;

    }


    /* EDITOR */

    const editor =
        $("#codeEditor");

    if (editor) {

        editor.addEventListener(
            "input",
            handleEditorInput
        );

        editor.addEventListener(
            "keydown",
            handleEditorKeydown
        );

    }


    /* NEW FILE */

    const newFileButton =
        $("#newFileBtn");

    if (newFileButton) {

        newFileButton.addEventListener(
            "click",
            openNewFileModal
        );

    }


    /* NEW FILE FORM */

    const newFileForm =
        $("#newFileForm");

    if (newFileForm) {

        newFileForm.addEventListener(
            "submit",
            createNewFile
        );

    }


    /* CLOSE NEW FILE */

    const closeNewFile =
        $("#closeNewFileModal");

    if (closeNewFile) {

        closeNewFile.addEventListener(
            "click",
            closeNewFileModal
        );

    }


    const cancelNewFile =
        $("#cancelNewFile");

    if (cancelNewFile) {

        cancelNewFile.addEventListener(
            "click",
            closeNewFileModal
        );

    }


    /* SHARE */

    const shareButton =
        $("#shareWorkspace");

    if (shareButton) {

        shareButton.addEventListener(
            "click",
            openShareModal
        );

    }


    const closeShare =
        $("#closeShareModal");

    if (closeShare) {

        closeShare.addEventListener(
            "click",
            closeShareModal
        );

    }


    const closeShareButton =
        $("#closeShareButton");

    if (closeShareButton) {

        closeShareButton.addEventListener(
            "click",
            closeShareModal
        );

    }


    /* COPY SHARE LINK */

    const copyShare =
        $("#copyShareLink");

    if (copyShare) {

        copyShare.addEventListener(
            "click",
            copyShareLink
        );

    }


    /* REVIEW */

    const reviewButton =
        $("#reviewCode");

    if (reviewButton) {

        reviewButton.addEventListener(
            "click",
            showReviewNotice
        );

    }


    /* BOTTOM PANELS */

    $$(".bottom-tab")
        .forEach(
            bindBottomTab
        );


    /* UNDO */

    const undoButton =
        $("#undoBtn");

    if (undoButton) {

        undoButton.addEventListener(
            "click",
            undoEdit
        );

    }


    /* REDO */

    const redoButton =
        $("#redoBtn");

    if (redoButton) {

        redoButton.addEventListener(
            "click",
            redoEdit
        );

    }


    /* KEYBOARD */

    document.addEventListener(
        "keydown",
        handleGlobalKeyboard
    );

}


/* =========================================================
   CURRENT USER
========================================================= */

async function loadCurrentUser() {

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

        return;

    }


    state.user =
        result.data;


    updateUserUI();

}


/* =========================================================
   USER UI
========================================================= */

function updateUserUI() {

    if (!state.user) {

        return;

    }


    const name =
        state.user.name ||
        "User";


    const avatar =
        name
            .charAt(0)
            .toUpperCase();


    const nameElement =
        $("#currentUserName");


    const avatarElement =
        $("#currentUserAvatar");


    if (nameElement) {

        nameElement.textContent =
            name;

    }


    if (avatarElement) {

        avatarElement.textContent =
            avatar;

    }

}


/* =========================================================
   PROJECT
========================================================= */

async function loadProject() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    let projectId =
        params.get(
            "project_id"
        );


    if (!projectId) {

        projectId =
            localStorage.getItem(
                "hero_workspace_project_id"
            );

    }


    if (!projectId) {

        showNoProjectMessage();

        return;

    }


    projectId =
        parseInt(
            projectId,
            10
        );


    if (!projectId) {

        showNoProjectMessage();

        return;

    }


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


        if (!result.success) {

            throw new Error(
                result.message
            );

        }


        const project =
            result.data.find(
                item =>
                    Number(item.id) ===
                    Number(projectId)
            );


        if (!project) {

            showNoProjectMessage();

            return;

        }


        state.project =
            project;


        localStorage.setItem(
            "hero_workspace_project_id",
            project.id
        );


        localStorage.setItem(
            "hero_workspace_project_name",
            project.name
        );


        updateProjectUI();

        await loadFiles();

    }

    catch (error) {

        console.error(error);

        showNoProjectMessage();

    }

}


/* =========================================================
   PROJECT UI
========================================================= */

function updateProjectUI() {

    if (!state.project) {

        return;

    }


    const name =
        state.project.name ||
        "Untitled Project";


    const language =
        state.project.language ||
        "javascript";


    const projectName =
        $("#projectName");


    const workspaceName =
        $("#workspaceName");


    const infoName =
        $("#infoProjectName");


    const infoLanguage =
        $("#infoProjectLanguage");


    if (projectName) {

        projectName.textContent =
            name;

    }


    if (workspaceName) {

        workspaceName.textContent =
            "📁 " + name;

    }


    if (infoName) {

        infoName.textContent =
            name;

    }


    if (infoLanguage) {

        infoLanguage.textContent =
            formatLanguage(
                language
            );

    }

}


/* =========================================================
   LOAD FILES
========================================================= */

async function loadFiles() {

    if (!state.project) {

        return;

    }


    const url =
        API.projectFiles +
        "?project_id=" +
        encodeURIComponent(
            state.project.id
        );


    const response =
        await fetch(
            url,
            {
                credentials: "include"
            }
        );


    const result =
        await response.json();


    if (!result.success) {

        throw new Error(
            result.message
        );

    }


    state.files =
        result.data || [];


    updateFileCount();

    renderFileList();

    renderEditorTabs();


    if (
        state.files.length > 0
    ) {

        await openFile(
            state.files[0].id
        );

    }

    else {

        showNoFilesMessage();

    }

}


/* =========================================================
   FILE COUNT
========================================================= */

function updateFileCount() {

    const element =
        $("#infoFileCount");


    if (element) {

        element.textContent =
            state.files.length;

    }

}


/* =========================================================
   FILE LIST
========================================================= */

function renderFileList() {

    const container =
        $("#fileList");


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (
        state.files.length === 0
    ) {

        container.innerHTML = `

            <div class="file-empty">

                No files yet.

            </div>

        `;

        return;

    }


    state.files.forEach(
        file => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "file-item";


            if (
                state.activeFile &&
                Number(
                    state.activeFile.id
                ) ===
                Number(file.id)
            ) {

                item.classList.add(
                    "active"
                );

            }


            const icon =
                getFileIcon(
                    file.filename
                );


            item.innerHTML = `

                <span class="file-icon">

                    ${icon}

                </span>

                <span class="file-name">

                    ${escapeHtml(
                        file.filename
                    )}

                </span>

                <button
                    class="file-delete"
                    title="Delete file">

                    ×

                </button>

            `;


            item.addEventListener(
                "click",
                async event => {

                    if (
                        event.target.closest(
                            ".file-delete"
                        )
                    ) {

                        return;

                    }


                    await openFile(
                        file.id
                    );

                }
            );


            const deleteButton =
                item.querySelector(
                    ".file-delete"
                );


            deleteButton.addEventListener(
                "click",
                async event => {

                    event.stopPropagation();

                    await deleteFile(
                        file
                    );

                }
            );


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   OPEN FILE
========================================================= */

async function openFile(
    fileId
) {

    if (
        state.isDirty &&
        state.activeFile
    ) {

        const shouldSave =
            confirm(
                "You have unsaved changes. Save before switching files?"
            );


        if (shouldSave) {

            const saved =
                await saveActiveFile();


            if (!saved) {

                return;

            }

        }

    }


    const url =
        API.getFile +
        "?file_id=" +
        encodeURIComponent(
            fileId
        );


    try {

        const response =
            await fetch(
                url,
                {
                    credentials: "include"
                }
            );


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message
            );

        }


        state.activeFile =
            result.data;


        state.isDirty =
            false;


        resetHistory();

        renderFileList();

        renderEditorTabs();

        updateEditor();


    }

    catch (error) {

        console.error(error);


        showEditorStatus(
            error.message ||
            "Unable to load file.",
            "error"
        );

    }

}


/* =========================================================
   UPDATE EDITOR
========================================================= */

function updateEditor() {

    const editor =
        $("#codeEditor");


    if (!editor) {

        return;

    }


    if (!state.activeFile) {

        editor.value =
            "";

        editor.disabled =
            true;


        showEditorStatus(
            "Select a file to start editing."
        );

        return;

    }


    editor.disabled =
        false;


    editor.value =
        state.activeFile.content ||
        "";


    showEditorStatus(
        `${state.activeFile.filename} • Saved`,
        "saved"
    );


    updateLanguageUI();

}


/* =========================================================
   LANGUAGE UI
========================================================= */

function updateLanguageUI() {

    if (!state.activeFile) {

        return;

    }


    document.title =
        `${state.activeFile.filename} | Hero Workspace`;

}


/* =========================================================
   EDITOR INPUT
========================================================= */

function handleEditorInput() {

    if (!state.activeFile) {

        return;

    }


    state.activeFile.content =
        $("#codeEditor").value;


    state.isDirty =
        true;


    showEditorStatus(
        `${state.activeFile.filename} • Unsaved changes`,
        "modified"
    );

}


/* =========================================================
   SAVE FILE
========================================================= */

async function saveActiveFile() {

    if (
        !state.activeFile ||
        !state.project
    ) {

        return false;

    }


    if (state.isSaving) {

        return false;

    }


    state.isSaving =
        true;


    const editor =
        $("#codeEditor");


    const content =
        editor.value;


    try {

        const response =
            await fetch(
                API.saveFile,
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

                            file_id:
                                state.activeFile.id,

                            content:
                                content

                        })

                }
            );


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message
            );

        }


        state.activeFile.content =
            content;


        state.isDirty =
            false;


        const localFile =
            state.files.find(
                file =>
                    Number(file.id) ===
                    Number(
                        state.activeFile.id
                    )
            );


        if (localFile) {

            localFile.content =
                content;

        }


        showEditorStatus(
            `${state.activeFile.filename} • Saved`,
            "saved"
        );


        return true;

    }

    catch (error) {

        console.error(error);


        showEditorStatus(
            error.message ||
            "Save failed.",
            "error"
        );


        return false;

    }

    finally {

        state.isSaving =
            false;

    }

}


/* =========================================================
   CREATE NEW FILE
========================================================= */

function openNewFileModal() {

    const modal =
        $("#newFileModal");


    if (!modal) {

        return;

    }


    modal.classList.add(
        "active"
    );


    const nameInput =
        $("#newFileName");


    if (nameInput) {

        nameInput.value =
            "";


        setTimeout(
            () =>
                nameInput.focus(),
            50
        );

    }

}


function closeNewFileModal() {

    const modal =
        $("#newFileModal");


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


async function createNewFile(
    event
) {

    event.preventDefault();


    if (!state.project) {

        alert(
            "No project selected."
        );

        return;

    }


    const filename =
        $("#newFileName")
            .value
            .trim();


    const language =
        $("#newFileLanguage")
            .value;


    if (!filename) {

        alert(
            "Please enter a file name."
        );

        return;

    }


    try {

        const response =
            await fetch(
                API.createFile,
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
                                state.project.id,

                            filename,

                            language,

                            content:
                                getStarterCode(
                                    language
                                )

                        })

                }
            );


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message
            );

        }


        closeNewFileModal();


        await loadFiles();


        await openFile(
            result.data.id
        );


    }

    catch (error) {

        console.error(error);


        alert(
            error.message ||
            "Unable to create file."
        );

    }

}


/* =========================================================
   DELETE FILE
========================================================= */

async function deleteFile(
    file
) {

    if (!file) {

        return;

    }


    if (
        state.files.length <= 1
    ) {

        alert(
            "A project must have at least one file."
        );

        return;

    }


    const confirmed =
        confirm(
            `Delete "${file.filename}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                API.deleteFile,
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

                            file_id:
                                file.id

                        })

                }
            );


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message
            );

        }


        if (
            state.activeFile &&
            Number(
                state.activeFile.id
            ) ===
            Number(file.id)
        ) {

            state.activeFile =
                null;

        }


        await loadFiles();

    }

    catch (error) {

        console.error(error);


        alert(
            error.message ||
            "Unable to delete file."
        );

    }

}


/* =========================================================
   EDITOR TABS
========================================================= */

function renderEditorTabs() {

    const container =
        $("#editorTabs");


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    if (!state.activeFile) {

        return;

    }


    const tab =
        document.createElement(
            "div"
        );


    tab.className =
        "editor-tab active";


    tab.innerHTML = `

        <span>

            ${getFileIcon(
                state.activeFile.filename
            )}

        </span>

        <span>

            ${escapeHtml(
                state.activeFile.filename
            )}

        </span>

        <span
            class="editor-tab-close"
            title="Close">

            ×

        </span>

    `;


    container.appendChild(
        tab
    );

}


/* =========================================================
   KEYBOARD HANDLING
========================================================= */

function handleEditorKeydown(
    event
) {

    if (
        event.key === "Tab"
    ) {

        event.preventDefault();


        const editor =
            event.target;


        const start =
            editor.selectionStart;


        const end =
            editor.selectionEnd;


        editor.value =
            editor.value.substring(
                0,
                start
            ) +
            "    " +
            editor.value.substring(
                end
            );


        editor.selectionStart =
            editor.selectionEnd =
                start + 4;


        handleEditorInput();

    }

}


/* =========================================================
   GLOBAL SHORTCUTS
========================================================= */

function handleGlobalKeyboard(
    event
) {

    if (
        (event.ctrlKey ||
         event.metaKey) &&
        event.key.toLowerCase() ===
        "s"
    ) {

        event.preventDefault();

        saveActiveFile();

    }

}


/* =========================================================
   HISTORY
========================================================= */

function resetHistory() {

    const editor =
        $("#codeEditor");


    if (!editor) {

        return;

    }


    state.history = [

        editor.value

    ];


    state.historyIndex =
        0;

}


function undoEdit() {

    const editor =
        $("#codeEditor");


    if (!editor) {

        return;

    }


    document.execCommand(
        "undo"
    );

}


function redoEdit() {

    const editor =
        $("#codeEditor");


    if (!editor) {

        return;

    }


    document.execCommand(
        "redo"
    );

}


/* =========================================================
   BOTTOM PANELS
========================================================= */

function bindBottomTab(
    tab
) {

    tab.addEventListener(
        "click",
        () => {

            activateBottomPanel(
                tab.dataset.panel
            );

        }
    );

}


function activateBottomPanel(
    name
) {

    $$(".bottom-tab")
        .forEach(
            tab => {

                tab.classList.toggle(
                    "active",
                    tab.dataset.panel ===
                    name
                );

            }
        );


    $$(".bottom-content")
        .forEach(
            panel => {

                panel.classList.toggle(
                    "active",
                    panel.id ===
                    `${name}Panel`
                );

            }
        );

}


/* =========================================================
   REAL CODE EXECUTION
========================================================= */

async function runCode() {

    if (!state.activeFile) {

        alert(
            "Please select a file first."
        );

        return;

    }


    const editor =
        $("#codeEditor");


    if (!editor) {

        return;

    }


    const code =
        editor.value;


    if (!code.trim()) {

        showExecutionOutput(
            "No code to execute.",
            "error"
        );

        activateBottomPanel(
            "output"
        );

        return;

    }


    const language =
        detectExecutionLanguage(
            state.activeFile
        );


    /*
    |--------------------------------------------------------------------------
    | PHP
    |--------------------------------------------------------------------------
    |
    | PHP will be connected through XAMPP/PHP backend later.
    |
    */

    if (
        language === "php"
    ) {

        showExecutionOutput(

            "PHP execution will be connected through the XAMPP PHP backend in the next phase.",

            "error"

        );


        activateBottomPanel(
            "output"
        );


        return;

    }


    /*
    |--------------------------------------------------------------------------
    | Start UI state
    |--------------------------------------------------------------------------
    */

    executionRunning =
        true;


    executionController =
        new AbortController();


    setExecutionUI(
        true
    );


    activateBottomPanel(
        "output"
    );


    showExecutionCommand(
        language
    );


    showExecutionOutput(
        "Executing...",
        "loading"
    );


    try {

        const response =
            await fetch(

                `${EXECUTION_ENGINE}/execute`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            language:
                                language,

                            code:
                                code

                        }),

                    signal:
                        executionController.signal

                }

            );


        let result;


        try {

            result =
                await response.json();

        }

        catch {

            throw new Error(
                "Execution engine returned an invalid response."
            );

        }


        if (!response.ok) {

            throw new Error(

                result.message ||
                result.error ||
                "Execution failed."

            );

        }


        displayExecutionResult(
            result
        );

    }

    catch (error) {

        /*
        |--------------------------------------------------------------------------
        | Stop / Abort
        |--------------------------------------------------------------------------
        */

        if (
            error.name ===
            "AbortError"
        ) {

            showExecutionOutput(
                "Execution stopped.",
                "warning"
            );

        }

        else {

            console.error(
                "Execution error:",
                error
            );


            showExecutionOutput(

                "Unable to connect to execution engine.\n\n" +
                error.message,

                "error"

            );

        }

    }

    finally {

        executionController =
            null;


        executionRunning =
            false;


        setExecutionUI(
            false
        );

    }

}


/* =========================================================
   DETECT LANGUAGE
========================================================= */

function detectExecutionLanguage(
    file
) {

    if (
        file &&
        file.language
    ) {

        const language =
            String(
                file.language
            ).toLowerCase();


        if (
            language ===
            "javascript"
        ) {

            return "javascript";

        }


        if (
            language ===
            "python"
        ) {

            return "python";

        }


        if (
            language ===
            "cpp"
        ) {

            return "cpp";

        }


        if (
            language ===
            "php"
        ) {

            return "php";

        }

    }


    const filename =
        String(
            file?.filename ||
            ""
        )
        .toLowerCase();


    if (
        filename.endsWith(
            ".py"
        )
    ) {

        return "python";

    }


    if (
        filename.endsWith(
            ".js"
        )
    ) {

        return "javascript";

    }


    if (
        filename.endsWith(
            ".cpp"
        ) ||
        filename.endsWith(
            ".cc"
        ) ||
        filename.endsWith(
            ".cxx"
        )
    ) {

        return "cpp";

    }


    if (
        filename.endsWith(
            ".php"
        )
    ) {

        return "php";

    }


    return "javascript";

}


/* =========================================================
   EXECUTION RESULT
========================================================= */

function displayExecutionResult(
    result
) {

    let output =
        "";


    if (
        result.output
    ) {

        output +=
            result.output;

    }


    if (
        result.error
    ) {

        if (output) {

            output +=
                "\n";

        }


        output +=
            result.error;

    }


    if (
        !output.trim()
    ) {

        if (
            result.success
        ) {

            output =
                "Program executed successfully with no output.";

        }

        else {

            output =
                "Program finished without output.";

        }

    }


    if (
        typeof result.execution_time ===
        "number"
    ) {

        output +=
            `\n\n[Execution time: ${result.execution_time.toFixed(2)} ms]`;

    }


    if (
        result.status ===
        "timeout"
    ) {

        output +=
            "\n[Process terminated: timeout]";

    }


    showExecutionOutput(

        output,

        result.success
            ? "success"
            : "error"

    );

}


/* =========================================================
   EXECUTION COMMAND
========================================================= */

function showExecutionCommand(
    language
) {

    const output =
        $("#outputPanel");


    if (!output) {

        return;

    }


    output.innerHTML = `

        <div class="terminal-command">

            hero@workspace:~$ run ${escapeHtml(
                language
            )}

        </div>

    `;

}


/* =========================================================
   EXECUTION OUTPUT
========================================================= */

function showExecutionOutput(
    message,
    type = ""
) {

    const output =
        $("#outputPanel");


    if (!output) {

        console.log(
            message
        );

        return;

    }


    const oldOutput =
        output.querySelector(
            ".execution-result"
        );


    if (oldOutput) {

        oldOutput.remove();

    }


    const element =
        document.createElement(
            "div"
        );


    element.className =
        "terminal-output execution-result";


    if (
        type === "error"
    ) {

        element.classList.add(
            "execution-error"
        );

    }


    if (
        type === "success"
    ) {

        element.classList.add(
            "execution-success"
        );

    }


    if (
        type === "warning"
    ) {

        element.classList.add(
            "execution-warning"
        );

    }


    if (
        type === "loading"
    ) {

        element.classList.add(
            "execution-loading"
        );

    }


    element.textContent =
        message;


    output.appendChild(
        element
    );


    output.scrollTop =
        output.scrollHeight;

}


/* =========================================================
   EXECUTION UI
========================================================= */

function setExecutionUI(
    running
) {

    const runButton =
        $("#runCode");


    const stopButton =
        $("#stopCode");


    if (runButton) {

        runButton.disabled =
            running;


        if (running) {

            runButton.dataset.originalText =
                runButton.textContent;


            runButton.textContent =
                "⏳ Running...";

        }

        else {

            runButton.textContent =
                runButton.dataset.originalText ||
                "▶ Run";

        }

    }


    if (stopButton) {

        stopButton.disabled =
            !running;

    }

}


/* =========================================================
   STOP EXECUTION
========================================================= */

function stopExecution() {

    if (
        executionController
    ) {

        executionController.abort();

    }

    else {

        showExecutionOutput(
            "No execution is currently running.",
            "warning"
        );

    }


    activateBottomPanel(
        "output"
    );

}


/* =========================================================
   TEST ENGINE
========================================================= */

async function testExecutionEngine() {

    try {

        const response =
            await fetch(
                EXECUTION_ENGINE,
                {
                    method: "GET"
                }
            );


        const result =
            await response.json();


        console.log(
            "Hero Workspace Execution Engine:",
            result
        );


        return result;

    }

    catch (error) {

        console.error(
            "Execution engine offline:",
            error
        );


        return null;

    }

}


/* =========================================================
   SHARE
========================================================= */

function openShareModal() {

    const modal =
        $("#shareModal");


    if (!modal) {

        return;

    }


    const input =
        $("#shareLink");


    const url =
        window.location.origin +
        window.location.pathname +
        "?project_id=" +
        encodeURIComponent(

            state.project
                ? state.project.id
                : ""

        );


    if (input) {

        input.value =
            url;

    }


    modal.classList.add(
        "active"
    );

}


function closeShareModal() {

    const modal =
        $("#shareModal");


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


async function copyShareLink() {

    const input =
        $("#shareLink");


    if (!input) {

        return;

    }


    try {

        await navigator.clipboard.writeText(
            input.value
        );


        alert(
            "Workspace link copied."
        );

    }

    catch {

        input.select();


        document.execCommand(
            "copy"
        );


        alert(
            "Workspace link copied."
        );

    }

}


/* =========================================================
   REVIEW PLACEHOLDER
========================================================= */

function showReviewNotice() {

    alert(
        "AI Code Review will be connected in a later phase."
    );

}


/* =========================================================
   STATUS
========================================================= */

function showEditorStatus(
    message,
    type = ""
) {

    const status =
        $("#editorStatus");


    if (!status) {

        return;

    }


    status.textContent =
        message;


    status.classList.remove(
        "saved",
        "modified"
    );


    if (
        type === "saved"
    ) {

        status.classList.add(
            "saved"
        );

    }


    if (
        type === "modified"
    ) {

        status.classList.add(
            "modified"
        );

    }

}


/* =========================================================
   NO PROJECT
========================================================= */

function showNoProjectMessage() {

    const editor =
        $("#codeEditor");


    if (editor) {

        editor.value =
            "";

        editor.disabled =
            true;

    }


    showEditorStatus(
        "No project selected."
    );


    const projectName =
        $("#projectName");


    if (projectName) {

        projectName.textContent =
            "No Project";

    }


    const workspaceName =
        $("#workspaceName");


    if (workspaceName) {

        workspaceName.textContent =
            "📁 No Project";

    }

}


/* =========================================================
   NO FILES
========================================================= */

function showNoFilesMessage() {

    const container =
        $("#fileList");


    if (container) {

        container.innerHTML = `

            <div class="file-empty">

                No files found.

                <br><br>

                Click + to create one.

            </div>

        `;

    }


    showEditorStatus(
        "This project has no files."
    );

}


/* =========================================================
   STARTER CODE
========================================================= */

function getStarterCode(
    language
) {

    switch (language) {


        case "javascript":

            return `// Hero Workspace

console.log("Hello, Hero Workspace!");
`;


        case "python":

            return `# Hero Workspace

print("Hello, Hero Workspace!")
`;


        case "cpp":

            return `#include <iostream>

using namespace std;

int main() {

    cout << "Hello, Hero Workspace!" << endl;

    return 0;

}
`;


        case "php":

            return `<?php

echo "Hello, Hero Workspace!";

?>
`;


        default:

            return "";

    }

}


/* =========================================================
   FILE ICON
========================================================= */

function getFileIcon(
    filename
) {

    const extension =
        filename
            .split(".")
            .pop()
            .toLowerCase();


    const icons = {

        js:
            "🟨",

        mjs:
            "🟨",

        py:
            "🐍",

        cpp:
            "🔵",

        cc:
            "🔵",

        cxx:
            "🔵",

        h:
            "🔵",

        php:
            "🐘",

        html:
            "🌐",

        css:
            "🎨",

        json:
            "📋",

        txt:
            "📄"

    };


    return (
        icons[extension] ||
        "📄"
    );

}


/* =========================================================
   LANGUAGE FORMAT
========================================================= */

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
            "PHP",

        text:
            "Text"

    };


    return (
        languages[language] ||
        language
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value
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


/* =========================================================
   DEBUG / PUBLIC API
========================================================= */

window.HeroWorkspace = {

    state,

    runCode,

    stopExecution,

    saveActiveFile,

    testExecutionEngine

};
/* =========================================================
   HERO WORKSPACE COLLABORATION
========================================================= */

const COLLABORATION_SERVER =
    "ws://localhost:3002";


let collaborationSocket =
    null;


let collaborationReady =
    false;


let typingTimer =
    null;


/* =========================================================
   START COLLABORATION
========================================================= */

function startCollaboration() {

    if (
        !state.project ||
        !state.user
    ) {

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | Close previous connection
    |--------------------------------------------------------------------------
    */

    if (
        collaborationSocket
    ) {

        try {

            collaborationSocket.close();

        }

        catch {}

    }


    collaborationSocket =
        new WebSocket(
            COLLABORATION_SERVER
        );


    collaborationSocket.addEventListener(
        "open",
        () => {

            collaborationReady =
                true;


            collaborationSocket.send(

                JSON.stringify({

                    type:
                        "join",

                    projectId:
                        state.project.id,

                    userId:
                        state.user.id ||
                        null,

                    userName:
                        state.user.name ||
                        "User"

                })

            );


            loadChatHistory();

            loadCollaborators();

            setCollaborationStatus(
                true
            );

        }
    );


    collaborationSocket.addEventListener(
        "message",
        event => {

            handleCollaborationMessage(
                event.data
            );

        }
    );


    collaborationSocket.addEventListener(
        "close",
        () => {

            collaborationReady =
                false;


            setCollaborationStatus(
                false
            );

            /*
            |--------------------------------------------------------------------------
            | Reconnect after 3 seconds
            |--------------------------------------------------------------------------
            */

            setTimeout(
                () => {

                    if (
                        state.project &&
                        state.user
                    ) {

                        startCollaboration();

                    }

                },
                3000
            );

        }
    );


    collaborationSocket.addEventListener(
        "error",
        error => {

            console.error(
                "Collaboration error:",
                error
            );

            setCollaborationStatus(
                false
            );

        }
    );

}


/* =========================================================
   COLLABORATION MESSAGE
========================================================= */

function handleCollaborationMessage(
    raw
) {

    let data;


    try {

        data =
            JSON.parse(
                raw
            );

    }

    catch {

        return;

    }


    switch (
        data.type
    ) {


        case "collaborators":

            renderOnlineCollaborators(
                data.users || []
            );

            break;


        case "user_joined":

            addOrUpdateCollaborator(
                data.user
            );

            showSystemMessage(

                `${getFirstName(
                    data.user.name
                )} joined the workspace.`

            );

            break;


        case "user_left":

            markCollaboratorOffline(
                data.user
            );

            showSystemMessage(

                `${getFirstName(
                    data.user.name
                )} left the workspace.`

            );

            break;


        case "chat":

            appendChatMessage(
                data
            );

            break;


        case "typing":

            showTypingIndicator(
                data
            );

            break;


        case "error":

            console.error(
                data.message
            );

            break;

    }

}


/* =========================================================
   LOAD CHAT HISTORY
========================================================= */

async function loadChatHistory() {

    if (
        !state.project
    ) {

        return;

    }


    try {

        const response =
            await fetch(

                `../php/messages/list.php?project_id=${encodeURIComponent(
                    state.project.id
                )}`,

                {
                    credentials:
                        "include"
                }

            );


        const result =
            await response.json();


        if (
            !result.success
        ) {

            return;

        }


        clearChatMessages();


        (result.data || [])
            .forEach(
                message => {

                    appendChatMessage({

                        type:
                            "chat",

                        message:
                            message.message,

                        user: {

                            id:
                                message.user_id,

                            name:
                                message.name,

                            first_name:
                                message.first_name

                        },

                        timestamp:
                            message.created_at

                    });

                }
            );

    }

    catch (error) {

        console.error(
            "Chat history error:",
            error
        );

    }

}


/* =========================================================
   SEND CHAT
========================================================= */

async function sendCollaborationMessage() {

    const input =
        document.querySelector(
            "#chatInput"
        );


    if (!input) {

        return;

    }


    const message =
        input.value.trim();


    if (!message) {

        return;

    }


    /*
    |--------------------------------------------------------------------------
    | Real-time WebSocket
    |--------------------------------------------------------------------------
    */

    if (
        collaborationSocket &&
        collaborationSocket.readyState ===
        WebSocket.OPEN
    ) {

        collaborationSocket.send(

            JSON.stringify({

                type:
                    "chat",

                message

            })

        );

    }


    /*
    |--------------------------------------------------------------------------
    | Database persistence
    |--------------------------------------------------------------------------
    */

    try {

        await fetch(
            "../php/messages/send.php",
            {

                method:
                    "POST",

                credentials:
                    "include",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({

                        project_id:
                            state.project.id,

                        message

                    })

            }
        );

    }

    catch (error) {

        console.error(
            "Message save failed:",
            error
        );

    }


    input.value =
        "";

}


/* =========================================================
   CHAT UI
========================================================= */

function appendChatMessage(
    data
) {

    const container =
        document.querySelector(
            "#chatMessages"
        );


    if (!container) {

        return;

    }


    const user =
        data.user ||
        {};


    const name =
        getFirstName(
            user.name
        );


    const userId =
        user.id
            ? `#${user.id}`
            : "";


    const time =
        formatChatTime(
            data.timestamp
        );


    const currentUserId =
        state.user?.id
            ? Number(
                state.user.id
            )
            : null;


    const messageUserId =
        user.id
            ? Number(
                user.id
            )
            : null;


    const isMine =
        currentUserId &&
        messageUserId &&
        currentUserId ===
        messageUserId;


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "chat-message";


    if (isMine) {

        wrapper.classList.add(
            "mine"
        );

    }


    wrapper.innerHTML = `

        <div class="chat-avatar">

            ${escapeHtml(
                name.charAt(0)
            )}

        </div>

        <div class="chat-message-body">

            <div class="chat-message-meta">

                <strong>

                    ${escapeHtml(
                        name
                    )}

                </strong>

                ${
                    userId
                        ? `<span class="chat-user-id">${userId}</span>`
                        : ""
                }

                <time>

                    ${escapeHtml(
                        time
                    )}

                </time>

            </div>

            <div class="chat-message-text">

                ${escapeHtml(
                    data.message
                )}

            </div>

        </div>

    `;


    container.appendChild(
        wrapper
    );


    container.scrollTop =
        container.scrollHeight;

}


function clearChatMessages() {

    const container =
        document.querySelector(
            "#chatMessages"
        );


    if (container) {

        container.innerHTML =
            "";

    }

}


function showSystemMessage(
    message
) {

    const container =
        document.querySelector(
            "#chatMessages"
        );


    if (!container) {

        return;

    }


    const element =
        document.createElement(
            "div"
        );


    element.className =
        "chat-system-message";


    element.textContent =
        message;


    container.appendChild(
        element
    );


    container.scrollTop =
        container.scrollHeight;

}


/* =========================================================
   CHAT INPUT
========================================================= */

function bindCollaborationChat() {

    const input =
        document.querySelector(
            "#chatInput"
        );


    const button =
        document.querySelector(
            "#sendMessage"
        );


    if (button) {

        button.addEventListener(
            "click",
            sendCollaborationMessage
        );

    }


    if (input) {

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendCollaborationMessage();

                    return;

                }


                sendTypingState(
                    true
                );


                clearTimeout(
                    typingTimer
                );


                typingTimer =
                    setTimeout(
                        () => {

                            sendTypingState(
                                false
                            );

                        },
                        800
                    );

            }
        );

    }

}


/* =========================================================
   TYPING
========================================================= */

function sendTypingState(
    typing
) {

    if (
        !collaborationSocket ||
        collaborationSocket.readyState !==
        WebSocket.OPEN
    ) {

        return;

    }


    collaborationSocket.send(

        JSON.stringify({

            type:
                "typing",

            typing:
                Boolean(typing)

        })

    );

}


function showTypingIndicator(
    data
) {

    const element =
        document.querySelector(
            "#typingIndicator"
        );


    if (!element) {

        return;

    }


    if (
        data.typing
    ) {

        element.textContent =
            `${getFirstName(
                data.name
            )} is typing...`;

        element.classList.add(
            "active"
        );

    }

    else {

        element.textContent =
            "";

        element.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   COLLABORATORS
========================================================= */

let collaborators =
    [];


async function loadCollaborators() {

    if (
        !state.project
    ) {

        return;

    }


    try {

        const response =
            await fetch(

                `../php/collaborators/list.php?project_id=${encodeURIComponent(
                    state.project.id
                )}`,

                {
                    credentials:
                        "include"
                }

            );


        const result =
            await response.json();


        if (
            result.success
        ) {

            collaborators =
                result.data || [];

        }

    }

    catch (error) {

        console.error(
            "Collaborator loading failed:",
            error
        );

    }

}


function renderOnlineCollaborators(
    onlineUsers
) {

    const onlineIds =
        new Set(

            onlineUsers
                .map(
                    user =>
                        Number(
                            user.id
                        )
                )
                .filter(
                    id => id > 0
                )

        );


    collaborators =
        collaborators.map(
            user => ({

                ...user,

                online:
                    onlineIds.has(
                        Number(
                            user.id
                        )
                    )

            })
        );


    /*
    |--------------------------------------------------------------------------
    | Add users that came through WebSocket
    |--------------------------------------------------------------------------
    */

    onlineUsers.forEach(
        user => {

            addOrUpdateCollaborator(
                user
            );

        }
    );


    renderCollaboratorUI();

}


function addOrUpdateCollaborator(
    user
) {

    if (!user) {

        return;

    }


    const existing =
        collaborators.find(
            item =>
                user.id &&
                Number(item.id) ===
                Number(user.id)
        );


    if (existing) {

        existing.name =
            user.name ||
            existing.name;

        existing.first_name =
            user.first_name ||
            getFirstName(
                user.name
            );

        existing.online =
            true;

    }

    else {

        collaborators.push({

            id:
                user.id,

            name:
                user.name ||
                "User",

            first_name:
                user.first_name ||
                getFirstName(
                    user.name
                ),

            role:
                "collaborator",

            online:
                true

        });

    }


    renderCollaboratorUI();

}


function markCollaboratorOffline(
    user
) {

    if (!user) {

        return;

    }


    collaborators =
        collaborators.map(
            item => {

                if (
                    user.id &&
                    Number(item.id) ===
                    Number(user.id)
                ) {

                    return {

                        ...item,

                        online:
                            false

                    };

                }


                return item;

            }
        );


    renderCollaboratorUI();

}


/* =========================================================
   COLLABORATOR UI
========================================================= */

function renderCollaboratorUI() {

    /*
    |--------------------------------------------------------------------------
    | Try common container IDs
    |--------------------------------------------------------------------------
    */

    const container =
        document.querySelector(
            "#collaboratorsList"
        ) ||
        document.querySelector(
            "#collaboratorList"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    collaborators.forEach(
        user => {

            const name =
                getFirstName(
                    user.name
                );


            const idText =
                user.id
                    ? `#${user.id}`
                    : "";


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "collaborator-item";


            item.innerHTML = `

                <div class="collaborator-avatar">

                    ${escapeHtml(
                        name.charAt(0)
                    )}

                    <span
                        class="collaborator-status ${
                            user.online
                                ? "online"
                                : "offline"
                        }">
                    </span>

                </div>

                <div class="collaborator-info">

                    <div class="collaborator-name">

                        ${escapeHtml(
                            name
                        )}

                        ${
                            idText
                                ? `<span class="collaborator-id">${idText}</span>`
                                : ""
                        }

                    </div>

                    <div class="collaborator-role">

                        ${
                            user.online
                                ? "Online"
                                : formatRole(
                                    user.role
                                )
                        }

                    </div>

                </div>

            `;


            container.appendChild(
                item
            );

        }
    );


    updateOnlineCount();

}


function updateOnlineCount() {

    const onlineCount =
        collaborators.filter(
            user =>
                user.online
        ).length;


    const elements =
        document.querySelectorAll(
            "#onlineCount, .online-count"
        );


    elements.forEach(
        element => {

            element.textContent =
                onlineCount;

        }
    );

}


/* =========================================================
   COLLABORATION STATUS
========================================================= */

function setCollaborationStatus(
    online
) {

    const elements =
        document.querySelectorAll(
            "#collaborationStatus, .collaboration-status"
        );


    elements.forEach(
        element => {

            element.textContent =
                online
                    ? "Connected"
                    : "Offline";


            element.classList.toggle(
                "online",
                online
            );


            element.classList.toggle(
                "offline",
                !online
            );

        }
    );

}


/* =========================================================
   HELPERS
========================================================= */

function getFirstName(
    name
) {

    if (!name) {

        return "User";

    }


    return String(name)
        .trim()
        .split(/\s+/)[0];

}


function formatRole(
    role
) {

    if (!role) {

        return "Member";

    }


    return (
        String(role)
            .charAt(0)
            .toUpperCase() +
        String(role)
            .slice(1)
    );

}


function formatChatTime(
    timestamp
) {

    if (!timestamp) {

        return "";

    }


    const date =
        new Date(
            timestamp
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   START AFTER WORKSPACE LOAD
========================================================= */

const originalInitWorkspace =
    window.initWorkspace;


if (
    typeof originalInitWorkspace ===
    "function"
) {

    window.initWorkspace =
        async function () {

            await originalInitWorkspace();

            bindCollaborationChat();

            startCollaboration();

        };

}
function updateCurrentUser(user) {

    const nameElement =
        document.getElementById("currentUserName");

    const avatarElement =
        document.getElementById("currentUserAvatar");

    const roleElement =
        document.getElementById("currentUserRole");

    if (!user) return;


    const name =
        user.name || "Hero";


    if (nameElement) {

        nameElement.textContent =
            name;

    }


    if (avatarElement) {

        avatarElement.textContent =
            name.charAt(0).toUpperCase();

    }


    if (roleElement) {

        roleElement.textContent =
            "Owner • online";

    }

}