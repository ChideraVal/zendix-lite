/* ============================================================
   DOM
============================================================ */

const schemaList = document.getElementById("schemaList");
const emptyState = document.getElementById("emptyState");

const deleteModal = document.getElementById("deleteModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");


/* ============================================================
   STATE
============================================================ */

let schemas = [];
let schemaToDelete = null;


/* ============================================================
   INITIALIZE
============================================================ */

initialize();

function initialize() {
    loadSchemas();

    cancelDeleteBtn.addEventListener("click", closeDeleteModal);

    confirmDeleteBtn.addEventListener("click", confirmDelete);
}


/* ============================================================
   LOAD
============================================================ */

function loadSchemas() {

    schemas = Storage.getSchemas().sort(
        (a, b) => b.updated_at - a.updated_at
    );

    renderSchemas();

}


/* ============================================================
   RENDER
============================================================ */

function renderSchemas() {

    schemaList.innerHTML = "";

    if (schemas.length === 0) {

        emptyState.classList.remove("hidden");
        schemaList.classList.add("hidden");

        return;

    }

    emptyState.classList.add("hidden");
    schemaList.classList.remove("hidden");

    schemas.forEach(schema => {

        const card = createSchemaCard(schema);

        schemaList.appendChild(card);

    });

}


/* ============================================================
   CARD
============================================================ */

function createSchemaCard(schema) {

    const card = document.createElement("div");

    card.className = "schema-card";

    card.innerHTML = `

        <h2 class="schema-name">
            ${escapeHtml(schema.name)}
        </h2>

        <p class="schema-description">
            ${escapeHtml(schema.description)}
        </p>

        <div class="schema-meta">

            <span>
                Created:
                ${Utils.formatDate(schema.created_at)}
            </span>

            <span>
                Updated:
                ${Utils.formatDate(schema.updated_at)}
            </span>

        </div>

        <div class="schema-actions">

            <button
                class="primary-btn edit-btn"
                data-id="${schema.id}">
                Edit
            </button>

            <button
                class="danger-btn delete-btn"
                data-id="${schema.id}">
                Delete
            </button>

        </div>

    `;

    card
        .querySelector(".edit-btn")
        .addEventListener("click", () => {

            window.location.href =
                `edit-schema.html?id=${schema.id}`;

        });

    card
        .querySelector(".delete-btn")
        .addEventListener("click", () => {

            openDeleteModal(schema.id);

        });

    return card;

}


/* ============================================================
   DELETE
============================================================ */

function openDeleteModal(schemaId) {

    schemaToDelete = schemaId;

    deleteModal.classList.add("show");

}


function closeDeleteModal() {

    schemaToDelete = null;

    deleteModal.classList.remove("show");

}


function confirmDelete() {

    if (!schemaToDelete)
        return;

    Storage.deleteSchema(schemaToDelete);

    Utils.toast("Schema deleted.");

    closeDeleteModal();

    loadSchemas();

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