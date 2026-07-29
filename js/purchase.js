/* ============================================================
    DOM
============================================================ */

const currencyTabs =
    document.querySelectorAll(".currency-tab");

const pricingGrid =
    document.getElementById("pricingGrid");

const processingModal =
    document.getElementById("processingModal");

const modalSpinner =
    document.getElementById("modalSpinner");

const modalIcon =
    document.getElementById("modalIcon");

const modalTitle =
    document.getElementById("modalTitle");

const modalMessage =
    document.getElementById("modalMessage");

const modalActions =
    document.getElementById("modalActions");

const primaryModalButton =
    document.getElementById("primaryModalButton");

const secondaryModalButton =
    document.getElementById("secondaryModalButton");


const verificationBlockedModal =
    document.getElementById("verificationBlockedModal");

const verifyPaymentBtn =
    document.getElementById("verifyPaymentBtn");

const closeBlockedModalBtn =
    document.getElementById("closeBlockedModalBtn");

const verifyPendingPaymentBtn =
    document.getElementById("verifyPendingPaymentBtn");

const closeVerificationCompleteModalBtn =
    document.getElementById("closeVerificationCompleteModalBtn");


const verificationCompleteModal =
    document.getElementById("verificationCompleteModal");

const verificationStatusIcon =
    document.getElementById("verificationStatusIcon");

const verificationStatusTitle =
    document.getElementById("verificationStatusTitle");

const verificationStatusMessage =
    document.getElementById("verificationStatusMessage");

const accessCodeContainer =
    document.getElementById("accessCodeContainer");

const accessCode =
    document.getElementById("accessCode");

const copyAccessCodeBtn =
    document.getElementById("copyAccessCodeBtn");

const verificationDoneBtn =
    document.getElementById("verificationDoneBtn");


const inactiveOverlay =
    document.getElementById("inactiveOverlay");

const restartSessionBtn =
    document.getElementById("restartSessionBtn");


/* ============================================================
    STATE
============================================================ */

let selectedPlan = null;

/*
    Used whenever the user needs to
    verify an unfinished payment.
*/
let pendingVerification = null;

let verifyingPayment = false;


/* ============================================================
    PAYMENT PLANS
============================================================ */

/*
    Edit this array whenever
    you want to change pricing.
*/

const PLANS = [

    // --------------------
    // NGN
    // --------------------

    {
        id: "plan_10_ngn",
        pages: 10,
        amount: 500,
        currency: "NGN",
        featured: false
    },

    {
        id: "plan_100_ngn",
        pages: 100,
        amount: 5000,
        currency: "NGN",
        featured: false
    },

    {
        id: "plan_500_ngn",
        pages: 500,
        amount: 25000,
        currency: "NGN",
        featured: true
    },

    {
        id: "plan_1000_ngn",
        pages: 1000,
        amount: 50000,
        currency: "NGN",
        featured: false
    },

    {
        id: "plan_2500_ngn",
        pages: 2500,
        amount: 125000,
        currency: "NGN",
        featured: false
    },

    {
        id: "plan_5000_ngn",
        pages: 5000,
        amount: 250000,
        currency: "NGN",
        featured: false
    },

    // --------------------
    // USD
    // --------------------

    {
        id: "plan_10_usd",
        pages: 10,
        amount: 1,
        currency: "USD",
        featured: false
    },

    {
        id: "plan_100_usd",
        pages: 100,
        amount: 10,
        currency: "USD",
        featured: false
    },

    {
        id: "plan_500_usd",
        pages: 500,
        amount: 50,
        currency: "USD",
        featured: true
    },

    {
        id: "plan_1000_usd",
        pages: 1000,
        amount: 100,
        currency: "USD",
        featured: false
    },

    {
        id: "plan_2500_usd",
        pages: 2500,
        amount: 250,
        currency: "USD",
        featured: false
    },

    {
        id: "plan_5000_usd",
        pages: 5000,
        amount: 500,
        currency: "USD",
        featured: false
    }

];

