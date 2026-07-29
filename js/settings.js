/* ==========================================================
   Zendix Lite
   settings.js
   ========================================================== */

(async function () {
    "use strict";

    // =====================================================
    // Elements
    // =====================================================

    const accessCodeInput = document.getElementById("accessCode");
    const saveAccessCodeButton = document.getElementById("saveAccessCode");
    const toggleButton = document.getElementById("toggleAccessCode");

    const emailInput = document.getElementById("emailAddress");
    const saveEmailButton = document.getElementById("saveEmail");

    const clearAccessCodeButton = document.getElementById("clearAccessCode");
    const clearEmailButton = document.getElementById("clearEmail");
    const clearAllDataButton = document.getElementById("clearAllData");

    const usageGrid = document.getElementById("usageGrid");

    const toast = document.getElementById("toast");

    const modal = document.getElementById("confirmModal");
    const modalMessage = document.getElementById("confirmMessage");
    const modalConfirm = document.getElementById("confirmAction");
    const modalCancel = document.getElementById("cancelAction");

    const exportBackupBtn = document.getElementById("exportBackupBtn");
    const importBackupBtn = document.getElementById("importBackupBtn");
    const backupFileInput = document.getElementById("backupFileInput");

    const importBackupModal = document.getElementById("importBackupModal");
    const confirmImportBackupBtn = document.getElementById("confirmImportBackupBtn");
    const cancelImportBackupBtn = document.getElementById("cancelImportBackupBtn");

    let confirmCallback = null;

    let selectedBackupFile = null;

    // =====================================================
    // Toast
    // =====================================================

    let toastTimer = null;

    function showToast(message) {

        clearTimeout(toastTimer);

        toast.textContent = message;

        toast.classList.add("show");

        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);

    }

    // =====================================================
    // Confirmation Modal
    // =====================================================

    function showConfirm(message, callback) {

        confirmCallback = callback;

        modalMessage.textContent = message;

        modal.classList.add("show");

        modalConfirm.focus();

    }

    function closeModal() {

        modal.classList.remove("show");

        confirmCallback = null;

    }

    modalCancel.addEventListener("click", closeModal);

    modalConfirm.addEventListener("click", () => {

        if (typeof confirmCallback === "function") {
            confirmCallback();
        }

        closeModal();

    });

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {
            closeModal();
        }

    });

    // =====================================================
    // Load Saved Access Code
    // =====================================================

    function loadAccessCode() {

        const code = Storage.getAccessCode();

        if (code) {
            accessCodeInput.value = code;
        }

        loadUsageData();

    }

    async function loadUsageData() {

        usageGrid.style.display = "flex";
        
        usageGrid.innerHTML = "<p class='small'>Loading usage data...</p>";

        try {

            usageGrid.style.display = "grid";

            const response = await Api.getUsage();

            usageGrid.innerHTML = `
                <div class="usage-box">

                    <div class="usage-label">
                        Pages Available
                    </div>

                    <div class="usage-value">
                        ${response.pages_available}
                    </div>

                </div>

                <div class="usage-box">

                    <div class="usage-label">
                        Pages Used
                    </div>

                    <div class="usage-value">
                        ${response.pages_used}
                    </div>

                </div>

                <div class="usage-box">

                    <div class="usage-label">
                        Pages Purchased
                    </div>

                    <div class="usage-value">
                        ${response.pages_purchased}
                    </div>

                </div>
            `

        } catch(error) {

            usageGrid.style.display = "flex";

            usageGrid.innerHTML =  `<p class='small'>${error.message || "Failed to load usage data."}</p>`;

        }

    }

    // =====================================================
    // Save Access Code
    // =====================================================

    saveAccessCodeButton.addEventListener("click", () => {

        const code = accessCodeInput.value.trim();

        Storage.setAccessCode(code);

        showToast("Access code saved.");

        loadUsageData();

    });

    // =====================================================
    // Show / Hide Password
    // =====================================================

    toggleButton.addEventListener("click", () => {

        if (accessCodeInput.type === "password") {

            accessCodeInput.type = "text";

            toggleButton.textContent = "Hide";

        } else {

            accessCodeInput.type = "password";

            toggleButton.textContent = "Show";

        }

    });

    // =====================================================
    // Load Saved Email
    // =====================================================

    function loadEmail() {

        const email = Storage.getEmail();

        if (email) {
            emailInput.value = email;
        }

    }

    // =====================================================
    // Save Email
    // =====================================================

    function isValidEmail(email) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    }

    saveEmailButton.addEventListener("click", () => {

        const email = emailInput.value.trim().toLowerCase();

        if (!email) {

            Utils.toast("Email address is required.");

            return;

        }

        if (!isValidEmail(email)) {

            Utils.toast("Please enter a valid email address.");

            return;

        }

        if (email.length > 254) {

            // Utils.toast("Email address is too long.");
            Utils.toast("Email address must be 254 characters or less.");

            return;

        }

        Storage.setEmail(email);

        showToast("Email address saved.");

    });


    // =====================================================
    // Clear Access Code
    // =====================================================

    clearAccessCodeButton.addEventListener("click", () => {

        showConfirm(

            "Remove the stored access code from this browser?",

            () => {

                Storage.removeAccessCode();

                accessCodeInput.value = "";

                showToast("Access code removed.");

            }

        );

    });

    // =====================================================
    // Clear Email
    // =====================================================

    clearEmailButton.addEventListener("click", () => {

        showConfirm(

            "Remove the stored email address from this browser?",

            () => {

                Storage.removeEmail();

                emailInput.value = "";

                showToast("Email address removed.");

            }

        );

    });

    // =====================================================
    // Clear All Local Data
    // =====================================================

    clearAllDataButton.addEventListener("click", async () => {

        showConfirm(

            "This will permanently delete all locally stored jobs, files, schemas, interrupted payment verifications, settings, email address and access code. Continue?",

            async () => {

                Storage.removeAccessCode();
                Storage.removeEmail();
                Storage.clearPendingVerifications();
                await Storage.clearJobs();
                Storage.clearSchemas();

                accessCodeInput.value = "";
                emailInput.value = "";

                showToast("All local data cleared.");

            }

        );

    });

    exportBackupBtn.addEventListener(
        "click",
        exportBackup
    );

    importBackupBtn.addEventListener(
        "click",
        () => backupFileInput.click()
    );

    backupFileInput.addEventListener(
        "change",
        event => {

            if (!event.target.files.length) {
                return;
            }

            selectedBackupFile = event.target.files[0];

            importBackupModal.classList.add("show");

        }
    );

    cancelImportBackupBtn.addEventListener(
        "click",
        () => {

            selectedBackupFile = null;

            backupFileInput.value = "";

            importBackupModal.classList.remove("show");

        }
    );

    confirmImportBackupBtn.addEventListener(
        "click",
        importBackup
    );

    async function exportBackup() {

        try {

            const backup =
                await Storage.exportBackup();

            const blob = new Blob(

                [
                    JSON.stringify(
                        backup,
                        null,
                        2
                    )
                ],

                {
                    type: "application/json"
                }

            );

            const url =
                URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            const date =
                new Date()
                    .toISOString()
                    .split("T")[0];

            link.href = url;

            link.download =
                `zendix-backup-${date}.json`;

            link.click();

            URL.revokeObjectURL(url);

            Utils.toast(
                "Backup exported successfully."
            );

        }

        catch (error) {

            console.error(error);

            Utils.toast(
                "Failed to export backup."
            );

        }

    }

    async function importBackup() {

        if (!selectedBackupFile) {
            return;
        }

        try {

            const text =
                await selectedBackupFile.text();

            const backup =
                JSON.parse(text);

            console.log(backup);

            await Storage.importBackup(
                backup
            );

            Utils.toast(
                "Backup imported successfully."
            );

            importBackupModal.classList.remove(
                "show"
            );

            location.reload();

        }

        catch (error) {

            console.error(error);

            // Utils.toast(

            //     error.message ||

            //     "Failed to import backup."

            // );

            Utils.toast(

                "Failed to import backup."

            );

            importBackupModal.classList.remove(
                "show"
            );

        }

        finally {

            selectedBackupFile = null;

            backupFileInput.value = "";

        }

    }

    // =====================================================
    // Initialise
    // =====================================================

    loadAccessCode();
    loadEmail();

})();