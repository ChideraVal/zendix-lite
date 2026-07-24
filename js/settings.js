/* ==========================================================
   Zendix Lite
   settings.js
   ========================================================== */

(function () {
    "use strict";

    // =====================================================
    // Elements
    // =====================================================

    const accessCodeInput = document.getElementById("accessCode");
    const saveButton = document.getElementById("saveAccessCode");
    const toggleButton = document.getElementById("toggleAccessCode");

    const clearAccessCodeButton = document.getElementById("clearAccessCode");
    const clearAllDataButton = document.getElementById("clearAllData");

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

    }

    // =====================================================
    // Save Access Code
    // =====================================================

    saveButton.addEventListener("click", () => {

        const code = accessCodeInput.value.trim();

        Storage.setAccessCode(code);

        showToast("Access code saved.");

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
    // Clear All Local Data
    // =====================================================

    clearAllDataButton.addEventListener("click", () => {

        showConfirm(

            "This will permanently delete all locally stored jobs, schemas, filters, settings and access code. Continue?",

            () => {

                Storage.removeAccessCode();
                Storage.clearJobs();
                Storage.clearSchemas();

                accessCodeInput.value = "";

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

            Utils.toast(

                error.message ||

                "Failed to import backup."

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

})();