// const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK_TEST-c3adb57392cdc89f81cd6b12959f7141-X"
const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK-766caaef810d70163be3a8d8e5bb2c87-X"


// const CURRENCY = "NGN";
let selectedCurrency =
    localStorage.getItem("purchase_currency") || "NGN";

const PAYMENT_TITLE =
    "Zendix Lite";

const PAYMENT_DESCRIPTION =
    "Zendix Lite Access Pages";


/* ============================================================
    EVENTS
============================================================ */

function bindEvents() {

    // restartSessionBtn.addEventListener(
    //     "click",
    //     () => location.reload()
    // );

    verifyPaymentBtn.addEventListener(
        "click", function () {

            if (!pendingVerification) {
                return;
            }

            hideVerificationBlockedModal();

            startSession();

            showProcessingModal();

            verifyPendingPayment();

        }
    );

    verifyPendingPaymentBtn.addEventListener(
        "click", function () {

            if (!pendingVerification) {
                return;
            }

            hideVerificationResultModal();

            startSession();

            showProcessingModal();

            verifyPendingPayment();

        }
    );

    closeBlockedModalBtn.addEventListener(
        "click",
        () => {

            verificationBlockedModal
                .classList
                .remove("show");

        }
    );

    verificationDoneBtn.addEventListener(
        "click",
        () => {

            verificationCompleteModal
                .classList
                .remove("show");

        }
    );

    closeVerificationCompleteModalBtn.addEventListener(
        "click",
        () => {

            verificationCompleteModal
                .classList
                .remove("show");

        }
    );

    copyAccessCodeBtn.addEventListener(
        "click",
        copyAccessCode
    );

}

pricingGrid.addEventListener(
    "click",
    handlePricingGridClick
);


/* ============================================================
    BUTTON STATE
============================================================ */

function disableBuyButtons() {

    document
        .querySelectorAll(".buy-plan-btn")
        .forEach(button => {

            button.disabled = true;

        });

}


function enableBuyButtons() {

    document
        .querySelectorAll(".buy-plan-btn")
        .forEach(button => {

            button.disabled = false;

        });

}

/* ============================================================
    PLAN SELECTION
============================================================ */

function updateCurrencyTabs() {

    currencyTabs.forEach(tab => {

        tab.classList.toggle(
            "active",
            tab.dataset.currency === selectedCurrency
        );

    });

}

function handlePricingGridClick(event) {

    const button = event.target.closest(
        ".buy-plan-btn"
    );

    if (!button) {
        return;
    }

    const planId =
        button.dataset.planId;

    selectedPlan =
        PLANS.find(
            plan => plan.id === planId
        );

    if (!selectedPlan) {
        return;
    }

    startPayment();

}

currencyTabs.forEach(tab => {

    tab.addEventListener("click", () => {

        selectedCurrency = tab.dataset.currency;

        localStorage.setItem(
            "purchase_currency",
            selectedCurrency
        );

        updateCurrencyTabs();

        renderPlans();

    });

});

/* ============================================================
    RENDER PLANS
============================================================ */

function renderPlans() {

    pricingGrid.innerHTML = "";

    PLANS.filter(plan => plan.currency === selectedCurrency).forEach(plan => {

        const card = document.createElement("div");

        card.className = plan.featured
            ? "plan-card featured"
            : "plan-card";

        card.innerHTML = `

    ${plan.featured ? `
        <div class="plan-badge">

            ⭐ Most Popular

        </div>
    ` : ""}

    <div class="plan-header">

        <div class="plan-pages">

            ${plan.pages.toLocaleString()}

        </div>

        <div class="plan-pages-label">

            Pages

        </div>

    </div>

    <div class="plan-price">

        ${Utils.formatCurrency(plan.amount, plan.currency)}

    </div>

    <div class="plan-rate">

        ${Utils.formatCurrency(
            plan.amount / plan.pages, plan.currency
        )} per page

    </div>

    <div class="plan-divider"></div>

    <div class="plan-features">

        <div class="plan-feature">

            <span class="feature-icon">✓</span>

            Instant activation

        </div>

        <div class="plan-feature">

            <span class="feature-icon">✓</span>

            Credits never expire

        </div>

        <div class="plan-feature">

            <span class="feature-icon">✓</span>

            Secure payment

        </div>

    </div>

    <button
        class="button buy-plan-btn primary-btn"
        data-plan-id="${plan.id}">

        Buy Now

    </button>

`;

        pricingGrid.appendChild(card);

    });

}


