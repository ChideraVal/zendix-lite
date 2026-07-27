/* ==========================================================
   REVIEW PAGE
   Part 1 - Initialization
   ========================================================== */

// const params = new URLSearchParams(window.location.search);
// const jobId = params.get("id");

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

/* ==========================================================
   DOM
   ========================================================== */

const jobTitle = document.getElementById("jobTitle");
const jobSubtitle = document.getElementById("jobSubtitle");

const jobDetails = document.getElementById("jobDetails");
const fileList = document.getElementById("fileList");
const filePreview = document.getElementById("filePreview");
const openInTabLink = document.getElementById("openInNewTab");
const downloadLink = document.getElementById("downloadFile");

const downloadBtn = document.getElementById("downloadBtn");
const retryBtn = document.getElementById("retryBtn");
const viewTableBtn = document.getElementById("viewTableBtn");
const saveBtn = document.getElementById("saveBtn");
const approveBtn = document.getElementById("approveBtn");

const toast = document.getElementById("toast");

/* ==========================================================
   Preview State
   ========================================================== */

let currentFile = null;

/* ==========================================================
   Page Header
   ========================================================== */

// jobTitle.textContent = job.label || "Review Extraction";

// jobSubtitle.textContent =
//     `${job.files.length} file${job.files.length === 1 ? "" : "s"}`;

jobTitle.textContent = "Review Extraction";
jobSubtitle.textContent = `${job.label}`;
/* ==========================================================
   Toast
   ========================================================== */

let toastTimer = null;

function showToast(message) {

    clearTimeout(toastTimer);

    toast.textContent = message;

    toast.classList.add("show");

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}

/* ==========================================================
   Update Approve Button On Load And Save
   ========================================================== */

function updateApproveButton() {
    const color = job.approved ? "red" : "#16A34A";
    approveBtn.style.background = color;

    if (job.approved) {
        approveBtn.textContent = "Unapprove";
        approveBtn.classList.remove("primary");
        approveBtn.classList.add("secondary")
    } else {
        approveBtn.textContent = "Approve";
        approveBtn.classList.remove("secondary");
        approveBtn.classList.add("primary");
    }
}

/* ==========================================================
   Part 2 - Job Details & File List
   ========================================================== */

function niceBytes(bytes) {

    if (bytes == null) return "-";

    const units = ["B", "KB", "MB", "GB", "TB"];

    let value = bytes;
    let unit = 0;

    while (value >= 1024 && unit < units.length - 1) {

        value /= 1024;
        unit++;

    }

    return `${value.toFixed(value >= 100 ? 0 : 2)} ${units[unit]}`;

}

function formatDate(date) {

    if (!date)
        return "-";

    return new Date(date).toLocaleString();

}

