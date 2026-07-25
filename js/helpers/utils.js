/*
|--------------------------------------------------------------------------
| Zendix Utility Helper
|--------------------------------------------------------------------------
| Generic reusable helper functions.
|--------------------------------------------------------------------------
*/

const Utils = (() => {

    // --------------------------------------------------
    // IDs
    // --------------------------------------------------

    function uuid() {

        if (window.crypto && crypto.randomUUID) {
            return crypto.randomUUID();
        }

        return Date.now().toString(36) +
            Math.random().toString(36).substring(2);

    }

    // --------------------------------------------------
    // Date Formatting
    // --------------------------------------------------

    function formatDate(date) {

        return new Date(date).toLocaleDateString();

    }

    function formatTime(date) {

        return new Date(date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    }

    function formatDateTime(date) {

        return `${formatDate(date)} ${formatTime(date)}`;

    }

    // --------------------------------------------------
    // File Helpers
    // --------------------------------------------------

    function getExtension(filename) {

        return filename.split(".").pop().toLowerCase();

    }

    function getFileName(filename) {

        const index = filename.lastIndexOf(".");

        if (index === -1)
            return filename;

        return filename.substring(0, index);

    }

    function formatFileSize(bytes) {

        if (bytes === 0)
            return "0 Bytes";

        const units = [
            "Bytes",
            "KB",
            "MB",
            "GB",
            "TB"
        ];

        const i = Math.floor(
            Math.log(bytes) / Math.log(1024)
        );

        return (
            bytes / Math.pow(1024, i)
        ).toFixed(2) + " " + units[i];

    }

    // --------------------------------------------------
    // Downloads
    // --------------------------------------------------

    function downloadBlob(blob, filename) {

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");

        a.href = url;
        a.download = filename;

        document.body.appendChild(a);

        a.click();

        a.remove();

        URL.revokeObjectURL(url);

    }

    function downloadJSON(data, filename = "data.json") {

        const blob = new Blob(
            [
                JSON.stringify(data, null, 2)
            ],
            {
                type: "application/json"
            }
        );

        downloadBlob(blob, filename);

    }

    function downloadText(text, filename = "file.txt") {

        const blob = new Blob(
            [text],
            {
                type: "text/plain"
            }
        );

        downloadBlob(blob, filename);

    }

    // --------------------------------------------------
    // Clipboard
    // --------------------------------------------------

    async function copy(text) {

        await navigator.clipboard.writeText(text);

    }

    // --------------------------------------------------
    // Debounce
    // --------------------------------------------------

    function debounce(fn, delay = 300) {

        let timer;

        return (...args) => {

            clearTimeout(timer);

            timer = setTimeout(() => {

                fn(...args);

            }, delay);

        };

    }

    // --------------------------------------------------
    // Sleep
    // --------------------------------------------------

    function sleep(ms) {

        return new Promise(resolve => {

            setTimeout(resolve, ms);

        });

    }

    // --------------------------------------------------
    // Toast
    // --------------------------------------------------

    let toastTimer = null;

    function toast(message, type = "info") {

        const element =
            document.getElementById("toast");

        if (!element)
            return;

        clearTimeout(toastTimer);

        element.textContent = message;

        element.className = "toast";

        element.classList.add(type);

        element.classList.add("show");

        toastTimer = setTimeout(() => {

            element.classList.remove("show");

        }, 3000);

    }

    // --------------------------------------------------
    // Loading
    // --------------------------------------------------

    function showLoading(text = "Loading...") {

        const overlay =
            document.getElementById("loadingOverlay");

        if (!overlay)
            return;

        overlay.style.display = "flex";

        const label =
            overlay.querySelector(".loading-text");

        if (label)
            label.textContent = text;

    }

    function hideLoading() {

        const overlay =
            document.getElementById("loadingOverlay");

        if (!overlay)
            return;

        overlay.style.display = "none";

    }

    // --------------------------------------------------
    // Errors
    // --------------------------------------------------

    function getErrorMessage(error) {

        if (!error)
            return "Unknown error.";

        if (typeof error === "string")
            return error;

        if (error.message)
            return error.message;

        return "Something went wrong.";

    }

    // --------------------------------------------------
    // Network
    // --------------------------------------------------

    function isOnline() {

        return navigator.onLine;

    }

    // --------------------------------------------------
    // Get query paramater
    // --------------------------------------------------

    function getQueryParam(name) {

        const params = new URLSearchParams(window.location.search);
        return params.get(name);

    }

    // --------------------------------------------------
    // Scroll
    // --------------------------------------------------

    function scrollTop() {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }

    function scrollToElement(element) {

        if (!element)
            return;

        element.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    // --------------------------------------------------
    // Currency Formatting
    // --------------------------------------------------

    function formatCurrency(amount) {

        return new Intl.NumberFormat(

            "en-NG",

            {

                style: "currency",

                currency: "NGN",

                maximumFractionDigits: 0

            }

        ).format(amount);

    }

    function generateTransactionReference() {

        const random = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

        return `ZL-${Date.now()}-${random}`;

    }

    async function copyText(text) {

        try {

            await navigator.clipboard.writeText(text);

        }

        catch {

            const input =
                document.createElement("textarea");

            input.value = text;

            document.body.appendChild(input);

            input.select();

            document.execCommand("copy");

            input.remove();

        }

    }

    // --------------------------------------------------
    // Public API
    // --------------------------------------------------

    return {

        uuid,

        formatDate,
        formatTime,
        formatDateTime,

        getExtension,
        getFileName,
        formatFileSize,

        downloadBlob,
        downloadJSON,
        downloadText,

        copy,

        debounce,

        sleep,

        toast,

        showLoading,
        hideLoading,

        getErrorMessage,

        isOnline,

        getQueryParam,

        scrollTop,
        scrollToElement,

        formatCurrency,
        generateTransactionReference,
        copyText

    };

})();