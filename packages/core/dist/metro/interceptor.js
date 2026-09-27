/**
 * Metro Interceptor for Discord React Native / Hermes
 *
 * Metro bundler encapsulates modules inside:
 * __d(factory, moduleId, dependencyMap)
 *
 * and requires them using:
 * __r(moduleId)
 */
export class MetroInterceptor {
    modules = new Map();
    exportsCache = new Map();
    originalDefine = null;
    originalRequire = null;
    listeners = new Set();
    targetScope;
    constructor(target = globalThis) {
        this.targetScope = target;
        this.install();
    }
    install() {
        const g = this.targetScope;
        const wrapDefine = (orig) => {
            if (!orig || orig.__vencordHooked)
                return orig;
            this.originalDefine = orig.__original || orig;
            const interceptedDefine = (factory, id, depMap) => {
                const entry = {
                    id,
                    factory,
                    dependencyMap: depMap,
                    isInitialized: false,
                };
                this.modules.set(id, entry);
                // Wrap factory to capture exports on initialization
                const wrappedFactory = (globalObj, req, importDefault, importAll, mod, exp, deps) => {
                    factory(globalObj, req, importDefault, importAll, mod, exp, deps);
                    entry.exports = mod.exports;
                    entry.isInitialized = true;
                    this.exportsCache.set(id, mod.exports);
                    this.notifyListeners(entry);
                };
                return this.originalDefine.call(g, wrappedFactory, id, depMap);
            };
            interceptedDefine.__vencordHooked = true;
            interceptedDefine.__original = this.originalDefine;
            return interceptedDefine;
        };
        const wrapRequire = (orig) => {
            if (!orig || orig.__vencordHooked)
                return orig;
            this.originalRequire = orig.__original || orig;
            const interceptedRequire = (id) => {
                const exports = this.originalRequire.call(g, id);
                if (exports && !this.exportsCache.has(id)) {
                    this.exportsCache.set(id, exports);
                    const entry = this.modules.get(id);
                    if (entry) {
                        entry.exports = exports;
                        entry.isInitialized = true;
                        this.notifyListeners(entry);
                    }
                }
                return exports;
            };
            interceptedRequire.__vencordHooked = true;
            interceptedRequire.__original = this.originalRequire;
            return interceptedRequire;
        };
        let currentD = typeof g.__d === "function" ? wrapDefine(g.__d) : undefined;
        try {
            Object.defineProperty(g, "__d", {
                configurable: true,
                enumerable: true,
                get: () => currentD,
                set: (val) => {
                    currentD = wrapDefine(val);
                }
            });
        }
        catch {
            if (typeof g.__d === "function") {
                g.__d = wrapDefine(g.__d);
            }
        }
        let currentR = typeof g.__r === "function" ? wrapRequire(g.__r) : undefined;
        try {
            Object.defineProperty(g, "__r", {
                configurable: true,
                enumerable: true,
                get: () => currentR,
                set: (val) => {
                    currentR = wrapRequire(val);
                }
            });
        }
        catch {
            if (typeof g.__r === "function") {
                g.__r = wrapRequire(g.__r);
            }
        }
    }
    uninstall() {
        const g = this.targetScope;
        try {
            Object.defineProperty(g, "__d", {
                configurable: true,
                writable: true,
                value: this.originalDefine || undefined
            });
            Object.defineProperty(g, "__r", {
                configurable: true,
                writable: true,
                value: this.originalRequire || undefined
            });
        }
        catch {
            if (this.originalDefine)
                g.__d = this.originalDefine;
            if (this.originalRequire)
                g.__r = this.originalRequire;
        }
        this.modules.clear();
        this.exportsCache.clear();
        this.listeners.clear();
    }
    requireModule(id) {
        const g = this.targetScope;
        if (typeof g.__r === "function") {
            return g.__r(id);
        }
        return this.exportsCache.get(id);
    }
    onModuleDefined(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    notifyListeners(entry) {
        for (const listener of this.listeners) {
            try {
                listener(entry);
            }
            catch (err) {
                console.error("[MetroInterceptor] Listener error:", err);
            }
        }
    }
}
export const metroInterceptor = new MetroInterceptor();
//# sourceMappingURL=interceptor.js.map