function renderJobDetails() {

    jobDetails.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Name</span>
            <span class="detail-value">${job.label || "-"}</span>
        </div>

        <div class="detail-row">
            <span class="detail-label">Schema</span>
            <span class="detail-value">${job.schema_name || "-"}</span>
        </div>

        <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value">
                <span class="status-badge ${job.data.status === "successful" ? "success" : "failed"}">
                ${job.data.status || "-"}
                </span>
            </span>
        </div>

        <div class="detail-row">
            <span class="detail-label">Approved</span>
            <span class="detail-value">
                <span class="status-badge ${job.approved ? "badge-approved" : "badge-unapproved"}">
                ${job.approved ? "Yes" : "No"}
                </span>
            </span>
        </div>

        <div class="detail-row">
            <span class="detail-label">Files</span>
            <span class="detail-value">${job.files.length}</span>
        </div>

        <div class="detail-row">
            <span class="detail-label">Created</span>
            <span class="detail-value">${formatDate(job.data.details.created_at)}</span>
        </div>
    `;

}

function renderFileList() {

    fileList.innerHTML = "";

    if (!job.files.length) {

        fileList.innerHTML = `
            <div class="empty-state">
                No files attached.
            </div>
        `;

        return;

    }

    job.files.forEach(file => {

        const button = document.createElement("button");

        button.type = "button";
        button.className = "file-item";

        button.innerHTML = `
            <div class="file-name">
                ${file.name}
            </div>

            <div class="file-size">
                ${niceBytes(file.size)}
            </div>
        `;

        button.addEventListener("click", () => {

            document
                .querySelectorAll(".file-item")
                .forEach(item => item.classList.remove("active"));

            button.classList.add("active");

            previewFile(file.blobKey);

        });

        fileList.appendChild(button);

    });

}

/* ==========================================================
   Initial Render
   ========================================================== */

// renderJobDetails();
// renderFileList();


/* ==========================================================
   Part 3 - File Preview
   ========================================================== */

let previewUrl = "";

function generatePreviewLinks(file) {

    URL.revokeObjectURL(previewUrl);

    const newTabUrl = URL.createObjectURL(file);

    previewUrl = newTabUrl;

    openInTabLink.href = newTabUrl;

    downloadLink.href = newTabUrl;

    openInTabLink.textContent = "Open in external tab";

    downloadLink.textContent = "Download";

    downloadLink.download = file.name;

}


async function previewFile(blobKey) {

    filePreview.innerHTML = `
        <div class="empty-state">
            Loading preview...
        </div>
    `;

    try {

        const file = await Storage.getFile(blobKey);

        if (!file) {

            filePreview.innerHTML = `
                <div class="empty-state">
                    File not found.
                </div>
            `;

            return;

        }

        currentFile = file;

        const extension = (
            file.name.split(".").pop() || ""
        ).toLowerCase();

        switch (extension) {

            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
            case "webp":
            case "bmp":
            case "svg":

                renderImage(file);
                generatePreviewLinks(file);
                break;

            case "pdf":

                renderPdf(file);
                generatePreviewLinks(file);
                break;

            case "txt":

                renderText(file);
                generatePreviewLinks(file);
                break;

            case "csv":

                renderCsv(file);
                generatePreviewLinks(file);
                break;

            default:

                renderUnsupported(file);

        }

    } catch (error) {

        console.error(error);

        filePreview.innerHTML = `
            <div class="empty-state">
                Failed to load preview.
            </div>
        `;

    }

}

function clearPreview() {

    currentFile = null;

    filePreview.innerHTML = `
        <div class="empty-state">
            Select a file to preview.
        </div>
    `;

}

function renderUnsupported(file) {

    filePreview.innerHTML = `
        <div class="empty-state">

            <p>
                Preview is not available for this file type.
            </p>

            <p style="margin-top:8px;">
                <strong>${escapeHtml(file.name)}</strong>
            </p>

        </div>
    `;

}

function escapeHtml(text) {

    return String(text).replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]
    );

}


/* ==========================================================
   Part 4A - Preview Helpers, Image & PDF
   ========================================================== */

function clearPreviewContent() {

    filePreview.innerHTML = "";

}

function makeBtn(text, onClick) {

    const button = document.createElement("button");

    button.type = "button";
    button.className = "btn secondary";

    button.textContent = text;

    button.addEventListener("click", onClick);

    return button;

}

/* ==========================================================
   Image Renderer
   ========================================================== */

function renderImage(file) {

    clearPreviewContent();

    const objectUrl = URL.createObjectURL(file);

    const toolbar = document.createElement("div");
    toolbar.className = "preview-toolbar";

    const container = document.createElement("div");
    container.className = "image-preview";

    const image = document.createElement("img");

    image.src = objectUrl;
    image.alt = file.name;

    container.appendChild(image);

    let scale = 1;

    function updateZoom() {

        image.style.transform = `scale(${scale})`;

    }

    toolbar.appendChild(
        makeBtn("Zoom -", () => {

            scale = Math.max(0.25, scale - 0.25);

            updateZoom();

        })
    );

    toolbar.appendChild(
        makeBtn("Zoom +", () => {

            scale = Math.min(4, scale + 0.25);

            updateZoom();

        })
    );

    toolbar.appendChild(
        makeBtn("Fit", () => {

            scale = 1;

            updateZoom();

        })
    );

    filePreview.appendChild(toolbar);
    filePreview.appendChild(container);

    image.onload = () => {

        URL.revokeObjectURL(objectUrl);

    };

}

/* ==========================================================
   PDF Renderer
   ========================================================== */

function renderPdf(file) {

    clearPreviewContent();

    const objectUrl = URL.createObjectURL(file);

    const iframe = document.createElement("iframe");

    iframe.className = "pdf-preview";

    iframe.src = objectUrl;

    iframe.onload = () => {

        setTimeout(() => {

            URL.revokeObjectURL(objectUrl);

        }, 1000);

    };

    filePreview.appendChild(iframe);

}


/* ==========================================================
   Part 4B - Text & CSV Renderers
   ========================================================== */

async function renderText(file) {

    clearPreviewContent();

    const toolbar = document.createElement("div");
    toolbar.className = "preview-toolbar";

    const pre = document.createElement("pre");
    pre.className = "text-preview";

    pre.textContent = await file.text();

    let fontSize = 14;

    function updateFontSize() {

        pre.style.fontSize = `${fontSize}px`;

    }

    toolbar.appendChild(
        makeBtn("A-", () => {

            fontSize = Math.max(8, fontSize - 2);

            updateFontSize();

        })
    );

    toolbar.appendChild(
        makeBtn("A+", () => {

            fontSize = Math.min(40, fontSize + 2);

            updateFontSize();

        })
    );

    updateFontSize();

    filePreview.appendChild(toolbar);
    filePreview.appendChild(pre);

}

async function renderCsv(file) {

    clearPreviewContent();

    const toolbar = document.createElement("div");
    toolbar.className = "preview-toolbar";

    const wrapper = document.createElement("div");
    wrapper.className = "csv-preview";

    const table = document.createElement("table");

    const text = await file.text();

    const rows = text
        .split(/\r?\n/)
        .filter(Boolean)
        .map(parseCsvRow);

    if (!rows.length) {

        wrapper.innerHTML = `
            <div class="empty-state">
                Empty CSV file.
            </div>
        `;

        filePreview.appendChild(wrapper);

        return;

    }

    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    const headerRow = document.createElement("tr");

    rows[0].forEach(value => {

        const th = document.createElement("th");

        th.textContent = value;

        headerRow.appendChild(th);

    });

    thead.appendChild(headerRow);

    for (let i = 1; i < rows.length; i++) {

        const tr = document.createElement("tr");

        rows[i].forEach(value => {

            const td = document.createElement("td");

            td.textContent = value;

            tr.appendChild(td);

        });

        tbody.appendChild(tr);

    }

    table.appendChild(thead);
    table.appendChild(tbody);

    wrapper.appendChild(table);

    let fontSize = 13;

    function updateFontSize() {

        table
            .querySelectorAll("th, td")
            .forEach(cell => {

                cell.style.fontSize = `${fontSize}px`;

            });

    }

    toolbar.appendChild(
        makeBtn("A-", () => {

            fontSize = Math.max(8, fontSize - 1);

            updateFontSize();

        })
    );

    toolbar.appendChild(
        makeBtn("A+", () => {

            fontSize = Math.min(30, fontSize + 1);

            updateFontSize();

        })
    );

    updateFontSize();

    filePreview.appendChild(toolbar);
    filePreview.appendChild(wrapper);

}


/* ==========================================================
   Part 4C - CSV Helper & Initialization
   ========================================================== */

function parseCsvRow(row) {

    const cells = [];

    let current = "";
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {

        const character = row[i];

        if (character === '"') {

            if (inQuotes && row[i + 1] === '"') {

                current += '"';
                i++;

            } else {

                inQuotes = !inQuotes;

            }

        } else if (character === "," && !inQuotes) {

            cells.push(current);
            current = "";

        } else {

            current += character;

        }

    }

    cells.push(current);

    return cells;

}

async function reloadJob() {

    job = Storage.getJob(Number(jobId));

    renderJobDetails();

    updateApproveButton();

}

/* ==========================================================
   Page Initialization
   ========================================================== */

function loadReviewPage() {

    renderJobDetails();

    renderFileList();

    if (job.files.length > 0) {

        previewFile(job.files[0].blobKey);

    }

    updateApproveButton();

}

loadReviewPage();








/* ----------------------------
   JSON Form Editor (right panel)
   Full feature set: shape JSON, nested arrays & objects, friendly labels,
   descriptive Add/Remove buttons, modal confirmation (modal DOM exists above).
   ---------------------------- */

(function () {
    // Modal references
    const confirmBackdrop = document.getElementById('confirmBackdrop');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOk = document.getElementById('confirmOk');
    const confirmCancel = document.getElementById('confirmCancel');

    let pendingConfirm = null;
    function showDeleteConfirm(message, onConfirm) {
        pendingConfirm = { onConfirm };
        confirmMessage.textContent = message;
        confirmBackdrop.style.display = 'flex';
        // confirmBackdrop.setAttribute('aria-hidden', 'false');
        // confirmOk.focus();
    }
    function hideDeleteConfirm() {
        pendingConfirm = null;
        confirmBackdrop.style.display = 'none';
        // confirmBackdrop.setAttribute('aria-hidden', 'true');
    }
    confirmOk.addEventListener('click', () => { if (pendingConfirm && typeof pendingConfirm.onConfirm === 'function') { try { pendingConfirm.onConfirm(); } catch (e) { console.error(e); } } hideDeleteConfirm(); });
    confirmCancel.addEventListener('click', () => hideDeleteConfirm());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && confirmBackdrop.style.display === 'flex') hideDeleteConfirm(); });

    // Helper utilities
    function createElem(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);
        for (const k in attrs) {
            if (k === 'class') el.className = attrs[k];
            else if (k === 'text') el.textContent = attrs[k];
            else el.setAttribute(k, attrs[k]);
        }
        for (const c of children) {
            if (typeof c === 'string') el.appendChild(document.createTextNode(c));
            else if (c) el.appendChild(c);
        }
        return el;
    }
    function detectType(v) {
        if (Array.isArray(v)) return 'array';
        if (v === null) return 'null';
        return typeof v;
    }
    function deepClone(v) { return JSON.parse(JSON.stringify(v)); }
    function singularize(name) {
        if (!name || typeof name !== 'string') return 'item';
        if (name.endsWith('ies')) return name.slice(0, -3) + 'y';
        if (name.endsWith('ses')) return name.slice(0, -2);
        if (name.endsWith('s') && name.length > 1) return name.slice(0, -1);
        return name;
    }

    function displayType(type) {
        switch (type) {
            case 'array': return 'list';
            case 'object': return 'group';
            case 'string': return 'text';
            case 'number': return 'number';
            case 'boolean': return 'true/false';
            case 'null': return 'empty';
            default: return type;
        }
    }
    // function getSampleForPath(shapeRoot, pathParts) {
    //     if (!shapeRoot) return undefined;
    //     let node = shapeRoot;
    //     for (let p of pathParts) {
    //         if (node === undefined || node === null) return undefined;
    //         if (Array.isArray(node)) node = node[0];
    //         if (node && typeof node === 'object') node = node[p];
    //         else return undefined;
    //     }
    //     return node;
    // }



    // function normalizeSchema(node) {
    //     // Convert shorthand "string" → { type: "string" }
    //     if (typeof node === 'string') {
    //         return { type: node };
    //     }

    //     if (Array.isArray(node)) {
    //         return normalizeSchema(node[0]);
    //     }

    //     if (node && typeof node === 'object') {
    //         // normalize object properties
    //         if (node.type === 'object' && node.properties) {
    //             const newProps = {};
    //             for (const k in node.properties) {
    //                 newProps[k] = normalizeSchema(node.properties[k]);
    //             }
    //             return { ...node, properties: newProps };
    //         }

    //         // normalize array items
    //         if (node.type === 'array' && node.items) {
    //             return { ...node, items: normalizeSchema(node.items) };
    //         }

    //         return node;
    //     }

    //     return node;
    // }

    function normalizeSchema(node) {
        // Normalize shorthand strings, array-samples, and nested properties/items
        if (node === null) return { type: 'null' };
        if (typeof node === 'string') {
            // "string"  -> { type: "string" }
            return { type: node };
        }
        if (Array.isArray(node)) {
            // Array literal sample => treat as array schema with items = normalized first element
            if (node.length === 0) return { type: 'array', items: {} };
            return { type: 'array', items: normalizeSchema(node[0]) };
        }
        if (typeof node !== 'object') {
            // Unknown primitive - can't normalize further
            return node;
        }

        // If the node already has explicit type / items / properties, normalize recursively
        const out = { ...node };

        // If it's an object schema or it looks like properties (shorthand top-level object),
        // ensure we return { type: 'object', properties: {...} } form.
        if (out.type === 'object' || out.properties) {
            out.type = out.type || 'object';
            const props = out.properties || {};
            const newProps = {};
            for (const k of Object.keys(props)) {
                newProps[k] = normalizeSchema(props[k]);
            }
            out.properties = newProps;
            return out;
        }

        // If it's an array schema
        if (out.type === 'array' || out.items) {
            out.type = out.type || 'array';
            out.items = normalizeSchema(out.items === undefined ? {} : out.items);
            return out;
        }

        // If it doesn't declare type/properties/items but is a plain object, treat as shorthand
        // e.g. { "fail reason": "string", "orders": { type: "array", ... } }
        if (!out.type && !out.properties && Object.keys(out).length > 0) {
            // map each key as a property
            const props = {};
            for (const k of Object.keys(out)) props[k] = normalizeSchema(out[k]);
            return { type: 'object', properties: props };
        }

        // fallback: return shallow copy
        return out;
    }


    // function getSchemaForPath(shapeRoot, pathParts) {
    //     if (!shapeRoot) return undefined;
    //     let node = shapeRoot;

    //     for (let p of pathParts) {
    //         if (node === undefined || node === null) return undefined;

    //         if (Array.isArray(node)) {
    //             node = node[0];
    //             continue;
    //         }

    //         if (typeof node === 'object') {
    //             if (node.type === 'array' && node.items !== undefined) {
    //                 node = node.items;
    //                 continue;
    //             }

    //             if (node.type === 'object' && node.properties && node.properties[p] !== undefined) {
    //                 node = node.properties[p];
    //                 continue;
    //             }

    //             if (node[p] !== undefined) {
    //                 node = node[p];
    //                 continue;
    //             }
    //         }

    //         return undefined;
    //     }

    //     return normalizeSchema(node);
    // }

    function getSchemaForPath(shapeRoot, pathParts) {
        if (!shapeRoot) return undefined;
        let node = shapeRoot;

        for (let p of pathParts) {
            if (node === undefined || node === null) return undefined;

            // If top-level has direct key (our shape JSON often does), follow it
            if (node[p] !== undefined) {
                node = node[p];
                continue;
            }

            // If node is an array literal sample, descend into first item
            if (Array.isArray(node)) {
                node = node[0];
                continue;
            }

            // If node has a 'type' field, branch accordingly
            if (typeof node === 'object') {
                // If it's an array schema, go into items
                if (node.type === 'array' && node.items !== undefined) {
                    node = node.items;
                    continue;
                }
                // If it's an object schema with properties, go into that property
                if (node.type === 'object' && node.properties && node.properties[p] !== undefined) {
                    node = node.properties[p];
                    continue;
                }
                // If it's an object schema but the property doesn't exist explicitly, stop
                if (node.type === 'object' && node.properties && node.properties[p] === undefined) {
                    return undefined;
                }
            }

            // Otherwise cannot descend
            return undefined;
        }

        // Always return a normalized schema node so callers can rely on {type, properties, items}
        return normalizeSchema(node);
    }


    // function createDefaultFromSchema(schema) {
    //     schema = normalizeSchema(schema);
    //     if (schema === undefined || schema === null) return undefined;
    //     if (Array.isArray(schema)) return createDefaultFromSchema(schema[0]);
    //     if (typeof schema !== 'object') return undefined;

    //     const t = schema.type;

    //     switch (t) {
    //         case 'number': return 0.0;
    //         case 'integer': return 0;
    //         case 'string': return '';
    //         case 'boolean': return false;
    //         case 'null': return null;
    //         case 'array':
    //             if (schema.items) {
    //                 const child = createDefaultFromSchema(schema.items);
    //                 return child === undefined ? [] : [child];
    //             }
    //             return [];
    //         case 'object': {
    //             const out = {};
    //             const props = schema.properties || {};
    //             for (const k of Object.keys(props)) out[k] = createDefaultFromSchema(props[k]);
    //             return out;
    //         }
    //         default:
    //             if (schema.properties) {
    //                 const o = {};
    //                 for (const k of Object.keys(schema.properties)) o[k] = createDefaultFromSchema(schema.properties[k]);
    //                 return o;
    //             }
    //             return undefined;
    //     }
    // }

    function createDefaultFromSchema(schema) {
        // Normalize shorthand first
        schema = normalizeSchema(schema);
        if (schema === undefined || schema === null) return undefined;

        // If schema is still not object, can't build
        if (typeof schema !== 'object') return undefined;

        const t = schema.type;

        switch (t) {
            case 'number':
            case 'float':
            case 'double':
                return 0.0;
            case 'integer': return 0;
            case 'string': return '';
            case 'boolean': return false;
            case 'null': return null;
            case 'array': {
                // Build a representative array with one default child if possible
                if (schema.items) {
                    const child = createDefaultFromSchema(schema.items);
                    return child === undefined ? [] : [child];
                }
                return [];
            }
            case 'object': {
                const out = {};
                const props = schema.properties || {};
                // IMPORTANT: we must add **all** declared properties, even if their default is undefined
                for (const k of Object.keys(props)) {
                    out[k] = createDefaultFromSchema(props[k]);
                }
                return out;
            }
            default:
                // If no explicit type but has properties, treat as object
                if (schema.properties) {
                    const o = {};
                    for (const k of Object.keys(schema.properties)) o[k] = createDefaultFromSchema(schema.properties[k]);
                    return o;
                }
                return undefined;
        }
    }


    // function readShape() {
    //     const raw = document.getElementById('shapeInput').value.trim();
    //     if (!raw) return null;
    //     try { return JSON.parse(raw); } catch (e) { console.warn('Invalid shape JSON'); return null; }
    // }

    function readShape() {
        return job.data.details.schema || null;
    }

    // Primitive renderer
    function renderPrimitive(value, origType) {
        const wrapper = createElem('div', { class: 'primitive-wrapper' });
        if (origType === 'boolean') {
            const input = createElem('input', { type: 'checkbox' });
            input.checked = Boolean(value);
            input.dataset.primType = 'boolean';
            wrapper.appendChild(input);
        } else if (origType === 'number') {
            const input = createElem('input', { type: 'number', step: 'any' });
            input.value = (value === null || value === undefined) ? '' : String(value);
            input.dataset.primType = 'number';
            wrapper.appendChild(input);
        } else if (origType === 'null') {
            const sel = createElem('select', {});
            sel.dataset.primType = 'null';
            ['null', 'string', 'number', 'boolean'].forEach(opt => {
                const o = createElem('option', { value: opt, text: opt });
                if (opt === 'null') o.selected = true;
                sel.appendChild(o);
            });
            const txt = createElem('input', { type: 'text' }); txt.style.display = 'none';
            sel.addEventListener('change', () => {
                const t = sel.value; sel.dataset.primType = t;
                if (t === 'null') { txt.style.display = 'none'; txt.value = ''; } else { txt.style.display = 'inline-block'; txt.type = (t === 'number' ? 'number' : 'text'); }
            });
            wrapper.appendChild(sel); wrapper.appendChild(txt);
        } else {
            const input = createElem('input', { type: 'text' });
            input.value = (value === null || value === undefined) ? '' : String(value);
            input.dataset.primType = 'string';
            wrapper.appendChild(input);
        }

        wrapper.readValue = function () {
            const child = wrapper.querySelector('[data-prim-type]');
            if (!child) return null;
            const t = child.dataset.primType;
            if (child.tagName === 'SELECT') {
                if (t === 'null') return null;
                const adj = wrapper.querySelector('input[type="text"], input[type="number"]');
                if (!adj) return null;
                if (t === 'number') return adj.value === '' ? null : Number(adj.value);
                if (t === 'boolean') return adj.checked;
                return adj.value;
            }
            if (t === 'boolean') return child.checked;
            if (t === 'number') return child.value === '' ? null : Number(child.value);
            return child.value;
        };

        return wrapper;
    }

    // Object renderer
    function renderObject(obj, pathParts = [], shapeRoot = null) {
        const container = createElem('div', { class: 'object-block' });
        container.dataset.role = 'object';

        for (const key of Object.keys(obj)) {
            const val = obj[key];
            const type = detectType(val);
            const row = createElem('div', { class: 'prop-row' });
            const label = createElem('label', { text: key });
            const ctrl = createElem('div', { class: 'prop-controls' });

            if (type === 'object') {
                const details = createElem('details', { open: true }, [
                    // createElem('summary', {}, [key + ' (object)']),
                    createElem('summary', {}, [key + ` (${displayType('object')})`]),
                    renderObject(val, pathParts.concat([key]), shapeRoot)
                ]);
                container.appendChild(details);
            } else if (type === 'array') {
                const arrNode = renderArray(val, pathParts.concat([key]), key, shapeRoot);
                const details = createElem('details', { open: true }, [
                    // createElem('summary', {}, [key + ' (array)']),
                    createElem('summary', {}, [key + ` (${displayType('array')})`]),
                    arrNode
                ]);
                container.appendChild(details);
            } else {
                const prim = renderPrimitive(val, type);
                ctrl.appendChild(prim);
                row.appendChild(label); row.appendChild(ctrl); container.appendChild(row);
            }
        }

        container.readValue = function () {
            const out = {};
            for (const child of container.children) {
                if (child.tagName === 'DETAILS') {
                    const summary = child.querySelector('summary').textContent;
                    const key = summary.split(' (')[0];
                    const inner = child.querySelector('[data-role="object"], [data-role="array"], .object-block, .array-block');
                    if (!inner) { out[key] = null; continue; }
                    if (inner.dataset && inner.dataset.role === 'object') out[key] = inner.readValue();
                    else if (inner.dataset && inner.dataset.role === 'array') out[key] = inner.readValue();
                    else {
                        const prim = inner.querySelector('.primitive-wrapper');
                        out[key] = prim && prim.readValue ? prim.readValue() : null;
                    }
                } else if (child.classList && child.classList.contains('prop-row')) {
                    const key = child.querySelector('label').textContent;
                    const primWrapper = child.querySelector('.primitive-wrapper');
                    out[key] = primWrapper && primWrapper.readValue ? primWrapper.readValue() : null;
                }
            }
            return out;
        };

        return container;
    }

    // Array renderer with friendly labels + confirm modal on remove
    function renderArray(arr, pathParts = [], arrayName = 'items', shapeRoot = null) {
        const container = createElem('div', { class: 'array-block' });
        container.dataset.role = 'array';
        container.dataset.arrayName = arrayName;

        const headerRow = createElem('div', { class: 'array-header' });
        const title = createElem('div', { class: 'muted', text: `${arrayName} — ${arr.length} item${arr.length !== 1 ? 's' : ''}` });
        const countBadge = createElem('div', { class: 'badge', text: `${arr.length}` });
        headerRow.appendChild(title); headerRow.appendChild(countBadge);
        container.appendChild(headerRow);

        const list = createElem('div', { class: 'array-list' });

        // let itemSample = undefined;
        // if (arr.length > 0) itemSample = deepClone(arr[0]);
        // else {
        //     const sampleCandidate = getSampleForPath(shapeRoot, pathParts);
        //     if (Array.isArray(sampleCandidate) && sampleCandidate.length > 0) itemSample = deepClone(sampleCandidate[0]);
        // }


        // Determine itemSample (default instance) for this array.
        // Prefer data content if present; otherwise derive an instance from the schema.
        // let itemSample = undefined;
        // if (arr.length > 0) {
        //     itemSample = deepClone(arr[0]); // use real data example if available
        // } else {
        //     // Try to get the schema node for this array path
        //     const schemaNode = getSchemaForPath(shapeRoot, pathParts);
        //     if (schemaNode) {
        //         // If schemaNode is an array schema, use its items schema
        //         let itemsSchema = schemaNode;
        //         if (itemsSchema.type === 'array' && itemsSchema.items) itemsSchema = itemsSchema.items;

        //         // Build a default instance value from the items schema
        //         const sampleVal = createDefaultFromSchema(itemsSchema);
        //         if (sampleVal !== undefined) itemSample = deepClone(sampleVal);
        //     }
        //     // fallback: still undefined -> UI will allow user to choose first item type
        // }


        // Determine itemSample ONLY from schema, never from existing data
        let itemSample = undefined;

        const schemaNode = getSchemaForPath(shapeRoot, pathParts);
        if (schemaNode) {
            let itemsSchema = schemaNode;
            if (itemsSchema.type === 'array' && itemsSchema.items) {
                itemsSchema = itemsSchema.items;
            }

            const sampleVal = createDefaultFromSchema(itemsSchema);
            if (sampleVal !== undefined) {
                itemSample = deepClone(sampleVal);
            }
        }

        const itemType = itemSample === undefined ? null : detectType(itemSample);
        const singular = singularize(arrayName);

        function updateHeaderAndLabels() {
            const total = list.children.length;
            title.textContent = `${arrayName} — ${total} item${total !== 1 ? 's' : ''}`;
            countBadge.textContent = String(total);
            Array.from(list.children).forEach((it, idx) => {
                const sum = it.querySelector('summary');
                if (sum) {
                    let t = it.dataset.itemType || detectTypeFromNode(it) || 'item';
                    // sum.textContent = `${singular} ${idx + 1} of ${total} (${t})`;
                    sum.textContent = `${singular} ${idx + 1} of ${total} (${displayType(t)})`;
                }
                const removeBtn = it.querySelector('button.btn-remove');
                if (removeBtn) removeBtn.textContent = `Remove`;
            });
            const addBtns = container.querySelectorAll('button.btn-add');
            addBtns.forEach(b => { if (b.dataset && b.dataset.singular) b.textContent = `Add ${b.dataset.singular}`; });
        }

        function detectTypeFromNode(itemNode) {
            const innerObj = itemNode.querySelector('.object-block, [data-role="object"]');
            if (innerObj) return 'object';
            const innerArr = itemNode.querySelector('.array-block, [data-role="array"]');
            if (innerArr) return 'array';
            const prim = itemNode.querySelector('.primitive-wrapper [data-prim-type]');
            if (prim) return prim.dataset.primType || 'string';
            return null;
        }

        function makeItemNode(value, idx) {
            const item = createElem('div', { class: 'array-item' });
            item.dataset.index = idx;
            item.dataset.itemType = detectType(value);

            const details = createElem('details', { open: true });
            const summary = createElem('summary', {}, [`${singular} ${idx + 1} of ${Math.max(1, list.children.length)} (${item.dataset.itemType})`]);
            details.appendChild(summary);

            const body = createElem('div', {});
            const t = detectType(value);
            if (t === 'object') {
                body.appendChild(renderObject(value, pathParts.concat([String(idx)]), shapeRoot));
            } else if (t === 'array') {
                body.appendChild(renderArray(value, pathParts.concat([String(idx)]), arrayName + '-' + (idx + 1), shapeRoot));
            } else {
                const prim = renderPrimitive(value, t);
                body.appendChild(prim);
            }

            const removeBtn = createElem('button', { class: 'btn-small btn-remove', type: 'button' }, [`Remove`]);
            removeBtn.addEventListener('click', () => {
                // const label = `${singular} ${idx + 1}`;
                const label = `${singular}`;
                showDeleteConfirm(`Are you sure you want to remove this ${label}? This action cannot be undone if not saved, else just refresh the page.`, () => {
                    item.remove();
                    Array.from(list.children).forEach((ch, i) => { ch.dataset.index = i; });
                    updateHeaderAndLabels();
                    renderControls();
                });
            });

            details.appendChild(body);
            details.appendChild(removeBtn);
            item.appendChild(details);
            return item;
        }

        arr.forEach((v, i) => list.appendChild(makeItemNode(v, i)));
        container.appendChild(list);

        let controls = null;
        function renderControls() {
            if (controls && controls.parentNode) controls.remove();
            controls = createElem('div', { class: 'controls-row' });

            if (itemType === 'array') {
                const note = createElem('div', { class: 'muted', text: 'Adding items disabled for arrays-of-arrays.' });
                controls.appendChild(note);
            } else if (itemType === 'object') {
                const addBtn = createElem('button', { class: 'btn-small btn-add', type: 'button' }, [`Add ${singular}`]);
                addBtn.dataset.singular = singular;
                addBtn.addEventListener('click', () => {
                    // Build a concrete template (instance) for the new object:
                    let template = undefined;

                    // 1) Prefer the itemSample if it is already a usable instance object
                    if (itemSample && detectType(itemSample) === 'object') {
                        template = deepClone(itemSample);
                    } else {
                        // 2) Fallback: get schema for this path and create a default instance from it
                        const schemaNode = getSchemaForPath(shapeRoot, pathParts);
                        if (schemaNode) {
                            // If schemaNode is array schema, get its items schema
                            let itemsSchema = schemaNode;
                            if (itemsSchema.type === 'array' && itemsSchema.items) itemsSchema = itemsSchema.items;

                            // If itemsSchema is an object schema, create default instance
                            if (itemsSchema && itemsSchema.type === 'object') {
                                const built = createDefaultFromSchema(itemsSchema);
                                if (built !== undefined) template = deepClone(built);
                            }
                        }
                    }

                    // 3) Last fallback: empty object
                    if (!template || detectType(template) !== 'object') {
                        template = {};
                    }

                    const idx = list.children.length;
                    list.appendChild(makeItemNode(template, idx));
                    updateHeaderAndLabels(); renderControls();
                });
                controls.appendChild(addBtn);
                controls.appendChild(createElem('div', { class: 'muted', text: 'New objects match existing keys.' }));
                // } else if (itemType === 'object') {
                //     const addBtn = createElem('button', { class: 'btn-small btn-add', type: 'button' }, [`Add ${singular}`]);
                //     addBtn.dataset.singular = singular;
                //     addBtn.addEventListener('click', () => {
                //         let template = itemSample ? deepClone(itemSample) : getSampleForPath(shapeRoot, pathParts);
                //         if (!template || detectType(template) !== 'object') template = {};
                //         const idx = list.children.length;
                //         list.appendChild(makeItemNode(template, idx));
                //         updateHeaderAndLabels(); renderControls();
                //     });
                //     controls.appendChild(addBtn);
                //     controls.appendChild(createElem('div', { class: 'muted', text: 'New objects match existing keys.' }));
            } else if (itemType === 'number' || itemType === 'string' || itemType === 'boolean' || itemType === 'null') {
                const addBtn = createElem('button', { class: 'btn-small btn-add', type: 'button' }, [`Add ${singular}`]);
                addBtn.dataset.singular = singular;
                addBtn.addEventListener('click', () => {
                    let newVal = itemType === 'number' ? 0 : itemType === 'string' ? '' : itemType === 'boolean' ? false : null;
                    const idx = list.children.length; list.appendChild(makeItemNode(newVal, idx));
                    updateHeaderAndLabels(); renderControls();
                });
                controls.appendChild(addBtn);
                controls.appendChild(createElem('div', { class: 'muted', text: 'Array expects: ' + itemType }));
            } else {
                const sel = createElem('select', {});
                ['string', 'number', 'boolean', 'object', 'null'].forEach(t => sel.appendChild(createElem('option', { value: t, text: t })));
                const addBtn = createElem('button', { class: 'btn-small btn-add', type: 'button' }, [`Add ${singular}`]);
                addBtn.dataset.singular = singular;
                addBtn.addEventListener('click', () => {
                    const chosen = sel.value;
                    let val = chosen === 'string' ? '' : chosen === 'number' ? 0 : chosen === 'boolean' ? false : chosen === 'object' ? {} : null;
                    const idx = list.children.length;
                    list.appendChild(makeItemNode(val, idx));
                    itemSample = val;
                    renderControls();
                    updateHeaderAndLabels();
                });
                controls.appendChild(sel);
                controls.appendChild(addBtn);
                controls.appendChild(createElem('div', { class: 'muted', text: 'Array empty — choose item type (arrays disabled).' }));
            }

            container.appendChild(controls);
            updateHeaderAndLabels();
            return controls;
        }

        container.readValue = function () {
            const out = [];
            for (const it of list.children) {
                const innerObj = it.querySelector('.object-block, [data-role="object"]');
                const innerArr = it.querySelector('.array-block, [data-role="array"]');
                if (innerObj && innerObj.readValue) out.push(innerObj.readValue());
                else if (innerArr && innerArr.readValue) out.push(innerArr.readValue());
                else {
                    const prim = it.querySelector('.primitive-wrapper');
                    out.push(prim && prim.readValue ? prim.readValue() : null);
                }
            }
            return out;
        };

        renderControls();
        updateHeaderAndLabels();
        return container;
    }

    // Top-level form generation
    // function generateFormInternal() {
    //     const raw = document.getElementById('jsonInput').value;
    //     const shapeRoot = readShape();
    //     let data;
    //     try { data = JSON.parse(raw); } catch (e) { alert('Invalid JSON: ' + e.message); return; }
    //     const area = document.getElementById('formArea'); area.innerHTML = '';
    //     if (Array.isArray(data)) {
    //         const topArr = renderArray(data, [], 'items', shapeRoot);
    //         const det = createElem('details', { open: true }, [createElem('summary', {}, ['Extracted Data'])]);
    //         det.appendChild(topArr); area.appendChild(det);
    //     } else if (data !== null && typeof data === 'object') {
    //         const topObj = renderObject(data, [], shapeRoot);
    //         const det = createElem('details', { open: true }, [createElem('summary', {}, ['Extracted Data'])]);
    //         det.appendChild(topObj); area.appendChild(det);
    //     } else {
    //         const prim = renderPrimitive(data, detectType(data));
    //         const wrap = createElem('div', {}); wrap.appendChild(createElem('label', { text: 'Extracted Data' })); wrap.appendChild(prim);
    //         prim.id = 'rootPrimitive'; area.appendChild(wrap);
    //     }
    //     document.getElementById('outputJson').textContent = JSON.stringify(data, null, 2);
    // }

    function generateFormInternal() {

        if (!job || !job.data.result || job.data.status === "failed") {
            formArea.innerHTML =
                '<div class="empty-state">No extracted data found.</div>';
            downloadBtn.style.display = "none";
            saveBtn.style.display = "none";
            approveBtn.style.display = "none";
            retryBtn.textContent = "Retry Extraction"
            return;
        }

        retryBtn.textContent = "Rerun Extraction"

        const data = JSON.parse(job.data.result);
        const shapeRoot = readShape();

        const area = document.getElementById('formArea');
        area.innerHTML = "";

        if (Array.isArray(data)) {
            const topArr = renderArray(data, [], 'items', shapeRoot);
            const det = createElem('details', { open: true }, [createElem('summary', {}, ['Extracted Data'])]);
            det.appendChild(topArr); area.appendChild(det);
        } else if (data !== null && typeof data === 'object') {
            const topObj = renderObject(data, [], shapeRoot);
            const det = createElem('details', { open: true }, [createElem('summary', {}, ['Extracted Data'])]);
            det.appendChild(topObj); area.appendChild(det);
        } else {
            const prim = renderPrimitive(data, detectType(data));
            const wrap = createElem('div', {}); wrap.appendChild(createElem('label', { text: 'Extracted Data' })); wrap.appendChild(prim);
            prim.id = 'rootPrimitive'; area.appendChild(wrap);
        }

        // if (Array.isArray(data)) {

        //     const editor = renderArray(
        //         data,
        //         [],
        //         "items",
        //         shapeRoot
        //     );

        //     formArea.appendChild(editor);

        // } else if (data && typeof data === "object") {

        //     const editor = renderObject(
        //         data,
        //         [],
        //         shapeRoot
        //     );

        //     formArea.appendChild(editor);

        // } else {

        //     formArea.appendChild(
        //         renderPrimitive(
        //             data,
        //             detectType(data)
        //         )
        //     );

        // }

    }

    // Submit and rebuild JSON
    // function submitFormInternal() {
    //     const area = document.getElementById('formArea');
    //     if (!area.firstChild) { alert('No form generated'); return null; }
    //     const top = area.firstChild;
    //     const inner = top.querySelector('[data-role="object"], [data-role="array"], .object-block, .array-block, .primitive-wrapper');
    //     let rebuilt;
    //     if (!inner) {
    //         const prim = area.querySelector('.primitive-wrapper');
    //         rebuilt = prim && prim.readValue ? prim.readValue() : null;
    //     } else {
    //         if (inner.dataset && inner.dataset.role === 'object') rebuilt = inner.readValue();
    //         else if (inner.dataset && inner.dataset.role === 'array') rebuilt = inner.readValue();
    //         else rebuilt = inner.readValue ? inner.readValue() : null;
    //     }
    //     document.getElementById('outputJson').textContent = JSON.stringify(rebuilt, null, 2);
    //     console.log('REBUILT: ', rebuilt)
    //     return rebuilt;
    // }

    function submitFormInternal() {

        const area = document.getElementById("formArea");

        if (!area.firstChild) {
            return null;
        }

        const inner = area.querySelector(
            '[data-role="object"], [data-role="array"], .object-block, .array-block, .primitive-wrapper'
        );

        let rebuilt;

        if (!inner) {

            const prim = area.querySelector(".primitive-wrapper");
            rebuilt = prim?.readValue ? prim.readValue() : null;

        } else if (inner.dataset?.role === "object") {

            rebuilt = inner.readValue();

        } else if (inner.dataset?.role === "array") {

            rebuilt = inner.readValue();

        } else {

            rebuilt = inner.readValue
                ? inner.readValue()
                : null;

        }

        rebuilt = JSON.stringify(rebuilt);

        return rebuilt;

    }

    // function downloadJSON() {
    //     // const data = submitFormInternal();
    //     const data = document.getElementById('outputJson').textContent;
    //     console.log("DOWNLOADING JSON...");

    //     if (!data) return;
    //     // const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    //     const blob = new Blob([data], { type: 'application/json' });
    //     const url = URL.createObjectURL(blob);
    //     // const a = document.createElement('a'); a.href = url; a.download = 'edited.json'; document.body.appendChild(a); a.click(); a.remove();
    //     const a = document.createElement('a'); a.href = url; a.download = `Extracted Data #${result_id}.json`; document.body.appendChild(a); a.click(); a.remove();
    //     URL.revokeObjectURL(url);
    // }

    function downloadJSON() {

        // const data = submitFormInternal();
        const data = JSON.parse(job.data.result);

        if (data === null) {
            return;
        }

        const blob = new Blob(
            [JSON.stringify(data, null, 2)],
            {
                type: "application/json"
            }
        );

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;

        const fileName = job?.label
            ? `${job.label}.json`
            : "extracted-data.json";

        a.download = fileName;

        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);

    }

    // function setButtonsDisabled(disabled) {
    //     saveBtn.disabled = disabled;
    //     saveApproveBtn.disabled = disabled;
    // }

    // // Helper: show toast
    // const toast = document.getElementById('toast');
    // let toastTimer = null;
    // function showToast(msg) {
    //     clearTimeout(toastTimer);
    //     toast.textContent = msg;
    //     toast.classList.add('show');
    //     toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    // }

    // // CSRF helper (Django default cookie name)
    // function getCookie(name) {
    //     const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    //     return v ? v.pop() : '';
    // }
    // const csrftoken = getCookie('csrftoken');

    async function saveJson(action, message, approved) {

        // const data = submitFormInternal();
        const newData = submitFormInternal();

        if (newData === null) {
            showToast("Nothing to save.");
            return;
        }

        saveBtn.disabled = true;
        approveBtn.disabled = true;

        try {

            // job.data.result = data;

            // job.approved = approved;

            // await Storage.saveJob(job);

            if (action === "save") {
                Storage.updateJob(job.id, {

                    approved: approved,

                    data: {
                        ...job.data,
                        result: newData
                    }

                });
            } else {
                Storage.updateJob(job.id, {

                    approved: approved

                });
            }

            await reloadJob();

            showToast(message);

            console.log("New approved = ", job.approved)

        } catch (error) {

            console.error(error);
            showToast("Failed to save changes.");

        } finally {

            saveBtn.disabled = false;
            approveBtn.disabled = false;

        }

    }

    saveBtn.addEventListener("click", async () => {

        await saveJson(
            "save",
            "Changes saved.",
            job.approved
        );

    });

    approveBtn.addEventListener("click", async () => {

        const approved = !job.approved;

        await saveJson(
            "approve",
            approved
                ? "Approved."
                : "Approval removed.",
            approved
        );

        const color = approved ? "red" : "#16A34A";

        approveBtn.style.background = color;

        // job.approved = approved;

        // approveBtn.textContent = approved
        //     ? "Unapprove"
        //     : "Approve";

    });

    viewTableBtn.addEventListener("click", () => {

        window.location.href = `table.html?id=${job.id}`;

    });

    retryBtn.addEventListener("click", () => {

        window.location.href = `retry.html?id=${job.id}`;

    });

    // document.getElementById('deleteBtn').addEventListener('click', async (e) => {
    //     confirmDelete();
    // });

    // // --------------------------
    // // Delete modal flow
    // // --------------------------
    // function handleDeleteClick() {
    //     // let id = upload_id;
    //     // let url = `/environments/envupload/${id}/data/delete/`
    //     // if (id === 0) {
    //     //     id = email_id;
    //     //     url = `/environments/envmail/${id}/data/delete/`
    //     // }

    //     let id = result_id;
    //     console.log("PARENT: ", result_parent)
    //     let url = `/environments/envupload/${id}/data/delete/`
    //     if (result_parent === "email") {
    //         url = `/environments/envmail/${id}/data/delete/`
    //     }

    //     window.open(url, "_parent");
    // }

    // let pendingDelete = null;
    // function confirmDelete() {
    //     showModal();
    // }
    // function showModal() {
    //     const mb = document.getElementById('modalBackdrop');
    //     const modaldeletebtn = document.getElementById('modalConfirm');
    //     mb.style.display = 'flex';
    //     modaldeletebtn.onclick = () => {
    //         handleDeleteClick();
    //         closeModal();
    //     }
    //     modaldeletebtn.focus();
    // }
    // function closeModal() { document.getElementById('modalBackdrop').style.display = 'none'; }

    // // close modal on ESC
    // document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });


    // function loadSample() {
    //     document.getElementById('jsonInput').value = JSON.stringify({
    //         users: [
    //             {
    //                 id: 1, name: "Alice", rating: 4.5, active: true, roles: ["admin", "editor"], scores: [10, 12.75, 9.5],
    //                 addresses: [{ city: "Lagos", zip: 100001, coordinates: { lat: 6.5244, lng: 3.3792 }, tags: ["home", "primary"] }]
    //             }
    //         ],
    //         metadata: { version: 1.1, generatedAt: "2025-01-01" }
    //     }, null, 2);
    //     document.getElementById('shapeInput').value = JSON.stringify({
    //         users: {
    //             type: "array", items: {
    //                 type: "object", properties: {
    //                     id: { type: "number" }, name: { type: "string" }, rating: { type: "number" }, active: { type: "boolean" },
    //                     roles: { type: "array", items: { type: "string" } }, scores: { type: "array", items: { type: "number" } },
    //                     addresses: {
    //                         type: "array", items: {
    //                             type: "object", properties: {
    //                                 city: { type: "string" }, zip: { type: "number" },
    //                                 coordinates: { type: "object", properties: { lat: { type: "number" }, lng: { type: "number" } } },
    //                                 tags: { type: "array", items: { type: "string" } }
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         },
    //         metadata: { type: "object", properties: { version: { type: "number" }, generatedAt: { type: "string" } } }
    //     }, null, 2);
    //     generateFormInternal();
    // }

    // Expose functions to global scope for buttons
    window.generateForm = generateFormInternal;
    window.submitForm = submitFormInternal;
    window.downloadJSON = downloadJSON;
    // window.closeModal = closeModal;
    // window.loadSample = loadSample;

})();

generateForm();