/* ============================================================
    SESSION MANAGEMENT
============================================================ */

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

    stopSession();

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

    window.addEventListener(
        eventName,
        resetInactivityTimer
    );

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

restartSessionBtn.addEventListener(
    "click",
    restartSession
);


function restartSession() {

    inactiveOverlay.classList.remove("show");

    startSession();

}


/* ============================================================
    PAYMENT
============================================================ */

function renderPendingVerifications() {

    const container =
        document.getElementById(
            "pendingVerifications"
        );

    const verifications =
        Storage.getPendingVerifications();

    if (verifications.length === 0) {

        container.classList.add("hidden");

        container.innerHTML = "";

        return;

    }

    container.classList.remove("hidden");

    container.innerHTML = `

    <div class="pending-header">

        <h2>

            Interrupted Payment Verifications

        </h2>

        <p>

            These payments were completed, but their verification was interrupted before
            the result could be shown. Verify them to retrieve your access code.

        </p>

    </div>

    <div class="pending-grid">

        ${verifications.map(verification => `

            <div class="pending-card">

                <div class="pending-badge">

                    Interrupted

                </div>

                <div class="pending-main">

                    <div class="pending-pages">

                        ${verification.pages.toLocaleString()} Pages

                    </div>

                    <div class="pending-amount">

                        ${Utils.formatCurrency(verification.amount, verification.currency)}

                    </div>

                </div>

                <div class="pending-meta">

                    <div>

                        <strong>Reference</strong>

                        <span>${verification.tx_ref}</span>

                    </div>

                    <div>

                        <strong>Date</strong>

                        <span>

                            ${verification.created_at
            ? Utils.formatDate(
                verification.created_at
            )
            : "Unknown"
        }

                        </span>

                    </div>

                </div>

                <button

                    class="button verify-payment primary-btn"

                    data-txref="${verification.tx_ref}">

                    Verify Payment

                </button>

            </div>

        `).join("")}

    </div>

`;

    container

        .querySelectorAll(".verify-payment")

        .forEach(button => {

            button.addEventListener(

                "click",

                () => verifyPendingVerification(

                    button.dataset.txref

                )

            );

        });

}

async function verifyPendingVerification(txRef) {

    const verification =

        Storage.getPendingVerification(
            txRef
        );

    if (!verification) {

        Utils.toast(
            // "Verification no longer exists."
            "Payment data not found."
        );

        renderPendingVerifications();

        return;

    }

    pendingVerification = verification;

    hideVerificationBlockedModal();

    startSession();

    showProcessingModal();

    await verifyPendingPayment();

}

function refreshPendingVerifications() {

    renderPendingVerifications();

}

function startPayment() {

    const email = Storage.getEmail();

    if (!email) {

        showEmailRequiredModal();

        return;

    }

    if (!selectedPlan) {

        Utils.toast(
            "Please select a plan."
        );

        return;

    }

    disableBuyButtons();

    openFlutterwaveCheckout();

}

