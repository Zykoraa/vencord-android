import { describe, it, expect, beforeEach, vi } from "vitest";
import { PluginManager } from "../packages/plugins/src/manager.js";
import { silentTypingPlugin } from "../packages/plugins/src/builtins/silentTyping.js";
import { customTimestampsPlugin } from "../packages/plugins/src/builtins/customTimestamps.js";
import { showHiddenChannelsPlugin } from "../packages/plugins/src/builtins/showHiddenChannels.js";
import { Patcher } from "../packages/core/src/patcher/index.js";
import { Storage } from "../packages/core/src/api/storage.js";

describe("Plugin Manager & Built-in Plugins", () => {
    let manager: PluginManager;
    let patcher: Patcher;
    let storage: Storage;
    let mockContext: any;

    beforeEach(() => {
        manager = new PluginManager();
        patcher = new Patcher();
        storage = new Storage();

        mockContext = {
            metro: {
                findByProps: vi.fn(),
                waitFor: vi.fn(),
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

        manager.initialize(mockContext);
    });

    it("should register and start an enabled plugin", () => {
        let started = false;
        let stopped = false;

        const testPlugin = {
            name: "TestPlugin",
            description: "A test plugin",
            authors: [{ name: "Tester" }],
            defaultEnabled: true,
            start: () => { started = true; },
            stop: () => { stopped = true; },
        };

        manager.register(testPlugin);

        expect(started).toBe(true);
        expect(manager.getPlugin("TestPlugin")?.enabled).toBe(true);
        expect(manager.getPlugin("TestPlugin")?.started).toBe(true);

        manager.disable("TestPlugin");
        expect(stopped).toBe(true);
        expect(manager.getPlugin("TestPlugin")?.enabled).toBe(false);
        expect(manager.getPlugin("TestPlugin")?.started).toBe(false);
    });

    it("should manage plugin options through storage", () => {
        const testPlugin = {
            name: "OptionPlugin",
            description: "Options test",
            authors: [{ name: "Tester" }],
            options: {
                testOption: { type: "boolean" as const, description: "flag", default: true },
            },
            start: () => {},
            stop: () => {},
        };

        manager.register(testPlugin);

        expect(manager.getPluginOption("OptionPlugin", "testOption", true)).toBe(true);

        manager.setPluginOption("OptionPlugin", "testOption", false);
        expect(manager.getPluginOption("OptionPlugin", "testOption", true)).toBe(false);
    });

    it("should verify SilentTyping suppresses typing indicator", () => {
        const fakeTypingModule = {
            startTyping: vi.fn(() => "original typing sent"),
        };

        mockContext.metro.findByProps.mockReturnValue(fakeTypingModule);

        silentTypingPlugin.start(mockContext);

        // Calling startTyping should be suppressed
        const res = fakeTypingModule.startTyping();
        expect(res).toBeUndefined();
        expect(mockContext.logger.log).toHaveBeenCalledWith("[SilentTyping] Typing indicator suppressed");

        silentTypingPlugin.stop(mockContext);
        // After stop, original should be restored
        fakeTypingModule.startTyping();
        expect(fakeTypingModule.startTyping()).toBe("original typing sent");
    });

    it("should verify CustomTimestamps transforms timestamp", () => {
        const fakeTimeModule = {
            formatTimestamp: (d: any) => "1:30 PM",
        };

        mockContext.metro.findByProps.mockReturnValue(fakeTimeModule);
        storage.set("plugin_CustomTimestamps_opt_format24h", true);

        customTimestampsPlugin.start(mockContext);

        const testDate = new Date("2026-09-26T15:45:00");
        const formatted = fakeTimeModule.formatTimestamp(testDate);
        expect(formatted).toBe("15:45");

        customTimestampsPlugin.stop(mockContext);
        expect(fakeTimeModule.formatTimestamp(testDate)).toBe("1:30 PM");
    });

    it("should verify ShowHiddenChannels bypasses VIEW_CHANNEL check", () => {
        const fakePermsModule = {
            can: (perm: bigint) => perm !== 1024n, // originally false for VIEW_CHANNEL
        };

        mockContext.metro.findByProps.mockReturnValue(fakePermsModule);

        showHiddenChannelsPlugin.start(mockContext);

        // With plugin running, VIEW_CHANNEL (1024n) should evaluate to true
        expect(fakePermsModule.can(1024n)).toBe(true);

        showHiddenChannelsPlugin.stop(mockContext);
        // Restored to false
        expect(fakePermsModule.can(1024n)).toBe(false);
    });
});
