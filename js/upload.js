/* ============================================================
    DOM
============================================================ */

const schemaSelect = document.getElementById("schemaSelect");

const documentType = document.getElementById("documentType");

const customDocumentTypeContainer = document.getElementById("customDocumentTypeContainer");
const customDocumentType = document.getElementById("customDocumentType");

const dropZone = document.getElementById("dropZone");
const browseBtn = document.getElementById("browseBtn");
const fileInput = document.getElementById("fileInput");

const fileList = document.getElementById("fileList");

const extractBtn = document.getElementById("extractBtn");

const requirements = document.getElementById("requirements");


/* ============================================================
    STATE
============================================================ */

let selectedFiles = [];

let schemas = [];


/* ============================================================
    INITIALIZE
============================================================ */

initialize();

function initialize() {

    loadSchemas();

    bindEvents();

    updateExtractState();

}


/* ============================================================
    EVENTS
============================================================ */

function bindEvents() {

    // browseBtn.addEventListener("click", () => {

    //     fileInput.click();

    // });

    fileInput.addEventListener("change", handleFileSelection);

    dropZone.addEventListener("dragover", handleDragOver);

    dropZone.addEventListener("dragleave", handleDragLeave);

    dropZone.addEventListener("drop", handleDrop);

    dropZone.addEventListener("dragenter", event => {
        event.preventDefault();
        dropZone.classList.add("drag-over");
    });

    dropZone.addEventListener("click", () => {
        fileInput.click();
    });

    documentType.addEventListener("change", handleDocumentTypeChange);

    customDocumentType.addEventListener("input", updateExtractState);

    schemaSelect.addEventListener("change", updateExtractState);

}


/* ============================================================
    LOAD SCHEMAS
============================================================ */

function loadSchemas() {

    schemas = Storage
        .getSchemas()
        .sort((a, b) => b.updated_at - a.updated_at);

    schemaSelect.innerHTML =
        `<option value="">Select a schema</option>`;

    schemas.forEach(schema => {

        const option = document.createElement("option");

        option.value = schema.id;

        option.textContent = schema.name;

        schemaSelect.appendChild(option);

    });

}


/* ============================================================
    DOCUMENT TYPE
============================================================ */

function handleDocumentTypeChange() {

    if (documentType.value === "Other") {

        customDocumentTypeContainer.classList.remove("hidden");

    }

    else {

        customDocumentTypeContainer.classList.add("hidden");

        customDocumentType.value = "";

    }

    updateExtractState();

}


function getDocumentType() {

    if (documentType.value === "Other")
        return customDocumentType.value.trim();

    return documentType.value;

}


/* ============================================================
    DRAG & DROP
============================================================ */

function handleDragOver(event) {

    event.preventDefault();

    dropZone.classList.add("drag-over");

}


function handleDragLeave(event) {

    event.preventDefault();

    dropZone.classList.remove("drag-over");

}


function handleDrop(event) {

    event.preventDefault();

    dropZone.classList.remove("drag-over");

    addFiles(event.dataTransfer.files);

}


/* ============================================================
    FILE PICKER
============================================================ */

function handleFileSelection() {

    addFiles(fileInput.files);

    fileInput.value = "";

}


/* ============================================================
    FILE VALIDATION
============================================================ */

const allowedExtensions = [
    "pdf",
    "png",
    "jpg",
    "jpeg",
    "webp",
    "txt"
];

// const MAX_FILE_SIZE = 20 * 1024 * 1024;

const MAX_TOTAL_SIZE = 5 * 1024 * 1024;

const MAX_FILES = 10;


function addFiles(files) {

    const incoming = Array.from(files);

    let totalSize =
        selectedFiles.reduce((t, f) => t + f.size, 0);

    for (const file of incoming) {

        const duplicate = selectedFiles.some(existing =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified
        );

        if (duplicate) {
            Utils.toast(`${file.name} has already been added.`);
            continue;
        }

        const extension =
            file.name.split(".").pop().toLowerCase();

        if (!allowedExtensions.includes(extension)) {

            Utils.toast(
                `${file.name} is not supported.`
            );

            continue;

        }

        // if (file.size > MAX_FILE_SIZE) {

        //     Utils.toast(
        //         `${file.name} exceeds the maximum file size.`
        //     );

        //     continue;

        // }

        if (selectedFiles.length >= MAX_FILES) {

            Utils.toast(
                `You can upload at most ${MAX_FILES} files.`
            );

            break;

        }

        if (totalSize + file.size > MAX_TOTAL_SIZE) {

            Utils.toast(
                `Total upload size of ${Utils.formatFileSize(MAX_TOTAL_SIZE)} exceeded.`
            );

            break;

        }

        totalSize += file.size;

        selectedFiles.push(file);

    }

    renderFiles();

    updateExtractState();

}


