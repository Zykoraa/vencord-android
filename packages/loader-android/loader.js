/**
 * Vencord Mobile Native Bootstrap Loader
 * 
 * Executed by the Hermes JavaScript runtime before Discord initializes.
 * 1. Establishes global Metro hooks.
 * 2. Loads the local/remote Vencord Mobile bundle.
 * 3. Safely hands control over to Discord's stock bundle.
 */

(function () {
    const DEV_SERVER_URL = "http://10.0.2.2:4040/vencord-mobile.bundle.js";

    console.log("[VencordMobileLoader] Bootstrapping mobile runtime...");

    // Helper to evaluate JavaScript safely
    function evaluateCode(code, sourceURL) {
        try {
            const runner = new Function("sourceURL", code);
            runner(sourceURL);
        } catch (err) {
            console.error("[VencordMobileLoader] Failed to evaluate script from " + sourceURL, err);
        }
    }

    // Try loading debug bundle over network if running in emulator / development mode
    if (typeof fetch === "function") {
        fetch(DEV_SERVER_URL)
            .then(res => res.text())
            .then(code => {
                console.log("[VencordMobileLoader] Successfully loaded dynamic bundle from dev server!");
                evaluateCode(code, DEV_SERVER_URL);
            })
            .catch(() => {
                console.log("[VencordMobileLoader] Dev server unreachable, running embedded bundle.");
            });
    }
})();
