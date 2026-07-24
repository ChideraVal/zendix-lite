/* ==========================================================
   STATE
========================================================== */

const PAGE_SIZE = 20;

let jobs = [];

let filteredJobs = [];

let currentPage = 1;

let currentJob = null;

let searchTimeout = null;


/* ==========================================================
   DOM
========================================================== */

const jobsTableBody = document.getElementById("jobsTableBody");

const searchInput = document.getElementById("searchInput");

const statusFilter = document.getElementById("statusFilter");

const approvalFilter = document.getElementById("approvalFilter");

const totalJobs = document.getElementById("totalJobs");

const successfulJobs = document.getElementById("successfulJobs");

const failedJobs = document.getElementById("failedJobs");

const approvedJobs = document.getElementById("approvedJobs");

const emptyState = document.getElementById("emptyState");

const pagination = document.getElementById("pagination");

const pageIndicator = document.getElementById("pageIndicator");

const previousPageBtn = document.getElementById("previousPageBtn");

const nextPageBtn = document.getElementById("nextPageBtn");

// const newExtractionBtn = document.getElementById("newExtractionBtn");

const emptyStateTitle = document.getElementById("emptyStateTitle");

const emptyStateMessage = document.getElementById("emptyStateMessage");

const emptyStateButton = document.getElementById("emptyStateButton");

const actionMenu = document.getElementById("actionMenu");

const renameModal = document.getElementById("renameModal");

const renameInput = document.getElementById("renameInput");

const saveRenameBtn = document.getElementById("saveRenameBtn");

const cancelRenameBtn = document.getElementById("cancelRenameBtn");

const deleteModal = document.getElementById("deleteModal");

const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

const errorModal = document.getElementById("errorModal");

const errorMessage = document.getElementById("errorMessage");

const closeErrorBtn = document.getElementById("closeErrorBtn");


/* ==========================================================
   INITIALIZATION
========================================================== */

function init() {

    loadJobs();

    attachEventListeners();

    refresh();

}

document.addEventListener("DOMContentLoaded", init);


/* ==========================================================
   LOAD JOBS
========================================================== */

function loadJobs() {

    jobs = Storage.getJobs();

}


/* ==========================================================
   EVENT LISTENERS
========================================================== */

function attachEventListeners() {

    /* ---------- Search ---------- */

    searchInput.addEventListener("input", () => {

        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {

            currentPage = 1;

            refresh();

        }, 300);

    });


    /* ---------- Filters ---------- */

    statusFilter.addEventListener("change", () => {

        currentPage = 1;

        refresh();

    });


    approvalFilter.addEventListener("change", () => {

        currentPage = 1;

        refresh();

    });


    /* ---------- Pagination ---------- */

    previousPageBtn.addEventListener("click", () => {

        if (currentPage > 1) {

            currentPage--;

            refresh();

        }

    });


    nextPageBtn.addEventListener("click", () => {

        const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);

        if (currentPage < totalPages) {

            currentPage++;

            refresh();

        }

    });


    /* ---------- Navigation ---------- */

    // newExtractionBtn.addEventListener("click", () => {

    //     window.location.href = "upload.html";

    // });


    // emptyStateButton.addEventListener("click", () => {

    //     window.location.href = "upload.html";

    // });


    /* ---------- Rename ---------- */

    cancelRenameBtn.addEventListener("click", () => {

        renameModal.classList.remove("show");

    });


    /* saveRenameBtn listener comes later */


    /* ---------- Delete ---------- */

    cancelDeleteBtn.addEventListener("click", () => {

        deleteModal.classList.remove("show");

    });


    /* confirmDeleteBtn listener comes later */


    /* ---------- Error ---------- */

    closeErrorBtn.addEventListener("click", () => {

        errorModal.classList.remove("show");

    });


    /* ---------- Close action menu ---------- */

    document.addEventListener("click", event => {

        if (

            !actionMenu.contains(event.target) &&

            !event.target.closest(".action-button")

        ) {

            actionMenu.classList.add("hidden");

        }

    });

}


