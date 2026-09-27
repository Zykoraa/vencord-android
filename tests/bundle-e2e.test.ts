import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bundlePath = path.resolve(__dirname, "../packages/core/dist/vencord-mobile.bundle.js");

describe("End-to-End Bundle Evaluation", () => {
    it("should load the compiled Hermes bundle and initialize without errors", () => {
        expect(fs.existsSync(bundlePath)).toBe(true);
        const bundleCode = fs.readFileSync(bundlePath, "utf-8");

        // Create a realistic simulated React Native Discord environment
        const context: any = {
            console,
            setTimeout,
            clearTimeout,
            setInterval,
            clearInterval,
            Promise,
            Map,
            Set,
            WeakMap,
            Array,
            Object,
            String,
            Number,
            Boolean,
            Date,
            RegExp,
            JSON,
            Math,
        };

        // Add self-referential global
        context.globalThis = context;
        context.window = context;
        context.global = context;

        // Mock Metro bundler
        const modules = new Map<number | string, any>();
        context.__d = (factory: any, id: number | string, depMap: any[]) => {
            modules.set(id, { factory, depMap });
        };
        context.__r = (id: number | string) => {
            const entry = modules.get(id);
            if (!entry) return undefined;
            if (!entry.exports) {
                const mod = { exports: {} };
                entry.factory(context, context.__r, null, null, mod, mod.exports, entry.depMap);
                entry.exports = mod.exports;
            }
            return entry.exports;
        };

        // 1. Evaluate the bundle in the VM
        vm.runInNewContext(bundleCode, context);

        // 2. Verify global Vencord object is attached
        expect(context.Vencord).toBeDefined();
        expect(context.Vencord.version).toBe("0.1.0");
        expect(context.Vencord.plugins).toBeDefined();

        // 3. Verify all built-in plugins are registered
        const plugins = context.Vencord.plugins.getAllPlugins();
        const pluginNames = plugins.map((p: any) => p.plugin.name);

        expect(pluginNames).toContain("DisableCallIdle");
        expect(pluginNames).toContain("SilentTyping");
        expect(pluginNames).toContain("CustomTimestamps");
        expect(pluginNames).toContain("ShowHiddenChannels");
        expect(pluginNames).toContain("DeveloperTools");

        // 4. Verify DisableCallIdle is enabled by default
        const callIdleRecord = context.Vencord.plugins.getPlugin("DisableCallIdle");
        expect(callIdleRecord).toBeDefined();
        expect(callIdleRecord.enabled).toBe(true);

        // 5. Simulate Discord defining the voice idle module after bundle load
        let kicked = false;
        const voiceModule = {
            handleIdleUpdate: () => { kicked = true; },
            idleTimeout: {
                start: (_delay: number, cb: () => void) => { cb(); },
                stop: () => {},
            }
        };

        context.__d((_g: any, _r: any, _i1: any, _i2: any, mod: any) => {
            mod.exports = voiceModule;
        }, 505, []);

        context.__r(505);

        // Re-trigger start on the plugin or let it auto-patch
        callIdleRecord.plugin.start({
            metro: context.Vencord.metro,
            patcher: context.Vencord.patcher,
            storage: context.Vencord.storage,
            ui: context.Vencord.ui,
            logger: context.Vencord.logger,
        });

        // Test that handleIdleUpdate is now intercepted
        voiceModule.handleIdleUpdate();
        expect(kicked).toBe(false); // Call kick was prevented!
    });
});
