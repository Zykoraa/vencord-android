import { describe, it, expect, beforeEach, vi } from "vitest";
import { adaptVencordPlugin, setupVencordCompatAPI } from "../packages/core/src/compat/vencordPluginAdapter.js";
import { disableCallIdlePlugin } from "../packages/plugins/src/builtins/disableCallIdle.js";
import { Patcher } from "../packages/core/src/patcher/index.js";
import { Storage } from "../packages/core/src/api/storage.js";

describe("DisableCallIdle & Vencord Compatibility Layer", () => {
    let patcher: Patcher;
    let storage: Storage;
    let mockContext: any;

    beforeEach(() => {
        patcher = new Patcher();
        storage = new Storage();

        mockContext = {
            metro: {
                find: vi.fn(),
                findByProps: vi.fn(),
                findByStoreName: vi.fn(),
                waitFor: vi.fn(() => Promise.reject("not found in test")),
            },
            patcher,
            storage,
            ui: {},
            logger: {
                log: vi.fn(),
                info: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
            },
        };
    });

    it("should prevent call kick in DisableCallIdle by intercepting handleIdleUpdate and idleTimeout", () => {
        let kickExecuted = false;

        const fakeIdleModule = {
            handleIdleUpdate: () => {
                kickExecuted = true;
            },
            idleTimeout: {
                start: (_delay: number, cb: () => void) => {
                    cb();
                }
            }
        };

        mockContext.metro.find.mockReturnValue(fakeIdleModule);

        disableCallIdlePlugin.start(mockContext);

        // Calling handleIdleUpdate should now be a no-op (kick suppressed)
        fakeIdleModule.handleIdleUpdate();
        expect(kickExecuted).toBe(false);
        expect(mockContext.logger.log).toHaveBeenCalledWith(
            expect.stringContaining("call kick suppressed")
        );

        disableCallIdlePlugin.stop(mockContext);

        // After stopping the plugin, original behavior is restored
        fakeIdleModule.handleIdleUpdate();
        expect(kickExecuted).toBe(true);
    });

    it("should adapt an existing desktop Vencord plugin with patches into a mobile plugin", async () => {
        let desktopPluginStarted = false;
        let desktopPluginStopped = false;

        const desktopVencordPlugin = {
            name: "DesktopEchoPlugin",
            description: "A desktop plugin written with Vencord conventions",
            authors: [{ name: "Vendicated" }],
            patches: [
                {
                    find: "this.idleTimeout.start(",
                    replacement: {
                        match: /this\.idleTimeout\.(start|stop)/g,
                        replace: "$self.noop"
                    }
                }
            ],
            start() {
                desktopPluginStarted = true;
            },
            stop() {
                desktopPluginStopped = true;
            }
        };

        const adaptedMobilePlugin = adaptVencordPlugin(desktopVencordPlugin);

        expect(adaptedMobilePlugin.name).toBe("DesktopEchoPlugin");
        expect(adaptedMobilePlugin.description).toBe("A desktop plugin written with Vencord conventions");

        await adaptedMobilePlugin.start(mockContext);
        expect(desktopPluginStarted).toBe(true);

        await adaptedMobilePlugin.stop(mockContext);
        expect(desktopPluginStopped).toBe(true);
    });

    it("should setup global Vencord.Webpack and Vencord.Patcher shims", () => {
        setupVencordCompatAPI();

        const g = globalThis as any;
        expect(g.Vencord).toBeDefined();
        expect(g.Vencord.Webpack).toBeDefined();
        expect(g.Vencord.Patcher).toBeDefined();
        expect(typeof g.Vencord.Webpack.findByProps).toBe("function");
        expect(typeof g.Vencord.Patcher.instead).toBe("function");
    });
});