/* ============================================================
    FILE LIST
============================================================ */

function renderFiles() {

    fileList.innerHTML = "";

    selectedFiles.forEach((file, index) => {

        const card = document.createElement("div");

        card.className = "file-card";

        card.innerHTML = `

            <div class="file-info">

                <div>

                    <div class="file-name">
                        ${escapeHtml(file.name)}
                    </div>

                    <div class="file-size">
                        ${Utils.formatFileSize(file.size)}
                    </div>

                </div>

            </div>

            <button
                class="remove-file"
                data-index="${index}">

                Remove

            </button>

        `;

        card
            .querySelector(".remove-file")
            .addEventListener("click", () => {

                selectedFiles.splice(index, 1);

                renderFiles();

                updateExtractState();

            });

        fileList.appendChild(card);

    });

}


/* ============================================================
    REQUIREMENTS
============================================================ */

function updateExtractState() {

    const messages = [];

    const accessCode =
        Storage.getAccessCode();

    if (!accessCode) {

        messages.push(`
            <div class="requirement">
                ⚠ Access code required.
                <a href="settings.html">
                    Settings
                </a>
            </div>
        `);

    }

    if (schemas.length === 0) {

        messages.push(`
            <div class="requirement">
                ⚠ No schemas available.
                <a href="schemas.html">
                    Create Schema
                </a>
            </div>
        `);

    }

    if (!schemaSelect.value) {

        messages.push(`
            <div class="requirement">
                ⚠ Select a schema.
            </div>
        `);

    }

    if (!getDocumentType()) {

        messages.push(`
            <div class="requirement">
                ⚠ Select a document type.
            </div>
        `);

    }

    if (selectedFiles.length === 0) {

        messages.push(`
            <div class="requirement">
                ⚠ Select at least one file.
            </div>
        `);

    }

    requirements.innerHTML = messages.join("");

    extractBtn.disabled = messages.length > 0;

}


/* ============================================================
    HELPERS
============================================================ */