/* ==========================================================
   REFRESH
========================================================== */

function refresh() {
    closeActionMenu();

    filteredJobs = getFilteredJobs();

    renderStatistics();

    renderJobs();

    renderPagination();

}


/* ==========================================================
   FILTERING
========================================================== */

function getFilteredJobs() {

    const search = searchInput.value.trim().toLowerCase();

    const status = statusFilter.value;

    const approval = approvalFilter.value;

    return jobs.filter(job => {

        /* ---------- Status ---------- */

        if (
            status !== "all" &&
            job.data.status !== status
        ) {
            return false;
        }

        /* ---------- Approval ---------- */

        if (
            approval !== "all"
        ) {

            const approved =
                approval === "approved";

            if ((job.approved || false) !== approved) {
                return false;
            }

        }

        /* ---------- Search ---------- */

        if (!search)
            return true;

        const jobLabel =
            (job.label || job.id || "")
                .toLowerCase();

        const schemaName =
            (job.schema_name || "")
                .toLowerCase();

        const documentType =
            (job.data.details.document_type || "")
                .toLowerCase();

        const fileNames =
            (job.files || [])
                .map(file => {

                    if (typeof file === "string")
                        return file.toLowerCase();

                    return (file.name || "")
                        .toLowerCase();

                })
                .join(" ");

        return (

            jobLabel.includes(search)

            ||

            schemaName.includes(search)

            ||

            documentType.includes(search)

            ||

            fileNames.includes(search)

        );

    });

}


function clearFilters() {

    searchInput.value = "";

    statusFilter.value = "all";

    approvalFilter.value = "all";

    currentPage = 1;

    refresh();

}


/* ==========================================================
   STATISTICS
========================================================== */

function renderStatistics() {

    totalJobs.textContent =
        jobs.length;

    successfulJobs.textContent =
        jobs.filter(job => job.data.status === "successful").length;

    failedJobs.textContent =
        jobs.filter(job => job.data.status === "failed").length;

    approvedJobs.textContent =
        jobs.filter(job => job.approved).length;

}


/* ==========================================================
   TABLE
========================================================== */

function renderJobs() {

    jobsTableBody.innerHTML = "";

    // if (filteredJobs.length === 0) {

    //     emptyState.classList.remove("hidden");

    //     pagination.classList.add("hidden");

    //     return;

    // }

    if (jobs.length === 0) {

        emptyState.classList.remove("hidden");

        pagination.classList.add("hidden");

        emptyStateTitle.textContent =
            "No jobs yet";

        emptyStateMessage.textContent =
            "You haven't created any extraction jobs yet.";

        emptyStateButton.textContent =
            "New Extraction";

        emptyStateButton.onclick = () => {
            location.href = "upload.html";
        };

        return;

    }
    else if (filteredJobs.length === 0) {

        emptyState.classList.remove("hidden");

        pagination.classList.add("hidden");

        emptyStateTitle.textContent =
            "No jobs found";

        emptyStateMessage.textContent =
            "Try changing your search or filters.";

        emptyStateButton.textContent =
            "Clear Filters";

        emptyStateButton.onclick = clearFilters;

        return;

    }

    emptyState.classList.add("hidden");

    pagination.classList.remove("hidden");

    const start =
        (currentPage - 1) * PAGE_SIZE;

    const end =
        start + PAGE_SIZE;

    const pageJobs =
        filteredJobs.slice(start, end);

    pageJobs.forEach(job => {

        jobsTableBody.appendChild(
            createJobRow(job)
        );

    });

}


/* ==========================================================
   ROW
========================================================== */

