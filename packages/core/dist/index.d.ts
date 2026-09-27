export declare class VencordMobile {
    readonly version = "0.1.0";
    readonly metro: import("./index.js").MetroFinder;
    readonly patcher: import("./index.js").Patcher;
    readonly storage: import("./index.js").Storage;
    readonly ui: import("./index.js").UIManager;
    readonly plugins: import("@vencord-mobile/plugins").PluginManager;
    readonly logger: {
        log: (...args: any[]) => void;
        info: (...args: any[]) => void;
        warn: (...args: any[]) => void;
        error: (...args: any[]) => void;
    };
    private initialized;
    init(): void;
    private hookSettings;
}
export declare const vencord: VencordMobile;
export * from "./metro/interceptor.js";
export * from "./metro/finder.js";
export * from "./patcher/index.js";
export * from "./api/storage.js";
export * from "./api/ui.js";
export * from "./ui/SettingsView.js";
//# sourceMappingURL=index.d.ts.map