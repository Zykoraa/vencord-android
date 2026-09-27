export type UnpatchFn = () => void;
export type PatchType = "before" | "after" | "instead";
export declare class Patcher {
    private static patchedFunctions;
    private unpatches;
    /**
     * Monkey patch a function to execute code before the original function.
     * Can modify arguments by returning a new array of arguments.
     */
    before(parent: any, functionName: string, patchFn: (args: any[]) => any[] | void): UnpatchFn;
    /**
     * Monkey patch a function to execute code after the original function.
     * Can modify the return value.
     */
    after(parent: any, functionName: string, patchFn: (args: any[], res: any) => any): UnpatchFn;
    /**
     * Completely replace a function with a custom implementation.
     */
    instead(parent: any, functionName: string, patchFn: (args: any[], orig: (...args: any[]) => any) => any): UnpatchFn;
    private createPatch;
    unpatchAll(): void;
}
export declare const patcher: Patcher;
//# sourceMappingURL=index.d.ts.map