function createJobRow(job) {

    const tr =
        document.createElement("tr");

    const jobLabel =
        job.label || job.id;

    const fileCount =
        (job.files || []).length;

    tr.innerHTML = `

        <td data-label="Job">

            <div class="job-name">

                ${escapeHtml(jobLabel)}

            </div>

            <span class="job-id">

                ${escapeHtml(job.id)}

            </span>

        </td>

        <td data-label="Document">

            ${escapeHtml(job.data.details.document_type)}

        </td>

        <td data-label="Schema">

            ${escapeHtml(job.schema_name)}

        </td>

        <td data-label="Files">

            ${fileCount}

        </td>

        <td data-label="Status">

            ${statusBadge(job.data.status)}

        </td>

        <td data-label="Approval">

            ${approvalBadge(job.approved)}

        </td>

        <td data-label="Updated">

            ${Utils.formatDate(job.data.details.created_at)}

        </td>

        <td data-label="Actions">

            <button
                class="action-button"
                data-job="${job.id}">

                ⋮

            </button>

        </td>

    `;

    tr
        .querySelector(".action-button")
        .addEventListener("click", event => {

            event.stopPropagation();

            openActionMenu(
                event.currentTarget,
                job
            );

        });

    return tr;

}


/* ==========================================================
   PAGINATION
========================================================== */

function renderPagination() {

    if (filteredJobs.length === 0) {

        pagination.classList.add("hidden");

        return;

    }

    pagination.classList.remove("hidden");

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredJobs.length / PAGE_SIZE
            )
        );

    if (currentPage > totalPages)
        currentPage = totalPages;

    pageIndicator.textContent =
        `Page ${currentPage} of ${totalPages}`;

    previousPageBtn.disabled =
        currentPage === 1;

    nextPageBtn.disabled =
        currentPage === totalPages;

}


/* ==========================================================
   ACTION MENU
========================================================== */

function openActionMenu(button, job) {

    currentJob = job;

    actionMenu.innerHTML = "";

    addActionMenuItem(
        "Rename",
        () => openRenameModal(job)
    );

    if (job.data.status === "successful") {

        // addActionMenuItem(
        //     "Open Review",
        //     () => openReview(job)
        // );

        // addActionMenuItem(
        //     "View In Table",
        //     () => openExtractedData(job)
        // );

        addActionMenuItem(
            "Rerun Extraction",
            () => openRetry(job)
        );

    } else {

        addActionMenuItem(
            "Retry Extraction",
            () => openRetry(job)
        );

        addActionMenuItem(
            "View Error",
            () => openErrorModal(job)
        );

    }

    addActionMenuItem(
        "Open Review",
        () => openReview(job)
    );

    addActionMenuItem(
        "View In Table",
        () => openExtractedData(job)
    );

    addActionMenuItem(
        "Delete",
        () => openDeleteModal(job)
    );

    actionMenu.classList.remove("hidden");

    positionActionMenu(button);
}

function closeActionMenu() {

    currentJob = null;

    actionMenu.classList.add("hidden");

}

window.addEventListener("scroll", closeActionMenu, true);

window.addEventListener("resize", closeActionMenu);
/* ==========================================================
   MENU ITEM
========================================================== */

function addActionMenuItem(text, callback) {

    const button =
        document.createElement("button");

    button.textContent = text;

    button.addEventListener("click", () => {

        actionMenu.classList.add("hidden");

        callback();

    });

    actionMenu.appendChild(button);

}


/* ==========================================================
   MENU POSITION
========================================================== */

// function positionActionMenu(button) {

//     const rect =
//         button.getBoundingClientRect();

//     const menuWidth = 220;

//     const spacing = 6;

//     let left =
//         rect.right - menuWidth;

//     let top =
//         rect.bottom + spacing;

//     if (left < 12) {

//         left = 12;

//     }

//     if (top + 250 > window.innerHeight) {

//         top =
//             rect.top - 250;

//     }

//     actionMenu.style.left =
//         `${left}px`;

//     actionMenu.style.top =
//         `${top}px`;

// }

