import { describe, it, expect, beforeEach } from "vitest";
import { MetroInterceptor } from "../packages/core/src/metro/interceptor.js";
import { MetroFinder } from "../packages/core/src/metro/finder.js";

describe("Metro Interceptor & Finder", () => {
    let interceptor: MetroInterceptor;
    let finder: MetroFinder;

    beforeEach(() => {
        // Mock global Metro __d and __r
        const modulesTable = new Map<number | string, any>();

        (globalThis as any).__d = (factory: any, id: number | string, depMap: any[]) => {
            modulesTable.set(id, { factory, depMap });
        };

        (globalThis as any).__r = (id: number | string) => {
            const entry = modulesTable.get(id);
            if (!entry) return undefined;
            if (!entry.exports) {
                const mod = { exports: {} };
                entry.factory(globalThis, (reqId: any) => (globalThis as any).__r(reqId), null, null, mod, mod.exports, entry.depMap);
                entry.exports = mod.exports;
            }
            return entry.exports;
        };

        interceptor = new MetroInterceptor();
        finder = new MetroFinder(interceptor);
    });

    it("should intercept __d and register modules", () => {
        const dummyFactory = (_g: any, _r: any, _i1: any, _i2: any, mod: any) => {
            mod.exports = {
                sendMessage: () => "message sent",
                editMessage: () => "message edited",
            };
        };

        (globalThis as any).__d(dummyFactory, 101, []);
        const loaded = (globalThis as any).__r(101);

        expect(loaded).toBeDefined();
        expect(loaded.sendMessage()).toBe("message sent");
        expect(interceptor.exportsCache.has(101)).toBe(true);
    });

    it("should find module by props using findByProps", () => {
        (globalThis as any).__d((_g: any, _r: any, _i1: any, _i2: any, mod: any) => {
            mod.exports = {
                userId: "12345",
                getUsername: () => "TestUser",
            };
        }, 202, []);

        (globalThis as any).__r(202);

        const found = finder.findByProps("userId", "getUsername");
        expect(found).toBeDefined();
        expect(found.userId).toBe("12345");
        expect(found.getUsername()).toBe("TestUser");
    });

    it("should find module by store name using findByStoreName", () => {
        (globalThis as any).__d((_g: any, _r: any, _i1: any, _i2: any, mod: any) => {
            mod.exports = {
                getName: () => "UserStore",
                getCurrentUser: () => ({ id: "1", name: "Eve" }),
            };
        }, 303, []);

        (globalThis as any).__r(303);

        const store = finder.findByStoreName("UserStore");
        expect(store).toBeDefined();
        expect(store.getCurrentUser().name).toBe("Eve");
    });

    it("should support async waitFor", async () => {
        const waitPromise = finder.waitFor((mod) => mod && mod.customAction === true, 1000);

        setTimeout(() => {
            (globalThis as any).__d((_g: any, _r: any, _i1: any, _i2: any, mod: any) => {
                mod.exports = { customAction: true, value: 42 };
            }, 404, []);
            (globalThis as any).__r(404);
        }, 50);

        const result = await waitPromise;
        expect(result).toBeDefined();
        expect(result.value).toBe(42);
    });
});
