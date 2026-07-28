const jobId = Utils.getQueryParam("id");

if (!jobId) {
    alert("Job not found.");
    window.location.href = "jobs.html";
    throw new Error("Missing job id.");
}

let job = Storage.getJob(Number(jobId));

if (!job) {
    alert("Job not found.");
    window.location.href = "jobs.html";
    throw new Error("Invalid job id.");
}


/* ============================================================
    DOM
============================================================ */

const actionLabel = document.getElementById("action-label");
const jobLabel = document.getElementById("job-label");

const schemaSelect = document.getElementById("schemaSelect");

const documentType = document.getElementById("documentType");

const customDocumentTypeContainer = document.getElementById("customDocumentTypeContainer");
const customDocumentType = document.getElementById("customDocumentType");

const fileList = document.getElementById("fileList");

const extractBtn = document.getElementById("extractBtn");

const requirements = document.getElementById("requirements");


/* ============================================================
    STATE
============================================================ */

let selectedFiles = [];

let currentJob = job;

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

/* ============================================================
    INITIALIZE
============================================================ */

initialize();

function initialize() {

    loadJob();

    updateExtractState();

}


/* ============================================================
    LOAD JOB
============================================================ */

function loadJob() {

    jobLabel.textContent = `${currentJob.label}`;
    actionLabel.textContent = `${currentJob.data.status === "failed" ? "Retry" : "Rerun"} Extraction`;
    extractBtn.textContent = `${currentJob.data.status === "failed" ? "Retry" : "Rerun"} Extraction`;
    document.title = `${currentJob.data.status === "failed" ? "Retry" : "Rerun"} Extraction - Zendix`;

    // Schema (read-only)
    schemaSelect.innerHTML = "";

    const option = document.createElement("option");

    option.value = currentJob.schema_id ?? "";

    option.textContent = currentJob.schema_name;

    schemaSelect.appendChild(option);

    schemaSelect.disabled = true;

    // Restore document type
    const docType = currentJob.data.details.document_type || "";

    const optionExists = Array
        .from(documentType.options)
        .some(option => option.value === docType);

    if (optionExists) {

        documentType.value = docType;

        customDocumentTypeContainer.classList.add("hidden");
        customDocumentType.value = "";

    }

    else {

        documentType.value = "Other";

        customDocumentTypeContainer.classList.remove("hidden");

        customDocumentType.value = docType;

    }

    documentType.disabled = true;

    customDocumentType.disabled = true;

    // Restore uploaded files
    selectedFiles = [...(currentJob.files || [])];

    renderFiles();

}


/* ============================================================
    FILE VALIDATION
============================================================ */

async function validateRetryFiles() {

    const errors = [];

    // Job request data
    if (!currentJob?.data?.details?.schema) {

        errors.push(
            `This job cannot be ${currentJob.data.status === "failed" ? "retried" : "reran"} because it's original schema is missing.`
        );

    }

    if (!currentJob?.data?.details?.document_type) {

        errors.push(
            `This job cannot be ${currentJob.data.status === "failed" ? "retried" : "reran"} because it's original document type is missing.`
        );

    }

    // Files
    if (!Array.isArray(selectedFiles) || selectedFiles.length === 0) {

        errors.push(
            // "This job has no files available for retry."
            // "This job cannot be retried because its original files are missing."
            `This job cannot be ${currentJob.data.status === "failed" ? "retried" : "reran"} because it's original files are missing.`
        );

        return {
            valid: false,
            errors
        };

    }

    if (selectedFiles.length > MAX_FILES) {

        errors.push(
            `This job contains more than the maximum of ${MAX_FILES} files.`
        );

    }

    let totalSize = 0;

    for (const file of selectedFiles) {

        const fileObject = await Storage.getFile(file.blobKey);

        if (!(fileObject instanceof File)) {

            errors.push(
                `${file?.name || "Unknown file"} is no longer available.`
            );

            continue;

        }

        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();

        if (!allowedExtensions.includes(extension)) {

            errors.push(
                `${file.name} is not a supported file type.`
            );

        }

        if (file.size <= 0) {

            errors.push(
                `${file.name} is empty.`
            );

        }

        totalSize += file.size;

    }

    if (totalSize > MAX_TOTAL_SIZE) {

        errors.push(
            `Total upload size exceeds ${Utils.formatFileSize(MAX_TOTAL_SIZE)}.`
        );

    }

    return {
        valid: errors.length === 0,
        errors
    };

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

        `;

        fileList.appendChild(card);

    });

}


/* ============================================================
    REQUIREMENTS
============================================================ */

async function updateExtractState() {

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

    const validation = await validateRetryFiles();

    validation.errors.forEach(error => {

        messages.push(`
            <div class="requirement">
                ⚠ ${error}
            </div>
        `);

    });

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
    console.log("starting session...")
    return;

    warmUpServer();

    resetInactivityTimer();

    keepAliveTimer = setInterval(() => {

        Api.ping().catch(() => { });

    }, KEEP_ALIVE_INTERVAL);

}


/* ============================================================
    STOP SESSION
============================================================ */

function stopSession() {
    console.log("stopping session...")
    return;

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
    console.log("resetting session...")
    return;

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
    // fileInput.disabled = true;
    extractBtn.disabled = true;

    // document
    //     .querySelectorAll(".remove-file")
    //     .forEach(button => button.disabled = true);

}

// function enableForm() {

//     schemaSelect.disabled = false;
//     documentType.disabled = false;

//     if (documentType.value === "Other") {
//         customDocumentType.disabled = false;
//     }

//     // fileInput.disabled = false;

//     updateExtractState();

// }


/* ============================================================
    EXTRACT
============================================================ */

// extractBtn.addEventListener("click", extract);
extractBtn.addEventListener("click", retryExtraction);


async function retryExtraction() {

    stopSession();

    disableForm();

    showProcessingModal();

    try {

        const files = [];

        for (const file of selectedFiles) {
            const fileObject = await Storage.getFile(file.blobKey);

            if (!fileObject) {
                throw new Error(`${file.name} is missing.`);
            }

            files.push(fileObject);
        }

        const response = await Api.createExtractionJob({

            schema: currentJob.data.details.schema,

            documentType: currentJob.data.details.document_type,

            files: files

        });

        Storage.updateJob(currentJob.id, {

            data: response.data

        });

        showSuccessModal();

    }

    catch (error) {

        console.error(error);

        showErrorModal(
            error.message ||
            `Something went wrong while ${currentJob.data.status === "failed" ? "retrying" : "rerunning"} your extraction.`
        );

    }

    finally {

        updateExtractState();

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

    // customDocumentTypeContainer.classList.add("hidden");z

    // fileInput.value = "";

    renderFiles();

    hideProcessingModal();

    // enableForm();

    startSession();

}


/* ============================================================
    SUCCESS / ERROR ACTIONS
============================================================ */

newExtractionBtn.addEventListener("click", resetForm);

viewJobsBtn.addEventListener("click", () => {

    location.href = "jobs.html";

});