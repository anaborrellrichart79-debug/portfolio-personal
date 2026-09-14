/*=========================================
        CONSENTIMIENTO DE COOKIES
=========================================*/

(function () {

    const STORAGE_KEY = "cookie_consent";

    const banner = document.getElementById("cookie-banner");
    const acceptButton = document.getElementById("cookie-accept");
    const rejectButton = document.getElementById("cookie-reject");
    const settingsLink = document.getElementById("cookie-settings-link");

    if (!banner || !acceptButton || !rejectButton) return;

    function updateConsent(granted) {

        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }

        gtag("consent", "update", {
            analytics_storage: granted ? "granted" : "denied"
        });

    }

    function showBanner() {

        banner.hidden = false;

    }

    function hideBanner() {

        banner.hidden = true;

    }

    function savePreference(value) {

        localStorage.setItem(STORAGE_KEY, value);

    }

    const savedPreference = localStorage.getItem(STORAGE_KEY);

    if (savedPreference === "granted") {

        updateConsent(true);

    } else if (savedPreference === "denied") {

        updateConsent(false);

    } else {

        showBanner();

    }

    acceptButton.addEventListener("click", () => {

        updateConsent(true);
        savePreference("granted");
        hideBanner();

    });

    rejectButton.addEventListener("click", () => {

        updateConsent(false);
        savePreference("denied");
        hideBanner();

    });

    if (settingsLink) {

        settingsLink.addEventListener("click", () => {

            showBanner();

        });

    }

})();
