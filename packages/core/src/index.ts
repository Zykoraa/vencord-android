import { metroInterceptor } from "./metro/interceptor.js";
import { metroFinder } from "./metro/finder.js";
import { patcher } from "./patcher/index.js";
import { storage } from "./api/storage.js";
import { ui } from "./api/ui.js";
import {
    pluginManager,
    silentTypingPlugin,
    customTimestampsPlugin,
    showHiddenChannelsPlugin,
    developerToolsPlugin,
    disableCallIdlePlugin,
    type PluginContext
} from "@vencord-mobile/plugins";
import { SettingsView } from "./ui/SettingsView.js";
import { setupVencordCompatAPI, adaptVencordPlugin } from "./compat/vencordPluginAdapter.js";

const logger = {
    log: (...args: any[]) => console.log("[VencordMobile]", ...args),
    info: (...args: any[]) => console.info("[VencordMobile]", ...args),
    warn: (...args: any[]) => console.warn("[VencordMobile]", ...args),
    error: (...args: any[]) => console.error("[VencordMobile]", ...args),
};

export class VencordMobile {
    public readonly version = "0.1.0";
    public readonly metro = metroFinder;
    public readonly patcher = patcher;
    public readonly storage = storage;
    public readonly ui = ui;
    public readonly plugins = pluginManager;
    public readonly logger = logger;
    public readonly adaptVencordPlugin = adaptVencordPlugin;

    private initialized = false;

    public init() {
        if (this.initialized) return;
        this.initialized = true;

        logger.info(`Initializing Vencord Mobile v${this.version}...`);

        // 1. Install Metro interceptor hooks
        metroInterceptor.install();

        // 2. Setup Vencord Desktop compatibility layer
        setupVencordCompatAPI();

        // 3. Initialize Plugin Context
        const context: PluginContext = {
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

    private hookSettings() {
        // Find Discord's Settings overview or Settings renderer
        this.metro.waitFor((mod: any) => {
            return mod && (mod.useSettingsTree || mod.UserSettingsOverview || mod.SettingsOverview);
        }).then((settingsModule: any) => {
            logger.info("Found Discord settings module; injecting Vencord Settings entry");

            if (settingsModule.useSettingsTree) {
                this.patcher.after(settingsModule, "useSettingsTree", (_args: any[], res: any) => {
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
(globalThis as any).Vencord = vencord;

// Automatically initialize if loaded in a runtime environment
vencord.init();

export * from "./metro/interceptor.js";
export * from "./metro/finder.js";
export * from "./patcher/index.js";
export * from "./api/storage.js";
export * from "./api/ui.js";
export * from "./ui/SettingsView.js";
export * from "./compat/vencordPluginAdapter.js";
