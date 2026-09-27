import { metroInterceptor } from "./metro/interceptor.js";
import { metroFinder } from "./metro/finder.js";
import { patcher } from "./patcher/index.js";
import { storage } from "./api/storage.js";
import { ui } from "./api/ui.js";
import { pluginManager, silentTypingPlugin, customTimestampsPlugin, showHiddenChannelsPlugin, developerToolsPlugin, disableCallIdlePlugin } from "@vencord-mobile/plugins";
import { SettingsView } from "./ui/SettingsView.js";
import { setupVencordCompatAPI, adaptVencordPlugin } from "./compat/vencordPluginAdapter.js";
const logger = {
    log: (...args) => console.log("[VencordMobile]", ...args),
    info: (...args) => console.info("[VencordMobile]", ...args),
    warn: (...args) => console.warn("[VencordMobile]", ...args),
    error: (...args) => console.error("[VencordMobile]", ...args),
};
export class VencordMobile {
    version = "0.1.0";
    metro = metroFinder;
    patcher = patcher;
    storage = storage;
    ui = ui;
    plugins = pluginManager;
    logger = logger;
    adaptVencordPlugin = adaptVencordPlugin;
    initialized = false;
    init() {
        if (this.initialized)
            return;
        this.initialized = true;
        logger.info(`Initializing Vencord Mobile v${this.version}...`);
        // 1. Install Metro interceptor hooks
        metroInterceptor.install();
        // 2. Setup Vencord Desktop compatibility layer
        setupVencordCompatAPI();
        // 3. Initialize Plugin Context
        const context = {
            metro: this.metro,
            patcher: this.patcher,
            storage: this.storage,
            ui: this.ui,
            logger: this.logger,
        };
        this.plugins.initialize(context);
        // 4. Register built-in plugins
        this.plugins.register(silentTypingPlugin);
        this.plugins.register(customTimestampsPlugin);
        this.plugins.register(showHiddenChannelsPlugin);
        this.plugins.register(developerToolsPlugin);
        this.plugins.register(disableCallIdlePlugin);
        // 4. Hook Settings navigation
        this.hookSettings();
        logger.info("Vencord Mobile initialized successfully!");
    }
    hookSettings() {
        // Find Discord's Settings overview or Settings renderer
        this.metro.waitFor((mod) => {
            return mod && (mod.useSettingsTree || mod.UserSettingsOverview || mod.SettingsOverview);
        }).then((settingsModule) => {
            logger.info("Found Discord settings module; injecting Vencord Settings entry");
            if (settingsModule.useSettingsTree) {
                this.patcher.after(settingsModule, "useSettingsTree", (_args, res) => {
                    if (Array.isArray(res)) {
                        res.push({
                            title: "Vencord",
                            key: "vencord_mobile_settings",
                            render: () => SettingsView(),
                        });
                    }
                    return res;
                });
            }
        }).catch((err) => {
            logger.warn("Could not hook settings module immediately:", err);
        });
    }
}
export const vencord = new VencordMobile();
// Expose on global scope
globalThis.Vencord = vencord;
// Automatically initialize if loaded in a runtime environment
vencord.init();
export * from "./metro/interceptor.js";
export * from "./metro/finder.js";
export * from "./patcher/index.js";
export * from "./api/storage.js";
export * from "./api/ui.js";
export * from "./ui/SettingsView.js";
export * from "./compat/vencordPluginAdapter.js";
//# sourceMappingURL=index.js.map