function openFlutterwaveCheckout() {
    console.log("Making payment...");

    FlutterwaveCheckout({

        public_key: FLUTTERWAVE_PUBLIC_KEY,

        tx_ref: Utils.generateTransactionReference(),

        amount: selectedPlan.amount,

        currency: selectedPlan.currency,

        payment_options:
            "card,banktransfer,ussd",

        customer: {

            email: Storage.getEmail(),

            name: "Zendix User"

        },

        customizations: {

            title: PAYMENT_TITLE,

            description: PAYMENT_DESCRIPTION,

            logo: ""

        },

        meta: {

            product: "zendix_lite",

            plan: selectedPlan.id

        },

        callback: handlePaymentCallback,

        onclose: handlePaymentClose

    });



}

async function handlePaymentCallback(payment) {

    pendingVerification = {

        transactionId: payment.transaction_id,

        tx_ref: payment.tx_ref,

        amount: selectedPlan.amount,

        currency: selectedPlan.currency,

        pages: selectedPlan.pages,

        planId: selectedPlan.id,

        created_at: new Date().toISOString()

    };

    Storage.addPendingVerification(
        pendingVerification
    );

    showProcessingModal();

    await verifyPendingPayment();

}

function handlePaymentClose() {
    console.log("CLOSING MODAL...")

    if (verifyingPayment) {
        return;
    }

    enableBuyButtons();

}

async function verifyPendingPayment() {

    console.log("VERIFYING PAYMENT...")

    disableBuyButtons();

    if (!pendingVerification) {
        return;
    }

    verifyingPayment = true;

    try {

        const response =
            await Api.verifyPayment(

                pendingVerification

            );

        console.log("RESPONSE = ", response);
        // Save access code if payment succeeded.


        // Now verification is complete.

        // Storage.removePendingVerification(
        //     pendingVerification.tx_ref
        // );

        // refreshPendingVerifications();

        // pendingVerification = null;

        showVerificationResultModal(response);

    }

    catch (error) {

        // Do nothing to the pending verification.
        // It already exists and can be retried.

        showVerificationBlockedModal(
            error.message ||
            "Unable to verify your payment."
        );

    }

    finally {

        verifyingPayment = false;

        stopSession();

        enableBuyButtons();

    }

}

/* ============================================================
    PROCESSING MODAL
============================================================ */

function showProcessingModal() {

    processingModal.classList.add("show");

    modalSpinner.classList.remove("hidden");

    modalIcon.classList.add("hidden");

    // modalActions.classList.add("hidden");

    modalTitle.textContent =
        "Verifying Payment";

    modalMessage.textContent =
        "Please wait while we verify your payment.";

}


function hideProcessingModal() {

    processingModal.classList.remove("show");

}

/* ============================================================
    VERIFICATION BLOCKED
============================================================ */

function showVerificationBlockedModal(message) {

    hideProcessingModal();

    verificationBlockedModal.classList.add("show");

    const messageElement =
        verificationBlockedModal.querySelector(
            ".verification-blocked-message"
        );

    messageElement.textContent =
        message ||
        "We couldn't verify your payment right now.";

}


function hideVerificationBlockedModal() {

    verificationBlockedModal.classList.remove("show");

}

/* ============================================================
    VERIFICATION RESULT
============================================================ */

