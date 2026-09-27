export class Patcher {
    static patchedFunctions = new WeakMap();
    unpatches = new Set();
    /**
     * Monkey patch a function to execute code before the original function.
     * Can modify arguments by returning a new array of arguments.
     */
    before(parent, functionName, patchFn) {
        return this.createPatch(parent, functionName, "before", patchFn);
    }
    /**
     * Monkey patch a function to execute code after the original function.
     * Can modify the return value.
     */
    after(parent, functionName, patchFn) {
        return this.createPatch(parent, functionName, "after", patchFn);
    }
    /**
     * Completely replace a function with a custom implementation.
     */
    instead(parent, functionName, patchFn) {
        return this.createPatch(parent, functionName, "instead", patchFn);
    }
    createPatch(parent, functionName, type, patchFn) {
        if (!parent || typeof parent[functionName] !== "function") {
            throw new Error(`Cannot patch non-existent function "${functionName}" on object`);
        }
        let parentMeta = Patcher.patchedFunctions.get(parent);
        if (!parentMeta) {
            parentMeta = new Map();
            Patcher.patchedFunctions.set(parent, parentMeta);
        }
        let meta = parentMeta.get(functionName);
        if (!meta) {
            const original = parent[functionName];
            const patches = [];
            meta = { original, patches };
            parentMeta.set(functionName, meta);
            parent[functionName] = function patchedWrapper(...args) {
                let currentArgs = args;
                // 1. Run "before" patches
                for (const p of patches) {
                    if (p.type === "before") {
                        try {
                            const newArgs = p.fn.call(this, currentArgs);
                            if (Array.isArray(newArgs)) {
                                currentArgs = newArgs;
                            }
                        }
                        catch (err) {
                            console.error(`[Patcher] Error in "before" patch on ${functionName}:`, err);
                        }
                    }
                }
                // 2. Run "instead" patch if present, else original
                let result;
                const insteadPatch = patches.find((p) => p.type === "instead");
                if (insteadPatch) {
                    try {
                        result = insteadPatch.fn.call(this, currentArgs, meta.original.bind(this));
                    }
                    catch (err) {
                        console.error(`[Patcher] Error in "instead" patch on ${functionName}:`, err);
                    }
                }
                else {
                    result = meta.original.apply(this, currentArgs);
                }
                // 3. Run "after" patches
                for (const p of patches) {
                    if (p.type === "after") {
                        try {
                            const newRes = p.fn.call(this, currentArgs, result);
                            if (newRes !== undefined) {
                                result = newRes;
                            }
                        }
                        catch (err) {
                            console.error(`[Patcher] Error in "after" patch on ${functionName}:`, err);
                        }
                    }
                }
                return result;
            };
            // Preserve function properties
            Object.assign(parent[functionName], original);
        }
        const record = { type, fn: patchFn };
        meta.patches.push(record);
        const unpatch = () => {
            const idx = meta.patches.indexOf(record);
            if (idx !== -1) {
                meta.patches.splice(idx, 1);
            }
            // If no patches remain, restore the original function
            if (meta.patches.length === 0) {
                parent[functionName] = meta.original;
                parentMeta.delete(functionName);
            }
            this.unpatches.delete(unpatch);
        };
        this.unpatches.add(unpatch);
        return unpatch;
    }
    unpatchAll() {
        for (const unpatch of Array.from(this.unpatches)) {
            unpatch();
        }
        this.unpatches.clear();
    }
}
export const patcher = new Patcher();
//# sourceMappingURL=index.js.map