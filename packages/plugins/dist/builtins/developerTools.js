export const developerToolsPlugin = {
    name: "DeveloperTools",
    description: "Adds logging utilities, Metro bundle inspection, and debugging tools.",
    authors: [{ name: "Vencord Mobile Team" }],
    version: "1.0.0",
    tags: ["developer", "utility"],
    defaultEnabled: true,
    start(ctx) {
        ctx.logger.info("[DeveloperTools] Developer tools initialized.");
        // Expose global debug helpers
        globalThis.vencordDev = {
            findModule: (prop) => ctx.metro.findByProps(prop),
            findByName: (name) => ctx.metro.findByName(name),
            dumpModules: () => ctx.metro.modules,
            restartApp: () => {
                const reloadModule = ctx.metro.findByProps("reload", "bundleFinishedLoading") ||
                    ctx.metro.findByProps("reloadApp");
                if (reloadModule?.reload)
                    reloadModule.reload();
            }
        };
    },
    stop() {
        delete globalThis.vencordDev;
    }
};
//# sourceMappingURL=developerTools.js.map