function escapeHtml(value) {

    if (!value)
        return "";

    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* ============================================================
    SESSION MANAGEMENT
============================================================ */

const processingModal = document.getElementById("processingModal");
const modalSpinner = document.getElementById("modalSpinner");
const modalIcon = document.getElementById("modalIcon");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalActions = document.getElementById("modalActions");

const newExtractionBtn = document.getElementById("newExtractionBtn");
const viewJobsBtn = document.getElementById("viewJobsBtn");

const inactiveOverlay = document.getElementById("inactiveOverlay");
const restartSessionBtn = document.getElementById("restartSessionBtn");


const KEEP_ALIVE_INTERVAL = 10 * 60 * 1000;
const INACTIVITY_TIMEOUT = 60 * 60 * 1000;

let keepAliveTimer = null;
let inactivityTimer = null;


/* ============================================================
    START SESSION
============================================================ */

startSession();

function startSession() {

    warmUpServer();

    resetInactivityTimer();

    keepAliveTimer = setInterval(() => {

        Api.ping().catch(() => {});

    }, KEEP_ALIVE_INTERVAL);

}


/* ============================================================
    STOP SESSION
============================================================ */

function stopSession() {

    clearInterval(keepAliveTimer);

    clearTimeout(inactivityTimer);

}


/* ============================================================
    SERVER WARMUP
============================================================ */

async function warmUpServer() {

    try {

        await Api.ping();

    }

    catch (error) {

        console.error(error);

    }

}


/* ============================================================
    INACTIVITY
============================================================ */

[
    "click",
    "keydown",
    "mousemove",
    "touchstart",
    "scroll"
].forEach(eventName => {

    window.addEventListener(eventName, resetInactivityTimer);

});


function resetInactivityTimer() {

    clearTimeout(inactivityTimer);

    inactivityTimer = setTimeout(() => {

        stopSession();

        inactiveOverlay.classList.add("show");

    }, INACTIVITY_TIMEOUT);

}


/* ============================================================
    RESTART SESSION
============================================================ */

restartSessionBtn.addEventListener("click", () => {

    location.reload();

});


/* ============================================================
    REQUEST MODAL
============================================================ */

function showProcessingModal() {

    processingModal.classList.add("show");

    modalSpinner.classList.remove("hidden");

    modalIcon.classList.add("hidden");

    modalActions.classList.add("hidden");

    // modalTitle.textContent = "Processing Extraction";
    modalTitle.textContent = "Extraction In Progress";

    modalMessage.textContent =
        "Please wait while your files are being processed.";

}


function showSuccessModal() {

    modalSpinner.classList.add("hidden");

    modalIcon.classList.remove("hidden");

    modalIcon.textContent = "✓";

    // modalTitle.textContent = "Processing Finished";
    modalTitle.textContent = "Extraction Complete";

    modalMessage.textContent =
        "Your extraction completed successfully.";

    modalActions.classList.remove("hidden");

}


function showErrorModal(message) {

    modalSpinner.classList.add("hidden");

    modalIcon.classList.remove("hidden");

    modalIcon.textContent = "✕";

    // modalTitle.textContent = "Extraction Failed";
    modalTitle.textContent = "Request Failed";

    modalMessage.textContent = message;

    modalActions.classList.remove("hidden");

}


function hideProcessingModal() {

    processingModal.classList.remove("show");

}


/* ============================================================
    MODAL BUTTONS
============================================================ */

newExtractionBtn.addEventListener("click", resetForm);

viewJobsBtn.addEventListener("click", () => {

    location.href = "jobs.html";

});


/* ============================================================
    FORM STATE
============================================================ */

function disableForm() {

    schemaSelect.disabled = true;
    documentType.disabled = true;
    customDocumentType.disabled = true;
    fileInput.disabled = true;
    extractBtn.disabled = true;

    document
        .querySelectorAll(".remove-file")
        .forEach(button => button.disabled = true);

}

function enableForm() {

    schemaSelect.disabled = false;
    documentType.disabled = false;

    if (documentType.value === "Other") {
        customDocumentType.disabled = false;
    }

    fileInput.disabled = false;

    updateExtractState();

}


/* ============================================================
    EXTRACT
============================================================ */

extractBtn.addEventListener("click", extract);


async function extract() {

    stopSession();

    disableForm();

    showProcessingModal();

    try {

        const schema = Storage.getSchema(schemaSelect.value);

        const response = await Api.createExtractionJob({

            // access_code: Storage.getAccessCode(),

            schema: schema.schema,

            documentType: getDocumentType(),

            files: selectedFiles

        });

        const job = {

            id: response.meta.job_id,

            label: `Job #${response.meta.job_id}`,

            approved: false,

            // client_reference_id: response.client_reference_id,

            // created_at: Date.now(),

            // completed_at: Date.now(),

            // document_type: getDocumentType(),

            schema_id: schema.id,
            
            schema_name: schema.name,

            // files: selectedFiles.map(file => ({
            //     name: file.name,
            //     size: file.size
            // })),

            files: [...selectedFiles],

            ...response

        };

        Storage.saveJob(job);

        showSuccessModal();

    }

    catch (error) {

        console.error(error);

        showErrorModal(
            error.message ||
            "Something went wrong while processing your extraction."
        );

    }

    finally {

        enableForm();

    }

}


/* ============================================================
    RESET
============================================================ */

function resetForm() {

    // selectedFiles = [];

    // schemaSelect.selectedIndex = 0;

    // documentType.selectedIndex = 0;

    // customDocumentType.value = "";

    // customDocumentTypeContainer.classList.add("hidden");

    // fileInput.value = "";

    renderFiles();

    hideProcessingModal();

    enableForm();

    startSession();

}


/* ============================================================
    SUCCESS / ERROR ACTIONS
============================================================ */

newExtractionBtn.addEventListener("click", resetForm);

viewJobsBtn.addEventListener("click", () => {

    location.href = "jobs.html";

});