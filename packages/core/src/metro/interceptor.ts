/**
 * Metro Interceptor for Discord React Native / Hermes
 * 
 * Metro bundler encapsulates modules inside:
 * __d(factory, moduleId, dependencyMap)
 * 
 * and requires them using:
 * __r(moduleId)
 */

export type MetroModuleFactory = (
    global: any,
    require: any,
    metroImportDefault: any,
    metroImportAll: any,
    module: { exports: any },
    exports: any,
    dependencyMap: any[]
) => void;

export interface MetroModuleEntry {
    id: number | string;
    factory: MetroModuleFactory;
    dependencyMap?: any[];
    exports?: any;
    isInitialized: boolean;
}

export class MetroInterceptor {
    public modules = new Map<number | string, MetroModuleEntry>();
    public exportsCache = new Map<number | string, any>();
    private originalDefine: any = null;
    private originalRequire: any = null;
    private listeners = new Set<(entry: MetroModuleEntry) => void>();

    private targetScope: any;

    constructor(target: any = globalThis) {
        this.targetScope = target;
        this.install();
    }

    public install() {
        const g = this.targetScope;

        // Hook Metro's __d (define)
        if (typeof g.__d === "function") {
            this.originalDefine = g.__d.__original || g.__d;

            const interceptedDefine = (factory: MetroModuleFactory, id: number | string, depMap: any[]) => {
                const entry: MetroModuleEntry = {
                    id,
                    factory,
                    dependencyMap: depMap,
                    isInitialized: false,
                };
                this.modules.set(id, entry);

                // Wrap factory to capture exports on initialization
                const wrappedFactory = (
                    globalObj: any,
                    req: any,
                    importDefault: any,
                    importAll: any,
                    mod: { exports: any },
                    exp: any,
                    deps: any[]
                ) => {
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
            g.__d = interceptedDefine;
        }

        // Hook Metro's __r (require)
        if (typeof g.__r === "function") {
            this.originalRequire = g.__r.__original || g.__r;

            const interceptedRequire = (id: number | string) => {
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
            g.__r = interceptedRequire;
        }
    }

    public uninstall() {
        const g = this.targetScope;
        if (this.originalDefine) {
            g.__d = this.originalDefine;
        }
        if (this.originalRequire) {
            g.__r = this.originalRequire;
        }
        this.modules.clear();
        this.exportsCache.clear();
        this.listeners.clear();
    }

    public requireModule(id: number | string): any {
        const g = this.targetScope;
        if (typeof g.__r === "function") {
            return g.__r(id);
        }
        return this.exportsCache.get(id);
    }

    public onModuleDefined(listener: (entry: MetroModuleEntry) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(entry: MetroModuleEntry) {
        for (const listener of this.listeners) {
            try {
                listener(entry);
            } catch (err) {
                console.error("[MetroInterceptor] Listener error:", err);
            }
        }
    }
}

export const metroInterceptor = new MetroInterceptor();
