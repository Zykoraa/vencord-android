import { describe, it, expect, beforeEach } from "vitest";
import { Patcher } from "../packages/core/src/patcher/index.js";

describe("Patcher Utility", () => {
    let patcher: Patcher;

    beforeEach(() => {
        patcher = new Patcher();
    });

    it("should intercept arguments with 'before'", () => {
        const target = {
            add: (a: number, b: number) => a + b,
        };

        const unpatch = patcher.before(target, "add", (args) => {
            return [args[0] * 2, args[1]];
        });

        expect(target.add(2, 3)).toBe(7); // (2*2) + 3 = 7

        unpatch();
        expect(target.add(2, 3)).toBe(5);
    });

    it("should modify return value with 'after'", () => {
        const target = {
            greet: (name: string) => `Hello, ${name}!`,
        };

        const unpatch = patcher.after(target, "greet", (_args, res) => {
            return `${res} Welcome to Vencord Mobile.`;
        });

        expect(target.greet("Eve")).toBe("Hello, Eve! Welcome to Vencord Mobile.");

        unpatch();
        expect(target.greet("Eve")).toBe("Hello, Eve!");
    });

    it("should replace function with 'instead'", () => {
        const target = {
            calculate: (x: number) => x * 10,
        };

        const unpatch = patcher.instead(target, "calculate", (args, orig) => {
            if (args[0] === 0) return 999;
            return orig(...args);
        });

        expect(target.calculate(0)).toBe(999);
        expect(target.calculate(5)).toBe(50);

        unpatch();
        expect(target.calculate(0)).toBe(0);
    });

    it("should support multiple patches and unpatchAll", () => {
        const target = {
            render: () => ["BaseItem"],
        };

        patcher.after(target, "render", (_args, res) => [...res, "ExtraItem1"]);
        patcher.after(target, "render", (_args, res) => [...res, "ExtraItem2"]);

        expect(target.render()).toEqual(["BaseItem", "ExtraItem1", "ExtraItem2"]);

        patcher.unpatchAll();
        expect(target.render()).toEqual(["BaseItem"]);
    });
});