function showVerificationResultModal(
    response
) {

    hideProcessingModal();

    verificationCompleteModal
        .classList
        .add("show");

    // pendingVerification = null;
    console.log("pendingVerification = ", pendingVerification);

    // const success =
    //     response.payment_status ===
    //     "successful";

    const paymentStatus = response.payment_status;

    if (paymentStatus === "successful") {

        Storage.setAccessCode(response.access_code);

        verificationStatusIcon.textContent =
            "✓";

        verificationStatusTitle.textContent =
            "Payment Successful";

        verificationStatusMessage.textContent =
            response.message || "Your payment was successful."

        accessCodeContainer.classList.remove(
            "hidden"
        );

        accessCode.textContent =
            response.access_code;

        Storage.removePendingVerification(
            pendingVerification.tx_ref
        );

        refreshPendingVerifications();
        
        pendingVerification = null;

    }

    else if (paymentStatus === "failed") {

        verificationStatusIcon.textContent =
            "✕";

        verificationStatusTitle.textContent =
            "Payment Failed";

        verificationStatusMessage.textContent =
            response.message ||
            "Your payment was unsuccessful.";

        accessCodeContainer.classList.add(
            "hidden"
        );

        accessCode.textContent = "";

        Storage.removePendingVerification(
            pendingVerification.tx_ref
        );

        refreshPendingVerifications();

        pendingVerification = null;

    }

    else if (paymentStatus === "pending") {

        verificationStatusIcon.textContent =
            "...";

        verificationStatusTitle.textContent =
            "Payment Pending";

        verificationStatusMessage.textContent =
            response.message ||
            "Your payment is still being verified.";

        accessCodeContainer.classList.add(
            "hidden"
        );

        accessCode.textContent = "";

        verificationDoneBtn.classList.add("hidden");

        modalActions.classList.remove("hidden");

    }

    else {

        verificationStatusIcon.textContent =
            "...";

        verificationStatusTitle.textContent =
            "Payment Pending";

        verificationStatusMessage.textContent =
            response.message ||
            "Your payment is still being verified.";

        accessCodeContainer.classList.add(
            "hidden"
        );

        accessCode.textContent = "";

        verificationDoneBtn.classList.add("hidden");

        modalActions.classList.remove("hidden");

    }

    console.log("pendingVerification = ", pendingVerification);

}

function hideVerificationResultModal() {

    verificationCompleteModal
        .classList
        .remove("show");

}

function showEmailRequiredModal() {

    document
        .getElementById(
            "emailRequiredModal"
        )
        .classList.add("show");

}

function hideEmailRequiredModal() {

    document
        .getElementById(
            "emailRequiredModal"
        )
        .classList.remove("show");

}

document
    .getElementById("cancelEmailModalBtn")
    .addEventListener("click", hideEmailRequiredModal);

document
    .getElementById("settingsEmailModalBtn")
    .addEventListener("click", () => {

        location.href = "settings.html";

    });

/* ============================================================
    HELPERS
============================================================ */

async function copyAccessCode() {

    if (!accessCode.textContent) {
        return;
    }

    await Utils.copyText(
        accessCode.textContent
    );

    Utils.toast(
        "Access code copied."
    );

}


function resetPurchasePage() {

    selectedPlan = null;

    pendingVerification = null;

    verifyingPayment = false;

    hideProcessingModal();

    hideVerificationBlockedModal();

    hideVerificationResultModal();

    enableBuyButtons();

    startSession();

}

function formatPages(pages) {

    return `${pages.toLocaleString()} pages`;

}


function updateEmailRequirement() {

    const banner =
        document.getElementById(
            "emailRequiredBanner"
        );

    const title =
        document.getElementById(
            "emailStatusTitle"
        );

    const message =
        document.getElementById(
            "emailStatusMessage"
        );

    const icon =
        banner.querySelector(
            ".email-status-icon"
        );

    const email =
        Storage.getEmail();

    banner.classList.remove(
        "email-warning",
        "email-success"
    );

    banner.classList.remove("hidden");

    if (email) {

        banner.classList.add(
            "email-success"
        );

        icon.textContent = "✓";

        title.textContent =
            "Purchasing As";

        message.textContent =
            email;

    }

    else {

        banner.classList.add(
            "email-warning"
        );

        icon.textContent = "✉️";

        title.textContent =
            "Email Required";

        message.textContent =
            "Add your email address before purchasing an access code.";

    }

}

document
    .getElementById("goToSettingsBtn")
    .addEventListener("click", () => {

        location.href = "settings.html";

    });

/* ============================================================
    INITIALIZE
============================================================ */

initialize();

function initialize() {

    updateCurrencyTabs();

    renderPlans();

    renderPendingVerifications();

    updateEmailRequirement();

    bindEvents();

}
