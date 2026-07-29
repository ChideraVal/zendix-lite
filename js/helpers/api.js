/* ============================================================
   api.js
   Zendix Static Site API Helper
============================================================ */

const Api = (() => {

    // const BASE_URL = "https://api.zendix.app/v1";
    const BASE_URL = " http://127.0.0.1:8000/v1";

    function loop_error_details(error) {
        let error_messages = ""
        for (key in error) {
            // console.log("ERRORS:", key, error[key])
            for (msg of error[key]) {
                // console.log("MSG:", msg)
                error_messages = error_messages + msg + " "
            }
        }
        return error_messages;
    }

    /* --------------------------------------------------------
       Generic Request
    -------------------------------------------------------- */

    async function request(endpoint, options = {}) {

        const accessCode = Storage.getAccessCode();

        const headers = {
            ...(options.headers || {})
        };

        if (accessCode) {
            headers["Authorization"] = `Bearer ${accessCode}`;
        }

        const response = await fetch(BASE_URL + endpoint, {
            ...options,
            headers
        });

        let data = {};

        try {
            data = await response.json();
        }
        catch {
            data = {};
        }

        // console.log(response);

        if (!response.ok) {

            const error = new Error(
                // data.error.message || "Request failed"
                data.error.details ? loop_error_details(data.error.details) : data.error.message ? data.error.message.replace("API key", "access code") : "Request failed"
            );

            error.status = response.status;
            error.data = data;

            throw error;
        }

        return data;

    }

    /* --------------------------------------------------------
       Create Extraction Job
    -------------------------------------------------------- */

    async function createExtractionJob({

        text = "",

        files = [],

        documentType,

        schema,

        // clientReferenceId

    }) {

        const accessCode = Storage.getAccessCode();

        const formData = new FormData();

        formData.append("text", text);

        formData.append("document_type", documentType);

        // formData.append(
        //     "client_reference_id",
        //     clientReferenceId
        // );

        formData.append(
            "schema",
            JSON.stringify(schema)
        );

        files.forEach(file => {
            formData.append("files", file);
        });

        const response = await fetch(
            BASE_URL + "/jobs/s/create/",
            {
                method: "POST",

                headers: accessCode
                    ? {
                        "Authorization": `Bearer ${accessCode}`
                    }
                    : {},

                body: formData
            }
        );

        const data = await response.json();
        console.log(data)

        if (!response.ok) {

            // loop_error_details(data.error.details);

            const error = new Error(
                // data.error.message.replace("API key", "access code") || "Extraction failed"
                data.error.details ? loop_error_details(data.error.details) : data.error.message ? data.error.message.replace("API key", "access code") : "Extraction failed"
            );

            error.status = response.status;
            error.data = data;

            throw error;
        }

        return data;

    }

    /* --------------------------------------------------------
       Poll Job
    -------------------------------------------------------- */

    async function getJobStatus(jobId) {

        return request(`/jobs/${jobId}/`);

    }

    /* --------------------------------------------------------
       Purchase Access Code
    -------------------------------------------------------- */

    async function purchaseAccessCode(email) {

        return request("/purchase/", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email
            })
        });

    }

    /* ============================================================
        VERIFY PAYMENT
    ============================================================ */

    async function verifyPayment(data) {

        return request(

            "/payments/verify/",

            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    transaction_id: data.transactionId,

                    plan: data.planId

                })

            }

        );

        // return response;

    }

    /* --------------------------------------------------------
       Get Usage
    -------------------------------------------------------- */

    async function getUsage() {

        const access_code = Storage.getAccessCode();

        return request(`/usage/${access_code}/`);

    }

    /* --------------------------------------------------------
       Health Check
    -------------------------------------------------------- */

    async function ping() {

        return request("/ping/");

    }

    return {

        createExtractionJob,

        getJobStatus,

        purchaseAccessCode,

        verifyPayment,

        getUsage,

        ping

    };

})();