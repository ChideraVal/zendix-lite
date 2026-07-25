/* ============================================================
    DOM
============================================================ */

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

    {
        id: "plan_10",
        pages: 10,
        amount: 500,
        featured: false
    },

    {
        id: "plan_100",
        pages: 100,
        amount: 5000,
        featured: false
    },

    {
        id: "plan_500",
        pages: 500,
        amount: 25000,
        featured: true
    },

    {
        id: "plan_1000",
        pages: 1000,
        amount: 50000,
        featured: false
    },

    {
        id: "plan_2500",
        pages: 2500,
        amount: 125000,
        featured: false
    },

    {
        id: "plan_5000",
        pages: 5000,
        amount: 250000,
        featured: false
    }

];

const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK-a5854115010173e1d82d95e24cb9741d-X"

const CURRENCY = "NGN";

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
        "click",
        verifyPendingPayment
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


/* ============================================================
    RENDER PLANS
============================================================ */

function renderPlans() {

    pricingGrid.innerHTML = "";

    PLANS.forEach(plan => {

        const card = document.createElement("div");

        card.className = plan.featured
            ? "plan-card featured"
            : "plan-card";

        card.innerHTML = `

            ${plan.featured ? `
                <div class="plan-badge">

                    Most Popular

                </div>
            ` : ""}

            <div class="plan-pages">

                ${plan.pages.toLocaleString()}

                <span>

                    Pages

                </span>

            </div>

            <div class="plan-price">

                ${Utils.formatCurrency(
            plan.amount
        )}

            </div>

            <div class="plan-rate">

                ${Utils.formatCurrency(
            plan.amount / plan.pages
        )} per page

            </div>

            <button
                class="button buy-plan-btn"
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

const KEEP_ALIVE_INTERVAL =
    10 * 60 * 1000;

const INACTIVITY_TIMEOUT =
    60 * 60 * 1000;

let keepAliveTimer = null;

let inactivityTimer = null;


/* ============================================================
    START SESSION
============================================================ */

startSession();

function startSession() {

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

function loadPendingVerification() {

    pendingVerification =
        Storage.getPendingPaymentVerification();

    if (pendingVerification) {

        showPendingVerificationNotice();

    }

}

function startPayment() {

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
    console.log(selectedPlan);

    FlutterwaveCheckout({

        public_key: FLUTTERWAVE_PUBLIC_KEY,

        tx_ref: Utils.generateTransactionReference(),

        amount: selectedPlan.amount,

        currency: CURRENCY,

        // payment_options:
        //     "card,banktransfer,ussd",
        payment_options: "card, ussd, banktransfer, account, internetbanking, nqr, applepay, googlepay, enaira, opay",

        customer: {

            email: "",

            name: ""

        },

        customizations: {

            title: PAYMENT_TITLE,

            description: PAYMENT_DESCRIPTION,

            logo: ""

        },

        callback: handlePaymentCallback,

        onclose: handlePaymentClose

    });

}

async function handlePaymentCallback(payment) {

    pendingVerification = {

        transactionId: payment.transaction_id,

        txRef: payment.tx_ref,

        amount: selectedPlan.amount,

        pages: selectedPlan.pages,

        planId: selectedPlan.id

    };

    Storage.savePendingPaymentVerification(
        pendingVerification
    );

    showProcessingModal();

    await verifyPendingPayment();

}

function handlePaymentClose() {

    if (paymentCompleted) {
        return;
    }

    enableBuyButtons();

}

async function verifyPendingPayment() {

    if (!pendingVerification) {
        return;
    }

    verifyingPayment = true;

    try {

        const response =
            await Api.verifyPayment(

                pendingVerification

            );

        // Save access code if payment succeeded.

        

        // Now verification is complete.

        Storage.removePendingPaymentVerification();

        pendingVerification = null;

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

    }

}

/* ============================================================
    PROCESSING MODAL
============================================================ */

function showProcessingModal() {

    processingModal.classList.add("show");

    modalSpinner.classList.remove("hidden");

    modalIcon.classList.add("hidden");

    modalActions.classList.add("hidden");

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

    const success =
        response.payment_status ===
        "successful";

    if (success) {

        verificationStatusIcon.textContent =
            "✓";

        verificationStatusTitle.textContent =
            "Payment Successful";

        verificationStatusMessage.textContent =
            `Your access code has been generated with ${formatPages(response.pages)}.`;

        accessCodeContainer.classList.remove(
            "hidden"
        );

        accessCode.value =
            response.access_code;

    }

    else {

        verificationStatusIcon.textContent =
            "✕";

        verificationStatusTitle.textContent =
            "Payment Failed";

        verificationStatusMessage.textContent =
            response.message ||
            "Your payment was not successful.";

        accessCodeContainer.classList.add(
            "hidden"
        );

        accessCode.value = "";

    }

}

function hideVerificationResultModal() {

    verificationCompleteModal
        .classList
        .remove("show");

}

/* ============================================================
    HELPERS
============================================================ */

async function copyAccessCode() {

    if (!accessCode.value) {
        return;
    }

    await Utils.copyText(
        accessCode.value
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


/* ============================================================
    INITIALIZE
============================================================ */

initialize();

function initialize() {

    renderPlans();

    bindEvents();

    loadPendingVerification();

}