function positionActionMenu(button) {

    const rect = button.getBoundingClientRect();

    const menuWidth = actionMenu.offsetWidth;
    const menuHeight = actionMenu.offsetHeight;

    const margin = 8;

    let left = rect.right - menuWidth;
    let top = rect.bottom + margin;

    /* ---------- Horizontal ---------- */

    if (left < margin) {
        left = margin;
    }

    if (left + menuWidth > window.innerWidth - margin) {
        left = window.innerWidth - menuWidth - margin;
    }

    /* ---------- Vertical ---------- */

    if (top + menuHeight > window.innerHeight - margin) {

        top = rect.top - menuHeight - margin;

    }

    if (top < margin) {

        top = margin;

    }

    actionMenu.style.left = `${left}px`;
    actionMenu.style.top = `${top}px`;

}

/* ==========================================================
   OPEN REVIEW
========================================================== */

function openReview(job) {

    window.location.href =
        `review.html?id=${job.id}`;

}


/* ==========================================================
   VIEW EXTRACTED DATA
========================================================== */

function openExtractedData(job) {

    window.location.href =
        `table.html?id=${job.id}`;

}


/* ==========================================================
   RETRY JOB
========================================================== */

function openRetry(job) {

    window.location.href =
        `retry.html?id=${job.id}`;

}


/* ==========================================================
   VIEW ERROR
========================================================== */

function openErrorModal(job) {

    errorMessage.textContent =
        job.data.error || "Unknown error.";

    errorModal.classList.add("show");

}


/* ==========================================================
   RENAME
========================================================== */

function openRenameModal(job) {

    currentJob = job;

    renameInput.value =
        job.label || job.id;

    renameModal.classList.add("show");

    renameInput.focus();

    renameInput.select();

}


saveRenameBtn.addEventListener("click", saveRename);

renameInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {

        saveRename();

    }

});


function saveRename() {

    if (!currentJob)
        return;

    const label =
        renameInput.value.trim();

    if (!label) {

        Utils.toast("Job name cannot be empty.");

        return;

    }

    Storage.updateJob(currentJob.id, {

        label: label

    });

    renameModal.classList.remove("show");

    loadJobs();

    refresh();

    Utils.toast("Job renamed successfully.");

}


/* ==========================================================
   DELETE
========================================================== */

function openDeleteModal(job) {

    currentJob = job;

    deleteModal.classList.add("show");

}


confirmDeleteBtn.addEventListener("click", deleteCurrentJob);


async function deleteCurrentJob() {

    if (!currentJob)
        return;

    await Storage.deleteJob(currentJob.id);

    deleteModal.classList.remove("show");

    loadJobs();

    refresh();

    Utils.toast("Job deleted.");

}


/* ==========================================================
   CLOSE MODALS
========================================================== */

document.querySelectorAll(".modal")
    .forEach(modal => {

        modal.addEventListener("click", event => {

            if (event.target === modal) {

                modal.classList.remove("show");

            }

        });

    });


/* ==========================================================
   STATUS BADGES
========================================================== */

function statusBadge(status) {

    if (status === "successful") {

        return `
            <span class="badge badge-success">
                Successful
            </span>
        `;

    }

    return `
        <span class="badge badge-failed">
            Failed
        </span>
    `;

}


/* ==========================================================
   APPROVAL BADGES
========================================================== */

function approvalBadge(approved) {

    if (approved) {

        return `
            <span class="badge badge-approved">
                Approved
            </span>
        `;

    }

    return `
        <span class="badge badge-unapproved">
            Unapproved
        </span>
    `;

}


/* ==========================================================
   ESCAPE HTML
========================================================== */

function escapeHtml(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;

}


/* ==========================================================
   DATE
========================================================== */

function formatJobDate(timestamp) {

    if (!timestamp)
        return "-";

    return Utils.formatDate(timestamp);

}


/* ==========================================================
   JOB LABEL
========================================================== */

function getJobLabel(job) {

    return job.label || job.id;

}


/* ==========================================================
   FILE COUNT
========================================================== */

function getFileCount(job) {

    return (job.files || []).length;

}


/* ==========================================================
   JOB STATUS
========================================================== */

function isSuccessful(job) {

    return job.data.status === "successful";

}


/* ==========================================================
   APPROVAL STATUS
========================================================== */

function isApproved(job) {

    return job.approved === true;

}