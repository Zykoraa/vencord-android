import { describe, it, expect, beforeEach } from "vitest";
import { MetroInterceptor } from "../packages/core/src/metro/interceptor.js";
import { MetroFinder } from "../packages/core/src/metro/finder.js";

describe("Metro Interceptor & Finder", () => {
    let interceptor: MetroInterceptor;
    let finder: MetroFinder;
    let scope: any;

    beforeEach(() => {
        scope = {};
        // Mock global Metro __d and __r
        const modulesTable = new Map<number | string, any>();

        scope.__d = (factory: any, id: number | string, depMap: any[]) => {
            modulesTable.set(id, { factory, depMap });
        };

        scope.__r = (id: number | string) => {
            const entry = modulesTable.get(id);
            if (!entry) return undefined;
            if (!entry.exports) {
                const mod = { exports: {} };
                entry.factory(scope, (reqId: any) => scope.__r(reqId), null, null, mod, mod.exports, entry.depMap);
                entry.exports = mod.exports;
            }
            return entry.exports;
        };

        interceptor = new MetroInterceptor(scope);
        finder = new MetroFinder(interceptor);
    });

    it("should intercept __d and register modules", () => {
        const dummyFactory = (_g: any, _r: any, _i1: any, _i2: any, mod: any) => {
            mod.exports = {
                sendMessage: () => "message sent",
                editMessage: () => "message edited",
            };
        };

        scope.__d(dummyFactory, 101, []);
        const loaded = scope.__r(101);

        expect(loaded).toBeDefined();
        expect(loaded.sendMessage()).toBe("message sent");
        expect(interceptor.exportsCache.has(101)).toBe(true);
    });

    it("should find module by props using findByProps", () => {
        scope.__d((_g: any, _r: any, _i1: any, _i2: any, mod: any) => {
            mod.exports = {
                userId: "12345",
                getUsername: () => "TestUser",
            };
        }, 202, []);

        scope.__r(202);

        const found = finder.findByProps("userId", "getUsername");
        expect(found).toBeDefined();
        expect(found.userId).toBe("12345");
        expect(found.getUsername()).toBe("TestUser");
    });

    it("should find module by store name using findByStoreName", () => {
        scope.__d((_g: any, _r: any, _i1: any, _i2: any, mod: any) => {
            mod.exports = {
                getName: () => "UserStore",
                getCurrentUser: () => ({ id: "1", name: "Eve" }),
            };
        }, 303, []);

        scope.__r(303);

        const store = finder.findByStoreName("UserStore");
        expect(store).toBeDefined();
        expect(store.getCurrentUser().name).toBe("Eve");
    });

    it("should support async waitFor", async () => {
        const waitPromise = finder.waitFor((mod) => mod && mod.customAction === true, 1000);

        setTimeout(() => {
            scope.__d((_g: any, _r: any, _i1: any, _i2: any, mod: any) => {
                mod.exports = { customAction: true, value: 42 };
            }, 404, []);
            scope.__r(404);
        }, 50);

        const result = await waitPromise;
        expect(result).toBeDefined();
        expect(result.value).toBe(42);
    });

    it("should intercept __d and __r when defined asynchronously after interceptor initialization", () => {
        const customScope: any = {};
        const lateInterceptor = new MetroInterceptor(customScope);
        const lateFinder = new MetroFinder(lateInterceptor);

        expect(customScope.__d).toBeUndefined();

        // Discord loads its bundle later and assigns __d
        const modules = new Map<number | string, any>();
        customScope.__d = (factory: any, id: number | string, depMap: any[]) => {
            modules.set(id, { factory, depMap });
        };
        customScope.__r = (id: number | string) => {
            const entry = modules.get(id);
            if (!entry) return undefined;
            if (!entry.exports) {
                const mod = { exports: {} };
                entry.factory(customScope, customScope.__r, null, null, mod, mod.exports, entry.depMap);
                entry.exports = mod.exports;
            }
            return entry.exports;
        };

        // Define a module
        customScope.__d((_g: any, _r: any, _i1: any, _i2: any, mod: any) => {
            mod.exports = { lateFeature: true, answer: 100 };
        }, 999, []);

        customScope.__r(999);

        const found = lateFinder.findByProps("lateFeature", "answer");
        expect(found).toBeDefined();
        expect(found.answer).toBe(100);
    });
});

