(function () {

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

    // Configuration: endpoints (adjust if your URLs differ)
    // const ENV_ID = '{{ environment.id }}';
    // const API_URL = `/environments/${ENV_ID}/data/get/`;
    // const EXPORT_URL = `/environments/${ENV_ID}/data/export/`;
    // const ROW_SOURCE_URL = `/environments/${ENV_ID}/row-source-options/`;

    // UI elements
    const rowSourceSelect = document.getElementById('rowSourceSelect');
    // const approvalSelect = document.getElementById('approvalSelect');
    const depthInput = document.getElementById('depthInput');
    const pageSizeInput = document.getElementById('pageSizeInput');
    const tableHead = document.getElementById('tableHead');
    const tableBody = document.getElementById('tableBody');
    const infoBar = document.getElementById('infoBar');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pagerInfo = document.getElementById('pagerInfo');
    const refreshBtn = document.getElementById('refreshBtn');
    const exportBtn = document.getElementById('exportBtn');
    const columnsBtn = document.getElementById('columnsBtn');

    const colModal = document.getElementById('colModal');
    const colList = document.getElementById('colList');
    const colApplyBtn = document.getElementById('colApplyBtn');
    const colCancelBtn = document.getElementById('colCancelBtn');

    // State
    let columns = [];        // full schema columns
    let visibleColumns = []; // currently visible columns
    let rows = [];           // current page rows
    let page = 1;
    let totalRows = 0;
    let pageCount = 1;

    // Helpers
    function qsEncode(params) {
        return Object.entries(params)
            .filter(([k, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
            .join('&');
    }

    // async function fetchRowSourceOptions() {
    //     try {
    //         const res = await fetch(ROW_SOURCE_URL);
    //         const data = await res.json();

    //         // console.log(data)
    //         // options: include Document (null) + discovered paths
    //         rowSourceSelect.innerHTML = '';
    //         // const optDoc = document.createElement('option');
    //         // optDoc.value = '';
    //         // optDoc.textContent = 'Document (one row per email)';
    //         // rowSourceSelect.appendChild(optDoc);

    //         (data.sources || []).forEach(source => {
    //             const o = document.createElement('option');
    //             o.value = source.key;
    //             o.textContent = source.label;
    //             rowSourceSelect.appendChild(o);
    //         });
    //     } catch (e) {
    //         console.error(e);
    //     }
    // }

    function fetchRowSourceOptions() {
        const data = JSON.parse(job.data.result);

        rowSourceSelect.innerHTML = "";

        // Always include the whole document
        const defaultOption = document.createElement("option");
        defaultOption.value = "document";
        defaultOption.textContent = "Document (1 row)";
        rowSourceSelect.appendChild(defaultOption);

        if (!data || typeof data !== "object") {
            return;
        }

        const paths = TableUtils.filterRowSources(
            TableUtils.discoverArrayPaths(data),
            2
        );

        paths
            .sort()
            .forEach(path => {
                const option = document.createElement("option");
                option.value = path;
                option.textContent = `${path} (list of groups)`;
                rowSourceSelect.appendChild(option);
            });

        rowSourceSelect.value = "document";
    }

    function buildTableData({
        rowSource = "document",
        depth = 1,
        page = 1,
        pageSize = 50,
        visibleColumns = null
    } = {}) {

        // const job = await Storage.getCurrentJob();

        console.log(job);

        job = Storage.getJob(Number(job.id));

        if (!job || !JSON.parse(job.data.result)) {
            return {
                allColumns: [],
                columns: [],
                rows: [],
                meta: {
                    page,
                    pageSize,
                    totalRows: 0,
                    rowSource
                }
            };
        }

        // Build rows from the document
        const allRows = TableUtils.buildRowsFromDocument(
            JSON.parse(job.data.result),
            rowSource
        );

        console.log(JSON.stringify(allRows, null, 2));

        // Discover every possible column
        const allColumns = TableUtils.discoverSchema(
            allRows,
            depth
        );


        // Apply column visibility
        const columns = visibleColumns && visibleColumns.length
            ? TableUtils.applyColumnVisibility(allColumns, visibleColumns)
            : allColumns;


        // Flatten/project rows
        const table = TableUtils.projectRows(
            allRows,
            columns,
            depth
        );

        // Pagination
        const {
            rows,
            totalRows
        } = TableUtils.paginateTable(
            table,
            page,
            pageSize
        );

        console.log("Rows: ", JSON.stringify(rows, null, 2));
        console.log("Columns: ", JSON.stringify(columns, null, 2));
        console.log("Table: ", JSON.stringify(table, null, 2));

        return {
            allColumns,
            columns,
            rows,
            meta: {
                page,
                pageSize,
                totalRows,
                rowSource
            }
        };
    }

    async function exportTableToCsv({
        rowSource = "document",
        depth = 1,
        visibleColumns = []
    } = {}) {

        const data = await buildTableData({
            rowSource,
            depth,
            page: 1,
            pageSize: Number.MAX_SAFE_INTEGER,
            visibleColumns
        });

        const columns = data.columns;
        const rows = data.rows;

        if (!rows.length) {
            alert("There is no extracted data to export.");
            return;
        }

        function escapeCsv(value) {
            if (value === null || value === undefined) {
                return "";
            }

            let text = String(value);

            text = text.replace(/"/g, '""');

            if (/[",\r\n]/.test(text)) {
                text = `"${text}"`;
            }

            return text;
        }

        const csv = [];

        // Header row
        csv.push(columns.map(escapeCsv).join(","));

        // Data rows
        for (const row of rows) {
            csv.push(
                columns
                    .map(col => escapeCsv(row[col]))
                    .join(",")
            );
        }

        const blob = new Blob(
            [csv.join("\r\n")],
            {
                type: "text/csv;charset=utf-8;"
            }
        );

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;
        // a.download = "zendix-data.csv";
        a.download = `${job.label}.csv`;

        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    // async function fetchData() {
    //     infoBar.textContent = 'Loading...';
    //     tableHead.innerHTML = '';
    //     tableBody.innerHTML = '';
    //     const rowSource = rowSourceSelect.value || '';
    //     const approval = approvalSelect.value;
    //     const depth = depthInput.value;
    //     const pageSize = pageSizeInput.value;
    //     console.log("PAGE SIZE: ", pageSize);

    //     // visible columns param for API (CSV style) - send comma-separated
    //     const colsParam = visibleColumns.length ? visibleColumns.join(',') : '';

    //     // Build url
    //     const params = {
    //         row_source: rowSource || undefined,
    //         approval: approval,
    //         depth: depth,
    //         page: page,
    //         page_size: pageSize,
    //         columns: colsParam || undefined
    //     };

    //     // console.log(params)

    //     const url = API_URL + '?' + qsEncode(params);
    //     console.log("URL = ", url)

    //     try {
    //         const res = await fetch(url);
    //         if (!res.ok) throw new Error('Failed to load');
    //         const data = await res.json();

    //         // console.log('DATA:', data)

    //         columns = data.all_columns || [];
    //         visibleColumns = visibleColumns.length ? visibleColumns : columns.slice();

    //         // console.log('VISIBLE COLUMNS:', visibleColumns);


    //         rows = data.rows || [];
    //         totalRows = data.meta ? data.meta.total_rows : (rows.length || 0);

    //         renderTable();
    //         renderPager(data.meta || {});
    //         // infoBar.textContent = `Showing ${rows.length} rows (page ${page}) — total ${totalRows}`;
    //         // infoBar.textContent = ""
    //     } catch (e) {
    //         console.error(e);
    //         infoBar.textContent = 'Failed to load data.';
    //     }
    // }

    function fetchData() {
        infoBar.textContent = "Loading...";
        tableHead.innerHTML = "";
        tableBody.innerHTML = "";

        const rowSource = rowSourceSelect.value || "document";
        console.log("Row source: ", rowSourceSelect.value)
        const depth = Number(depthInput.value);
        const pageSize = Number(pageSizeInput.value);

        try {
            const data = buildTableData({
                rowSource,
                depth,
                page,
                pageSize,
                visibleColumns
            });


            columns = data.allColumns;
            // visibleColumns = visibleColumns.length ? visibleColumns : columns.slice();

            // First load -> every column is visible
            if (!visibleColumns || visibleColumns.length === 0) {
                visibleColumns = [...columns];
            }

            rows = data.rows;
            totalRows = data.meta.totalRows;

            console.log("data: ", data);
            console.log("rows: ", rows);
            console.log("total rows: ", totalRows);

            renderTable();
            renderPager(data.meta);

        } catch (err) {
            console.error(err);
            infoBar.textContent = "Failed to load table.";
        }
    }

    // function renderTable() {
    //     // header
    //     tableHead.innerHTML = '';
    //     const tr = document.createElement('tr');
    //     visibleColumns.forEach(col => {
    //         const th = document.createElement('th');
    //         th.textContent = col;
    //         tr.appendChild(th);
    //     });
    //     tableHead.appendChild(tr);

    //     // body
    //     tableBody.innerHTML = '';

    //     if (!rows.length) {
    //         tableBody.innerHTML = `
    //             <tr>
    //                 <td colspan="${visibleColumns.length}" class="empty-state">
    //                     No extracted data found
    //                 </td>
    //             </tr>
    //         `;
    //         return;
    //     }

    //     rows.forEach(row => {
    //         const tr = document.createElement('tr');
    //         visibleColumns.forEach(col => {
    //             // console.log('TD COL: ', col);
    //             const td = document.createElement('td');
    //             let val = row[col];
    //             if (val === null || val === undefined) val = '';
    //             else if (typeof val === 'object') val = JSON.stringify(val);

    //             // --- WRAP the row in an anchor tag as requested ---
    //             if ((col === "Email ID" || col === "Upload ID") && String(val) !== "") {
    //                 const link = document.createElement('a');
    //                 link.className = 'row-link';
    //                 let url = "";
    //                 if (col === "Email ID") {
    //                     url = `/environments/envmail/${String(val)}/data/review/`
    //                 } else {
    //                     url = `/environments/envupload/${String(val)}/data/review/`
    //                 }
    //                 link.href = url;
    //                 link.textContent = String(val);
    //                 td.appendChild(link);
    //             } else {
    //                 td.textContent = String(val);
    //             }
    //             // End

    //             // td.textContent = String(val);
    //             tr.appendChild(td);
    //         });
    //         // console.log("ROW: ", row['Email ID'])
    //         tableBody.appendChild(tr);
    //     });
    // }

    function renderTable() {
        // Render table header
        tableHead.innerHTML = "";

        const headerRow = document.createElement("tr");

        visibleColumns.forEach(column => {
            const th = document.createElement("th");
            th.textContent = column;
            headerRow.appendChild(th);
        });

        tableHead.appendChild(headerRow);

        // Render table body
        tableBody.innerHTML = "";

        if (!rows.length) {
            tableBody.innerHTML = `
            <tr>
                <td colspan="${Math.max(visibleColumns.length, 1)}"
                    class="empty-state">
                    No rows to display.
                    Try selecting a different row source or flatten depth.
                </td>
            </tr>
        `;
            return;
        }

        rows.forEach(row => {

            const tr = document.createElement("tr");

            visibleColumns.forEach(column => {

                const td = document.createElement("td");

                let value = row[column];

                if (value === null || value === undefined) {
                    value = "";
                } else if (typeof value === "object") {
                    value = JSON.stringify(value);
                }

                td.textContent = String(value);

                tr.appendChild(td);

            });

            tableBody.appendChild(tr);

        });
    }

    // function renderPager(meta) {
    //     let pageSize = Number(pageSizeInput.value);
    //     console.log("SIZE: ", pageSize);

    //     if (pageSize < 1) {
    //         pageSize = 1;
    //         pageSizeInput.value = 1;
    //     }

    //     const total_rows = meta.total_rows || totalRows;
    //     const totalPages = Math.max(1, Math.ceil(total_rows / pageSize));
    //     pageCount = totalPages;
    //     console.log("CT: ", pageCount);
    //     if (page === pageCount) {
    //         nextBtn.setAttribute("disabled", "disabled");
    //     } else {
    //         nextBtn.removeAttribute("disabled");
    //     }
    //     infoBar.textContent = `Showing ${rows.length} rows (page ${page} of ${totalPages}) — ${total_rows} total rows`;
    //     // pagerInfo.textContent = `Page ${page} of ${totalPages} — ${total} total rows`;
    // }

    function renderPager(meta) {

        let pageSize = Number(pageSizeInput.value);

        if (pageSize < 1) {
            pageSize = 1;
            pageSizeInput.value = 1;
        }

        const totalRows = meta.totalRows;

        const totalPages = Math.max(
            1,
            Math.ceil(totalRows / pageSize)
        );

        pageCount = totalPages;

        prevBtn.disabled = (page <= 1);
        nextBtn.disabled = (page >= totalPages);

        infoBar.textContent =
            `Showing ${rows.length} rows (page ${page} of ${totalPages}) — ${totalRows} total rows`;
    }

    // Column modal
    function openColumnModal() {
        colList.innerHTML = '';
        // console.log(columns)
        columns.forEach(c => {
            const id = 'col_' + c.replace(/[^a-z0-9]/gi, '_');
            const div = document.createElement('div');
            div.innerHTML = `
            <label class="column-label">
            <input type="checkbox" id="${id}" data-col="${c}" ${visibleColumns.includes(c) ? 'checked' : ''}/> ${c}
            </label>
            `;

            // div.innerHTML = `
            // <input type="checkbox" id="${id}" data-col="${c}" ${visibleColumns.includes(c) ? 'checked' : ''}/>
            // <label class="column-label">${c}</label>
            // `;
            colList.appendChild(div);
        });
        colModal.style.display = 'flex';
    }

    function applyColumnChanges() {
        const checks = Array.from(colList.querySelectorAll('input[type=checkbox]'));
        visibleColumns = checks.filter(ch => ch.checked).map(ch => ch.dataset.col);
        colModal.style.display = 'none';
        // reload data with new columns
        page = 1;
        fetchData();
        Utils.toast("Columns applied.");
    }

    // Export (ignores pagination)
    // function exportCsv() {
    //     const rowSource = rowSourceSelect.value || '';
    //     const depth = depthInput.value;
    //     const colsParam = visibleColumns.length ? visibleColumns.join(',') : '';
    //     const params = {
    //         row_source: rowSource || undefined,
    //         depth: depth,
    //         columns: colsParam || undefined
    //     };
    //     const url = EXPORT_URL + '?' + qsEncode(params);
    //     // navigate browser to download
    //     window.location = url;
    // }

    function exportCsv() {
        Utils.toast("Exporting...");
        exportTableToCsv({
            rowSource: rowSourceSelect.value || "document",
            depth: Number(depthInput.value),
            visibleColumns
        });

    }

    // Event wiring
    prevBtn.setAttribute("disabled", "disabled");
    nextBtn.setAttribute("disabled", "disabled");

    prevBtn.addEventListener('click', () => {
        if (page > 1) {
            page--;
            fetchData();
        }
        if (page === 1) {
            prevBtn.setAttribute("disabled", "disabled");
        }
    });
    nextBtn.addEventListener('click', () => {
        page++;
        fetchData();
        prevBtn.removeAttribute("disabled");
        if (page === pageCount) {
            nextBtn.setAttribute("disabled", "disabled");
        }
    });
    refreshBtn.addEventListener('click', () => {
        // page = 1;
        // fetchData();
        // Utils.toast("Refreshed.");

        window.location.href = `review.html?id=${job.id}`;
    });
    exportBtn.addEventListener('click', exportCsv);
    columnsBtn.addEventListener('click', openColumnModal);
    colApplyBtn.addEventListener('click', applyColumnChanges);
    colCancelBtn.addEventListener('click', () => { colModal.style.display = 'none' });

    // Change handlers
    rowSourceSelect.addEventListener('change', () => { page = 1; visibleColumns = []; fetchData(); });
    // approvalSelect.addEventListener('change', () => { page = 1; fetchData(); });
    depthInput.addEventListener('change', () => { page = 1; visibleColumns = []; fetchData(); });
    pageSizeInput.addEventListener('change', () => { page = 1; fetchData(); });

    // Initial load
    (async function init() {
        await fetchRowSourceOptions();
        await fetchData();
    })();

})();
